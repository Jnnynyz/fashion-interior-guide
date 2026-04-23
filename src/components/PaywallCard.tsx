import { Sparkles } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";

export function PaywallCard() {
  const { t } = useI18n();
  return (
    <div className="rounded-3xl bg-card border border-border/60 p-6 sm:p-8 shadow-soft">
      <div className="flex items-center gap-2">
        <span className="h-7 w-7 rounded-full bg-accent text-accent-foreground grid place-items-center">
          <Sparkles className="h-3.5 w-3.5" />
        </span>
        <p className="text-[11px] uppercase tracking-[0.28em] text-accent">{t("paywall.eyebrow")}</p>
      </div>

      <p className="font-display text-2xl mt-4 leading-snug text-balance">
        {t("paywall.headline")}
        <br />
        {t("paywall.sub")}
      </p>

      <p className="font-display text-xl mt-5 leading-snug">{t("paywall.unlock")}</p>

      <ul className="mt-4 space-y-2.5 text-sm text-foreground/85">
        <li className="flex gap-2.5">
          <span className="text-accent mt-0.5">·</span>
          {t("paywall.b1")}
        </li>
        <li className="flex gap-2.5">
          <span className="text-accent mt-0.5">·</span>
          {t("paywall.b2")}
        </li>
        <li className="flex gap-2.5">
          <span className="text-accent mt-0.5">·</span>
          {t("paywall.b3")}
        </li>
      </ul>

      <Link
        to="/pricing"
        className="mt-6 inline-flex w-full items-center justify-center gap-2 h-12 rounded-full bg-primary text-primary-foreground font-medium tracking-wide shadow-soft hover:opacity-90 transition"
      >
        {t("paywall.cta")}
      </Link>
    </div>
  );
}
