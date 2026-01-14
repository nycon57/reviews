import { ThemeProvider } from "@/components/providers/theme-provider";

export default function SurveyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <main className="bg-background">{children}</main>
    </ThemeProvider>
  );
}
