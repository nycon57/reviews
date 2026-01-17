import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Webhook, RefreshCw, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Webhooks | RepWell Developer Portal",
  description: "Learn how to use webhooks to receive real-time notifications for survey completions and other events.",
};

const events = [
  {
    name: "survey.trigger",
    description: "Trigger a new survey to be sent",
    example: `{
  "event": "survey.trigger",
  "customer": {
    "email": "customer@example.com",
    "name": "John Doe",
    "phone": "+15551234567"
  },
  "loan_officer": {
    "email": "lo@company.com",
    "name": "Jane Smith"
  },
  "transaction": {
    "type": "purchase",
    "close_date": "2024-01-15"
  }
}`,
  },
];

export default function WebhooksPage() {
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
              <h1 className="text-xl font-semibold">Webhooks</h1>
              <p className="text-sm text-muted-foreground">Real-time event notifications</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-3xl">
          {/* Introduction */}
          <div className="mb-12">
            <h2 className="mb-4 text-2xl font-bold">Inbound Webhooks</h2>
            <p className="text-muted-foreground">
              Use webhooks to trigger surveys from your CRM or loan origination system.
              When a loan closes or a milestone is reached, send a webhook to RepWell
              to automatically send a survey to your customer.
            </p>
          </div>

          {/* Endpoint */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Webhook className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Webhook Endpoint</CardTitle>
                  <CardDescription>POST requests to trigger surveys</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border bg-slate-50 p-4">
                <code className="text-sm">POST https://api.repwell.com/api/webhooks/survey-trigger</code>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                Include your API key in the <code className="rounded bg-slate-100 px-1">Authorization</code> header
                or as a <code className="rounded bg-slate-100 px-1">secret_key</code> parameter in the request body.
              </p>
            </CardContent>
          </Card>

          {/* Authentication */}
          <div className="mb-12">
            <h3 className="mb-4 text-xl font-semibold">Authentication</h3>
            <p className="mb-4 text-muted-foreground">
              Authenticate webhook requests using your API key:
            </p>
            <pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 text-sm text-slate-100">
              <code>{`curl -X POST "https://api.repwell.com/api/webhooks/survey-trigger" \\
  -H "Authorization: Bearer rw_live_xxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "customer": {
      "email": "customer@example.com",
      "name": "John Doe"
    },
    "loan_officer": {
      "email": "lo@company.com"
    }
  }'`}</code>
            </pre>
          </div>

          {/* Events */}
          <div className="mb-12">
            <h3 className="mb-4 text-xl font-semibold">Webhook Payload</h3>
            {events.map((event) => (
              <div key={event.name} className="mb-6">
                <div className="mb-2 flex items-center gap-2">
                  <code className="rounded bg-primary/10 px-2 py-1 text-sm font-semibold text-primary">
                    {event.name}
                  </code>
                  <span className="text-muted-foreground">{event.description}</span>
                </div>
                <pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 text-sm text-slate-100">
                  <code>{event.example}</code>
                </pre>
              </div>
            ))}
          </div>

          {/* Required Fields */}
          <Card className="mb-12">
            <CardHeader>
              <CardTitle>Required Fields</CardTitle>
              <CardDescription>Minimum data needed to trigger a survey</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
                  <div>
                    <code className="rounded bg-slate-100 px-1">customer.email</code> or{" "}
                    <code className="rounded bg-slate-100 px-1">customer.phone</code>
                    <p className="mt-1 text-sm text-muted-foreground">
                      At least one contact method is required
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
                  <div>
                    <code className="rounded bg-slate-100 px-1">loan_officer.email</code>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Used to match the survey to a loan officer
                    </p>
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Retry Logic */}
          <div className="mb-12">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <RefreshCw className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">Response & Retry Logic</h3>
                <p className="text-muted-foreground">How we handle webhook processing</p>
              </div>
            </div>
            <div className="rounded-lg border bg-white">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-3 text-left font-semibold">Status</th>
                    <th className="px-4 py-3 text-left font-semibold">Meaning</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="px-4 py-3">
                      <code className="rounded bg-green-100 px-2 py-1 text-sm text-green-700">200 OK</code>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">Survey queued successfully</td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-4 py-3">
                      <code className="rounded bg-amber-100 px-2 py-1 text-sm text-amber-700">400 Bad Request</code>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">Invalid payload - check required fields</td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-4 py-3">
                      <code className="rounded bg-red-100 px-2 py-1 text-sm text-red-700">401 Unauthorized</code>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">Invalid or missing API key</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">
                      <code className="rounded bg-red-100 px-2 py-1 text-sm text-red-700">429 Too Many Requests</code>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">Rate limit exceeded</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Success Response */}
          <div className="mb-12">
            <h3 className="mb-4 text-xl font-semibold">Success Response</h3>
            <pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 text-sm text-slate-100">
              <code>{`{
  "success": true,
  "data": {
    "survey_id": "surv_abc123",
    "status": "queued",
    "scheduled_at": "2024-01-15T10:30:00Z"
  },
  "meta": {
    "request_id": "req_xyz789"
  }
}`}</code>
            </pre>
          </div>

          {/* Next Steps */}
          <div className="mt-16">
            <h2 className="mb-6 text-2xl font-bold">Next Steps</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="transition-shadow hover:shadow-md">
                <Link href="/dashboard/settings/api-keys">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      Create API Key
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </CardTitle>
                    <CardDescription>
                      Get your webhook authentication key
                    </CardDescription>
                  </CardHeader>
                </Link>
              </Card>
              <Card className="transition-shadow hover:shadow-md">
                <Link href="/developers/api">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      API Reference
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </CardTitle>
                    <CardDescription>
                      Full endpoint documentation
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
