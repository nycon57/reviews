"use client";

import { useCallback, useState } from "react";

let nextStableId = 0;
function genStableId() {
  return `stable_${++nextStableId}`;
}

/**
 * Maintains a list of stable IDs — one per item in a reorderable list — so
 * inputs keep their DOM identity (and focus/caret) across reorders, inserts,
 * and removals. The ID count is reconciled during render when `length` changes
 * from outside, using React's adjust-state-during-render pattern.
 */
export function useStableIds(length: number) {
  const [ids, setIds] = useState<string[]>(() =>
    Array.from({ length }, genStableId)
  );

  // Reconcile ID count when the list length changes externally.
  let currentIds = ids;
  if (ids.length !== length) {
    currentIds = ids.slice(0, length);
    while (currentIds.length < length) currentIds.push(genStableId());
    setIds(currentIds);
  }

  const appendId = useCallback(() => {
    setIds((prev) => [...prev, genStableId()]);
  }, []);

  const removeIdAt = useCallback((index: number) => {
    setIds((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const moveId = useCallback((from: number, to: number) => {
    setIds((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }, []);

  return { ids: currentIds, appendId, removeIdAt, moveId };
}
