/**
 * Extract the dominant color from an image using canvas pixel analysis.
 * Skips transparent, near-white, near-black, and grayscale pixels.
 * Returns hex color string (e.g. "#52796f").
 */
export async function extractDominantColor(imageUrl: string): Promise<string> {
  const DEFAULT_COLOR = "#52796f"; // repwell-teal-300

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(DEFAULT_COLOR);
        return;
      }

      // Scale down for faster processing
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

        if (a < 128) continue; // transparent
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        if (brightness > 240 || brightness < 15) continue; // too light/dark
        if (Math.max(r, g, b) - Math.min(r, g, b) < 30) continue; // grayscale

        // Quantize to reduce noise (floor + clamp to stay in 0-255)
        const qr = Math.min(255, Math.floor(r / 16) * 16);
        const qg = Math.min(255, Math.floor(g / 16) * 16);
        const qb = Math.min(255, Math.floor(b / 16) * 16);
        const key = `${qr},${qg},${qb}`;
        colorCounts[key] = (colorCounts[key] || 0) + 1;
      }

      let maxCount = 0;
      let dominant = "82,121,111"; // default RGB

      for (const [color, count] of Object.entries(colorCounts)) {
        if (count > maxCount) {
          maxCount = count;
          dominant = color;
        }
      }

      const [cr, cg, cb] = dominant.split(",").map(Number);
      resolve(
        `#${cr.toString(16).padStart(2, "0")}${cg.toString(16).padStart(2, "0")}${cb.toString(16).padStart(2, "0")}`
      );
    };

    img.onerror = () => resolve(DEFAULT_COLOR);
    img.src = imageUrl;
  });
}
