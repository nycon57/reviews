"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CanvasElement, CanvasSize } from "@/lib/share-studio/template-types";
import { useHistory } from "./use-history";

export interface EditorState {
  elements: CanvasElement[];
  canvasSize: CanvasSize;
  background: CanvasBackground;
  gridSize: number;
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

export interface EditorActions {
  state: EditorState;
  selectedId: string | null;
  selectedElement: CanvasElement | null;
  zoom: number;

  // Selection
  select: (id: string | null) => void;

  // Element CRUD
  addElement: (el: CanvasElement) => void;
  updateElement: (id: string, updates: Partial<CanvasElement>) => void;
  deleteElement: (id: string) => void;
  duplicateElement: (id: string) => void;

  // Positioning
  moveElement: (id: string, x: number, y: number) => void;
  resizeElement: (id: string, w: number, h: number) => void;

  // Layer management
  reorderLayers: (fromIndex: number, toIndex: number) => void;
  bringForward: (id: string) => void;
  sendBackward: (id: string) => void;
  toggleVisibility: (id: string) => void;
  toggleLock: (id: string) => void;

  // Canvas
  setCanvasSize: (size: CanvasSize) => void;
  setBackground: (bg: CanvasBackground) => void;
  setGridSize: (size: number) => void;

  // Zoom
  setZoom: (z: number) => void;

  // History
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export function generateElementId(): string {
  return `el-${crypto.randomUUID()}`;
}

function snapToGrid(value: number, gridSize: number, canvasDim: number): number {
  if (gridSize <= 0 || !canvasDim || !Number.isFinite(canvasDim)) return value;
  const pixelValue = value * canvasDim;
  const snapped = Math.round(pixelValue / gridSize) * gridSize;
  return snapped / canvasDim;
}

export function useEditorState(
  initialElements: CanvasElement[],
  initialCanvasSize: CanvasSize
): EditorActions {
  const history = useHistory<EditorState>({
    elements: initialElements,
    canvasSize: initialCanvasSize,
    background: { type: "solid", color: "#ffffff" },
    gridSize: 8,
  });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);

  const { state, set: setState } = history;

  const selectedElement = useMemo(
    () => state.elements.find((el) => el.id === selectedId) ?? null,
    [state.elements, selectedId]
  );

  const select = useCallback((id: string | null) => {
    setSelectedId(id);
  }, []);

  const addElement = useCallback(
    (el: CanvasElement) => {
      setState({
        ...state,
        elements: [...state.elements, el],
      });
      setSelectedId(el.id);
    },
    [state, setState]
  );

  const updateElement = useCallback(
    (id: string, updates: Partial<CanvasElement>) => {
      setState({
        ...state,
        elements: state.elements.map((el) =>
          el.id === id ? { ...el, ...updates } : el
        ),
      });
    },
    [state, setState]
  );

  const deleteElement = useCallback(
    (id: string) => {
      setState({
        ...state,
        elements: state.elements.filter((el) => el.id !== id),
      });
      if (selectedId === id) setSelectedId(null);
    },
    [state, setState, selectedId]
  );

  const duplicateElement = useCallback(
    (id: string) => {
      const el = state.elements.find((e) => e.id === id);
      if (!el) return;
      const newEl: CanvasElement = {
        ...el,
        id: generateElementId(),
        x: el.x + 0.02,
        y: el.y + 0.02,
        text: el.text ? `${el.text}` : undefined,
      };
      setState({
        ...state,
        elements: [...state.elements, newEl],
      });
      setSelectedId(newEl.id);
    },
    [state, setState]
  );

  const moveElement = useCallback(
    (id: string, x: number, y: number) => {
      const { gridSize, canvasSize } = state;
      const snappedX = snapToGrid(x, gridSize, canvasSize.width);
      const snappedY = snapToGrid(y, gridSize, canvasSize.height);
      setState({
        ...state,
        elements: state.elements.map((el) =>
          el.id === id ? { ...el, x: snappedX, y: snappedY } : el
        ),
      });
    },
    [state, setState]
  );

  const resizeElement = useCallback(
    (id: string, w: number, h: number) => {
      setState({
        ...state,
        elements: state.elements.map((el) =>
          el.id === id
            ? { ...el, width: Math.max(0.01, w), height: Math.max(0.01, h) }
            : el
        ),
      });
    },
    [state, setState]
  );

  const reorderLayers = useCallback(
    (fromIndex: number, toIndex: number) => {
      const sorted = [...state.elements].sort((a, b) => b.zIndex - a.zIndex);
      const [moved] = sorted.splice(fromIndex, 1);
      sorted.splice(toIndex, 0, moved);
      const reindexed = sorted.map((el, i) => ({
        ...el,
        zIndex: sorted.length - i,
      }));
      setState({ ...state, elements: reindexed });
    },
    [state, setState]
  );

  const bringForward = useCallback(
    (id: string) => {
      if (state.elements.length === 0 || !state.elements.some((el) => el.id === id)) return;
      const maxZ = Math.max(...state.elements.map((el) => el.zIndex));
      setState({
        ...state,
        elements: state.elements.map((el) =>
          el.id === id ? { ...el, zIndex: maxZ + 1 } : el
        ),
      });
    },
    [state, setState]
  );

  const sendBackward = useCallback(
    (id: string) => {
      if (state.elements.length === 0 || !state.elements.some((el) => el.id === id)) return;
      const minZ = Math.min(...state.elements.map((el) => el.zIndex));
      setState({
        ...state,
        elements: state.elements.map((el) =>
          el.id === id ? { ...el, zIndex: Math.max(0, minZ - 1) } : el
        ),
      });
    },
    [state, setState]
  );

  const toggleVisibility = useCallback(
    (id: string) => {
      setState({
        ...state,
        elements: state.elements.map((el) =>
          el.id === id ? { ...el, visible: !el.visible } : el
        ),
      });
    },
    [state, setState]
  );

  const toggleLock = useCallback(
    (id: string) => {
      setState({
        ...state,
        elements: state.elements.map((el) =>
          el.id === id ? { ...el, locked: !el.locked } : el
        ),
      });
    },
    [state, setState]
  );

  const setCanvasSize = useCallback(
    (size: CanvasSize) => {
      setState({ ...state, canvasSize: size });
    },
    [state, setState]
  );

  const setBackground = useCallback(
    (bg: CanvasBackground) => {
      setState({ ...state, background: bg });
    },
    [state, setState]
  );

  const setGridSize = useCallback(
    (size: number) => {
      setState({ ...state, gridSize: size });
    },
    [state, setState]
  );

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          history.redo();
        } else {
          history.undo();
        }
      }

      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedId) {
          const el = state.elements.find((e) => e.id === selectedId);
          if (el && !el.locked) {
            e.preventDefault();
            deleteElement(selectedId);
          }
        }
      }

      if ((e.metaKey || e.ctrlKey) && e.key === "d") {
        if (selectedId) {
          e.preventDefault();
          duplicateElement(selectedId);
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedId, state.elements, history, deleteElement, duplicateElement]);

  return {
    state,
    selectedId,
    selectedElement,
    zoom,
    select,
    addElement,
    updateElement,
    deleteElement,
    duplicateElement,
    moveElement,
    resizeElement,
    reorderLayers,
    bringForward,
    sendBackward,
    toggleVisibility,
    toggleLock,
    setCanvasSize,
    setBackground,
    setGridSize,
    setZoom,
    undo: history.undo,
    redo: history.redo,
    canUndo: history.canUndo,
    canRedo: history.canRedo,
  };
}
