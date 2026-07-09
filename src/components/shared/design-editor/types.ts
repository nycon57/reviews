"use client";

export type DesignEditorMode = "share-studio" | "social-graphics";

export interface CanvasSize {
  width: number;
  height: number;
  name?: string;
}

export type ElementType = "text" | "image" | "shape" | "icon" | "rating" | "stats";

export type ShapeType = "rectangle" | "circle" | "rounded-rect";

export type TextAlignment = "left" | "center" | "right";

export interface TemplateBinding {
  path: string;
  fallback?: string | number | boolean | null;
  transform?: "uppercase" | "lowercase" | "title_case" | "stars" | "date_short";
}

export interface MotionConfig {
  preset?: "none" | "fade" | "fade-up" | "slide-left" | "zoom-in";
  durationMs?: number;
  delayMs?: number;
  easing?: "linear" | "ease-in" | "ease-out" | "ease-in-out";
}

export interface CanvasElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  opacity: number;
  locked: boolean;
  visible: boolean;
  binding?: TemplateBinding;
  motion?: MotionConfig;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  color?: string;
  textAlign?: TextAlignment;
  lineHeight?: number;
  letterSpacing?: number;
  shape?: ShapeType;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  imageUrl?: string;
  objectFit?: "cover" | "contain" | "fill";
  rating?: number;
  starColor?: string;
  starSize?: number;
  statLabel?: string;
  statValue?: string;
  iconName?: string;
  iconColor?: string;
}

export interface CanvasBackground {
  type: "solid" | "gradient" | "image";
  color?: string;
  gradientType?: "linear" | "radial";
  gradientFrom?: string;
  gradientTo?: string;
  gradientAngle?: number;
  imageUrl?: string;
}

export interface EditorState {
  elements: CanvasElement[];
  canvasSize: CanvasSize;
  background: CanvasBackground;
  gridSize: number;
}

export interface EditorActions {
  state: EditorState;
  selectedId: string | null;
  selectedElement: CanvasElement | null;
  zoom: number;
  select: (id: string | null) => void;
  addElement: (el: CanvasElement) => void;
  updateElement: (id: string, updates: Partial<CanvasElement>) => void;
  deleteElement: (id: string) => void;
  duplicateElement: (id: string) => void;
  moveElement: (id: string, x: number, y: number) => void;
  resizeElement: (id: string, w: number, h: number) => void;
  reorderLayers: (fromIndex: number, toIndex: number) => void;
  bringForward: (id: string) => void;
  sendBackward: (id: string) => void;
  toggleVisibility: (id: string) => void;
  toggleLock: (id: string) => void;
  setCanvasSize: (size: CanvasSize) => void;
  setBackground: (bg: CanvasBackground) => void;
  setGridSize: (size: number) => void;
  setZoom: (z: number) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export interface DesignEditorConfig {
  mode: DesignEditorMode;
  canvasPresets: readonly CanvasSize[];
  generateElementId: () => string;
  snapRequiresFiniteCanvasDimension: boolean;
  guardLayerActions: boolean;
  trimRedoPastToMax: boolean;
  releasePointerCapture: boolean;
  syncCustomSizeInputs: boolean;
  filterUnnamedCanvasPresets: boolean;
}
