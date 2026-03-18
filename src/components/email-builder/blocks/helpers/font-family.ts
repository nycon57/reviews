export const FONT_FAMILIES = [
  {
    key: 'MODERN_SANS' as const,
    label: 'Modern sans-serif',
    value:
      '"Helvetica Neue", "Arial Nova", "Nimbus Sans", Arial, sans-serif',
  },
  {
    key: 'BOOK_SANS' as const,
    label: 'Book sans-serif',
    value:
      'Optima, Candara, "Noto Sans", source-sans-pro, sans-serif',
  },
  {
    key: 'ORGANIC_SANS' as const,
    label: 'Organic sans-serif',
    value:
      'Seravek, "Gill Sans Nova", Ubuntu, Calibri, "DejaVu Sans", source-sans-pro, sans-serif',
  },
  {
    key: 'GEOMETRIC_SANS' as const,
    label: 'Geometric sans-serif',
    value:
      'Avenir, "Avenir Next LT Pro", Montserrat, Corbel, "URW Gothic", source-sans-pro, sans-serif',
  },
  {
    key: 'HEAVY_SANS' as const,
    label: 'Heavy sans-serif',
    value:
      'Bahnschrift, "DIN Alternate", "Franklin Gothic Medium", "Nimbus Sans Narrow", sans-serif-condensed, sans-serif',
  },
  {
    key: 'ROUNDED_SANS' as const,
    label: 'Rounded sans-serif',
    value:
      'ui-rounded, "Hiragino Maru Gothic ProN", Quicksand, Comfortaa, Manjari, "Arial Rounded MT Bold", Calibri, source-sans-pro, sans-serif',
  },
  {
    key: 'MODERN_SERIF' as const,
    label: 'Modern serif',
    value: 'Charter, "Bitstream Charter", "Sitka Text", Cambria, serif',
  },
  {
    key: 'BOOK_SERIF' as const,
    label: 'Book serif',
    value:
      '"Iowan Old Style", "Palatino Linotype", "URW Palladio L", P052, serif',
  },
  {
    key: 'MONOSPACE' as const,
    label: 'Monospace',
    value: '"Nimbus Mono PS", "Courier New", "Cutive Mono", monospace',
  },
] as const;

export type FontFamilyKey = (typeof FONT_FAMILIES)[number]['key'];

export function getFontFamily(fontFamily?: FontFamilyKey | null): string {
  const entry = FONT_FAMILIES.find((f) => f.key === (fontFamily ?? 'MODERN_SANS'));
  return entry?.value ?? FONT_FAMILIES[0].value;
}
