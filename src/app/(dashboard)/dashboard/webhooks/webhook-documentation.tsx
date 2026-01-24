"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import {
  Copy,
  CheckCircle as CheckCircle2,
  CaretDown as ChevronDown,
  ArrowSquareOut as ExternalLink,
  Shield,
  Clock,
  Lightning as Zap,
  Warning as AlertTriangle,
  BuildingOffice as Building2,
  Info,
} from "@phosphor-icons/react";

export function WebhookDocumentation() {
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const { toast } = useToast();

  function copyToClipboard(text: string, item: string): void {
    navigator.clipboard.writeText(text);
    setCopiedItem(item);
    setTimeout(() => setCopiedItem(null), 2000);
    toast({ title: "Copied", description: `${item} copied to clipboard` });
  }

  const webhookEndpoint =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/webhooks/survey-trigger`
      : "/api/webhooks/survey-trigger";

  return (
    <div className="space-y-6">
      {/* Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Webhook Integration Guide</CardTitle>
          <CardDescription>
            Learn how to integrate your LOS, CRM, or other systems with RepWell
            webhooks to automatically trigger survey sends
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex items-start gap-3 p-4 rounded-lg border">
              <Shield className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-sm">Secure</h4>
                <p className="text-xs text-muted-foreground">
                  HMAC-SHA256 signature verification for all requests
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-lg border">
              <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-sm">Reliable</h4>
                <p className="text-xs text-muted-foreground">
                  Automatic retries with exponential backoff
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-lg border">
              <Zap className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-sm">Fast</h4>
                <p className="text-xs text-muted-foreground">
                  Process webhooks in under 500ms
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Start */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Start</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium text-sm">1. Get your API Key</h4>
            <p className="text-sm text-muted-foreground">
              Create a webhook configuration in the Settings tab to generate your
              unique API key.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium text-sm">2. Webhook Endpoint</h4>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded bg-muted p-2 text-sm break-all">
                {webhookEndpoint}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(webhookEndpoint, "Endpoint")}
              >
                {copiedItem === "Endpoint" ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium text-sm">3. Required Headers</h4>
            <div className="rounded bg-muted p-3 space-y-1">
              <code className="block text-sm">
                Content-Type: application/json
              </code>
              <code className="block text-sm">x-api-key: your_api_key_here</code>
              <code className="block text-sm text-muted-foreground">
                x-webhook-signature: sha256=... (optional but recommended)
              </code>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Event Types */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Event Types</CardTitle>
          <CardDescription>
            Different event types for different use cases
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="loan.closed" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="loan.closed">loan.closed</TabsTrigger>
              <TabsTrigger value="contact.created">contact.created</TabsTrigger>
              <TabsTrigger value="survey.trigger">survey.trigger</TabsTrigger>
              <TabsTrigger value="encompass.milestone">encompass.milestone</TabsTrigger>
            </TabsList>

            <TabsContent value="loan.closed" className="space-y-4 mt-4">
              <div className="flex items-center gap-2">
                <Badge>Recommended</Badge>
                <span className="text-sm text-muted-foreground">
                  Use when a loan closes in your LOS
                </span>
              </div>
              <CodeBlock
                title="Payload Example"
                code={JSON.stringify(
                  {
                    event_type: "loan.closed",
                    data: {
                      transaction_id: "LOAN-2024-001234",
                      loan_officer_email: "john.doe@company.com",
                      customer_name: "Jane Smith",
                      customer_email: "jane.smith@email.com",
                      customer_phone: "+15551234567",
                      transaction_type: "mortgage",
                      transaction_date: "2024-01-15",
                      metadata: {
                        loan_amount: 350000,
                        property_address: "123 Main St",
                      },
                    },
                  },
                  null,
                  2
                )}
                onCopy={() => copyToClipboard("loan.closed payload", "Payload")}
                isCopied={copiedItem === "Payload"}
              />
              <div className="text-sm space-y-2">
                <p>
                  <strong>Default delay:</strong> 24 hours (configurable in webhook
                  settings)
                </p>
                <p>
                  <strong>Required fields:</strong> transaction_id,
                  loan_officer_email, customer_name, customer_email
                </p>
              </div>
            </TabsContent>

            <TabsContent value="contact.created" className="space-y-4 mt-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Use when a new contact is added to your CRM
                </span>
              </div>
              <CodeBlock
                title="Payload Example"
                code={JSON.stringify(
                  {
                    event_type: "contact.created",
                    data: {
                      loan_officer_email: "john.doe@company.com",
                      customer_name: "Jane Smith",
                      customer_email: "jane.smith@email.com",
                      customer_phone: "+15551234567",
                      source: "website_form",
                      metadata: {
                        lead_source: "Google Ads",
                      },
                    },
                  },
                  null,
                  2
                )}
                onCopy={() =>
                  copyToClipboard("contact.created payload", "Payload2")
                }
                isCopied={copiedItem === "Payload2"}
              />
              <div className="text-sm space-y-2">
                <p>
                  <strong>Default delay:</strong> No delay (immediate)
                </p>
                <p>
                  <strong>Required fields:</strong> loan_officer_email,
                  customer_name, customer_email
                </p>
              </div>
            </TabsContent>

            <TabsContent value="survey.trigger" className="space-y-4 mt-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Manual trigger with full control over all parameters
                </span>
              </div>
              <CodeBlock
                title="Payload Example"
                code={JSON.stringify(
                  {
                    event_type: "survey.trigger",
                    data: {
                      loan_officer_email: "john.doe@company.com",
                      customer_name: "Jane Smith",
                      customer_email: "jane.smith@email.com",
                      customer_phone: "+15551234567",
                      template_id: "uuid-of-specific-template",
                      delay_hours: 48,
                      transaction_id: "CUSTOM-REF-001",
                      metadata: {
                        custom_field: "custom_value",
                      },
                    },
                  },
                  null,
                  2
                )}
                onCopy={() =>
                  copyToClipboard("survey.trigger payload", "Payload3")
                }
                isCopied={copiedItem === "Payload3"}
              />
              <div className="text-sm space-y-2">
                <p>
                  <strong>Delay:</strong> 0-168 hours (configurable per request)
                </p>
                <p>
                  <strong>Required fields:</strong> customer_name, customer_email,
                  and either loan_officer_email or loan_officer_id
                </p>
              </div>
            </TabsContent>

            <TabsContent value="encompass.milestone" className="space-y-4 mt-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-blue-300 text-blue-700">
                  <Building2 className="mr-1 h-3 w-3" />
                  Encompass
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Trigger surveys based on Encompass loan milestones
                </span>
              </div>
              <CodeBlock
                title="Payload Example"
                code={JSON.stringify(
                  {
                    event_type: "encompass.milestone",
                    milestone: "Funded",
                    loan_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
                    loan_officer_email: "john.doe@company.com",
                    borrower_name: "Jane Smith",
                    borrower_email: "jane.smith@email.com",
                    borrower_phone: "+15551234567",
                    loan_amount: 350000,
                    property_address: "123 Main St, Anytown, CA 90210",
                    loan_number: "2024-001234",
                    milestone_date: "2024-01-15T10:30:00Z",
                    metadata: {
                      loan_type: "Conventional",
                      branch: "West Region",
                    },
                  },
                  null,
                  2
                )}
                onCopy={() =>
                  copyToClipboard("encompass.milestone payload", "Payload4")
                }
                isCopied={copiedItem === "Payload4"}
              />
              <div className="text-sm space-y-2">
                <p>
                  <strong>Delay:</strong> Configured per milestone in the Encompass tab
                </p>
                <p>
                  <strong>Required fields:</strong> milestone, loan_id,
                  loan_officer_email, borrower_name, borrower_email
                </p>
                <p>
                  <strong>Optional fields:</strong> borrower_phone, loan_amount,
                  property_address, loan_number, milestone_date, metadata
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Encompass Integration Guide */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">Encompass Integration Guide</CardTitle>
          </div>
          <CardDescription>
            Step-by-step instructions to connect Encompass with RepWell
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Prerequisites */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Prerequisites</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Encompass admin access to configure webhook notifications</li>
              <li>RepWell webhook API key (create in the Configurations tab)</li>
              <li>Milestone mappings configured (in the Encompass tab)</li>
            </ul>
          </div>

          {/* Step 1 */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Step 1: Get Your RepWell API Key</h4>
            <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
              <li>Go to the <strong>Configurations</strong> tab above</li>
              <li>Create a new webhook configuration (or use an existing one)</li>
              <li>Copy your API key - you&apos;ll need this for Encompass</li>
            </ol>
          </div>

          {/* Step 2 */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Step 2: Configure Milestone Mappings</h4>
            <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
              <li>Go to the <strong>Encompass</strong> tab above</li>
              <li>Enable the milestones you want to trigger surveys (e.g., &quot;Funded&quot;)</li>
              <li>Configure the delay (how long after the milestone to send the survey)</li>
              <li>Optionally assign specific survey templates to each milestone</li>
            </ol>
          </div>

          {/* Step 3 */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Step 3: Configure Encompass Webhook</h4>
            <p className="text-sm text-muted-foreground">
              You&apos;ll need to configure an outbound webhook in Encompass to send milestone
              events to RepWell. This can be done via:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside ml-4">
              <li><strong>Encompass Business Rules</strong> - Trigger webhooks on milestone changes</li>
              <li><strong>Custom Integration Middleware</strong> - Transform Encompass events to RepWell format</li>
              <li><strong>Zapier/Make</strong> - Connect Encompass to RepWell via automation platform</li>
            </ul>
          </div>

          {/* Webhook Configuration */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Webhook Configuration Details</h4>
            <div className="rounded bg-muted p-3 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Endpoint URL:</span>
                <code className="text-xs">{webhookEndpoint}</code>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Method:</span>
                <code className="text-xs">POST</code>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Content-Type:</span>
                <code className="text-xs">application/json</code>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Auth Header:</span>
                <code className="text-xs">x-api-key: YOUR_API_KEY</code>
              </div>
            </div>
          </div>

          {/* Field Mapping */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Required Field Mapping</h4>
            <p className="text-sm text-muted-foreground">
              Map these Encompass fields to the RepWell webhook payload:
            </p>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-2 font-medium">RepWell Field</th>
                    <th className="text-left p-2 font-medium">Encompass Field (Example)</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr>
                    <td className="p-2"><code>milestone</code></td>
                    <td className="p-2 text-muted-foreground">Milestone Name (e.g., &quot;Funded&quot;)</td>
                  </tr>
                  <tr>
                    <td className="p-2"><code>loan_id</code></td>
                    <td className="p-2 text-muted-foreground">Loan GUID / Loan Number</td>
                  </tr>
                  <tr>
                    <td className="p-2"><code>loan_officer_email</code></td>
                    <td className="p-2 text-muted-foreground">Loan Officer Email Address</td>
                  </tr>
                  <tr>
                    <td className="p-2"><code>borrower_name</code></td>
                    <td className="p-2 text-muted-foreground">Borrower First + Last Name</td>
                  </tr>
                  <tr>
                    <td className="p-2"><code>borrower_email</code></td>
                    <td className="p-2 text-muted-foreground">Borrower Email Address</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Testing */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Step 4: Test Your Integration</h4>
            <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
              <li>Go to the <strong>Test Webhooks</strong> tab</li>
              <li>Select your webhook configuration</li>
              <li>Choose &quot;encompass.milestone&quot; as the event type (coming soon)</li>
              <li>Run a live test to verify the connection</li>
              <li>Check the <strong>Logs</strong> tab to see webhook activity</li>
            </ol>
          </div>

          <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200">
            <Info className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
            <div className="text-sm text-blue-800">
              <strong>Need help?</strong> Contact your Encompass administrator or IT team
              to set up the webhook configuration. They may need to create a custom
              business rule or use middleware to format the payload correctly.
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Signature Verification */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Signature Verification</CardTitle>
          <CardDescription>
            Recommended: Sign your requests for additional security
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-sm text-amber-800">
              While signature verification is optional, we strongly recommend it
              for production integrations to prevent unauthorized requests.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium text-sm">How to generate a signature</h4>
            <p className="text-sm text-muted-foreground">
              Create an HMAC-SHA256 hash of the request body using your API key as
              the secret, then prefix it with &quot;sha256=&quot;.
            </p>
          </div>

          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <span>Node.js / TypeScript Example</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CodeBlock
                title=""
                code={`import crypto from 'crypto';

function generateSignature(payload: string, secret: string): string {
  const hash = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return \`sha256=\${hash}\`;
}

// Usage
const payload = JSON.stringify(webhookData);
const signature = generateSignature(payload, apiKey);

fetch(webhookUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'x-webhook-signature': signature,
  },
  body: payload,
});`}
                onCopy={() => copyToClipboard("node signature", "NodeSig")}
                isCopied={copiedItem === "NodeSig"}
              />
            </CollapsibleContent>
          </Collapsible>

          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <span>Python Example</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CodeBlock
                title=""
                code={`import hmac
import hashlib
import json
import requests

def generate_signature(payload: str, secret: str) -> str:
    signature = hmac.new(
        secret.encode('utf-8'),
        payload.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    return f"sha256={signature}"

# Usage
payload = json.dumps(webhook_data)
signature = generate_signature(payload, api_key)

response = requests.post(
    webhook_url,
    headers={
        'Content-Type': 'application/json',
        'x-api-key': api_key,
        'x-webhook-signature': signature,
    },
    data=payload,
)`}
                onCopy={() => copyToClipboard("python signature", "PythonSig")}
                isCopied={copiedItem === "PythonSig"}
              />
            </CollapsibleContent>
          </Collapsible>

          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <span>cURL Example</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CodeBlock
                title=""
                code={`# Generate signature (bash)
PAYLOAD='{"event_type":"loan.closed","data":{...}}'
API_KEY="your_api_key"
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$API_KEY" | cut -d' ' -f2)

# Send request
curl -X POST "${webhookEndpoint}" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: $API_KEY" \\
  -H "x-webhook-signature: sha256=$SIGNATURE" \\
  -d "$PAYLOAD"`}
                onCopy={() => copyToClipboard("curl signature", "CurlSig")}
                isCopied={copiedItem === "CurlSig"}
              />
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      {/* Response Codes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Response Codes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-3 p-2 rounded">
              <Badge variant="default" className="w-16 justify-center">
                200
              </Badge>
              <span className="text-sm">
                Success - Survey created and queued for delivery
              </span>
            </div>
            <div className="flex items-center gap-3 p-2 rounded">
              <Badge variant="secondary" className="w-16 justify-center">
                400
              </Badge>
              <span className="text-sm">
                Bad Request - Invalid JSON or missing required fields
              </span>
            </div>
            <div className="flex items-center gap-3 p-2 rounded">
              <Badge variant="secondary" className="w-16 justify-center">
                401
              </Badge>
              <span className="text-sm">
                Unauthorized - Invalid API key or signature
              </span>
            </div>
            <div className="flex items-center gap-3 p-2 rounded">
              <Badge variant="secondary" className="w-16 justify-center">
                403
              </Badge>
              <span className="text-sm">
                Forbidden - Webhook disabled or IP not allowed
              </span>
            </div>
            <div className="flex items-center gap-3 p-2 rounded">
              <Badge variant="destructive" className="w-16 justify-center">
                500
              </Badge>
              <span className="text-sm">
                Server Error - Processing failed (will retry automatically)
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Retry Policy */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Retry Policy</CardTitle>
          <CardDescription>
            Failed webhooks are automatically retried with exponential backoff
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <div className="flex items-center justify-between text-sm">
              <span>Attempt 1</span>
              <Badge variant="outline">5 minutes</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Attempt 2</span>
              <Badge variant="outline">10 minutes</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Attempt 3</span>
              <Badge variant="outline">20 minutes</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Attempt 4</span>
              <Badge variant="outline">40 minutes</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Attempt 5</span>
              <Badge variant="outline">1 hour 20 minutes</Badge>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            After 5 failed attempts, the webhook is marked as permanently failed.
            Permanent errors (invalid payload, auth failures) will not be retried.
          </p>
        </CardContent>
      </Card>

      {/* Support */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Need Help?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            If you need assistance with your webhook integration, check the
            following resources:
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <a
                href="https://github.com/anthropics/claude-code/issues"
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                GitHub Issues
              </a>
            </Button>
            <Button variant="outline" size="sm">
              Test Webhooks Tab
            </Button>
            <Button variant="outline" size="sm">
              View Logs Tab
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface CodeBlockProps {
  title: string;
  code: string;
  onCopy: () => void;
  isCopied: boolean;
}

function CodeBlock({ title, code, onCopy, isCopied }: CodeBlockProps) {
  return (
    <div className="space-y-2">
      {title && <h5 className="text-sm font-medium">{title}</h5>}
      <div className="relative">
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-2 top-2 h-6 px-2 z-10"
          onClick={onCopy}
        >
          {isCopied ? (
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
        <ScrollArea className="rounded-md border bg-muted">
          <pre className="p-4 text-xs font-mono overflow-x-auto">{code}</pre>
        </ScrollArea>
      </div>
    </div>
  );
}
