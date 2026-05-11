import type { Metadata } from "next";
import { Source_Sans_3 } from "next/font/google";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { MotionProvider } from "@/components/providers/motion-provider";

const sourceSans = Source_Sans_3({ subsets: ["latin"] });

export const metadata: Metadata = {
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
      </body>
    </html>
  );
}
