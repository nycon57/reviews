import { MarketingNav } from "@/components/marketing/marketing-nav";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MotionProvider } from "@/components/providers/motion-provider";

export default function DevelopersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MotionProvider>
      <div className="flex min-h-screen flex-col bg-slate-50">
        <MarketingNav />
        <main className="flex-1">{children}</main>
        <MarketingFooter />
      </div>
    </MotionProvider>
  );
}
