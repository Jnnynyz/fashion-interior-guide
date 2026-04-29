import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Shirt, Home } from "lucide-react";
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

      {/* Category cards */}
      <section className="grid sm:grid-cols-2 gap-4">
        <CategoryCard
          to={user ? "/upload" : "/auth"}
          icon={<Shirt className="h-5 w-5" strokeWidth={1.4} />}
          eyebrow={t("index.feature.outfit.eyebrow") || "Fashion"}
          title={t("index.feature.outfit.title")}
          body={t("index.feature.outfit.body")}
        />
        <CategoryCard
          to={user ? "/upload" : "/auth"}
          icon={<Home className="h-5 w-5" strokeWidth={1.4} />}
          eyebrow={t("index.feature.interior.eyebrow") || "Interior"}
          title={t("index.feature.interior.title")}
          body={t("index.feature.interior.body")}
        />
      </section>

      {/* Gallery */}
      <section className="mt-6">
        <p className="text-[11px] uppercase tracking-[0.22em] text-terracotta font-medium mb-4">Examples</p>
        <div className="gallery">
          {[
            { featured: true,  bg: "#c97f5b22", accent: "#c97f5b", eyebrow: "Outfit", caption: "Casual elevated" },
            { featured: false, bg: "#94a58322", accent: "#94a583", eyebrow: "Interior", caption: "Living room, refined" },
            { featured: false, bg: "#3a2f2522", accent: "#6f6055", eyebrow: "Outfit", caption: "Evening look" },
            { featured: false, bg: "#e8d4c533", accent: "#c97f5b", eyebrow: "Interior", caption: "Dining area" },
            { featured: false, bg: "#ddc9ad33", accent: "#6f6055", eyebrow: "Outfit", caption: "Weekend style" },
          ].map((tile, i) => (
            <div key={i} className={`g-tile${tile.featured ? " featured" : ""}`} style={{ background: tile.bg, border: "1px solid var(--line)" }}>
              <div className="g-tile-overlay" />
              <div className="g-tile-caption">
                <p className="text-[10px] uppercase tracking-[0.18em] font-medium mb-1" style={{ color: tile.accent }}>{tile.eyebrow}</p>
                <p className="font-display text-[20px] leading-tight text-cream-50">{tile.caption}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground text-center mt-4 tracking-[0.04em]">Your results will appear here</p>
      </section>

      {/* How it works */}
      <section className="mt-6 p-1.5 rounded-[28px] bg-cream-100 border border-[var(--line)]">
        <div className="bg-cream-50 rounded-[22px] p-8 shadow-[var(--shadow-card)]">
          <p className="text-[11px] uppercase tracking-[0.22em] text-terracotta font-medium">Process</p>
          <h2 className="font-display text-[32px] font-normal mt-1 leading-tight">{t("index.steps.title")}</h2>
          <ol className="mt-8 grid sm:grid-cols-3 gap-8 sm:gap-6">
            {[t("index.step.1"), t("index.step.2"), t("index.step.3")].map((s, i) => (
              <li key={i} className="flex flex-col">
                <span className="font-display text-[56px] leading-none text-terracotta font-normal">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="mt-3 h-px bg-[var(--line)]" />
                <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{s}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </AppShell>
  );
}

function CategoryCard({
  to, icon, eyebrow, title, body,
}: {
  to: string;
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <Link
      to={to}
      className="group block p-1.5 rounded-[28px] bg-cream-100 border border-[var(--line)] transition-transform duration-300 hover:-translate-y-1"
    >
      <div className="bg-cream-50 rounded-[22px] p-6 shadow-[var(--shadow-card)] flex flex-col h-full min-h-[200px]">
        <div className="h-10 w-10 rounded-full bg-cream-100 text-ink-700 grid place-items-center border border-[var(--line)]">
          {icon}
        </div>
        <p className="text-[11px] uppercase tracking-[0.22em] text-terracotta font-medium mt-4">{eyebrow}</p>
        <h3 className="font-display text-[28px] font-normal mt-1 leading-tight">{title}</h3>
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed flex-1">{body}</p>
        <div className="mt-5 flex items-center gap-1.5 text-[13px] text-ink-700 font-medium">
          <span className="tracking-[0.04em]">Analyse</span>
          <span className="grid place-items-center w-6 h-6 rounded-full bg-ink-900 text-cream-50 transition-transform duration-200 group-hover:translate-x-0.5">
            <ArrowRight className="h-3 w-3" strokeWidth={1.6} />
          </span>
        </div>
      </div>
    </Link>
  );
}
