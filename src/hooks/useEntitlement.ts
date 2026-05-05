import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { getPaymentsEnv } from "@/lib/paddle";

export type Entitlement = {
  loading: boolean;
  hasSubscription: boolean;
  planName: string | null;
  credits: number;
  refresh: () => Promise<void>;
};

const PLAN_NAMES: Record<string, string> = {
  monthly_unlimited: "Monthly Unlimited",
  halfyear_unlimited: "6-Month Unlimited",
  yearly_unlimited: "Yearly Unlimited",
};

export function useEntitlement(): Entitlement {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [planName, setPlanName] = useState<string | null>(null);
  const [credits, setCredits] = useState(0);

  const refresh = useCallback(async () => {
    if (!user) {
      setLoading(false);
      setHasSubscription(false);
      setPlanName(null);
      setCredits(0);
      return;
    }
    setLoading(true);
    const env = getPaymentsEnv();

    // Admins get unlimited usage
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });
    if (isAdmin === true) {
      setHasSubscription(true);
      setPlanName("Admin");
      setCredits(0);
      setLoading(false);
      return;
    }

    const { data: sub } = await supabase
      .from("subscriptions")
      .select("product_id, status, current_period_end")
      .eq("user_id", user.id)
      .eq("environment", env)
      .maybeSingle();

    const active =
      !!sub &&
      ["active", "trialing", "past_due"].includes(sub.status) &&
      (!sub.current_period_end || new Date(sub.current_period_end) > new Date());

    setHasSubscription(active);
    setPlanName(active ? PLAN_NAMES[sub!.product_id] ?? "Unlimited" : null);

    if (!active) {
      const { data: c } = await supabase.rpc("get_available_credits", { user_uuid: user.id });
      setCredits(typeof c === "number" ? c : 0);
    } else {
      setCredits(0);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Realtime: refresh when subscription/credit ledger changes
  const userId = user?.id;
  useEffect(() => {
    if (!userId) return;
    const channelName = `entitlement-${userId}-${Math.random().toString(36).slice(2, 10)}`;
    const ch = supabase
      .channel(channelName)
      .on("postgres_changes", { event: "*", schema: "public", table: "subscriptions", filter: `user_id=eq.${userId}` }, () => refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "credit_ledger", filter: `user_id=eq.${userId}` }, () => refresh())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return { loading, hasSubscription, planName, credits, refresh };
}
