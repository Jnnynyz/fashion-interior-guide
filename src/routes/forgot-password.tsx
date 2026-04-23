import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset password — What's Missing" },
      { name: "description", content: "Reset your password to regain access to your account." },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
      toast.success(t("forgot.toast"));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell>
      <div className="max-w-md mx-auto pt-6">
        <Link to="/auth" className="text-xs uppercase tracking-[0.22em] text-muted-foreground hover:text-foreground">
          {t("forgot.back")}
        </Link>
        <h1 className="font-display text-4xl mt-4">{t("forgot.title")}</h1>
        <p className="text-sm text-muted-foreground mt-2">
          {t("forgot.lede")}
        </p>

        {sent ? (
          <div className="mt-8 rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
            {t("forgot.sent.pre")}<span className="text-foreground">{email}</span>{t("forgot.sent.post")}
          </div>
        ) : (
          <form onSubmit={submit} className="mt-8 space-y-4">
            <label className="block">
              <span className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground ml-1">
                {t("auth.field.email")}
              </span>
              <div className="mt-1.5">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input-base"
                />
              </div>
            </label>

            <button
              type="submit"
              disabled={busy}
              className="w-full h-12 rounded-full bg-primary text-primary-foreground font-medium tracking-wide shadow-soft hover:opacity-90 transition disabled:opacity-60"
            >
              {busy ? t("forgot.sending") : t("forgot.send")}
            </button>
          </form>
        )}
      </div>

      <style>{`
        .input-base {
          width: 100%;
          height: 3rem;
          padding: 0 1rem;
          border-radius: 9999px;
          background: var(--color-card);
          border: 1px solid var(--color-border);
          color: var(--color-foreground);
          font-size: 0.95rem;
          outline: none;
          transition: border-color .2s, box-shadow .2s;
        }
        .input-base:focus { border-color: var(--color-accent); box-shadow: 0 0 0 4px color-mix(in oklab, var(--color-accent) 14%, transparent); }
      `}</style>
    </AppShell>
  );
}
