import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set new password — What's Missing" },
      { name: "description", content: "Choose a new password for your account." },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error(t("reset.short"));
      return;
    }
    if (password !== confirm) {
      toast.error(t("reset.mismatch"));
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success(t("reset.success"));
      navigate({ to: "/upload" });
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
        <h1 className="font-display text-4xl mt-4">{t("reset.title")}</h1>
        <p className="text-sm text-muted-foreground mt-2">
          {ready ? t("reset.lede.ready") : t("reset.lede.verifying")}
        </p>

        <form onSubmit={submit} className="mt-8 space-y-4">
          <label className="block">
            <span className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground ml-1">
              {t("reset.field.new")}
            </span>
            <div className="mt-1.5">
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-base"
              />
            </div>
          </label>
          <label className="block">
            <span className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground ml-1">
              {t("reset.field.confirm")}
            </span>
            <div className="mt-1.5">
              <input
                type="password"
                required
                minLength={6}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                className="input-base"
              />
            </div>
          </label>

          <button
            type="submit"
            disabled={busy || !ready}
            className="w-full h-12 rounded-full bg-primary text-primary-foreground font-medium tracking-wide shadow-soft hover:opacity-90 transition disabled:opacity-60"
          >
            {busy ? t("reset.updating") : t("reset.submit")}
          </button>
        </form>
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
