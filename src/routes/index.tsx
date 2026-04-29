import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles, Shirt, Home } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "What's Missing — Style your outfit & space" },
      {
        name: "description",
        content:
          "Upload a photo of your outfit or interior and receive elegant, AI-powered suggestions on what to add or remove.",
      },
      { property: "og:title", content: "What's Missing" },
      {
        property: "og:description",
        content: "Scandinavian-inspired AI styling for outfits and interiors.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const { user } = useAuth();
  const { t } = useI18n();
  return (
    <AppShell>
      {/* Hero */}
      <section className="pt-10 pb-14">
        <p className="text-[11px] uppercase tracking-[0.22em] text-terracotta font-medium mb-6">
          {t("index.eyebrow")}
        </p>
        <h1 className="font-display font-normal leading-[1.02] text-balance" style={{ fontSize: "clamp(48px, 7vw, 88px)", letterSpacing: "-0.015em" }}>
          {t("index.h1.line1")}
          <br />
          <em className="not-italic text-terracotta">{t("index.h1.line2")}</em>
        </h1>
        <p className="mt-6 text-[17px] text-muted-foreground max-w-md text-balance leading-[1.6]">
          {t("index.lede")}
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-3">
          <Link
            to={user ? "/upload" : "/auth"}
            className="group inline-flex items-center gap-2.5 px-5 py-3.5 rounded-full bg-ink-900 text-cream-50 text-sm font-medium transition-all duration-150 hover:bg-ink-800 active:scale-[0.97]"
            style={{ transitionTimingFunction: "var(--ease-out-quint)" }}
          >
            {t("index.cta.begin")}
            <span className="grid place-items-center w-6 h-6 rounded-full bg-white/10 transition-transform duration-200 group-hover:translate-x-0.5">
              <ArrowRight className="h-3 w-3" strokeWidth={1.6} />
            </span>
          </Link>
          {!user && (
            <Link
              to="/auth"
              className="inline-flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-full bg-transparent text-ink-900 text-sm font-medium border border-[var(--line-strong)] hover:bg-cream-100 transition-colors"
            >
              {t("index.cta.have")}
            </Link>
          )}
        </div>
      </section>

      {/* Feature cards */}
      <section className="grid sm:grid-cols-2 gap-4">
        <FeatureCard
          icon={<Shirt className="h-4 w-4" strokeWidth={1.4} />}
          title={t("index.feature.outfit.title")}
          body={t("index.feature.outfit.body")}
        />
        <FeatureCard
          icon={<Home className="h-4 w-4" strokeWidth={1.4} />}
          title={t("index.feature.interior.title")}
          body={t("index.feature.interior.body")}
        />
      </section>

      {/* How it works */}
      <section className="mt-6 p-1.5 rounded-[28px] bg-cream-100 border border-[var(--line)]">
        <div className="bg-cream-50 rounded-[22px] p-8 shadow-[var(--shadow-card)]">
          <p className="text-[11px] uppercase tracking-[0.22em] text-terracotta font-medium">{t("index.steps.title")}</p>
          <ol className="mt-6 space-y-5">
            {[t("index.step.1"), t("index.step.2"), t("index.step.3")].map((s, i) => (
              <li key={i} className="flex gap-4 items-start">
                <span className="font-display text-[26px] leading-none text-terracotta w-7 shrink-0">{i + 1}</span>
                <span className="text-sm text-muted-foreground leading-relaxed pt-1">{s}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </AppShell>
  );
}

function FeatureCard({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="p-1.5 rounded-[28px] bg-cream-100 border border-[var(--line)] transition-transform duration-300 hover:-translate-y-0.5">
      <div className="bg-cream-50 rounded-[22px] p-6 shadow-[var(--shadow-card)]">
        <div className="h-9 w-9 rounded-full bg-cream-100 text-ink-700 grid place-items-center">
          {icon}
        </div>
        <h3 className="font-display text-[26px] font-normal mt-4 leading-tight">{title}</h3>
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{body}</p>
      </div>
    </div>
  );
}
