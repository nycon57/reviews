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
  Envelope,
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

  async function copyToClipboard(text: string, item: string): Promise<void> {
    if (!navigator.clipboard) {
      toast({ title: "Error", description: "Clipboard not available", variant: "destructive" });
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItem(item);
      setTimeout(() => setCopiedItem(null), 2000);
      toast({ title: "Copied", description: `${item} copied to clipboard` });
    } catch {
      toast({ title: "Error", description: "Failed to copy to clipboard", variant: "destructive" });
    }
  }

  const webhookEndpoint =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/webhooks/survey-trigger`
      : "/api/webhooks/survey-trigger";

  return (
    <div className="space-y-6">
      {/* Overview */}
      <Card>
        <div className="h-1 bg-gradient-to-r from-repwell-teal-300 to-repwell-sage-200 rounded-t-xl" />
        <CardHeader>
          <CardTitle className="font-sans text-xl font-semibold text-heading">Webhook Integration Guide</CardTitle>
          <CardDescription className="text-repwell-teal-300">
            Learn how to integrate your LOS, CRM, or other systems with RepWell
            webhooks to automatically trigger survey sends
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex items-start gap-3 p-4 rounded-xl border border-border hover:shadow-sm transition-shadow duration-300">
              <div className="w-10 h-10 bg-repwell-sage-100/50 dark:bg-repwell-teal-300/15 rounded-lg flex items-center justify-center shrink-0">
                <Shield weight="duotone" className="h-5 w-5 text-repwell-sage-200" />
              </div>
              <div>
                <h4 className="font-sans font-semibold text-sm text-heading">Secure</h4>
                <p className="text-xs text-repwell-teal-300">
                  HMAC-SHA256 signature verification for all requests
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-xl border border-border hover:shadow-sm transition-shadow duration-300">
              <div className="w-10 h-10 bg-repwell-sage-100/50 dark:bg-repwell-teal-300/15 rounded-lg flex items-center justify-center shrink-0">
                <Clock weight="duotone" className="h-5 w-5 text-repwell-teal-300" />
              </div>
              <div>
                <h4 className="font-sans font-semibold text-sm text-heading">Reliable</h4>
                <p className="text-xs text-repwell-teal-300">
                  Automatic retries with exponential backoff
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-xl border border-border hover:shadow-sm transition-shadow duration-300">
              <div className="w-10 h-10 bg-repwell-sage-100/50 dark:bg-repwell-teal-300/15 rounded-lg flex items-center justify-center shrink-0">
                <Zap weight="duotone" className="h-5 w-5 text-[#d4a574]" />
              </div>
              <div>
                <h4 className="font-sans font-semibold text-sm text-heading">Fast</h4>
                <p className="text-xs text-repwell-teal-300">
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
          <CardTitle className="font-sans text-lg font-semibold text-heading">Quick Start</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-sans font-semibold text-sm text-heading">1. Get your API Key</h4>
            <p className="text-sm text-repwell-teal-300 leading-relaxed">
              Create a webhook configuration in the Settings tab to generate your
              unique API key.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-sans font-semibold text-sm text-heading">2. Webhook Endpoint</h4>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-lg bg-repwell-teal-500 text-repwell-sage-100 p-3 text-sm font-mono break-all">
                {webhookEndpoint}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(webhookEndpoint, "Endpoint")}
              >
                {copiedItem === "Endpoint" ? (
                  <CheckCircle2 className="h-4 w-4 text-repwell-sage-200" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-sans font-semibold text-sm text-heading">3. Required Headers</h4>
            <div className="rounded-lg bg-repwell-teal-500 p-4 space-y-1.5 font-mono">
              <code className="block text-sm text-repwell-sage-100">
                Content-Type: application/json
              </code>
              <code className="block text-sm text-repwell-sage-100">x-api-key: your_api_key_here</code>
              <code className="block text-sm text-repwell-sage-100/60">
                x-webhook-signature: sha256=... (optional but recommended)
              </code>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Event Types */}
      <Card>
        <CardHeader>
          <CardTitle className="font-sans text-lg font-semibold text-heading">Event Types</CardTitle>
          <CardDescription className="text-repwell-teal-300">
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
                <span className="text-sm text-repwell-teal-300">
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
                      user_email: "john.doe@company.com",
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
                label="Payload"
              />
              <div className="text-sm text-label space-y-2">
                <p>
                  <strong className="text-heading">Default delay:</strong> 24 hours (configurable in webhook
                  settings)
                </p>
                <p>
                  <strong className="text-heading">Required fields:</strong> transaction_id,
                  user_email, customer_name, customer_email
                </p>
              </div>
            </TabsContent>

            <TabsContent value="contact.created" className="space-y-4 mt-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-repwell-teal-300">
                  Use when a new contact is added to your CRM
                </span>
              </div>
              <CodeBlock
                title="Payload Example"
                code={JSON.stringify(
                  {
                    event_type: "contact.created",
                    data: {
                      user_email: "john.doe@company.com",
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
                label="Payload"
              />
              <div className="text-sm text-label space-y-2">
                <p>
                  <strong className="text-heading">Default delay:</strong> No delay (immediate)
                </p>
                <p>
                  <strong className="text-heading">Required fields:</strong> user_email,
                  customer_name, customer_email
                </p>
              </div>
            </TabsContent>

            <TabsContent value="survey.trigger" className="space-y-4 mt-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-repwell-teal-300">
                  Manual trigger with full control over all parameters
                </span>
              </div>
              <CodeBlock
                title="Payload Example"
                code={JSON.stringify(
                  {
                    event_type: "survey.trigger",
                    data: {
                      user_email: "john.doe@company.com",
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
                label="Payload"
              />
              <div className="text-sm text-label space-y-2">
                <p>
                  <strong className="text-heading">Delay:</strong> 0-168 hours (configurable per request)
                </p>
                <p>
                  <strong className="text-heading">Required fields:</strong> customer_name, customer_email,
                  and either user_email or user_id
                </p>
              </div>
            </TabsContent>

            <TabsContent value="encompass.milestone" className="space-y-4 mt-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-repwell-teal-300/30 text-label">
                  <Building2 className="mr-1 h-3 w-3" />
                  Encompass
                </Badge>
                <span className="text-sm text-repwell-teal-300">
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
                    user_email: "john.doe@company.com",
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
                label="Payload"
              />
              <div className="text-sm text-label space-y-2">
                <p>
                  <strong className="text-heading">Delay:</strong> Configured per milestone in the Encompass tab
                </p>
                <p>
                  <strong className="text-heading">Required fields:</strong> milestone, loan_id,
                  user_email, borrower_name, borrower_email
                </p>
                <p>
                  <strong className="text-heading">Optional fields:</strong> borrower_phone, loan_amount,
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
            <div className="w-8 h-8 bg-repwell-sage-100/50 dark:bg-repwell-teal-300/15 rounded-lg flex items-center justify-center">
              <Building2 weight="duotone" className="h-4 w-4 text-repwell-teal-300" />
            </div>
            <CardTitle className="font-sans text-lg font-semibold text-heading">Encompass Integration Guide</CardTitle>
          </div>
          <CardDescription className="text-repwell-teal-300">
            Step-by-step instructions to connect Encompass with RepWell
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Prerequisites */}
          <div className="space-y-3">
            <h4 className="font-sans font-semibold text-sm text-heading">Prerequisites</h4>
            <ul className="text-sm text-label space-y-1 list-disc list-inside leading-relaxed">
              <li>Encompass admin access to configure webhook notifications</li>
              <li>RepWell webhook API key (create in the Configurations tab)</li>
              <li>Milestone mappings configured (in the Encompass tab)</li>
            </ul>
          </div>

          {/* Step 1 */}
          <div className="space-y-3">
            <h4 className="font-sans font-semibold text-sm text-heading">Step 1: Get Your RepWell API Key</h4>
            <ol className="text-sm text-label space-y-2 list-decimal list-inside leading-relaxed">
              <li>Go to the <strong className="text-heading">Configurations</strong> tab above</li>
              <li>Create a new webhook configuration (or use an existing one)</li>
              <li>Copy your API key - you&apos;ll need this for Encompass</li>
            </ol>
          </div>

          {/* Step 2 */}
          <div className="space-y-3">
            <h4 className="font-sans font-semibold text-sm text-heading">Step 2: Configure Milestone Mappings</h4>
            <ol className="text-sm text-label space-y-2 list-decimal list-inside leading-relaxed">
              <li>Go to the <strong className="text-heading">Encompass</strong> tab above</li>
              <li>Enable the milestones you want to trigger surveys (e.g., &quot;Funded&quot;)</li>
              <li>Configure the delay (how long after the milestone to send the survey)</li>
              <li>Optionally assign specific survey templates to each milestone</li>
            </ol>
          </div>

          {/* Step 3 */}
          <div className="space-y-3">
            <h4 className="font-sans font-semibold text-sm text-heading">Step 3: Configure Encompass Webhook</h4>
            <p className="text-sm text-label leading-relaxed">
              You&apos;ll need to configure an outbound webhook in Encompass to send milestone
              events to RepWell. This can be done via:
            </p>
            <ul className="text-sm text-label space-y-1 list-disc list-inside ml-4 leading-relaxed">
              <li><strong className="text-heading">Encompass Business Rules</strong> - Trigger webhooks on milestone changes</li>
              <li><strong className="text-heading">Custom Integration Middleware</strong> - Transform Encompass events to RepWell format</li>
              <li><strong className="text-heading">Zapier/Make</strong> - Connect Encompass to RepWell via automation platform</li>
            </ul>
          </div>

          {/* Webhook Configuration */}
          <div className="space-y-3">
            <h4 className="font-sans font-semibold text-sm text-heading">Webhook Configuration Details</h4>
            <div className="rounded-lg bg-repwell-teal-500 p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-repwell-sage-100/70">Endpoint URL:</span>
                <code className="text-xs text-repwell-sage-100 font-mono">{webhookEndpoint}</code>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-repwell-sage-100/70">Method:</span>
                <code className="text-xs text-repwell-sage-100 font-mono">POST</code>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-repwell-sage-100/70">Content-Type:</span>
                <code className="text-xs text-repwell-sage-100 font-mono">application/json</code>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-repwell-sage-100/70">Auth Header:</span>
                <code className="text-xs text-repwell-sage-100 font-mono">x-api-key: YOUR_API_KEY</code>
              </div>
            </div>
          </div>

          {/* Field Mapping */}
          <div className="space-y-3">
            <h4 className="font-sans font-semibold text-sm text-heading">Required Field Mapping</h4>
            <p className="text-sm text-label leading-relaxed">
              Map these Encompass fields to the RepWell webhook payload:
            </p>
            <div className="border border-border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-repwell-sage-100/30 dark:bg-repwell-teal-300/10">
                  <tr>
                    <th className="text-left p-3 font-sans font-semibold text-heading">RepWell Field</th>
                    <th className="text-left p-3 font-sans font-semibold text-heading">Encompass Field (Example)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr className="hover:bg-repwell-sage-100/10 dark:hover:bg-repwell-teal-300/10 transition-colors">
                    <td className="p-3"><code className="text-repwell-teal-300 font-mono text-xs bg-repwell-sage-100/30 dark:bg-repwell-teal-300/10 px-1.5 py-0.5 rounded">milestone</code></td>
                    <td className="p-3 text-label">Milestone Name (e.g., &quot;Funded&quot;)</td>
                  </tr>
                  <tr className="hover:bg-repwell-sage-100/10 dark:hover:bg-repwell-teal-300/10 transition-colors">
                    <td className="p-3"><code className="text-repwell-teal-300 font-mono text-xs bg-repwell-sage-100/30 dark:bg-repwell-teal-300/10 px-1.5 py-0.5 rounded">loan_id</code></td>
                    <td className="p-3 text-label">Loan GUID / Loan Number</td>
                  </tr>
                  <tr className="hover:bg-repwell-sage-100/10 dark:hover:bg-repwell-teal-300/10 transition-colors">
                    <td className="p-3"><code className="text-repwell-teal-300 font-mono text-xs bg-repwell-sage-100/30 dark:bg-repwell-teal-300/10 px-1.5 py-0.5 rounded">user_email</code></td>
                    <td className="p-3 text-label">Loan Officer Email Address</td>
                  </tr>
                  <tr className="hover:bg-repwell-sage-100/10 dark:hover:bg-repwell-teal-300/10 transition-colors">
                    <td className="p-3"><code className="text-repwell-teal-300 font-mono text-xs bg-repwell-sage-100/30 dark:bg-repwell-teal-300/10 px-1.5 py-0.5 rounded">borrower_name</code></td>
                    <td className="p-3 text-label">Borrower First + Last Name</td>
                  </tr>
                  <tr className="hover:bg-repwell-sage-100/10 dark:hover:bg-repwell-teal-300/10 transition-colors">
                    <td className="p-3"><code className="text-repwell-teal-300 font-mono text-xs bg-repwell-sage-100/30 dark:bg-repwell-teal-300/10 px-1.5 py-0.5 rounded">borrower_email</code></td>
                    <td className="p-3 text-label">Borrower Email Address</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Testing */}
          <div className="space-y-3">
            <h4 className="font-sans font-semibold text-sm text-heading">Step 4: Test Your Integration</h4>
            <ol className="text-sm text-label space-y-2 list-decimal list-inside leading-relaxed">
              <li>Go to the <strong className="text-heading">Test Webhooks</strong> tab</li>
              <li>Select your webhook configuration</li>
              <li>Choose &quot;encompass.milestone&quot; as the event type (coming soon)</li>
              <li>Run a live test to verify the connection</li>
              <li>Check the <strong className="text-heading">Logs</strong> tab to see webhook activity</li>
            </ol>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-xl bg-repwell-sage-100/30 dark:bg-repwell-teal-300/10 border border-repwell-teal-300/20">
            <div className="w-8 h-8 bg-repwell-teal-300/10 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
              <Info weight="duotone" className="h-4 w-4 text-repwell-teal-300" />
            </div>
            <div className="text-sm text-label leading-relaxed">
              <strong className="text-heading">Need help?</strong> Contact your Encompass administrator or IT team
              to set up the webhook configuration. They may need to create a custom
              business rule or use middleware to format the payload correctly.
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Signature Verification */}
      <Card>
        <CardHeader>
          <CardTitle className="font-sans text-lg font-semibold text-heading">Signature Verification</CardTitle>
          <CardDescription className="text-repwell-teal-300">
            Recommended: Sign your requests for additional security
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-[#d4a574]/10 border border-[#d4a574]/20">
            <div className="w-8 h-8 bg-[#d4a574]/10 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle weight="duotone" className="h-4 w-4 text-[#d4a574]" />
            </div>
            <p className="text-sm text-label leading-relaxed">
              While signature verification is optional, we strongly recommend it
              for production integrations to prevent unauthorized requests.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-sans font-semibold text-sm text-heading">How to generate a signature</h4>
            <p className="text-sm text-label leading-relaxed">
              Create an HMAC-SHA256 hash of the request body using your API key as
              the secret, then prefix it with &quot;sha256=&quot;.
            </p>
          </div>

          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between text-label">
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
                label="Code example"
              />
            </CollapsibleContent>
          </Collapsible>

          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between text-label">
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
                label="Code example"
              />
            </CollapsibleContent>
          </Collapsible>

          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between text-label">
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
                label="Code example"
              />
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      {/* Response Codes */}
      <Card>
        <CardHeader>
          <CardTitle className="font-sans text-lg font-semibold text-heading">Response Codes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-repwell-sage-100/10 dark:hover:bg-repwell-teal-300/10 transition-colors">
              <Badge variant="default" className="w-16 justify-center">
                200
              </Badge>
              <span className="text-sm text-label">
                Success - Survey created and queued for delivery
              </span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-repwell-sage-100/10 dark:hover:bg-repwell-teal-300/10 transition-colors">
              <Badge variant="secondary" className="w-16 justify-center">
                400
              </Badge>
              <span className="text-sm text-label">
                Bad Request - Invalid JSON or missing required fields
              </span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-repwell-sage-100/10 dark:hover:bg-repwell-teal-300/10 transition-colors">
              <Badge variant="secondary" className="w-16 justify-center">
                401
              </Badge>
              <span className="text-sm text-label">
                Unauthorized - Invalid API key or signature
              </span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-repwell-sage-100/10 dark:hover:bg-repwell-teal-300/10 transition-colors">
              <Badge variant="secondary" className="w-16 justify-center">
                403
              </Badge>
              <span className="text-sm text-label">
                Forbidden - Webhook disabled or IP not allowed
              </span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-repwell-sage-100/10 dark:hover:bg-repwell-teal-300/10 transition-colors">
              <Badge variant="destructive" className="w-16 justify-center">
                500
              </Badge>
              <span className="text-sm text-label">
                Server Error - Processing failed (will retry automatically)
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Retry Policy */}
      <Card>
        <CardHeader>
          <CardTitle className="font-sans text-lg font-semibold text-heading">Retry Policy</CardTitle>
          <CardDescription className="text-repwell-teal-300">
            Failed webhooks are automatically retried with exponential backoff
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <div className="flex items-center justify-between text-sm p-2 rounded-lg hover:bg-repwell-sage-100/10 dark:hover:bg-repwell-teal-300/10 transition-colors">
              <span className="text-label">Attempt 1</span>
              <Badge variant="outline">5 minutes</Badge>
            </div>
            <div className="flex items-center justify-between text-sm p-2 rounded-lg hover:bg-repwell-sage-100/10 dark:hover:bg-repwell-teal-300/10 transition-colors">
              <span className="text-label">Attempt 2</span>
              <Badge variant="outline">10 minutes</Badge>
            </div>
            <div className="flex items-center justify-between text-sm p-2 rounded-lg hover:bg-repwell-sage-100/10 dark:hover:bg-repwell-teal-300/10 transition-colors">
              <span className="text-label">Attempt 3</span>
              <Badge variant="outline">20 minutes</Badge>
            </div>
            <div className="flex items-center justify-between text-sm p-2 rounded-lg hover:bg-repwell-sage-100/10 dark:hover:bg-repwell-teal-300/10 transition-colors">
              <span className="text-label">Attempt 4</span>
              <Badge variant="outline">40 minutes</Badge>
            </div>
            <div className="flex items-center justify-between text-sm p-2 rounded-lg hover:bg-repwell-sage-100/10 dark:hover:bg-repwell-teal-300/10 transition-colors">
              <span className="text-label">Attempt 5</span>
              <Badge variant="outline">1 hour 20 minutes</Badge>
            </div>
          </div>
          <p className="text-sm text-repwell-teal-300 leading-relaxed">
            After 5 failed attempts, the webhook is marked as permanently failed.
            Permanent errors (invalid payload, auth failures) will not be retried.
          </p>
        </CardContent>
      </Card>

      {/* Support */}
      <Card>
        <CardHeader>
          <CardTitle className="font-sans text-lg font-semibold text-heading">Need Help?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-label leading-relaxed">
            If you need assistance with your webhook integration, check the
            following resources:
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href="mailto:support@repwell.ai">
                <Envelope className="mr-2 h-4 w-4" />
                Contact Support
              </a>
            </Button>
            <Button variant="outline" size="sm" disabled aria-disabled="true">
              Test Webhooks Tab
            </Button>
            <Button variant="outline" size="sm" disabled aria-disabled="true">
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
  label: string;
}

function CodeBlock({ title, code, label }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  async function handleCopy() {
    if (!navigator.clipboard) {
      toast({ title: "Error", description: "Clipboard not available", variant: "destructive" });
      return;
    }
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Copied", description: `${label} copied to clipboard` });
    } catch {
      toast({ title: "Error", description: "Failed to copy to clipboard", variant: "destructive" });
    }
  }

  return (
    <div className="space-y-2">
      {title && <h5 className="font-sans text-sm font-semibold text-heading">{title}</h5>}
      <div className="relative">
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-2 top-2 h-7 px-2 z-10 text-repwell-sage-100/60 hover:text-repwell-sage-100 hover:bg-repwell-teal-400/50"
          onClick={handleCopy}
        >
          {copied ? (
            <CheckCircle2 className="h-4 w-4 text-repwell-sage-200" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
        <ScrollArea className="rounded-lg border border-repwell-teal-400/20 bg-repwell-teal-500">
          <pre className="p-4 text-xs font-mono text-repwell-sage-100 overflow-x-auto">{code}</pre>
        </ScrollArea>
      </div>
    </div>
  );
}
