"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from "next-themes";

/**
 * Theme provider simplified to light-only mode.
 * The provider is kept for API compatibility but forces light theme.
 * To re-enable dark mode in the future:
 * 1. Remove forcedTheme="light" from layout.tsx
 * 2. Add enableSystem and defaultTheme="system" props
 * 3. Restore .dark {} block in globals.css
 * 4. Re-add darkMode: ["class"] to tailwind.config.ts
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
