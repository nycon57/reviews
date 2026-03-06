"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from "next-themes";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith("/dashboard");
  const forcedTheme = React.useMemo(
    () => (isDashboard ? undefined : "light"),
    [isDashboard]
  );

  return (
    <NextThemesProvider
      {...props}
      forcedTheme={forcedTheme}
    >
      {children}
    </NextThemesProvider>
  );
}
