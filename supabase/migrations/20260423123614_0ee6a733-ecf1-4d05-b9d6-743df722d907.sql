-- Promo codes table
create table public.promo_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  credits integer not null default 10,
  max_redemptions integer,
  redemption_count integer not null default 0,
  expires_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Redemptions table (one per user per code)
create table public.promo_redemptions (
  id uuid primary key default gen_random_uuid(),
  promo_code_id uuid not null references public.promo_codes(id) on delete cascade,
  user_id uuid not null,
  credits_granted integer not null,
  created_at timestamptz not null default now(),
  unique (promo_code_id, user_id)
);

alter table public.promo_codes enable row level security;
alter table public.promo_redemptions enable row level security;

-- Only service role manages these tables (redemption goes through edge function)
create policy "Service role manages promo codes"
  on public.promo_codes for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "Service role manages redemptions"
  on public.promo_redemptions for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "Users view own redemptions"
  on public.promo_redemptions for select
  using (auth.uid() = user_id);

-- Redeem function: validates code, grants credits, records redemption.
create or replace function public.redeem_promo_code(_user_id uuid, _code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_promo public.promo_codes%rowtype;
  v_existing uuid;
begin
  select * into v_promo from public.promo_codes
    where lower(code) = lower(_code) for update;

  if v_promo.id is null then
    return jsonb_build_object('ok', false, 'error', 'Invalid code');
  end if;
  if not v_promo.active then
    return jsonb_build_object('ok', false, 'error', 'Code is no longer active');
  end if;
  if v_promo.expires_at is not null and v_promo.expires_at < now() then
    return jsonb_build_object('ok', false, 'error', 'Code has expired');
  end if;
  if v_promo.max_redemptions is not null and v_promo.redemption_count >= v_promo.max_redemptions then
    return jsonb_build_object('ok', false, 'error', 'Code redemption limit reached');
  end if;

  select id into v_existing from public.promo_redemptions
    where promo_code_id = v_promo.id and user_id = _user_id;
  if v_existing is not null then
    return jsonb_build_object('ok', false, 'error', 'You have already redeemed this code');
  end if;

  -- Grant credits via existing helper (1 year expiry)
  perform public.grant_pack_credits(_user_id, v_promo.credits, now() + interval '1 year');

  insert into public.promo_redemptions (promo_code_id, user_id, credits_granted)
    values (v_promo.id, _user_id, v_promo.credits);

  update public.promo_codes
    set redemption_count = redemption_count + 1
    where id = v_promo.id;

  return jsonb_build_object('ok', true, 'credits', v_promo.credits);
end;
$$;