-- Revoke EXECUTE from anon/authenticated on internal SECURITY DEFINER functions

-- Email queue infrastructure (service-role only)
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;

-- Internal credit / role helpers (called from other definer functions or triggers)
REVOKE EXECUTE ON FUNCTION public.consume_credit(uuid, uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.ensure_free_monthly_credits(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.grant_pack_credits(uuid, integer, timestamptz) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_active_subscription(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- has_role is used in RLS policies via auth.uid(); keep it executable to authenticated for policy evaluation
-- (RLS evaluates as the calling role, so authenticated needs EXECUTE)
-- But revoke from anon since anon shouldn't be checking roles
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;

-- redeem_promo_code is called via RPC by signed-in users only
REVOKE EXECUTE ON FUNCTION public.redeem_promo_code(uuid, text) FROM PUBLIC, anon;

-- get_available_credits and admin_stats — keep authenticated, revoke from anon
REVOKE EXECUTE ON FUNCTION public.get_available_credits(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_stats() FROM PUBLIC, anon;