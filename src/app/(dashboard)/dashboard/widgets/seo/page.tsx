import { SeoDashboard } from "@/components/widgets/seo/seo-dashboard";

export const metadata = {
  title: "SEO & Structured Data | RepWell",
  description:
    "Monitor structured data health, validate JSON-LD, and track rich snippet readiness",
};

export default function WidgetSeoPage() {
  return (
    <div className="flex-1 py-8">
      <SeoDashboard />
    </div>
  );
}
