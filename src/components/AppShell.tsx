import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { Sparkles, Upload, Clock, LogOut, LogIn, CreditCard, Globe } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useEntitlement } from "@/hooks/useEntitlement";
import { useI18n } from "@/lib/i18n";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const { hasSubscription, credits, loading: entLoading } = useEntitlement();
  const { lang, setLang, t } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();

  const onSignOut = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  const toggleLang = () => setLang(lang === "en" ? "sv" : "en");

  return (
    <div className="min-h-screen bg-gradient-warm flex flex-col">
      <PaymentTestModeBanner />
      <header className="sticky top-0 z-30 backdrop-blur bg-background/70 border-b border-border/60">
        <div className="mx-auto max-w-3xl px-5 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <span className="h-7 w-7 rounded-full bg-accent text-accent-foreground grid place-items-center">
              <Sparkles className="h-3.5 w-3.5" />
            </span>
            <span className="font-display text-xl tracking-tight">What's Missing</span>
          </Link>
          <div className="flex items-center gap-3">
            {user && !entLoading && (
              <Link
                to="/pricing"
                className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary/60 border border-border/60"
                title={hasSubscription ? t("nav.unlimited") : t("nav.left", { n: credits })}
              >
                <Sparkles className="h-3 w-3 text-accent" />
                {hasSubscription ? t("nav.unlimited") : t("nav.left", { n: credits })}
              </Link>
            )}
            <button
              onClick={toggleLang}
              aria-label={t("lang.label")}
              title={lang === "en" ? "Byt till svenska" : "Switch to English"}
              className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 px-2 py-1 rounded-full border border-border/60"
            >
              <Globe className="h-3 w-3" />
              {lang === "en" ? t("lang.sv") : t("lang.en")}
            </button>
            {user ? (
              <button
                onClick={onSignOut}
                className="text-xs uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
              >
                <LogOut className="h-3.5 w-3.5" /> {t("nav.signOut")}
              </button>
            ) : (
              <Link
                to="/auth"
                className="text-xs uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
              >
                <LogIn className="h-3.5 w-3.5" /> {t("nav.signIn")}
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-3xl px-5 pb-28 pt-6">{children}</main>

      <footer className={cn("mx-auto w-full max-w-3xl px-5 py-6 text-center", user ? "pb-24" : "pb-6")}>
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          <Link to="/pricing" className="hover:text-foreground transition-colors">{t("footer.pricing")}</Link>
          <span aria-hidden>·</span>
          <Link to="/terms" className="hover:text-foreground transition-colors">{t("footer.terms")}</Link>
          <span aria-hidden>·</span>
          <Link to="/refunds" className="hover:text-foreground transition-colors">{t("footer.refunds")}</Link>
          <span aria-hidden>·</span>
          <Link to="/privacy" className="hover:text-foreground transition-colors">{t("footer.privacy")}</Link>
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground">© {new Date().getFullYear()} JennyNystrand</p>
      </footer>

      {user && (
        <nav className="fixed bottom-0 inset-x-0 z-30 border-t border-border/60 bg-background/85 backdrop-blur">
          <div className="mx-auto max-w-3xl grid grid-cols-3 px-5 py-2 gap-2 safe-bottom">
            <TabLink
              to="/upload"
              label={t("nav.analyze")}
              icon={<Upload className="h-4 w-4" />}
              active={location.pathname.startsWith("/upload") || location.pathname.startsWith("/results")}
            />
            <TabLink
              to="/history"
              label={t("nav.history")}
              icon={<Clock className="h-4 w-4" />}
              active={location.pathname.startsWith("/history")}
            />
            <TabLink
              to="/pricing"
              label={t("nav.premium")}
              icon={<CreditCard className="h-4 w-4" />}
              active={location.pathname.startsWith("/pricing")}
            />
          </div>
        </nav>
      )}
    </div>
  );
}

function TabLink({
  to,
  label,
  icon,
  active,
}: {
  to: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "flex flex-col items-center justify-center py-2 rounded-lg text-[11px] uppercase tracking-[0.18em] transition-colors",
        active ? "text-foreground bg-secondary" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {icon}
      <span className="mt-0.5">{label}</span>
    </Link>
  );
}
