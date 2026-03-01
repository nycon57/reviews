/**
 * SVG text wrapping utility.
 *
 * SVG has no native text-wrap. This module approximates line breaks using
 * average character width for Inter font at a given size.
 *
 * Strategy: conservative width estimate so text wraps slightly early rather
 * than overflowing the container. Each returned line becomes a <tspan>.
 */

// Average character width as a fraction of fontSize for Inter (sans-serif).
// Measured empirically — Inter Regular averages ~0.52 of font-size per char.
const AVG_CHAR_WIDTH_RATIO = 0.52;

/**
 * Split text into lines that fit within `maxWidth` at `fontSize`.
 *
 * @param text      The full string to wrap.
 * @param maxWidth  Available width in SVG units (pixels).
 * @param fontSize  Font size in px.
 * @returns         Array of line strings.
 */
export function wrapText(
  text: string,
  maxWidth: number,
  fontSize: number,
): string[] {
  if (!text) return [];

  const avgCharWidth = fontSize * AVG_CHAR_WIDTH_RATIO;
  const maxCharsPerLine = Math.floor(maxWidth / avgCharWidth);

  if (maxCharsPerLine <= 0) return [text];

  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;

    if (candidate.length <= maxCharsPerLine) {
      currentLine = candidate;
    } else {
      if (currentLine) lines.push(currentLine);
      // Handle words longer than maxCharsPerLine — don't break mid-word,
      // just let it overflow slightly (better than splitting names)
      currentLine = word;
    }
  }

  if (currentLine) lines.push(currentLine);

  return lines;
}

/**
 * Calculate the total height needed for wrapped text.
 *
 * @param lineCount   Number of lines from wrapText().
 * @param fontSize    Font size in px.
 * @param lineHeight  Line height multiplier (default 1.4).
 * @returns           Total height in SVG units.
 */
export function textBlockHeight(
  lineCount: number,
  fontSize: number,
  lineHeight = 1.4,
): number {
  if (lineCount <= 0) return 0;
  return fontSize + (lineCount - 1) * fontSize * lineHeight;
}
