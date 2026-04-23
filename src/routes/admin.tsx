import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Users, CreditCard, Sparkles, Image as ImageIcon, ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ title: "Admin — What's Missing" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminPage,
});

type Stats = {
  total_users: number;
  signups_30d: number;
  active_subscriptions: number;
  subscriptions_by_plan: Record<string, number>;
  pack_credits_sold: number;
  analyses_total: number;
  analyses_30d: number;
};

function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const PLAN_LABELS: Record<string, string> = {
    monthly_unlimited: t("plan.monthly.name"),
    halfyear_unlimited: t("plan.half.name"),
    yearly_unlimited: t("plan.year.name"),
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate({ to: "/auth" });
      return;
    }
    (async () => {
      setLoading(true);
      const { data, error } = await supabase.rpc("admin_stats");
      if (error) {
        setError(error.message.includes("Forbidden") ? t("admin.forbidden") : error.message);
      } else {
        setStats(data as unknown as Stats);
      }
      setLoading(false);
    })();
  }, [user, authLoading, navigate, t]);

  return (
    <AppShell>
      <div className="pt-2">
        <Link
          to="/upload"
          className="text-xs uppercase tracking-[0.22em] text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> {t("common.back")}
        </Link>
      </div>

      <section className="pt-6 pb-8">
        <p className="text-[11px] uppercase tracking-[0.28em] text-accent mb-4">{t("admin.eyebrow")}</p>
        <h1 className="font-display text-4xl sm:text-5xl leading-[1.05]">{t("admin.title")}</h1>
        <p className="mt-3 text-sm text-muted-foreground">{t("admin.lede")}</p>
      </section>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> {t("admin.loading")}
        </div>
      )}

      {error && (
        <div className="rounded-2xl bg-card border border-border/60 p-5 text-sm">
          {error}
        </div>
      )}

      {stats && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label={t("admin.totalUsers")}
              value={stats.total_users}
              hint={t("admin.signupsHint", { n: stats.signups_30d })}
              icon={<Users className="h-4 w-4" />}
            />
            <StatCard
              label={t("admin.subs")}
              value={stats.active_subscriptions}
              hint={t("admin.subsHint")}
              icon={<Sparkles className="h-4 w-4" />}
            />
            <StatCard
              label={t("admin.packs")}
              value={stats.pack_credits_sold}
              hint={t("admin.packsHint")}
              icon={<CreditCard className="h-4 w-4" />}
            />
            <StatCard
              label={t("admin.analyses")}
              value={stats.analyses_total}
              hint={t("admin.analysesHint", { n: stats.analyses_30d })}
              icon={<ImageIcon className="h-4 w-4" />}
            />
          </div>

          <section className="mt-6">
            <div className="rounded-3xl bg-card border border-border/60 p-6 shadow-soft">
              <p className="text-[11px] uppercase tracking-[0.28em] text-accent">{t("admin.byPlan")}</p>
              <h3 className="font-display text-2xl mt-2">{t("admin.breakdown")}</h3>
              {Object.keys(stats.subscriptions_by_plan).length === 0 ? (
                <p className="mt-4 text-sm text-muted-foreground">{t("admin.noSubs")}</p>
              ) : (
                <ul className="mt-4 divide-y divide-border/60">
                  {Object.entries(stats.subscriptions_by_plan).map(([plan, n]) => (
                    <li key={plan} className="flex items-center justify-between py-3 text-sm">
                      <span>{PLAN_LABELS[plan] ?? plan}</span>
                      <span className="font-display text-lg">{n}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </>
      )}
    </AppShell>
  );
}

function StatCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: number;
  hint?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl bg-card border border-border/60 p-5 shadow-soft">
      <div className="flex items-center gap-2 text-muted-foreground">
        <span className="h-7 w-7 rounded-full bg-accent/30 text-accent-foreground grid place-items-center">
          {icon}
        </span>
        <span className="text-[11px] uppercase tracking-[0.22em]">{label}</span>
      </div>
      <p className="mt-3 font-display text-3xl">{value.toLocaleString()}</p>
      {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}
