import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Minus, ArrowLeft, Trash2, Sparkles, RotateCw, Download } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { getSignedImageUrl } from "@/lib/storage";

type Item = { title: string; reason: string };
type Analysis = {
  id: string;
  category: "outfit" | "interior";
  image_url: string;
  image_path: string;
  after_image_url: string | null;
  after_image_path: string | null;
  missing: Item[];
  remove: Item[];
  summary: string;
  score: number | null;
  created_at: string;
};

export const Route = createFileRoute("/results/$id")({
  head: () => ({
    meta: [
      { title: "Your analysis — What's Missing" },
      { name: "description", content: "Your styling analysis results." },
    ],
  }),
  component: ResultsPage,
});

function ResultsPage() {
  const { id } = Route.useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<Analysis | null>(null);
  const [fetching, setFetching] = useState(true);
  const [generatingAfter, setGeneratingAfter] = useState(false);
  const [beforeUrl, setBeforeUrl] = useState<string>("");
  const [afterUrl, setAfterUrl] = useState<string>("");

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/auth" });
      return;
    }
    if (!user) return;
    (async () => {
      const { data, error } = await supabase
        .from("analyses")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) toast.error(error.message);
      const a = data as Analysis | null;
      setData(a);
      if (a?.image_path) {
        const u = await getSignedImageUrl(a.image_path);
        if (u) setBeforeUrl(u);
      }
      if (a?.after_image_path) {
        const u = await getSignedImageUrl(a.after_image_path);
        if (u) setAfterUrl(u);
      }
      setFetching(false);
    })();
  }, [id, user, loading, navigate]);

  const onDelete = async () => {
    if (!data) return;
    if (!confirm("Delete this analysis?")) return;
    const paths = [data.image_path, ...(data.after_image_path ? [data.after_image_path] : [])];
    await supabase.storage.from("analysis-images").remove(paths);
    const { error } = await supabase.from("analyses").delete().eq("id", data.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Deleted.");
    navigate({ to: "/history" });
  };

  const onGenerateAfter = async () => {
    if (!data || generatingAfter) return;
    setGeneratingAfter(true);
    try {
      const { getPaymentsEnv } = await import("@/lib/paddle");
      const { data: res, error } = await supabase.functions.invoke("generate-after-image", {
        body: { analysisId: data.id, environment: getPaymentsEnv() },
      });
      if (error) {
        const msg = (error as { message?: string }).message ?? "Could not generate the after photo.";
        if (/402|no_credits/i.test(msg)) {
          toast.error("You're out of credits. Upgrade to keep refining.");
          navigate({ to: "/pricing" });
          return;
        }
        if (/429|rate/i.test(msg)) toast.error("Too many requests. Try again in a moment.");
        else toast.error(msg);
        return;
      }
      if ((res as { error?: string })?.error === "no_credits") {
        toast.error("You're out of credits. Upgrade to keep refining.");
        navigate({ to: "/pricing" });
        return;
      }
      const url = (res as { after_image_url?: string })?.after_image_url;
      if (!url) {
        toast.error("No image returned. Please try again.");
        return;
      }
      setAfterUrl(url);
      setData({ ...data, after_image_url: url, after_image_path: data.after_image_path ?? `${user?.id}/${data.id}-after.png` });
      toast.success("After photo ready.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setGeneratingAfter(false);
    }
  };

  const onDownloadAfter = async () => {
    const url = afterUrl || data?.after_image_url;
    if (!url) return;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Could not fetch image");
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = `whats-missing-after-${data?.id ?? "image"}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Download failed");
    }
  };

  if (fetching) {
    return (
      <AppShell>
        <div className="pt-20 text-center text-muted-foreground">Loading your analysis…</div>
      </AppShell>
    );
  }

  if (!data) {
    return (
      <AppShell>
        <div className="pt-20 text-center">
          <p className="text-muted-foreground">Analysis not found.</p>
          <Link to="/upload" className="text-accent underline mt-3 inline-block">Start a new one</Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="flex items-center justify-between pt-2">
        <Link to="/history" className="text-xs uppercase tracking-[0.22em] text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5">
          <ArrowLeft className="h-3.5 w-3.5" /> History
        </Link>
        <button
          onClick={onDelete}
          className="text-xs uppercase tracking-[0.22em] text-muted-foreground hover:text-destructive inline-flex items-center gap-1.5"
        >
          <Trash2 className="h-3.5 w-3.5" /> Delete
        </button>
      </div>

      <div className="mt-4 rounded-3xl overflow-hidden bg-card border border-border/60 shadow-soft">
        <div className="aspect-[4/5] bg-muted relative overflow-hidden">
          <img src={beforeUrl} alt="Your upload" style={{ imageOrientation: "from-image" }} className="absolute inset-0 h-full w-full object-cover" />
          {data.score !== null && (
            <div className="absolute top-3 right-3 bg-background/90 backdrop-blur rounded-full px-3 py-1.5 text-xs">
              <span className="text-muted-foreground">Score </span>
              <span className="font-display text-base">{data.score}</span>
              <span className="text-muted-foreground">/100</span>
            </div>
          )}
        </div>
        <div className="p-5">
          <p className="text-[11px] uppercase tracking-[0.28em] text-accent">
            {data.category === "outfit" ? "Outfit" : "Interior"} · Style summary
          </p>
          <p className="font-display text-xl mt-2 leading-snug text-balance">{data.summary}</p>
        </div>
      </div>

      <Section
        title="What's missing"
        accent
        icon={<Plus className="h-3.5 w-3.5" />}
        items={data.missing}
        empty="Nothing missing — beautifully complete."
      />
      <Section
        title="What to remove"
        icon={<Minus className="h-3.5 w-3.5" />}
        items={data.remove}
        empty="Nothing to remove. Effortlessly edited."
      />

      <section className="mt-8">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="h-6 w-6 rounded-full grid place-items-center bg-secondary text-foreground">
              <Sparkles className="h-3.5 w-3.5" />
            </span>
            <h2 className="font-display text-2xl">After</h2>
          </div>
          {data.after_image_url && !generatingAfter && (
            <span className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">AI preview</span>
          )}
        </div>

        <div className="mt-4 rounded-3xl overflow-hidden bg-card border border-border/60 shadow-soft">
          {data.after_image_url ? (
            <>
              <div className="grid grid-cols-1 gap-px bg-border/60 sm:grid-cols-2">
                <figure className="bg-card flex flex-col">
                  <div className="aspect-[4/5] bg-muted relative overflow-hidden">
                    <img
                      src={beforeUrl}
                      alt="Before"
                      style={{ imageOrientation: "from-image" }}
                      className="absolute inset-0 h-full w-full object-contain"
                    />
                  </div>
                  <figcaption className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground text-center py-2">Before</figcaption>
                </figure>
                <figure className="bg-card flex flex-col">
                  <div className="aspect-[4/5] bg-muted relative overflow-hidden">
                    <img
                      src={afterUrl || data.after_image_url || ""}
                      alt="After"
                      style={{ imageOrientation: "from-image" }}
                      className="absolute inset-0 h-full w-full object-contain"
                    />
                    <div className="absolute top-2 right-2 bg-background/90 backdrop-blur rounded-full px-2 py-0.5 text-[10px] inline-flex items-center gap-1">
                      <Sparkles className="h-2.5 w-2.5 text-accent" /> AI
                    </div>
                  </div>
                  <figcaption className="text-[10px] uppercase tracking-[0.22em] text-accent text-center py-2">After</figcaption>
                </figure>
              </div>
              <div className="p-4 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">An AI visualization — not a real photo.</p>
                <div className="flex items-center gap-4">
                  <button
                    onClick={onDownloadAfter}
                    className="text-xs uppercase tracking-[0.22em] text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5"
                  >
                    <Download className="h-3 w-3" /> Save
                  </button>
                  <button
                    onClick={onGenerateAfter}
                    disabled={generatingAfter}
                    className="text-xs uppercase tracking-[0.22em] text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5"
                  >
                    <RotateCw className="h-3 w-3" /> Redo
                  </button>
                </div>
              </div>
            </>
          ) : generatingAfter ? (
            <div className="p-6">
              <Skeleton className="aspect-[4/5] w-full rounded-2xl" />
              <p className="text-sm text-muted-foreground text-center mt-4">Styling your after photo… this takes 15–30s.</p>
            </div>
          ) : (
            <div className="p-8 text-center">
              <div className="aspect-[4/5] rounded-2xl bg-muted/60 grid place-items-center mb-5">
                <Sparkles className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="font-display text-xl leading-snug">See the fix, visualized.</p>
              <p className="text-sm text-muted-foreground mt-2">Generate an AI mockup applying the suggestions above.</p>
              <button
                onClick={onGenerateAfter}
                className="mt-5 inline-flex items-center justify-center gap-2 h-11 px-6 rounded-full bg-primary text-primary-foreground font-medium tracking-wide shadow-soft hover:opacity-90 transition"
              >
                <Sparkles className="h-4 w-4" /> Generate after photo
              </button>
            </div>
          )}
        </div>
      </section>


      <Link
        to="/upload"
        className="mt-10 mb-4 inline-flex w-full items-center justify-center h-12 rounded-full bg-primary text-primary-foreground font-medium tracking-wide shadow-soft hover:opacity-90 transition"
      >
        Analyze another
      </Link>
    </AppShell>
  );
}

function Section({
  title,
  icon,
  items,
  empty,
  accent,
}: {
  title: string;
  icon: React.ReactNode;
  items: Item[];
  empty: string;
  accent?: boolean;
}) {
  return (
    <section className="mt-8">
      <div className="flex items-center gap-2">
        <span
          className={
            "h-6 w-6 rounded-full grid place-items-center " +
            (accent ? "bg-accent text-accent-foreground" : "bg-secondary text-foreground")
          }
        >
          {icon}
        </span>
        <h2 className="font-display text-2xl">{title}</h2>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground mt-3 ml-8">{empty}</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {items.map((it, i) => (
            <li key={i} className="rounded-2xl bg-card border border-border/60 p-4 shadow-soft">
              <p className="font-display text-lg leading-tight">{it.title}</p>
              <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{it.reason}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
