import { useCallback, useEffect, useRef } from "react";
import type { WidgetEvent, WidgetEventType } from "../types";

interface UseWidgetEventsOptions {
  widgetId: string;
  onEvent?: (event: WidgetEvent) => void;
}

/**
 * Provides event emission utilities for widget components.
 * Fires the onEvent callback and tracks impressions on mount.
 */
export function useWidgetEvents({ widgetId, onEvent }: UseWidgetEventsOptions) {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;
  const impressionFired = useRef(false);

  const emit = useCallback(
    (type: WidgetEventType, metadata?: Record<string, unknown>) => {
      onEventRef.current?.({
        type,
        widgetId,
        timestamp: Date.now(),
        metadata,
      });
    },
    [widgetId],
  );

  // Fire impression event once on mount
  useEffect(() => {
    if (!impressionFired.current) {
      impressionFired.current = true;
      emit("impression");
    }
  }, [emit]);

  return { emit };
}
