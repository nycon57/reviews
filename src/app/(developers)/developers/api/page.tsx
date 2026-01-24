import { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowSquareOut as ExternalLink,
} from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";
import { SwaggerUIClient } from "./swagger-ui-client";

export const metadata: Metadata = {
  title: "API Reference | RepWell Developer Portal",
  description: "Complete API reference for the RepWell REST API. Interactive documentation for all endpoints.",
};

export default function ApiReferencePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b bg-slate-50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button asChild variant="ghost" size="sm">
                <Link href="/developers">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Portal
                </Link>
              </Button>
              <div className="h-6 w-px bg-border" />
              <h1 className="text-xl font-semibold">API Reference</h1>
            </div>
            <div className="flex items-center gap-3">
              <Button asChild variant="outline" size="sm">
                <Link href="/api/openapi.json" target="_blank">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  OpenAPI Spec
                </Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/dashboard/settings/api-keys">
                  Get API Key
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Swagger UI */}
      <div className="container mx-auto px-4 py-8">
        <SwaggerUIClient />
      </div>
    </div>
  );
}
