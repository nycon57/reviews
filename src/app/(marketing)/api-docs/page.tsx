import { Metadata } from "next";
import { ApiDocsClient } from "./api-docs-client";

export const metadata: Metadata = {
  title: "API Documentation | RepWell",
  description:
    "Interactive API documentation for the RepWell REST API. Explore endpoints, view code samples, and test requests in the live playground.",
  openGraph: {
    title: "API Documentation | RepWell",
    description:
      "Interactive API documentation for the RepWell REST API. Explore endpoints, view code samples, and test requests.",
    type: "website",
  },
};

export default function ApiDocsPage() {
  return <ApiDocsClient />;
}
