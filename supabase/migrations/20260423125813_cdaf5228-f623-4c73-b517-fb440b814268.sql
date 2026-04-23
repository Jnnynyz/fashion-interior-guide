
-- Roles enum + table
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'user');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own roles" ON public.user_roles;
CREATE POLICY "Users view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role manages roles" ON public.user_roles;
CREATE POLICY "Service role manages roles" ON public.user_roles
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- has_role helper (security definer to avoid recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  );
$$;

-- Grant admin to jenny
INSERT INTO public.user_roles (user_id, role)
VALUES ('f5483cc6-399e-474a-8ac6-9d4272e7b18d', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Admin stats function
CREATE OR REPLACE FUNCTION public.admin_stats()
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_total_users int;
  v_active_subs int;
  v_subs_by_plan jsonb;
  v_pack_credits_sold int;
  v_analyses_total int;
  v_analyses_30d int;
  v_signups_30d int;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT count(*) INTO v_total_users FROM public.profiles;

  SELECT count(*) INTO v_active_subs
  FROM public.subscriptions
  WHERE status IN ('active','trialing','past_due')
    AND (current_period_end IS NULL OR current_period_end > now());

  SELECT coalesce(jsonb_object_agg(product_id, n), '{}'::jsonb) INTO v_subs_by_plan
  FROM (
    SELECT product_id, count(*) AS n
    FROM public.subscriptions
    WHERE status IN ('active','trialing','past_due')
      AND (current_period_end IS NULL OR current_period_end > now())
    GROUP BY product_id
  ) s;

  SELECT coalesce(sum(amount), 0) INTO v_pack_credits_sold
  FROM public.credit_ledger
  WHERE source = 'pack' AND amount > 0;

  SELECT count(*) INTO v_analyses_total FROM public.analyses;
  SELECT count(*) INTO v_analyses_30d FROM public.analyses WHERE created_at > now() - interval '30 days';
  SELECT count(*) INTO v_signups_30d FROM public.profiles WHERE created_at > now() - interval '30 days';

  RETURN jsonb_build_object(
    'total_users', v_total_users,
    'signups_30d', v_signups_30d,
    'active_subscriptions', v_active_subs,
    'subscriptions_by_plan', v_subs_by_plan,
    'pack_credits_sold', v_pack_credits_sold,
    'analyses_total', v_analyses_total,
    'analyses_30d', v_analyses_30d
  );
END;
$$;
