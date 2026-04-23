import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Check, Loader2, Sparkles, ArrowLeft, Gift } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { useEntitlement } from "@/hooks/useEntitlement";
import { usePaddleCheckout } from "@/hooks/usePaddleCheckout";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — What's Missing" },
      {
        name: "description",
        content: "Unlimited AI outfit & interior analysis. Plans from $9/month, or buy a 10-pack for $5.",
      },
    ],
  }),
  component: PricingPage,
});

type Plan = {
  priceId: string;
  name: string;
  price: string;
  period: string;
  highlight?: boolean;
  badge?: string;
  features: string[];
};

const PLANS: Plan[] = [
  {
    priceId: "monthly_unlimited_price",
    name: "Monthly Unlimited",
    price: "$9",
    period: "/month",
    features: ["Unlimited analyses", "Unlimited After photos", "Cancel anytime"],
  },
  {
    priceId: "halfyear_unlimited_price",
    name: "6 Months Unlimited",
    price: "$29",
    period: "every 6 months",
    badge: "Save 46%",
    features: ["Everything in Monthly", "Half a year of refinement", "Best for slow seasons"],
  },
  {
    priceId: "yearly_unlimited_price",
    name: "Yearly Unlimited",
    price: "$39",
    period: "/year",
    highlight: true,
    badge: "Best value",
    features: ["Everything in Monthly", "12 months of styling", "Less than $4/month"],
  },
];

function PricingPage() {
  const { user } = useAuth();
  const { hasSubscription, planName, credits, refresh } = useEntitlement();
  const { openCheckout, loading: checkoutLoading } = usePaddleCheckout();
  const navigate = useNavigate();

  const handleChoose = (priceId: string) => {
    if (!user) {
      navigate({ to: "/auth" });
      return;
    }
    openCheckout(priceId, "/pricing?checkout=success");
  };

  // Refresh entitlement when arriving from successful checkout
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") === "success") {
      const t = setInterval(refresh, 1500);
      const stop = setTimeout(() => clearInterval(t), 15000);
      return () => {
        clearInterval(t);
        clearTimeout(stop);
      };
    }
  }, [refresh]);

  return (
    <AppShell>
      <div className="pt-2">
        <Link
          to="/upload"
          className="text-xs uppercase tracking-[0.22em] text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </Link>
      </div>

      <section className="pt-6 pb-8">
        <p className="text-[11px] uppercase tracking-[0.28em] text-accent mb-4">Pricing</p>
        <h1 className="font-display text-4xl sm:text-5xl leading-[1.05] text-balance">
          Refine your style,
          <br />
          on your own terms.
        </h1>
        <p className="mt-4 text-sm text-muted-foreground max-w-md">
          Start free with 5 analyses each month. Upgrade for unlimited styling.
        </p>

        {user && hasSubscription && (
          <div className="mt-6 rounded-2xl bg-secondary/60 border border-border/60 p-4 text-sm flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent" />
            You're on <strong className="font-medium">{planName}</strong>.
          </div>
        )}
        {user && !hasSubscription && (
          <div className="mt-6 rounded-2xl bg-card border border-border/60 p-4 text-sm">
            <span className="text-muted-foreground">Credits remaining: </span>
            <span className="font-display text-base">{credits}</span>
          </div>
        )}
      </section>

      <section className="space-y-4">
        {PLANS.map((p) => (
          <PlanCard
            key={p.priceId}
            plan={p}
            disabled={checkoutLoading || hasSubscription}
            onChoose={() => handleChoose(p.priceId)}
          />
        ))}
      </section>

      <section className="mt-8">
        <div className="rounded-3xl bg-card border border-border/60 p-6 shadow-soft">
          <p className="text-[11px] uppercase tracking-[0.28em] text-accent">Pay as you go</p>
          <h3 className="font-display text-2xl mt-2">10 Picture Pack</h3>
          <p className="text-sm text-muted-foreground mt-1.5">
            10 additional analyses for <strong className="text-foreground">$5</strong>. Credits expire after 12 months.
          </p>
          <button
            onClick={() => handleChoose("pack_10_price")}
            disabled={checkoutLoading}
            className="mt-5 inline-flex w-full items-center justify-center h-11 rounded-full bg-secondary text-foreground font-medium tracking-wide hover:bg-secondary/80 transition disabled:opacity-50"
          >
            {checkoutLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buy 10 credits — $5"}
          </button>
        </div>
      </section>

      {user && <RedeemCard onRedeemed={refresh} />}

      <p className="mt-8 mb-4 text-center text-xs text-muted-foreground">
        Free plan: 5 analyses every month, forever.
      </p>
    </AppShell>
  );
}

