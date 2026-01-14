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
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  Shield,
  Clock,
  Zap,
  AlertTriangle,
} from "lucide-react";

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
            Learn how to integrate your LOS, CRM, or other systems with ReviewHub
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
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="loan.closed">loan.closed</TabsTrigger>
              <TabsTrigger value="contact.created">contact.created</TabsTrigger>
              <TabsTrigger value="survey.trigger">survey.trigger</TabsTrigger>
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
          </Tabs>
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
          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-sm text-amber-800 dark:text-amber-200">
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
