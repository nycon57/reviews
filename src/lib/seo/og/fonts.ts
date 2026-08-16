import { readFile } from "fs/promises";
import { join } from "path";

type FontWeight = 400 | 700;

export type OgFont = {
  name: string;
  data: ArrayBuffer | Buffer;
  weight: FontWeight;
  style: "normal";
};

let interFontsPromise: Promise<OgFont[]> | null = null;
let erstoriaFontPromise: Promise<OgFont[]> | null = null;

interface LoadOgFontsOptions {
  includeErstoria?: boolean;
}

export async function loadOgFonts(options: LoadOgFontsOptions = {}): Promise<OgFont[]> {
  const [erstoriaFonts, interFonts] = await Promise.all([
    options.includeErstoria ? loadErstoriaFont() : Promise.resolve([]),
    loadInterFonts(),
  ]);

  return [...erstoriaFonts, ...interFonts];
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

  interFontsPromise = Promise.all([
    readFile(join(process.cwd(), "public/fonts/Inter-Regular.ttf")),
    readFile(join(process.cwd(), "public/fonts/Inter-Bold.ttf")),
  ])
    .then(([regular, bold]): OgFont[] => [
      {
        name: "Inter",
        data: regular,
        weight: 400,
        style: "normal",
      },
      {
        name: "Inter",
        data: bold,
        weight: 700,
        style: "normal",
      },
    ])
    .catch((err): OgFont[] => {
      console.error("Failed to load Inter font for OG image:", err);
      return [];
    });

  return interFontsPromise;
}
