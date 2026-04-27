// Guest free-trial tracking. Up to 5 free analyses per browser before signup is required.
// This is enforced client-side only; the public edge functions don't gate by user identity.

const KEY = "wm_guest_used";
export const GUEST_FREE_LIMIT = 5;

export function getGuestUsed(): number {
  if (typeof window === "undefined") return 0;
  const v = Number(window.localStorage.getItem(KEY) ?? "0");
  return Number.isFinite(v) && v > 0 ? Math.min(v, 9999) : 0;
}

export function getGuestRemaining(): number {
  return Math.max(0, GUEST_FREE_LIMIT - getGuestUsed());
}

export function incrementGuestUsed(): number {
  const next = getGuestUsed() + 1;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(KEY, String(next));
  }
  return next;
}

// Reads a File as a base64 data URL (suitable for sending to the public edge function).
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result ?? ""));
    r.onerror = () => reject(r.error ?? new Error("read failed"));
    r.readAsDataURL(file);
  });
}

export type GuestAnalysis = {
  category: "outfit" | "interior";
  image: string; // data URL
  missing: { title: string; reason: string }[];
  remove: { title: string; reason: string }[];
  summary: string;
  score: number | null;
  after_image_url?: string | null;
};

const SESSION_KEY = "wm_guest_analysis";

export function setGuestAnalysis(a: GuestAnalysis) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(a));
  } catch {
    // sessionStorage may be full (large base64); ignore — results will still render in-memory via state
  }
}

export function getGuestAnalysis(): GuestAnalysis | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as GuestAnalysis;
  } catch {
    return null;
  }
}

export function clearGuestAnalysis() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(SESSION_KEY);
}
