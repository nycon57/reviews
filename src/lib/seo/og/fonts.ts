import { readFile } from "fs/promises";
import { join } from "path";

type FontWeight = 400 | 700;

export type OgFont = {
  name: string;
  data: ArrayBuffer | Buffer;
  weight: FontWeight;
  style: "normal";
};

const INTER_FONTS = [
  {
    url: "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZ9hiA.woff2",
    weight: 400 as const,
  },
  {
    url: "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYAZ9hiA.woff2",
    weight: 700 as const,
  },
];

let interFontsPromise: Promise<OgFont[]> | null = null;
let erstoriaFontPromise: Promise<OgFont[]> | null = null;

interface LoadOgFontsOptions {
  includeErstoria?: boolean;
  excludeWoff2?: boolean;
}

export async function loadOgFonts(options: LoadOgFontsOptions = {}): Promise<OgFont[]> {
  const [erstoriaFonts, interFonts] = await Promise.all([
    options.includeErstoria ? loadErstoriaFont() : Promise.resolve([]),
    loadInterFonts(),
  ]);

  const usableInterFonts = options.excludeWoff2
    ? interFonts.filter((font) => !isWoff2Font(font.data))
    : interFonts;

  return [...erstoriaFonts, ...usableInterFonts];
}

function loadErstoriaFont(): Promise<OgFont[]> {
  if (erstoriaFontPromise) {
    return erstoriaFontPromise;
  }

  erstoriaFontPromise = readFile(join(process.cwd(), "public/fonts/Erstoria.otf"))
    .then((data): OgFont[] => [
      {
        name: "Erstoria",
        data,
        weight: 400,
        style: "normal",
      },
    ])
    .catch((err): OgFont[] => {
      console.error("Failed to load Erstoria font for OG image:", err);
      return [];
    });

  return erstoriaFontPromise;
}

function loadInterFonts(): Promise<OgFont[]> {
  if (interFontsPromise) {
    return interFontsPromise;
  }

  interFontsPromise = Promise.all(
    INTER_FONTS.map(async ({ url, weight }): Promise<OgFont | null> => {
      try {
        const res = await fetch(url);
        if (!res.ok) {
          console.error(`Failed to load Inter font for OG image (${weight}): HTTP ${res.status}`);
          return null;
        }

        return {
          name: "Inter",
          data: await res.arrayBuffer(),
          weight,
          style: "normal",
        };
      } catch (err) {
        console.error(`Failed to load Inter font for OG image (${weight}):`, err);
        return null;
      }
    })
  )
    .then((fonts): OgFont[] => fonts.filter((font): font is OgFont => font !== null))
    .catch((err): OgFont[] => {
      console.error("Failed to load Inter fonts for OG image:", err);
      return [];
    });

  return interFontsPromise;
}

function isWoff2Font(data: ArrayBuffer | Buffer): boolean {
  const signature = Buffer.isBuffer(data)
    ? data.subarray(0, 4)
    : Buffer.from(data.slice(0, 4));

  return signature.toString("ascii") === "wOF2";
}
