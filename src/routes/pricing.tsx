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
    highlight: true,
    badgeKey: "plan.half.badge",
    featureKeys: ["plan.half.f1", "plan.half.f2", "plan.half.f3"],
  },
  {
    priceId: "yearly_unlimited_price",
    nameKey: "plan.year.name",
    price: "$39",
    periodKey: "plan.year.period",
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

      <section className="grid sm:grid-cols-3 gap-4 items-start">
        {PLANS.map((p) => (
          <PlanCard
            key={p.priceId}
            plan={p}
            disabled={checkoutLoading || hasSubscription}
            onChoose={() => handleChoose(p.priceId)}
          />
        ))}
      </section>

      <section className="mt-6">
        <div className="p-1.5 rounded-[28px] bg-cream-100 border border-[var(--line)]">
          <div className="bg-cream-50 rounded-[22px] p-6 shadow-[var(--shadow-card)]">
            <p className="text-[11px] uppercase tracking-[0.22em] text-terracotta font-medium">{t("pricing.payg")}</p>
            <h3 className="font-display text-[28px] font-normal mt-1">{t("pricing.pack.title")}</h3>
            <p className="text-sm text-muted-foreground mt-2"
               dangerouslySetInnerHTML={{
                 __html: t("pricing.pack.body", { price: "<strong class='text-foreground'>$5</strong>" }),
               }}
            />
            <button
              onClick={() => handleChoose("pack_10_price")}
              disabled={checkoutLoading}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 h-11 rounded-full bg-ink-900 text-cream-50 text-sm font-medium hover:bg-ink-800 transition disabled:opacity-50"
            >
              {checkoutLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : t("pricing.pack.cta")}
            </button>
          </div>
        </div>
      </section>

      {user && <RedeemCard onRedeemed={refresh} />}

      <p className="mt-8 mb-4 text-center text-xs text-muted-foreground">
        {t("pricing.free.note")}
      </p>
    </AppShell>
  );
}

function PlanCard({ plan, disabled, onChoose }: { plan: Plan; disabled: boolean; onChoose: () => void }) {
  const { t } = useI18n();
  return (
    <div className={cn(
      "relative p-1.5 rounded-[28px] border",
      plan.highlight ? "bg-ink-800 border-ink-700" : "bg-cream-100 border-[var(--line)]",
    )}>
      {plan.badgeKey && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <span className="inline-block px-3 py-1 rounded-full text-[10px] uppercase tracking-[0.18em] font-medium bg-terracotta text-cream-50 shadow-sm whitespace-nowrap">
            {t(plan.badgeKey)}
          </span>
        </div>
      )}
      <div className={cn(
        "rounded-[22px] p-6 shadow-[var(--shadow-card)] flex flex-col",
        plan.highlight ? "bg-ink-800" : "bg-cream-50",
      )}>
        <h3 className={cn("font-display text-[26px] font-normal", plan.highlight ? "text-cream-50" : "text-ink-900")}>
          {t(plan.nameKey)}
        </h3>
        <p className={cn("mt-1 text-sm", plan.highlight ? "text-cream-200" : "text-muted-foreground")}>
          <span className={cn("font-display text-[32px] font-normal", plan.highlight ? "text-cream-50" : "text-ink-900")}>
            {plan.price}
          </span>{" "}{t(plan.periodKey)}
        </p>

        <ul className="mt-5 space-y-2.5 text-sm flex-1">
          {plan.featureKeys.map((f) => (
            <li key={f} className="flex items-start gap-2.5">
              <Check className={cn("h-4 w-4 mt-0.5 shrink-0", plan.highlight ? "text-terracotta" : "text-terracotta")} strokeWidth={2} />
              <span className={plan.highlight ? "text-cream-200" : "text-ink-700"}>{t(f)}</span>
            </li>
          ))}
        </ul>

        <button
          onClick={onChoose}
          disabled={disabled}
          className={cn(
            "mt-6 w-full h-11 rounded-full text-sm font-medium transition disabled:opacity-50",
            plan.highlight
              ? "bg-cream-50 text-ink-900 hover:bg-cream-100"
              : "bg-ink-900 text-cream-50 hover:bg-ink-800",
          )}
        >
          {t("pricing.choose")}
        </button>
      </div>
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
      let errMsg: string | undefined = (data as { error?: string })?.error;
      if (error && !errMsg) {
        // FunctionsHttpError: parse the response body for the server's error message
        try {
          const ctx = (error as { context?: Response }).context;
          if (ctx && typeof ctx.json === "function") {
            const body = await ctx.clone().json();
            errMsg = body?.error;
          }
        } catch {
          // ignore parse errors
        }
      }
      if (error || errMsg) {
        toast.error(errMsg || t("promo.error"));
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
            className="flex-1 h-11 rounded-full bg-cream-100 border border-[var(--line-strong)] px-5 text-sm outline-none focus:ring-2 focus:ring-terracotta"
            autoCapitalize="characters"
          />
          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="h-11 px-6 rounded-full bg-ink-900 text-cream-50 text-sm font-medium hover:bg-ink-800 transition disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t("promo.submit")}
          </button>
        </form>
      </div>
    </section>
  );
}
