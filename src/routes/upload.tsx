import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Shirt, Home, ImagePlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { PaywallCard } from "@/components/PaywallCard";
import { useAuth } from "@/lib/auth";
import { useEntitlement } from "@/hooks/useEntitlement";
import { getPaymentsEnv } from "@/lib/paddle";
import { supabase } from "@/integrations/supabase/client";
import { normalizeImageFile } from "@/lib/images";
import { cn } from "@/lib/utils";

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
  const navigate = useNavigate();
  const [category, setCategory] = useState<Category>("outfit");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [paywall, setPaywall] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!entLoading) setPaywall(!hasSubscription && credits <= 0);
  }, [entLoading, hasSubscription, credits]);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const onPick = async (f: File | null) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      toast.error("Image must be under 10MB.");
      return;
    }
    const normalized = await normalizeImageFile(f);
    setFile(normalized);
  };

  const analyze = async () => {
    if (!file || !user) return;
    setBusy(true);
    try {
      const ext = file.type === "image/png" ? "png" : "jpg";
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("analysis-images")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;

      const { data, error } = await supabase.functions.invoke("analyze-image", {
        body: { imagePath: path, category, environment: getPaymentsEnv() },
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
      const msg = err instanceof Error ? err.message : "Analysis failed";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

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
        <p className="text-[11px] uppercase tracking-[0.28em] text-accent">Step 01</p>
        <h1 className="font-display text-4xl mt-2">Choose a category</h1>

        <div className="grid grid-cols-2 gap-3 mt-5">
          <CategoryCard
            active={category === "outfit"}
            onClick={() => setCategory("outfit")}
            icon={<Shirt className="h-4 w-4" />}
            title="Outfit"
          />
          <CategoryCard
            active={category === "interior"}
            onClick={() => setCategory("interior")}
            icon={<Home className="h-4 w-4" />}
            title="Interior"
          />
        </div>

        <p className="text-[11px] uppercase tracking-[0.28em] text-accent mt-10">Step 02</p>
        <h2 className="font-display text-3xl mt-2">Upload a photo</h2>

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
              <img src={preview} alt="Preview" style={{ imageOrientation: "from-image" }} className="absolute inset-0 h-full w-full object-cover" />
            </div>
          ) : (
            <div className="flex flex-col items-center text-center text-muted-foreground gap-3">
              <span className="h-12 w-12 rounded-full bg-secondary grid place-items-center">
                <ImagePlus className="h-5 w-5 text-foreground" />
              </span>
              <span className="font-display text-xl text-foreground">Tap to add image</span>
              <span className="text-xs">JPG or PNG · up to 10MB</span>
            </div>
          )}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => void onPick(e.target.files?.[0] ?? null)}
        />

        {preview && (
          <button
            onClick={() => {
              setFile(null);
              if (inputRef.current) inputRef.current.value = "";
            }}
            className="mt-3 text-xs uppercase tracking-[0.22em] text-muted-foreground hover:text-foreground"
          >
            Replace photo
          </button>
        )}

        <button
          onClick={analyze}
          disabled={!file || busy}
          className="mt-8 w-full h-12 rounded-full bg-primary text-primary-foreground font-medium tracking-wide shadow-soft hover:opacity-90 transition disabled:opacity-50 inline-flex items-center justify-center gap-2"
        >
          {busy ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Analyzing…
            </>
          ) : (
            <>Analyze {category}</>
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
