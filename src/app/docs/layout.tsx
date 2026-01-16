import { Metadata } from "next";
import { DocsLayoutClient } from "./docs-layout-client";

export const metadata: Metadata = {
  title: {
    template: "%s | RepWell Docs",
    default: "Documentation | RepWell",
  },
  description:
    "Comprehensive documentation for RepWell - guides, tutorials, API reference, and best practices for platform administrators.",
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DocsLayoutClient>{children}</DocsLayoutClient>;
}
