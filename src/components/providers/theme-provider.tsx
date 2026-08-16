"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import {
  DEFAULT_THEME,
  THEME_DASHBOARD_PREFIX,
  THEME_STORAGE_KEY,
  VALID_THEMES,
  type Theme,
} from "@/lib/theme-constants";

type ResolvedTheme = "light" | "dark";

function isValidTheme(value: string | null): value is Theme {
  return value !== null && (VALID_THEMES as readonly string[]).includes(value);
}

interface ThemeProviderProps {
  children: React.ReactNode;
  attribute?: "class" | `data-${string}`;
  defaultTheme?: Theme;
  enableSystem?: boolean;
  enableColorScheme?: boolean;
  disableTransitionOnChange?: boolean;
  forcedTheme?: Theme;
  storageKey?: string;
}

interface ThemeContextValue {
  themes: Theme[];
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  systemTheme: ResolvedTheme;
  forcedTheme?: Theme;
  setTheme: React.Dispatch<React.SetStateAction<Theme>>;
}

const THEME_VALUES = ["light", "dark"] as const;
const ThemeContext = React.createContext<ThemeContextValue | undefined>(undefined);

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function subscribeToSystemTheme(onChange: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function getServerSystemTheme(): ResolvedTheme {
  return "light";
}

function getStoredTheme(storageKey: string, fallback: Theme): Theme {
  if (typeof window === "undefined") return fallback;

  try {
    const stored = window.localStorage.getItem(storageKey);
    if (isValidTheme(stored)) {
      return stored;
    }
  } catch {
    // Ignore storage access failures and use the configured fallback.
  }

  return fallback;
}

function disableThemeTransitions() {
  const style = document.createElement("style");
  style.appendChild(
    document.createTextNode(
      "*,*::before,*::after{transition:none!important;animation-duration:0s!important}"
    )
  );
  document.head.appendChild(style);

  return () => {
    window.getComputedStyle(document.body);
    setTimeout(() => style.remove(), 1);
  };
}

function applyTheme(
  theme: ResolvedTheme,
  attribute: NonNullable<ThemeProviderProps["attribute"]>,
  enableColorScheme: boolean,
  disableTransitionOnChange: boolean
) {
  const enableTransitions = disableTransitionOnChange ? disableThemeTransitions() : null;
  const root = document.documentElement;

  if (attribute === "class") {
    root.classList.remove(...THEME_VALUES);
    root.classList.add(theme);
  } else {
    root.setAttribute(attribute, theme);
  }

  if (enableColorScheme) {
    root.style.colorScheme = theme;
  }

  enableTransitions?.();
}

export function ThemeProvider({
  children,
  attribute = "class",
  defaultTheme = DEFAULT_THEME,
  enableSystem = true,
  enableColorScheme = true,
  disableTransitionOnChange = false,
  forcedTheme,
  storageKey = THEME_STORAGE_KEY,
}: ThemeProviderProps) {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith(THEME_DASHBOARD_PREFIX);
  const routeForcedTheme = forcedTheme ?? (isDashboard ? undefined : "light");
  const initialTheme = enableSystem ? defaultTheme : defaultTheme === "system" ? "light" : defaultTheme;
  const [theme, setThemeState] = React.useState<Theme>(() => getStoredTheme(storageKey, initialTheme));
  // Subscribing unconditionally is harmless: systemTheme is only consulted when
  // the active theme is "system", which enableSystem=false already rules out.
  const systemTheme = React.useSyncExternalStore(
    subscribeToSystemTheme,
    getSystemTheme,
    getServerSystemTheme
  );
  const activeTheme = routeForcedTheme ?? theme;
  const resolvedTheme = activeTheme === "system" ? systemTheme : activeTheme;

  React.useEffect(() => {
    applyTheme(resolvedTheme, attribute, enableColorScheme, disableTransitionOnChange);
  }, [attribute, disableTransitionOnChange, enableColorScheme, resolvedTheme]);

  // Persist only explicit choices; first-visit storage stays untouched until
  // the user picks a theme. Gating on intent (not first-render detection)
  // survives StrictMode's double-invoked mount effect.
  const userChangedTheme = React.useRef(false);
  const setTheme = React.useCallback<React.Dispatch<React.SetStateAction<Theme>>>((value) => {
    userChangedTheme.current = true;
    setThemeState(value);
  }, []);

  React.useEffect(() => {
    if (!userChangedTheme.current) return;
    try {
      window.localStorage.setItem(storageKey, theme);
    } catch {
      // Ignore storage access failures; the in-memory theme still updates.
    }
  }, [storageKey, theme]);

  const contextValue = React.useMemo<ThemeContextValue>(
    () => ({
      themes: enableSystem ? ["light", "dark", "system"] : ["light", "dark"],
      theme,
      resolvedTheme,
      systemTheme,
      forcedTheme: routeForcedTheme,
      setTheme,
    }),
    [enableSystem, resolvedTheme, routeForcedTheme, setTheme, systemTheme, theme]
  );

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = React.useContext(ThemeContext);

  if (!context) {
    return {
      themes: [],
      theme: "light" as Theme,
      resolvedTheme: "light" as ResolvedTheme,
      systemTheme: "light" as ResolvedTheme,
      setTheme: () => {},
    };
  }

  return context;
}
