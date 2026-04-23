import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Check, Loader2, Sparkles, ArrowLeft, Gift } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { useEntitlement } from "@/hooks/useEntitlement";
import { useI18n, type Key } from "@/lib/i18n";
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
  nameKey: Key;
  price: string;
  periodKey: Key;
  highlight?: boolean;
  badgeKey?: Key;
  featureKeys: Key[];
};

const PLANS: Plan[] = [
  {
    priceId: "monthly_unlimited_price",
    nameKey: "plan.monthly.name",
    price: "$9",
    periodKey: "plan.monthly.period",
    featureKeys: ["plan.monthly.f1", "plan.monthly.f2", "plan.monthly.f3"],
  },
  {
    priceId: "halfyear_unlimited_price",
    nameKey: "plan.half.name",
    price: "$29",
    periodKey: "plan.half.period",
    badgeKey: "plan.half.badge",
    featureKeys: ["plan.half.f1", "plan.half.f2", "plan.half.f3"],
  },
  {
    priceId: "yearly_unlimited_price",
    nameKey: "plan.year.name",
    price: "$39",
    periodKey: "plan.year.period",
    highlight: true,
    badgeKey: "plan.year.badge",
    featureKeys: ["plan.year.f1", "plan.year.f2", "plan.year.f3"],
  },
];

function PricingPage() {
  const { user } = useAuth();
  const { hasSubscription, planName, credits, refresh } = useEntitlement();
  const { t } = useI18n();
  const { openCheckout, loading: checkoutLoading } = usePaddleCheckout();
  const navigate = useNavigate();

  const handleChoose = (priceId: string) => {
    if (!user) {
      navigate({ to: "/auth" });
      return;
    }
    openCheckout(priceId, "/pricing?checkout=success");
  };

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
          <ArrowLeft className="h-3.5 w-3.5" /> {t("pricing.back")}
        </Link>
      </div>

      <section className="pt-6 pb-8">
        <p className="text-[11px] uppercase tracking-[0.28em] text-accent mb-4">{t("pricing.eyebrow")}</p>
        <h1 className="font-display text-4xl sm:text-5xl leading-[1.05] text-balance">
          {t("pricing.h1.line1")}
          <br />
          {t("pricing.h1.line2")}
        </h1>
        <p className="mt-4 text-sm text-muted-foreground max-w-md">
          {t("pricing.lede")}
        </p>

        {user && hasSubscription && (
          <div className="mt-6 rounded-2xl bg-secondary/60 border border-border/60 p-4 text-sm flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent" />
            {t("pricing.onPlan.pre")}<strong className="font-medium">{planName}</strong>{t("pricing.onPlan.post")}
          </div>
        )}
        {user && !hasSubscription && (
          <div className="mt-6 rounded-2xl bg-card border border-border/60 p-4 text-sm">
            <span className="text-muted-foreground">{t("pricing.creditsLeft")}</span>
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
          <p className="text-[11px] uppercase tracking-[0.28em] text-accent">{t("pricing.payg")}</p>
          <h3 className="font-display text-2xl mt-2">{t("pricing.pack.title")}</h3>
          <p className="text-sm text-muted-foreground mt-1.5"
             dangerouslySetInnerHTML={{
               __html: t("pricing.pack.body", { price: "<strong class='text-foreground'>$5</strong>" }),
             }}
          />
          <button
            onClick={() => handleChoose("pack_10_price")}
            disabled={checkoutLoading}
            className="mt-5 inline-flex w-full items-center justify-center h-11 rounded-full bg-secondary text-foreground font-medium tracking-wide hover:bg-secondary/80 transition disabled:opacity-50"
          >
            {checkoutLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : t("pricing.pack.cta")}
          </button>
        </div>
      </section>

      {user && <RedeemCard onRedeemed={refresh} />}

      <p className="mt-8 mb-4 text-center text-xs text-muted-foreground">
        {t("pricing.free.note")}
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
  const { t } = useI18n();
  return (
    <div
      className={cn(
        "rounded-3xl p-6 shadow-soft border",
        plan.highlight ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border/60",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-2xl">{t(plan.nameKey)}</h3>
          <p className={cn("text-sm mt-1", plan.highlight ? "text-primary-foreground/75" : "text-muted-foreground")}>
            <span className="font-display text-2xl text-foreground/100" style={{ color: "inherit" }}>
              {plan.price}
            </span>{" "}
            {t(plan.periodKey)}
          </p>
        </div>
        {plan.badgeKey && (
          <span
            className={cn(
              "text-[10px] uppercase tracking-[0.22em] px-2.5 py-1 rounded-full",
              plan.highlight
                ? "bg-primary-foreground/15 text-primary-foreground"
                : "bg-accent text-accent-foreground",
            )}
          >
            {t(plan.badgeKey)}
          </span>
        )}
      </div>

      <ul className="mt-5 space-y-2 text-sm">
        {plan.featureKeys.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <Check className={cn("h-4 w-4 mt-0.5 shrink-0", plan.highlight ? "text-primary-foreground/80" : "text-accent")} />
            <span className={cn(plan.highlight ? "text-primary-foreground/90" : "text-foreground/85")}>{t(f)}</span>
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
        {t("pricing.choose")}
      </button>
    </div>
  );
}

function RedeemCard({ onRedeemed }: { onRedeemed: () => Promise<void> }) {
  const { t } = useI18n();
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
      if (error || (data as { error?: string })?.error) {
        toast.error((data as { error?: string })?.error || t("promo.error"));
        return;
      }
      toast.success(t("promo.success", { n: (data as { credits: number }).credits }));
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
          <p className="text-[11px] uppercase tracking-[0.28em] text-accent">{t("promo.eyebrow")}</p>
        </div>
        <h3 className="font-display text-2xl mt-3">{t("promo.title")}</h3>
        <p className="text-sm text-muted-foreground mt-1.5">
          {t("promo.lede")}
        </p>
        <form onSubmit={submit} className="mt-4 flex gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={t("promo.placeholder")}
            className="flex-1 h-11 rounded-full bg-secondary px-5 text-sm outline-none focus:ring-2 focus:ring-accent"
            autoCapitalize="characters"
          />
          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="h-11 px-6 rounded-full bg-primary text-primary-foreground font-medium tracking-wide hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t("promo.submit")}
          </button>
        </form>
      </div>
    </section>
  );
}
