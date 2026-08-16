"use client";

import { CANVAS_PRESETS as SHARE_STUDIO_CANVAS_PRESETS } from "@/lib/share-studio/template-types";
import { CANVAS_PRESETS as SOCIAL_GRAPHICS_CANVAS_PRESETS } from "@/lib/social-graphics/types";
import type { DesignEditorConfig } from "./types";

let socialGraphicsElementCounter = 0;

export function generateShareStudioElementId(): string {
  return `el-${crypto.randomUUID()}`;
}

export function generateSocialGraphicsElementId(): string {
  socialGraphicsElementCounter += 1;
  return `el-${Date.now()}-${socialGraphicsElementCounter}`;
}

export const SHARE_STUDIO_DESIGN_EDITOR_CONFIG: DesignEditorConfig = {
  mode: "share-studio",
  canvasPresets: SHARE_STUDIO_CANVAS_PRESETS,
  generateElementId: generateShareStudioElementId,
  snapRequiresFiniteCanvasDimension: true,
  guardLayerActions: true,
  trimRedoPastToMax: true,
  releasePointerCapture: true,
  syncCustomSizeInputs: true,
  filterUnnamedCanvasPresets: true,
};

export const SOCIAL_GRAPHICS_DESIGN_EDITOR_CONFIG: DesignEditorConfig = {
  mode: "social-graphics",
  canvasPresets: SOCIAL_GRAPHICS_CANVAS_PRESETS,
  generateElementId: generateSocialGraphicsElementId,
  snapRequiresFiniteCanvasDimension: false,
  guardLayerActions: false,
  trimRedoPastToMax: false,
  releasePointerCapture: false,
  syncCustomSizeInputs: false,
  filterUnnamedCanvasPresets: false,
};
