import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Shirt, Home, ImagePlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { PaywallCard } from "@/components/PaywallCard";
import { useAuth } from "@/lib/auth";
import { useEntitlement } from "@/hooks/useEntitlement";
import { useI18n } from "@/lib/i18n";
import { getPaymentsEnv } from "@/lib/paddle";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
  GUEST_FREE_LIMIT,
  fileToDataUrl,
  getGuestRemaining,
  incrementGuestUsed,
  setGuestAnalysis,
} from "@/lib/guest";

export const Route = createFileRoute("/upload")({
  head: () => ({
    meta: [
      { title: "Upload — What's Missing" },
      { name: "description", content: "Upload your outfit or interior photo for AI styling analysis." },
    ],
  }),
  component: UploadPage,
});

type Category = "outfit" | "interior";

function UploadPage() {
  const { user, loading } = useAuth();
  const { hasSubscription, credits, loading: entLoading, refresh } = useEntitlement();
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const [category, setCategory] = useState<Category>("outfit");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [paywall, setPaywall] = useState(false);
  const [guestRemaining, setGuestRemaining] = useState<number>(GUEST_FREE_LIMIT);
  const inputRef = useRef<HTMLInputElement>(null);

  // Recompute guest remaining on mount / when auth status changes
  useEffect(() => {
    if (!user) setGuestRemaining(getGuestRemaining());
  }, [user]);

  // Authed: show paywall if no credits & no subscription
  useEffect(() => {
    if (!user) {
      setPaywall(false);
      return;
    }
    if (!entLoading) setPaywall(!hasSubscription && credits <= 0);
  }, [user, entLoading, hasSubscription, credits]);

  // Guests: if they've used all 5 free analyses, send them to /auth
  useEffect(() => {
    if (loading) return;
    if (!user && getGuestRemaining() <= 0) {
      navigate({ to: "/auth" });
    }
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const onPick = (f: File | null) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      toast.error(t("upload.err.image"));
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      toast.error(t("upload.err.size"));
      return;
    }
    setFile(f);
  };

  const analyzeAsGuest = async () => {
    if (!file) return;
    if (getGuestRemaining() <= 0) {
      navigate({ to: "/auth" });
      return;
    }
    setBusy(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      const { data, error } = await supabase.functions.invoke("analyze-image-public", {
        body: { image: dataUrl, category, language: lang },
      });
      if (error) throw error;
      if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);

      incrementGuestUsed();
      setGuestRemaining(getGuestRemaining());
      setGuestAnalysis({
        category,
        image: dataUrl,
        missing: data.missing ?? [],
        remove: data.remove ?? [],
        summary: data.summary ?? "",
        score: data.score ?? null,
        after_image_url: null,
      });
      navigate({ to: "/results/guest" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("upload.err.failed");
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const analyzeAsUser = async () => {
    if (!file || !user) return;
    setBusy(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("analysis-images")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;

      const { data, error } = await supabase.functions.invoke("analyze-image", {
        body: { imagePath: path, category, environment: getPaymentsEnv(), language: lang },
      });
      if (error) {
        const msg = (error as { message?: string }).message ?? "";
        if (/402|no_credits/i.test(msg)) {
          setPaywall(true);
          await refresh();
          return;
        }
        throw error;
      }
      if (data?.error === "no_credits") {
        setPaywall(true);
        await refresh();
        return;
      }
      if (data?.error) throw new Error(data.error);

      const { data: inserted, error: insErr } = await supabase
        .from("analyses")
        .insert({
          user_id: user.id,
          category,
          image_url: path,
          image_path: path,
          missing: data.missing ?? [],
          remove: data.remove ?? [],
          summary: data.summary ?? "",
          score: data.score ?? null,
        })
        .select("id")
        .single();
      if (insErr) throw insErr;

      await refresh();
      navigate({ to: "/results/$id", params: { id: inserted.id } });
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("upload.err.failed");
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const analyze = () => (user ? analyzeAsUser() : analyzeAsGuest());

  if (paywall) {
    return (
      <AppShell>
        <div className="pt-4">
          <PaywallCard />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="pt-4">
        {!user && !loading && (
          <div className="mb-5 rounded-2xl border border-border/60 bg-card px-4 py-3 text-sm flex items-center justify-between gap-3">
            <span className="text-foreground/85">
              {t("upload.guestRemaining", { n: String(guestRemaining) })}
            </span>
            <Link to="/auth" className="text-xs uppercase tracking-[0.22em] text-accent hover:opacity-80">
              {t("upload.guestSignup")}
            </Link>
          </div>
        )}

        <p className="text-[11px] uppercase tracking-[0.28em] text-accent">{t("upload.step1")}</p>
        <h1 className="font-display text-4xl mt-2">{t("upload.choose")}</h1>

        <div className="grid grid-cols-2 gap-3 mt-5">
          <CategoryCard
            active={category === "outfit"}
            onClick={() => setCategory("outfit")}
            icon={<Shirt className="h-4 w-4" />}
            title={t("upload.outfit")}
          />
          <CategoryCard
            active={category === "interior"}
            onClick={() => setCategory("interior")}
            icon={<Home className="h-4 w-4" />}
            title={t("upload.interior")}
          />
        </div>

        <p className="text-[11px] uppercase tracking-[0.28em] text-accent mt-10">{t("upload.step2")}</p>
        <h2 className="font-display text-3xl mt-2">{t("upload.uploadPhoto")}</h2>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={cn(
            "mt-5 w-full rounded-3xl border border-dashed border-border bg-card p-6 text-left transition hover:border-accent",
            preview ? "p-3" : "p-10",
          )}
        >
          {preview ? (
            <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-muted">
              <img src={preview} alt="Preview" className="absolute inset-0 h-full w-full object-cover" />
            </div>
          ) : (
            <div className="flex flex-col items-center text-center text-muted-foreground gap-3">
              <span className="h-12 w-12 rounded-full bg-secondary grid place-items-center">
                <ImagePlus className="h-5 w-5 text-foreground" />
              </span>
              <span className="font-display text-xl text-foreground">{t("upload.tap")}</span>
              <span className="text-xs">{t("upload.formats")}</span>
            </div>
          )}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onPick(e.target.files?.[0] ?? null)}
        />

        {preview && (
          <button
            onClick={() => {
              setFile(null);
              if (inputRef.current) inputRef.current.value = "";
            }}
            className="mt-3 text-xs uppercase tracking-[0.22em] text-muted-foreground hover:text-foreground"
          >
            {t("upload.replace")}
          </button>
        )}

        <button
          onClick={analyze}
          disabled={!file || busy}
          className="mt-8 w-full h-12 rounded-full bg-primary text-primary-foreground font-medium tracking-wide shadow-soft hover:opacity-90 transition disabled:opacity-50 inline-flex items-center justify-center gap-2"
        >
          {busy ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> {t("upload.analyzing")}
            </>
          ) : (
            <>{t("upload.analyze", { category: category === "outfit" ? t("upload.outfit") : t("upload.interior") })}</>
          )}
        </button>
      </div>
    </AppShell>
  );
}

function CategoryCard({
  active,
  onClick,
  icon,
  title,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-3xl p-5 text-left border transition shadow-soft",
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-card border-border hover:border-accent",
      )}
    >
      <span
        className={cn(
          "h-9 w-9 rounded-full grid place-items-center",
          active ? "bg-primary-foreground/15 text-primary-foreground" : "bg-secondary text-foreground",
        )}
      >
        {icon}
      </span>
      <div className="font-display text-2xl mt-4">{title}</div>
    </button>
  );
}