function PlanCard({
  plan,
  disabled,
  onChoose,
}: {
  plan: Plan;
  disabled: boolean;
  onChoose: () => void;
}) {
  return (
    <div
      className={cn(
        "rounded-3xl p-6 shadow-soft border",
        plan.highlight ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border/60",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-2xl">{plan.name}</h3>
          <p className={cn("text-sm mt-1", plan.highlight ? "text-primary-foreground/75" : "text-muted-foreground")}>
            <span className="font-display text-2xl text-foreground/100" style={{ color: "inherit" }}>
              {plan.price}
            </span>{" "}
            {plan.period}
          </p>
        </div>
        {plan.badge && (
          <span
            className={cn(
              "text-[10px] uppercase tracking-[0.22em] px-2.5 py-1 rounded-full",
              plan.highlight
                ? "bg-primary-foreground/15 text-primary-foreground"
                : "bg-accent text-accent-foreground",
            )}
          >
            {plan.badge}
          </span>
        )}
      </div>

      <ul className="mt-5 space-y-2 text-sm">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <Check className={cn("h-4 w-4 mt-0.5 shrink-0", plan.highlight ? "text-primary-foreground/80" : "text-accent")} />
            <span className={cn(plan.highlight ? "text-primary-foreground/90" : "text-foreground/85")}>{f}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={onChoose}
        disabled={disabled}
        className={cn(
          "mt-6 w-full h-11 rounded-full font-medium tracking-wide transition disabled:opacity-50",
          plan.highlight
            ? "bg-primary-foreground text-primary hover:opacity-90"
            : "bg-primary text-primary-foreground hover:opacity-90",
        )}
      >
        Choose plan
      </button>
    </div>
  );
}

function RedeemCard({ onRedeemed }: { onRedeemed: () => Promise<void> }) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("redeem-promo", {
        body: { code: code.trim() },
      });
      if (error || (data as any)?.error) {
        toast.error((data as any)?.error || "Could not redeem code");
        return;
      }
      toast.success(`${(data as any).credits} credits added to your account!`);
      setCode("");
      await onRedeemed();
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mt-6">
      <div className="rounded-3xl bg-card border border-border/60 p-6 shadow-soft">
        <div className="flex items-center gap-2">
          <span className="h-7 w-7 rounded-full bg-accent text-accent-foreground grid place-items-center">
            <Gift className="h-3.5 w-3.5" />
          </span>
          <p className="text-[11px] uppercase tracking-[0.28em] text-accent">Have a code?</p>
        </div>
        <h3 className="font-display text-2xl mt-3">Redeem promo code</h3>
        <p className="text-sm text-muted-foreground mt-1.5">
          Enter your code to add free credits to your account.
        </p>
        <form onSubmit={submit} className="mt-4 flex gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter code"
            className="flex-1 h-11 rounded-full bg-secondary px-5 text-sm outline-none focus:ring-2 focus:ring-accent"
            autoCapitalize="characters"
          />
          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="h-11 px-6 rounded-full bg-primary text-primary-foreground font-medium tracking-wide hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Redeem"}
          </button>
        </form>
      </div>
    </section>
  );
}
