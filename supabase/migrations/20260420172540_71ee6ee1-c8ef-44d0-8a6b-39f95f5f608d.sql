CREATE OR REPLACE FUNCTION public.get_available_credits(user_uuid uuid)
RETURNS integer
LANGUAGE plpgsql
VOLATILE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
  v_total integer;
begin
  if auth.uid() is null or auth.uid() <> user_uuid then
    raise exception 'Forbidden';
  end if;
  perform public.ensure_free_monthly_credits(user_uuid);
  select coalesce(sum(remaining), 0) into v_total
  from public.credit_ledger
  where user_id = user_uuid
    and remaining > 0
    and (expires_at is null or expires_at > now());
  return v_total;
end;
$function$;

GRANT EXECUTE ON FUNCTION public.get_available_credits(uuid) TO authenticated;