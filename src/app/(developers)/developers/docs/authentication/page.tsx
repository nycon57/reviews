import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, AlertTriangle, Key, Shield, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export const metadata: Metadata = {
  title: "Authentication | RepWell Developer Portal",
  description: "Learn how to authenticate with the RepWell API using API keys and scoped permissions.",
};

const scopes = [
  { name: "surveys:read", description: "List and view surveys" },
  { name: "surveys:write", description: "Create and update surveys" },
  { name: "reviews:read", description: "List and view reviews" },
  { name: "reviews:write", description: "Update reviews and respond to them" },
  { name: "branches:read", description: "List and view branches" },
  { name: "branches:write", description: "Create, update, and delete branches" },
  { name: "loan-officers:read", description: "List and view loan officers" },
  { name: "loan-officers:write", description: "Update loan officer profiles" },
  { name: "organization:read", description: "View organization settings" },
  { name: "organization:write", description: "Update organization settings" },
  { name: "users:read", description: "List organization users" },
  { name: "users:write", description: "Invite new users" },
  { name: "webhooks:trigger", description: "Trigger webhook events" },
  { name: "admin", description: "Full access to all resources" },
];

export default function AuthenticationPage() {
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
              <h1 className="text-xl font-semibold">Authentication</h1>
              <p className="text-sm text-muted-foreground">Secure your API requests</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-3xl">
          {/* Introduction */}
          <div className="mb-12">
            <h2 className="mb-4 text-2xl font-bold">API Key Authentication</h2>
            <p className="text-muted-foreground">
              The RepWell API uses API keys to authenticate requests. You can create and manage
              API keys from your dashboard settings. Each key can have specific permissions
              to control access to different resources.
            </p>
          </div>

          {/* Key Format */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Key className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>API Key Format</CardTitle>
                  <CardDescription>Understanding key prefixes</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="rounded-lg border p-4">
                  <div className="mb-2 font-mono text-sm">rw_live_xxxxxxxxxxxxxxxxxxxxxxxxxx</div>
                  <p className="text-sm text-muted-foreground">
                    <strong>Production keys</strong> start with <code className="rounded bg-slate-100 px-1">rw_live_</code>.
                    Use these for production environments.
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="mb-2 font-mono text-sm">rw_test_xxxxxxxxxxxxxxxxxxxxxxxxxx</div>
                  <p className="text-sm text-muted-foreground">
                    <strong>Test keys</strong> start with <code className="rounded bg-slate-100 px-1">rw_test_</code>.
                    Use these for development and testing.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Making Requests */}
          <div className="mb-12">
            <h2 className="mb-4 text-2xl font-bold">Making Authenticated Requests</h2>
            <p className="mb-4 text-muted-foreground">
              Include your API key in the <code className="rounded bg-slate-100 px-1">Authorization</code> header:
            </p>
            <pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 text-sm text-slate-100">
              <code>{`curl -X GET "https://api.repwell.com/v1/surveys" \\
  -H "Authorization: Bearer rw_live_xxxxx" \\
  -H "Content-Type: application/json"`}</code>
            </pre>
          </div>

          {/* Security Warning */}
          <Alert className="mb-12 border-amber-200 bg-amber-50">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800">Keep your API keys secure</AlertTitle>
            <AlertDescription className="text-amber-700">
              <ul className="mt-2 list-inside list-disc space-y-1">
                <li>Never expose API keys in client-side code or public repositories</li>
                <li>Rotate keys periodically and immediately if compromised</li>
                <li>Use environment variables to store keys securely</li>
                <li>Grant only the minimum required permissions</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Scopes */}
          <div className="mb-12">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Permission Scopes</h2>
                <p className="text-muted-foreground">Fine-grained access control</p>
              </div>
            </div>
            <p className="mb-6 text-muted-foreground">
              When creating an API key, you can specify which scopes it should have.
              This allows you to limit access to only what&apos;s needed.
            </p>
            <div className="rounded-lg border bg-white">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-3 text-left font-semibold">Scope</th>
                    <th className="px-4 py-3 text-left font-semibold">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {scopes.map((scope, index) => (
                    <tr key={scope.name} className={index < scopes.length - 1 ? "border-b" : ""}>
                      <td className="px-4 py-3">
                        <code className="rounded bg-slate-100 px-2 py-1 text-sm">{scope.name}</code>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{scope.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Rate Limiting */}
          <div className="mb-12">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Lock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Rate Limiting</h2>
                <p className="text-muted-foreground">API request quotas</p>
              </div>
            </div>
            <p className="mb-4 text-muted-foreground">
              API requests are rate limited per key. The limits are included in response headers:
            </p>
            <div className="rounded-lg border bg-white">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-3 text-left font-semibold">Header</th>
                    <th className="px-4 py-3 text-left font-semibold">Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="px-4 py-3">
                      <code className="rounded bg-slate-100 px-2 py-1 text-sm">X-RateLimit-Limit</code>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">Maximum requests per hour</td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-4 py-3">
                      <code className="rounded bg-slate-100 px-2 py-1 text-sm">X-RateLimit-Remaining</code>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">Requests remaining in window</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">
                      <code className="rounded bg-slate-100 px-2 py-1 text-sm">X-RateLimit-Reset</code>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">Unix timestamp when window resets</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              If you exceed the rate limit, you&apos;ll receive a <code className="rounded bg-slate-100 px-1">429 Too Many Requests</code> response.
              Wait until the reset time before making more requests.
            </p>
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
                      Generate your first API key
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
                      Explore all endpoints
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
