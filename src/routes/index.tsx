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
      <section className="pt-6 pb-12">
        <p className="text-[11px] uppercase tracking-[0.28em] text-accent mb-5">
          {t("index.eyebrow")}
        </p>
        <h1 className="font-display text-5xl sm:text-6xl leading-[1.02] text-balance">
          {t("index.h1.line1")}
          <br />
          {t("index.h1.line2")}
        </h1>
        <p className="mt-5 text-base text-muted-foreground max-w-md text-balance">
          {t("index.lede")}
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <Link
            to={user ? "/upload" : "/auth"}
            className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-full bg-primary text-primary-foreground font-medium tracking-wide shadow-soft hover:opacity-90 transition"
          >
            {t("index.cta.begin")} <ArrowRight className="h-4 w-4" />
          </Link>
          {!user && (
            <Link
              to="/auth"
              className="inline-flex items-center justify-center h-11 px-6 rounded-full border border-border bg-card text-foreground/80 hover:text-foreground transition"
            >
              {t("index.cta.have")}
            </Link>
          )}
        </div>
      </section>

      <section className="grid sm:grid-cols-2 gap-4 mt-4">
        <FeatureCard
          icon={<Shirt className="h-4 w-4" />}
          title={t("index.feature.outfit.title")}
          body={t("index.feature.outfit.body")}
        />
        <FeatureCard
          icon={<Home className="h-4 w-4" />}
          title={t("index.feature.interior.title")}
          body={t("index.feature.interior.body")}
        />
      </section>

      <section className="mt-10 rounded-3xl bg-card p-6 sm:p-8 shadow-soft border border-border/60">
        <Sparkles className="h-4 w-4 text-accent" />
        <h2 className="font-display text-2xl mt-3">{t("index.steps.title")}</h2>
        <ol className="mt-5 space-y-4 text-sm">
          {[t("index.step.1"), t("index.step.2"), t("index.step.3")].map((s, i) => (
            <li key={i} className="flex gap-3">
              <span className="font-display text-accent text-base w-5">{i + 1}</span>
              <span className="text-foreground/80">{s}</span>
            </li>
          ))}
        </ol>
      </section>
    </AppShell>
  );
}

function FeatureCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-3xl bg-card border border-border/60 p-6 shadow-soft">
      <div className="h-9 w-9 rounded-full bg-secondary text-foreground grid place-items-center">
        {icon}
      </div>
      <h3 className="font-display text-2xl mt-4">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1.5">{body}</p>
    </div>
  );
}
