import { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle as CheckCircle2,
  Copy,
} from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Quick Start Guide | RepWell Developer Portal",
  description: "Get started with the RepWell API in minutes. Learn how to authenticate, make requests, and integrate surveys and reviews.",
};

const steps = [
  {
    title: "Get Your API Key",
    description: "Create an API key from your dashboard settings.",
    code: null,
    link: { href: "/dashboard/settings/api-keys", label: "Go to API Keys" },
  },
  {
    title: "Make Your First Request",
    description: "Test your API key by listing your surveys.",
    code: `curl -X GET "https://api.repwell.com/v1/surveys" \\
  -H "Authorization: Bearer rw_live_xxxxx" \\
  -H "Content-Type: application/json"`,
  },
  {
    title: "Create a Survey",
    description: "Send a survey to a customer.",
    code: `curl -X POST "https://api.repwell.com/v1/surveys" \\
  -H "Authorization: Bearer rw_live_xxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "template_id": "your-template-id",
    "customer_email": "customer@example.com",
    "customer_name": "John Doe",
    "user_id": "your-user-id"
  }'`,
  },
  {
    title: "Get Reviews",
    description: "Fetch reviews for your organization.",
    code: `curl -X GET "https://api.repwell.com/v1/reviews?status=published" \\
  -H "Authorization: Bearer rw_live_xxxxx"`,
  },
];

export default function QuickStartPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost" size="sm">
              <Link href="/developers">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Portal
              </Link>
            </Button>
            <div className="h-6 w-px bg-border" />
            <div>
              <h1 className="text-xl font-semibold">Quick Start Guide</h1>
              <p className="text-sm text-muted-foreground">Get up and running in minutes</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-3xl">
          {/* Introduction */}
          <div className="mb-12">
            <h2 className="mb-4 text-2xl font-bold">Welcome to the RepWell API</h2>
            <p className="text-muted-foreground">
              The RepWell API enables you to programmatically manage surveys, reviews,
              loan officers, and branches. This guide will help you get started quickly.
            </p>
          </div>

          {/* Prerequisites */}
          <Card className="mb-12">
            <CardHeader>
              <CardTitle>Prerequisites</CardTitle>
              <CardDescription>What you need before getting started</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
                  <span>A RepWell account with API access enabled</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
                  <span>At least one survey template configured</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
                  <span>Loan officers added to your organization</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Steps */}
          <div className="space-y-8">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="mb-2 text-lg font-semibold">{step.title}</h3>
                    <p className="mb-4 text-muted-foreground">{step.description}</p>
                    {step.code && (
                      <div className="relative">
                        <pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 text-sm text-slate-100">
                          <code>{step.code}</code>
                        </pre>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-2 text-slate-400 hover:text-slate-100"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    {step.link && (
                      <Button asChild className="mt-4">
                        <Link href={step.link.href}>
                          {step.link.label}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className="absolute left-4 top-10 h-[calc(100%-2rem)] w-px bg-border" />
                )}
              </div>
            ))}
          </div>

          {/* Response Format */}
          <div className="mt-16">
            <h2 className="mb-4 text-2xl font-bold">Response Format</h2>
            <p className="mb-4 text-muted-foreground">
              All API responses follow a consistent format:
            </p>
            <pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 text-sm text-slate-100">
              <code>{`{
  "success": true,
  "data": { ... },
  "pagination": {
    "page": 1,
    "page_size": 25,
    "total": 142,
    "total_pages": 6
  },
  "meta": {
    "request_id": "req_abc123",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}`}</code>
            </pre>
          </div>

          {/* Error Handling */}
          <div className="mt-12">
            <h2 className="mb-4 text-2xl font-bold">Error Handling</h2>
            <p className="mb-4 text-muted-foreground">
              Errors include a code and message to help you debug:
            </p>
            <pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 text-sm text-slate-100">
              <code>{`{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": [
      {
        "field": "customer_email",
        "message": "Invalid email format"
      }
    ]
  },
  "meta": {
    "request_id": "req_abc123",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}`}</code>
            </pre>
          </div>

          {/* Next Steps */}
          <div className="mt-16">
            <h2 className="mb-6 text-2xl font-bold">Next Steps</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="transition-shadow hover:shadow-md">
                <Link href="/developers/api">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      API Reference
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </CardTitle>
                    <CardDescription>
                      Explore all available endpoints
                    </CardDescription>
                  </CardHeader>
                </Link>
              </Card>
              <Card className="transition-shadow hover:shadow-md">
                <Link href="/developers/docs/authentication">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      Authentication
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </CardTitle>
                    <CardDescription>
                      Learn about API key scopes
                    </CardDescription>
                  </CardHeader>
                </Link>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
