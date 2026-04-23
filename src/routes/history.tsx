import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { getSignedImageUrls } from "@/lib/storage";

type Row = {
  id: string;
  category: "outfit" | "interior";
  image_url: string;
  image_path: string;
  summary: string;
  score: number | null;
  created_at: string;
};

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "History — What's Missing" },
      { name: "description", content: "Your past styling analyses." },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const { user, loading } = useAuth();
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [signed, setSigned] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/auth" });
      return;
    }
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("analyses")
        .select("id, category, image_url, image_path, summary, score, created_at")
        .order("created_at", { ascending: false });
      const list = (data as Row[]) ?? [];
      setRows(list);
      const urls = await getSignedImageUrls(list.map((r) => r.image_path));
      setSigned(urls);
    })();
  }, [user, loading, navigate]);

  const localeTag = lang === "sv" ? "sv-SE" : "en-US";

  return (
    <AppShell>
      <div className="pt-4">
        <p className="text-[11px] uppercase tracking-[0.28em] text-accent">{t("history.eyebrow")}</p>
        <h1 className="font-display text-4xl mt-2">{t("history.title")}</h1>
        <p className="text-sm text-muted-foreground mt-2">{t("history.lede")}</p>
      </div>

      {rows === null ? (
        <p className="mt-10 text-center text-muted-foreground">{t("history.loading")}</p>
      ) : rows.length === 0 ? (
        <div className="mt-10 rounded-3xl border border-dashed border-border bg-card p-10 text-center">
          <Sparkles className="h-5 w-5 text-accent mx-auto" />
          <p className="font-display text-2xl mt-3">{t("history.empty.title")}</p>
          <p className="text-sm text-muted-foreground mt-2">{t("history.empty.body")}</p>
          <Link
            to="/upload"
            className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-primary text-primary-foreground px-6 font-medium hover:opacity-90"
          >
            {t("history.empty.cta")}
          </Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {rows.map((r) => (
            <li key={r.id}>
              <Link
                to="/results/$id"
                params={{ id: r.id }}
                className="flex gap-4 rounded-2xl bg-card border border-border/60 p-3 shadow-soft hover:border-accent transition"
              >
                <div className="h-24 w-20 shrink-0 rounded-xl overflow-hidden bg-muted">
                  <img src={signed[r.image_path] ?? ""} alt="" className="h-full w-full object-cover" />
                </div>
                <div className="flex-1 min-w-0 py-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] uppercase tracking-[0.24em] text-accent">
                      {r.category === "outfit" ? t("upload.outfit") : t("upload.interior")}
                    </span>
                    {r.score !== null && (
                      <span className="text-xs text-muted-foreground">
                        <span className="font-display text-foreground text-sm">{r.score}</span>/100
                      </span>
                    )}
                  </div>
                  <p className="font-display text-base leading-snug mt-1 line-clamp-2">
                    {r.summary || t("history.title")}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1.5">
                    {new Date(r.created_at).toLocaleDateString(localeTag, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
