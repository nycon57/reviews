/**
 * Free translation using Google Translate's public endpoint.
 * No API key, no Gemini, no cost. Server-side only.
 * Results are cached in-memory for instant repeat lookups.
 */

const TRANSLATE_URL =
  "https://translate.googleapis.com/translate_a/single";

// In-memory cache: "es:original text" → "translated text"
const translationCache = new Map<string, string>();

async function translateOne(
  text: string,
  targetLang: string,
): Promise<string> {
  const cacheKey = `${targetLang}:${text}`;
  const cached = translationCache.get(cacheKey);
  if (cached) return cached;

  try {
    const params = new URLSearchParams({
      client: "gtx",
      sl: "auto",
      tl: targetLang,
      dt: "t",
      q: text,
    });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    let res: Response;
    try {
      res = await fetch(`${TRANSLATE_URL}?${params}`, { signal: controller.signal });
    } finally {
      clearTimeout(timeout);
    }
    if (!res.ok) return text;

    const data = await res.json();
    // Response shape: [[["translated","original",...], ...], ...]
    const segments = data?.[0] as [string, string][] | undefined;
    const translated = segments?.map((seg) => seg[0]).join("") ?? text;

    translationCache.set(cacheKey, translated);
    return translated;
  } catch {
    return text;
  }
}

/**
 * Translate an array of texts to the target language.
 * Returns a map of original text → translated text.
 * Falls back to originals on error.
 */
export async function translateTexts(
  texts: string[],
  targetLang: string,
): Promise<Record<string, string>> {
  if (texts.length === 0 || targetLang === "en") {
    return Object.fromEntries(texts.map((t) => [t, t]));
  }

  const results: Record<string, string> = {};
  await Promise.all(
    texts.map(async (text) => {
      results[text] = await translateOne(text, targetLang);
    }),
  );
  return results;
}
