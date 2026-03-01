import { createElement } from "react";
import { Resvg } from "@resvg/resvg-js";
import { loadFontFiles } from "./font-loader";
import type { TemplateProps, SvgRenderResult } from "./types";

/**
 * Render a React SVG template component to a PNG buffer via resvg.
 *
 * Flow: React component → renderToStaticMarkup → SVG string → resvg → PNG
 *
 * We dynamically import react-dom/server to avoid Next.js Turbopack's
 * restriction on static imports of react-dom/server in server action modules.
 *
 * Performance: ~50-100ms (string render + WASM-based resvg).
 * No native binaries — works perfectly on Vercel.
 */
export async function renderTemplateToPng(
  component: (props: TemplateProps) => React.ReactElement,
  props: TemplateProps,
): Promise<SvgRenderResult> {
  const [fontFiles, { renderToStaticMarkup }] = await Promise.all([
    loadFontFiles(),
    import("react-dom/server"),
  ]);

  const svgMarkup = renderToStaticMarkup(createElement(component, props));

  const resvg = new Resvg(svgMarkup, {
    fitTo: { mode: "width", value: props.width },
    font: {
      fontFiles,
      loadSystemFonts: false,
      defaultFontFamily: "Inter",
    },
  });

  const pngData = resvg.render();
  const buffer = Buffer.from(pngData.asPng());

  return {
    buffer,
    width: props.width,
    height: props.height,
  };
}
