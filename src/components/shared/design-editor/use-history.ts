"use client";

import { useCallback, useState } from "react";
import { SHARE_STUDIO_DESIGN_EDITOR_CONFIG, SOCIAL_GRAPHICS_DESIGN_EDITOR_CONFIG } from "./config";

const MAX_HISTORY = 50;

export interface HistoryActions<T> {
  state: T;
  set: (next: T) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  reset: (initial: T) => void;
}

interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

/**
 * Generic undo/redo history hook with a configurable stack size (default 50).
 * Uses a past/present/future state model for O(1) undo/redo.
 */
export function useDesignHistory<T>(initial: T, trimRedoPastToMax: boolean): HistoryActions<T> {
  const [history, setHistory] = useState<HistoryState<T>>({
    past: [],
    present: initial,
    future: [],
  });

  const set = useCallback((next: T) => {
    setHistory((h) => ({
      past: [...h.past, h.present].slice(-MAX_HISTORY),
      present: next,
      future: [],
    }));
  }, []);

  const undo = useCallback(() => {
    setHistory((h) => {
      if (h.past.length === 0) return h;
      const previous = h.past[h.past.length - 1];
      return {
        past: h.past.slice(0, -1),
        present: previous,
        future: [h.present, ...h.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory((h) => {
      if (h.future.length === 0) return h;
      const next = h.future[0];
      return {
        past: trimRedoPastToMax
          ? [...h.past, h.present].slice(-MAX_HISTORY)
          : [...h.past, h.present],
        present: next,
        future: h.future.slice(1),
      };
    });
  }, [trimRedoPastToMax]);

  const reset = useCallback((initial: T) => {
    setHistory({ past: [], present: initial, future: [] });
  }, []);

  return {
    state: history.present,
    set,
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    reset,
  };
}

export function useShareStudioHistory<T>(initial: T): HistoryActions<T> {
  return useDesignHistory(initial, SHARE_STUDIO_DESIGN_EDITOR_CONFIG.trimRedoPastToMax);
}

export function useSocialGraphicsHistory<T>(initial: T): HistoryActions<T> {
  return useDesignHistory(initial, SOCIAL_GRAPHICS_DESIGN_EDITOR_CONFIG.trimRedoPastToMax);
}
