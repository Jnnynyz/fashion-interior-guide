import { useState, useEffect } from "react";
import { Download, X, Share } from "lucide-react";

type Platform = "android" | "ios" | "other";

function getPlatform(): Platform {
  if (typeof navigator === "undefined") return "other";
  if (/iPad|iPhone|iPod/.test(navigator.userAgent)) return "ios";
  if (/Android/.test(navigator.userAgent)) return "android";
  return "other";
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as any).standalone === true;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installed, setInstalled] = useState(false);
  const platform = getPlatform();

  useEffect(() => {
    if (isStandalone()) {
      setInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);

    window.addEventListener("appinstalled", () => setInstalled(true));

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (installed) return null;
  if (platform === "other" && !deferredPrompt) return null;

  const handleAndroidInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setDeferredPrompt(null);
  };

  if (platform === "ios") {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="group inline-flex items-center gap-2.5 px-5 py-3.5 rounded-full border border-[var(--line-strong)] bg-cream-50 text-ink-900 text-sm font-medium hover:bg-cream-100 transition-colors"
        >
          <Download className="h-4 w-4" strokeWidth={1.6} />
          Install app
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: "rgba(26,20,16,0.5)" }}>
            <div className="w-full max-w-sm p-1.5 rounded-[28px] bg-cream-100 border border-[var(--line)]">
              <div className="bg-cream-50 rounded-[22px] p-6 shadow-[var(--shadow-card)]">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.22em] text-terracotta font-medium">Install</p>
                    <h3 className="font-display text-[24px] font-normal mt-0.5">Add to Home Screen</h3>
                  </div>
                  <button onClick={() => setShowIOSGuide(false)} className="w-8 h-8 rounded-full bg-cream-100 grid place-items-center text-ink-500 hover:text-ink-900 transition-colors">
                    <X className="h-4 w-4" strokeWidth={1.4} />
                  </button>
                </div>
                <ol className="space-y-4">
                  {[
                    { icon: <Share className="h-4 w-4 shrink-0" strokeWidth={1.4} />, text: 'Tap the Share button at the bottom of Safari' },
                    { icon: <span className="text-[13px] font-medium shrink-0">+</span>, text: 'Scroll down and tap "Add to Home Screen"' },
                    { icon: <span className="text-[13px] font-medium shrink-0">✓</span>, text: 'Tap "Add" — the app appears on your home screen' },
                  ].map((s, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="h-7 w-7 rounded-full bg-terracotta-soft text-terracotta grid place-items-center mt-0.5 shrink-0">
                        {s.icon}
                      </span>
                      <span className="text-sm text-muted-foreground leading-relaxed">{s.text}</span>
                    </li>
                  ))}
                </ol>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="mt-6 w-full h-11 rounded-full bg-ink-900 text-cream-50 text-sm font-medium hover:bg-ink-800 transition-colors"
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  if (deferredPrompt) {
    return (
      <button
        onClick={handleAndroidInstall}
        className="group inline-flex items-center gap-2.5 px-5 py-3.5 rounded-full border border-[var(--line-strong)] bg-cream-50 text-ink-900 text-sm font-medium hover:bg-cream-100 transition-colors"
      >
        <Download className="h-4 w-4" strokeWidth={1.6} />
        Install app
      </button>
    );
  }

  return null;
}
