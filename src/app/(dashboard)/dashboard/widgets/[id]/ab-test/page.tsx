import { notFound } from "next/navigation";
import Link from "next/link";
import { getWidget } from "@/lib/widgets/actions";
import { AbTestResults } from "@/components/widgets/ab-test/ab-test-results";

export const metadata = {
  title: "A/B Test Results | RepWell",
  description: "View A/B test results and statistical significance for your widget",
};

interface AbTestPageProps {
  params: Promise<{ id: string }>;
}

export default async function AbTestPage({ params }: AbTestPageProps) {
  const { id } = await params;

  const result = await getWidget({ idOrSlug: id });
  if (!result.success) {
    notFound();
  }

  const widget = result.data;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link href="/dashboard/widgets" className="hover:underline">
            Widgets
          </Link>
          <span>/</span>
          <Link href={`/dashboard/widgets/${id}`} className="hover:underline">
            {widget.name}
          </Link>
          <span>/</span>
          <span>A/B Test</span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          A/B Test: {widget.name}
        </h1>
      </div>

      <AbTestResults parentWidgetId={widget.id} />
    </div>
  );
}
