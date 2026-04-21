-- 1) Make bucket private
UPDATE storage.buckets SET public = false WHERE id = 'analysis-images';

-- 2) Drop existing broad policies on analysis-images, add owner-scoped policies
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND (qual ILIKE '%analysis-images%' OR with_check ILIKE '%analysis-images%')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "analysis-images owner select"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'analysis-images' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "analysis-images owner insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'analysis-images' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "analysis-images owner update"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'analysis-images' AND (auth.uid())::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'analysis-images' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "analysis-images owner delete"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'analysis-images' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- 3) Revoke EXECUTE on sensitive SECURITY DEFINER credit functions from public callers.
-- Service role (used by edge functions) is unaffected and can still call them.
REVOKE EXECUTE ON FUNCTION public.consume_credit(uuid, uuid, text) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.grant_pack_credits(uuid, integer, timestamptz) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.ensure_free_monthly_credits(uuid) FROM anon, authenticated, public;

-- Keep get_available_credits callable by authenticated users, but add an auth.uid() guard.
CREATE OR REPLACE FUNCTION public.get_available_credits(user_uuid uuid)
RETURNS integer
LANGUAGE plpgsql
STABLE SECURITY DEFINER
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