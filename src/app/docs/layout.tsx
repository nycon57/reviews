import { Metadata } from "next";
import { DocsLayoutClient } from "./docs-layout-client";

export const metadata: Metadata = {
  title: {
    template: "%s | ReviewHub Docs",
    default: "Documentation | ReviewHub",
  },
  description:
    "Comprehensive documentation for ReviewHub - guides, tutorials, API reference, and best practices for platform administrators.",
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DocsLayoutClient>{children}</DocsLayoutClient>;
}
