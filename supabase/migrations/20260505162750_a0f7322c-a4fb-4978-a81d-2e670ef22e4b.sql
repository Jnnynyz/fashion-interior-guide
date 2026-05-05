CREATE OR REPLACE FUNCTION public.consume_credit(user_uuid uuid, related uuid DEFAULT NULL::uuid, check_env text DEFAULT 'live'::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_row record;
begin
  -- Admins have unlimited usage
  if public.has_role(user_uuid, 'admin') then
    return true;
  end if;

  -- Unlimited if active subscription
  if public.has_active_subscription(user_uuid, check_env) then
    return true;
  end if;

  perform public.ensure_free_monthly_credits(user_uuid);

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
$function$;

CREATE OR REPLACE FUNCTION public.has_active_subscription(user_uuid uuid, check_env text DEFAULT 'live'::text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select public.has_role(user_uuid, 'admin') or exists (
    select 1 from public.subscriptions
    where user_id = user_uuid
      and environment = check_env
      and status in ('active', 'trialing', 'past_due')
      and (current_period_end is null or current_period_end > now())
  );
$function$;