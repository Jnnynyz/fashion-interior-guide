-- 1. Subscriptions table
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  paddle_subscription_id text not null unique,
  paddle_customer_id text not null,
  product_id text not null,
  price_id text not null,
  status text not null default 'active',
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean default false,
  environment text not null default 'sandbox',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, environment)
);

create index idx_subscriptions_user_id on public.subscriptions(user_id);
create index idx_subscriptions_paddle_id on public.subscriptions(paddle_subscription_id);

alter table public.subscriptions enable row level security;

create policy "Users view own subscription"
  on public.subscriptions for select
  using (auth.uid() = user_id);

create policy "Service role manages subscriptions"
  on public.subscriptions for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- 2. Credit ledger (free monthly + paid packs)
create type public.credit_source as enum ('free_monthly', 'pack');

create table public.credit_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source public.credit_source not null,
  amount integer not null,           -- positive = grant, negative = spend
  remaining integer not null,        -- remaining for grants (0 for spends)
  expires_at timestamptz,            -- null = never
  period_key text,                   -- 'YYYY-MM' for free_monthly
  related_id uuid,                   -- analysis id when spending
  created_at timestamptz not null default now()
);

create index idx_credit_ledger_user on public.credit_ledger(user_id);
create index idx_credit_ledger_user_remaining on public.credit_ledger(user_id, remaining) where remaining > 0;
create unique index uniq_free_monthly on public.credit_ledger(user_id, period_key) where source = 'free_monthly';

alter table public.credit_ledger enable row level security;

create policy "Users view own credits"
  on public.credit_ledger for select
  using (auth.uid() = user_id);

create policy "Service role manages credits"
  on public.credit_ledger for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- 3. Helper: has active unlimited subscription
create or replace function public.has_active_subscription(
  user_uuid uuid,
  check_env text default 'live'
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.subscriptions
    where user_id = user_uuid
      and environment = check_env
      and status in ('active', 'trialing', 'past_due')
      and (current_period_end is null or current_period_end > now())
  );
$$;

-- 4. Helper: ensure free monthly grant exists for current month
create or replace function public.ensure_free_monthly_credits(user_uuid uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_period text := to_char(now(), 'YYYY-MM');
  v_expires timestamptz := date_trunc('month', now()) + interval '1 month';
begin
  insert into public.credit_ledger (user_id, source, amount, remaining, expires_at, period_key)
  values (user_uuid, 'free_monthly', 5, 5, v_expires, v_period)
  on conflict (user_id, period_key) where source = 'free_monthly' do nothing;
end;
$$;

-- 5. Helper: get remaining credits
create or replace function public.get_available_credits(user_uuid uuid)
returns integer
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_total integer;
begin
  perform public.ensure_free_monthly_credits(user_uuid);
  select coalesce(sum(remaining), 0) into v_total
  from public.credit_ledger
  where user_id = user_uuid
    and remaining > 0
    and (expires_at is null or expires_at > now());
  return v_total;
end;
$$;

-- 6. Helper: consume 1 credit; returns true if consumed
create or replace function public.consume_credit(
  user_uuid uuid,
  related uuid default null,
  check_env text default 'live'
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row record;
begin
  -- Unlimited if active subscription
  if public.has_active_subscription(user_uuid, check_env) then
    return true;
  end if;

  perform public.ensure_free_monthly_credits(user_uuid);

  -- Consume oldest expiring credit first; free_monthly first as it expires soonest naturally
  select id, remaining into v_row
  from public.credit_ledger
  where user_id = user_uuid
    and remaining > 0
    and (expires_at is null or expires_at > now())
  order by
    case when source = 'free_monthly' then 0 else 1 end,
    coalesce(expires_at, 'infinity'::timestamptz) asc,
    created_at asc
  for update skip locked
  limit 1;

  if v_row.id is null then
    return false;
  end if;

  update public.credit_ledger
  set remaining = remaining - 1
  where id = v_row.id;

  insert into public.credit_ledger (user_id, source, amount, remaining, related_id)
  values (user_uuid, 'pack', -1, 0, related);

  return true;
end;
$$;

-- 7. Helper: grant pack credits (called from webhook)
create or replace function public.grant_pack_credits(
  user_uuid uuid,
  qty integer,
  expires timestamptz default (now() + interval '12 months')
)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.credit_ledger (user_id, source, amount, remaining, expires_at)
  values (user_uuid, 'pack', qty, qty, expires);
$$;