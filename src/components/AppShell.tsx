import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { Sparkles, Upload, Clock, LogOut, LogIn, CreditCard, Globe, Sun, Moon } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useEntitlement } from "@/hooks/useEntitlement";
import { useI18n } from "@/lib/i18n";
import { useTheme } from "@/hooks/useTheme";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const { hasSubscription, credits, loading: entLoading } = useEntitlement();
  const { lang, setLang, t } = useI18n();
  const { theme, toggle: toggleTheme } = useTheme();
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
      <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[color-mix(in_oklch,var(--cream-50)_84%,transparent)] backdrop-blur-xl backdrop-saturate-[1.4]">
        <div className="mx-auto max-w-3xl px-5 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center group">
            <img src="/logo.png" alt="What's Missing" className="h-14 w-auto" style={{ mixBlendMode: "multiply" }} />
          </Link>
          <div className="flex items-center gap-2">
            {user && !entLoading && (
              <Link
                to="/pricing"
                className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-secondary border border-[var(--line)]"
                title={hasSubscription ? t("nav.unlimited") : t("nav.left", { n: credits })}
              >
                <Sparkles className="h-3 w-3 text-accent" strokeWidth={1.6} />
                {hasSubscription ? t("nav.unlimited") : t("nav.left", { n: credits })}
              </Link>
            )}
            <button
              onClick={toggleLang}
              aria-label={t("lang.label")}
              title={lang === "en" ? "Byt till svenska" : "Switch to English"}
              className="w-[38px] h-[38px] rounded-full border border-[var(--line)] bg-secondary grid place-items-center text-ink-700 transition-colors hover:bg-cream-200"
            >
              <Globe className="h-3.5 w-3.5" strokeWidth={1.4} />
            </button>
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="w-[38px] h-[38px] rounded-full border border-[var(--line)] bg-secondary grid place-items-center text-ink-700 transition-all duration-250 hover:bg-cream-200 hover:rotate-[15deg]"
            >
              {theme === "dark" ? <Moon className="h-4 w-4" strokeWidth={1.4} /> : <Sun className="h-4 w-4" strokeWidth={1.4} />}
            </button>
            {user ? (
              <button
                onClick={onSignOut}
                className="w-[38px] h-[38px] rounded-full border border-[var(--line)] bg-secondary grid place-items-center text-ink-700 transition-colors hover:bg-cream-200"
              >
                <LogOut className="h-3.5 w-3.5" strokeWidth={1.4} />
              </button>
            ) : (
              <Link
                to="/auth"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-ink-900 text-cream-50 text-[13px] tracking-[0.04em] transition-colors hover:bg-ink-800"
              >
                <LogIn className="h-3.5 w-3.5" strokeWidth={1.6} /> {t("nav.signIn")}
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-3xl px-5 pb-28 pt-6">{children}</main>

      <footer className={cn("w-full border-t border-[var(--line)] mt-16", user ? "pb-24" : "pb-0")}>
        <div className="mx-auto max-w-3xl px-5 py-12">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="col-span-2 sm:col-span-1">
              <img src="/logo.png" alt="What's Missing" className="h-10 w-auto mb-3" style={{ mixBlendMode: "multiply" }} />
              <p className="text-[13px] text-muted-foreground leading-relaxed max-w-[180px]">
                Calm, refined styling for outfits and interiors.
              </p>
            </div>

            {/* Product */}
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-ink-500 font-medium mb-4">Product</p>
              <ul className="space-y-2.5">
                {[
                  { to: "/upload", label: "Analyse" },
                  { to: "/pricing", label: t("footer.pricing") },
                  { to: "/history", label: "History" },
                ].map(l => (
                  <li key={l.to}>
                    <Link to={l.to} className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-ink-500 font-medium mb-4">Legal</p>
              <ul className="space-y-2.5">
                {[
                  { to: "/terms", label: t("footer.terms") },
                  { to: "/privacy", label: t("footer.privacy") },
                  { to: "/refunds", label: t("footer.refunds") },
                ].map(l => (
                  <li key={l.to}>
                    <Link to={l.to} className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Account */}
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-ink-500 font-medium mb-4">Account</p>
              <ul className="space-y-2.5">
                {user ? (
                  <li>
                    <button onClick={onSignOut} className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">
                      {t("nav.signOut")}
                    </button>
                  </li>
                ) : (
                  <li>
                    <Link to="/auth" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">
                      {t("nav.signIn")}
                    </Link>
                  </li>
                )}
              </ul>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-[var(--line)] flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[11px] text-muted-foreground">© {new Date().getFullYear()} What's Missing. All rights reserved.</p>
            <p className="text-[11px] text-muted-foreground">Made with care in Scandinavia.</p>
          </div>
        </div>
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
