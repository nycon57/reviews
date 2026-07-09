import type { Metadata } from "next";
import Script from "next/script";
import { Source_Sans_3 } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { MotionProvider } from "@/components/providers/motion-provider";
import {
  DEFAULT_THEME,
  THEME_DASHBOARD_PREFIX,
  THEME_STORAGE_KEY,
  VALID_THEMES,
} from "@/lib/theme-constants";
import { getBaseUrl } from "@/lib/seo";

const sourceSans = Source_Sans_3({ subsets: ["latin"] });

// Pre-paint theme script. Built from the shared theme constants so it can never
// drift from ThemeProvider: same storage key, dashboard-prefix rule, default,
// and valid values. Runs before paint to avoid a theme flash.
const validThemeCheck = VALID_THEMES.map(
  (value) => `s===${JSON.stringify(value)}`
).join("||");
const themeScript = `(function(){try{var d=document.documentElement,t="light";if(location.pathname.indexOf(${JSON.stringify(
  THEME_DASHBOARD_PREFIX
)})===0){var s=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY
)});t=(${validThemeCheck})?s:${JSON.stringify(
  DEFAULT_THEME
)};if(t==="system")t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}d.classList.remove("light","dark");d.classList.add(t);d.style.colorScheme=t;}catch(e){}})();`;

export const metadata: Metadata = {
  metadataBase: new URL(getBaseUrl()),
  title: "RepWell - Customer Experience Management",
  description:
    "Collect customer reviews, manage your reputation, and gain AI-powered insights to improve customer experience.",
  keywords: ["reviews", "customer experience", "NPS", "reputation management", "mortgage"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Set the theme class before paint to avoid a dark-mode flash. */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {process.env.NODE_ENV === "development" && (
          <Script
            src="https://unpkg.com/react-grab/dist/index.global.js"
            crossOrigin="anonymous"
            strategy="beforeInteractive"
          />
        )}
      </head>
      <body className={sourceSans.className} suppressHydrationWarning>
        <MotionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster />
          </ThemeProvider>
        </MotionProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}
