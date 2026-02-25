import type { Metadata } from "next";
import { NewWidgetPageClient } from "./new-widget-page-client";

export const metadata: Metadata = {
  title: "Create Widget | RepWell",
  description: "Create and configure a new review widget.",
};

export default function NewWidgetPage() {
  return <NewWidgetPageClient />;
}
