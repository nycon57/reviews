/**
 * Image loader: fetches remote URLs and converts to base64 data URIs
 * for embedding in SVG <image> elements.
 *
 * resvg does NOT auto-fetch external URLs — all images must be inlined
 * as data URIs for server-side rendering.
 */

// Simple LRU cache to avoid refetching the same avatar/logo across renders
const cache = new Map<string, { value: string | null; ts: number }>();
const MAX_CACHE_SIZE = 50;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function evictStale() {
  if (cache.size <= MAX_CACHE_SIZE) return;
  const now = Date.now();
  for (const [key, entry] of cache) {
    if (now - entry.ts > CACHE_TTL_MS) {
      cache.delete(key);
    }
  }
  // If still over limit, evict oldest
  if (cache.size > MAX_CACHE_SIZE) {
    const firstKey = cache.keys().next().value;
    if (firstKey) cache.delete(firstKey);
  }
}

/**
 * Fetch a URL and return a base64 data URI, or null on failure.
 */
export async function fetchImageAsBase64(
  url: string,
): Promise<string | null> {
  if (!url) return null;

  // Check cache
  const cached = cache.get(url);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return cached.value;
  }

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) {
      cache.set(url, { value: null, ts: Date.now() });
      return null;
    }

    const contentType = res.headers.get("content-type") || "image/png";
    const mime = contentType.split(";")[0].trim();
    const arrayBuffer = await res.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const dataUri = `data:${mime};base64,${base64}`;

    evictStale();
    cache.set(url, { value: dataUri, ts: Date.now() });
    return dataUri;
  } catch {
    cache.set(url, { value: null, ts: Date.now() });
    return null;
  }
}

/**
 * Fetch multiple images in parallel. Returns a map of url → dataUri|null.
 */
export async function fetchImagesAsBase64(
  urls: (string | null | undefined)[],
): Promise<Map<string, string | null>> {
  const validUrls = urls.filter((u): u is string => !!u);
  const results = await Promise.all(
    validUrls.map(async (url) => ({
      url,
      data: await fetchImageAsBase64(url),
    })),
  );

  const map = new Map<string, string | null>();
  for (const { url, data } of results) {
    map.set(url, data);
  }
  return map;
}
