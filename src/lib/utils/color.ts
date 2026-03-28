function rgbToHex(r: number, g: number, b: number): string {
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

/**
 * Analyse an image and return quantised colour counts sorted by frequency.
 * Shared between single- and dual-colour extraction.
 */
function analyseImageColors(
  imageUrl: string,
): Promise<Array<{ rgb: [number, number, number]; count: number }>> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve([]);
        return;
      }

      const scale = Math.min(1, 100 / Math.max(img.width, img.height));
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;
      const colorCounts: Record<string, number> = {};

      for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        const a = pixels[i + 3];

        if (a < 128) continue;
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        if (brightness > 240 || brightness < 15) continue;
        if (Math.max(r, g, b) - Math.min(r, g, b) < 30) continue;

        const qr = Math.min(255, Math.floor(r / 16) * 16);
        const qg = Math.min(255, Math.floor(g / 16) * 16);
        const qb = Math.min(255, Math.floor(b / 16) * 16);
        const key = `${qr},${qg},${qb}`;
        colorCounts[key] = (colorCounts[key] || 0) + 1;
      }

      const sorted = Object.entries(colorCounts)
        .map(([key, count]) => {
          const [r, g, b] = key.split(",").map(Number) as [number, number, number];
          return { rgb: [r, g, b] as [number, number, number], count };
        })
        .sort((a, b) => b.count - a.count);

      resolve(sorted);
    };

    img.onerror = () => resolve([]);
    img.src = imageUrl;
  });
}

/**
 * Extract the dominant color from an image using canvas pixel analysis.
 * Skips transparent, near-white, near-black, and grayscale pixels.
 * Returns hex color string (e.g. "#52796f").
 */
export async function extractDominantColor(imageUrl: string): Promise<string> {
  const DEFAULT_COLOR = "#52796f";
  const sorted = await analyseImageColors(imageUrl);
  if (sorted.length === 0) return DEFAULT_COLOR;
  const [r, g, b] = sorted[0].rgb;
  return rgbToHex(r, g, b);
}

/**
 * Extract a primary and secondary brand colour from an image.
 * Primary = most frequent colour. Secondary = next most-frequent colour
 * that differs enough from the primary. If none found, darkens the primary.
 */
export async function extractBrandColors(
  imageUrl: string,
): Promise<{ primary: string; secondary: string }> {
  const DEFAULT = { primary: "#52796f", secondary: "#2f3e46" };
  const sorted = await analyseImageColors(imageUrl);
  if (sorted.length === 0) return DEFAULT;

  const [pr, pg, pb] = sorted[0].rgb;

  // Find a secondary that differs enough from the primary
  let secondary: [number, number, number] | null = null;
  for (let i = 1; i < sorted.length; i++) {
    const [r, g, b] = sorted[i].rgb;
    const diff = Math.abs(r - pr) + Math.abs(g - pg) + Math.abs(b - pb);
    if (diff > 60) {
      secondary = [r, g, b];
      break;
    }
  }

  // Fallback: darken primary by ~35%
  if (!secondary) {
    secondary = [
      Math.max(0, Math.round(pr * 0.65)),
      Math.max(0, Math.round(pg * 0.65)),
      Math.max(0, Math.round(pb * 0.65)),
    ];
  }

  return {
    primary: rgbToHex(pr, pg, pb).toUpperCase(),
    secondary: rgbToHex(...secondary).toUpperCase(),
  };
}
