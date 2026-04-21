import { supabase } from "@/integrations/supabase/client";

const cache = new Map<string, { url: string; exp: number }>();

/**
 * Returns a signed URL for an object in the analysis-images bucket.
 * Caches results in-memory until shortly before expiry.
 */
export async function getSignedImageUrl(path: string, expiresInSeconds = 3600): Promise<string | null> {
  if (!path) return null;
  const now = Date.now();
  const hit = cache.get(path);
  if (hit && hit.exp - 60_000 > now) return hit.url;

  const { data, error } = await supabase.storage
    .from("analysis-images")
    .createSignedUrl(path, expiresInSeconds);
  if (error || !data?.signedUrl) return null;
  cache.set(path, { url: data.signedUrl, exp: now + expiresInSeconds * 1000 });
  return data.signedUrl;
}

export async function getSignedImageUrls(paths: (string | null | undefined)[]): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  await Promise.all(
    paths.filter((p): p is string => !!p).map(async (p) => {
      const u = await getSignedImageUrl(p);
      if (u) out[p] = u;
    }),
  );
  return out;
}
