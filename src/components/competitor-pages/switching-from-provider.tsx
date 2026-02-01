"use client";

import {
  createContext,
  useContext,
  type ReactNode,
} from "react";
import {
  useSwitchingFrom,
  type UseSwitchingFromReturn,
} from "@/hooks/use-switching-from";

const SwitchingFromContext = createContext<UseSwitchingFromReturn>({
  competitor: null,
  trackEvent: () => {},
});

/**
 * Provides switching_from context to all competitor page sections.
 * Place this around the competitor comparison page content so CTAs
 * can access the competitor attribution data.
 */
export function SwitchingFromProvider({ children }: { children: ReactNode }) {
  const switchingFrom = useSwitchingFrom();
  return (
    <SwitchingFromContext.Provider value={switchingFrom}>
      {children}
    </SwitchingFromContext.Provider>
  );
}

/** Read switching_from context from any child component. */
export function useSwitchingFromContext(): UseSwitchingFromReturn {
  return useContext(SwitchingFromContext);
}
