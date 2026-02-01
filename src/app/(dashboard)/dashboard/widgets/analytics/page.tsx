import { WidgetAnalyticsDashboard } from "@/components/widgets/analytics/widget-analytics-dashboard";

export const metadata = {
  title: "Widget Analytics | RepWell",
  description: "Track widget impressions, clicks, and conversions",
};

export default function WidgetAnalyticsPage() {
  return (
    <div className="flex-1 py-8">
      <WidgetAnalyticsDashboard />
    </div>
  );
}
