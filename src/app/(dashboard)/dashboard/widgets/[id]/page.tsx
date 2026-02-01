import { notFound } from "next/navigation";
import { WidgetBuilder } from "@/components/widgets/widget-builder";
import { getWidget } from "@/lib/widgets/actions";

export const metadata = {
  title: "Edit Widget | RepWell",
  description: "Configure your embeddable review widget",
};

interface EditWidgetPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditWidgetPage({ params }: EditWidgetPageProps) {
  const { id } = await params;

  const result = await getWidget({ idOrSlug: id });

  if (!result.success) {
    notFound();
  }

  return <WidgetBuilder widget={result.data} />;
}
