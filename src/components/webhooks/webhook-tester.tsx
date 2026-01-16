"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Play,
  Copy,
  CheckCircle2,
  XCircle,
  ChevronDown,
  Clock,
  Code,
  Terminal,
} from "lucide-react";
import type { WebhookConfig } from "@/lib/distribution";

interface WebhookTesterProps {
  webhookConfigs: WebhookConfig[];
}

interface TestResult {
  success: boolean;
  status?: number;
  response?: unknown;
  duration?: number;
  payload?: unknown;
  signature?: string;
  error?: string;
}

interface GeneratedPayload {
  webhookUrl: string;
  payload: unknown;
  payloadString: string;
  signature: string;
  headers: Record<string, string>;
  curlCommand: string;
  isActive: boolean;
}

export function WebhookTester({ webhookConfigs }: WebhookTesterProps) {
  const [isPending, startTransition] = useTransition();
  const [selectedConfigId, setSelectedConfigId] = useState<string>("");
  const [eventType, setEventType] = useState<string>("loan.closed");
  const [generatedPayload, setGeneratedPayload] =
    useState<GeneratedPayload | null>(null);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const [showPayload, setShowPayload] = useState(false);
  const [showCurl, setShowCurl] = useState(false);
  const { toast } = useToast();

  const activeConfigs = webhookConfigs.filter((c) => c.isActive);

  function handleGeneratePayload(): void {
    if (!selectedConfigId) {
      toast({
        title: "Select a webhook",
        description: "Please select a webhook configuration first",
        variant: "destructive",
      });
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/webhooks/test", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            webhookConfigId: selectedConfigId,
            eventType,
          }),
        });

        const data = await response.json();

        if (data.success) {
          setGeneratedPayload(data);
          setTestResult(null);
          toast({
            title: "Payload generated",
            description: "Test payload and signature have been generated",
          });
        } else {
          toast({
            title: "Error",
            description: data.error || "Failed to generate payload",
            variant: "destructive",
          });
        }
      } catch {
        toast({
          title: "Error",
          description: "Failed to generate payload",
          variant: "destructive",
        });
      }
    });
  }

  function handleRunTest(): void {
    if (!selectedConfigId) {
      toast({
        title: "Select a webhook",
        description: "Please select a webhook configuration first",
        variant: "destructive",
      });
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/webhooks/test", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            webhookConfigId: selectedConfigId,
            eventType,
          }),
        });

        const data = await response.json();
        setTestResult(data);

        if (data.success) {
          toast({
            title: "Test successful",
            description: `Webhook processed in ${data.duration}ms`,
          });
        } else {
          toast({
            title: "Test failed",
            description: data.error || "Webhook processing failed",
            variant: "destructive",
          });
        }
      } catch {
        toast({
          title: "Error",
          description: "Failed to run webhook test",
          variant: "destructive",
        });
      }
    });
  }

  function copyToClipboard(text: string, item: string): void {
    navigator.clipboard.writeText(text);
    setCopiedItem(item);
    setTimeout(() => setCopiedItem(null), 2000);
    toast({ title: "Copied", description: `${item} copied to clipboard` });
  }

  if (webhookConfigs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Webhook Tester</CardTitle>
          <CardDescription>
            Create a webhook configuration to start testing
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Webhook Tester</CardTitle>
        <CardDescription>
          Generate test payloads and send test webhooks to verify your
          integration
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Webhook Configuration</Label>
            <Select value={selectedConfigId} onValueChange={setSelectedConfigId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a webhook" />
              </SelectTrigger>
              <SelectContent>
                {webhookConfigs.map((config) => (
                  <SelectItem key={config.id} value={config.id}>
                    <div className="flex items-center gap-2">
                      <span>{config.name}</span>
                      {!config.isActive && (
                        <Badge variant="secondary" className="text-xs">
                          Inactive
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Event Type</Label>
            <Select value={eventType} onValueChange={setEventType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="loan.closed">loan.closed</SelectItem>
                <SelectItem value="contact.created">contact.created</SelectItem>
                <SelectItem value="survey.trigger">survey.trigger</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleGeneratePayload}
            disabled={isPending || !selectedConfigId}
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Code className="mr-2 h-4 w-4" />
            )}
            Generate Payload
          </Button>
          <Button
            onClick={handleRunTest}
            disabled={
              isPending ||
              !selectedConfigId ||
              !activeConfigs.some((c) => c.id === selectedConfigId)
            }
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Play className="mr-2 h-4 w-4" />
            )}
            Run Live Test
          </Button>
        </div>

        {selectedConfigId &&
          !activeConfigs.some((c) => c.id === selectedConfigId) && (
            <p className="text-sm text-amber-600">
              This webhook is inactive. Enable it to run live tests.
            </p>
          )}

        {generatedPayload && (
          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">Generated Test Data</h4>
              <Badge variant={generatedPayload.isActive ? "default" : "secondary"}>
                {generatedPayload.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Endpoint URL</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2"
                  onClick={() =>
                    copyToClipboard(generatedPayload.webhookUrl, "URL")
                  }
                >
                  {copiedItem === "URL" ? (
                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
              <code className="block rounded bg-muted p-2 text-xs break-all">
                {generatedPayload.webhookUrl}
              </code>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Signature</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2"
                  onClick={() =>
                    copyToClipboard(generatedPayload.signature, "Signature")
                  }
                >
                  {copiedItem === "Signature" ? (
                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
              <code className="block rounded bg-muted p-2 text-xs break-all font-mono">
                {generatedPayload.signature}
              </code>
            </div>

            <Collapsible open={showPayload} onOpenChange={setShowPayload}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full justify-between">
                  <span className="flex items-center">
                    <Code className="mr-2 h-4 w-4" />
                    JSON Payload
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${showPayload ? "rotate-180" : ""}`}
                  />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="relative mt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-2 h-6 px-2"
                    onClick={() =>
                      copyToClipboard(generatedPayload.payloadString, "Payload")
                    }
                  >
                    {copiedItem === "Payload" ? (
                      <CheckCircle2 className="h-3 w-3 text-green-600" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                  <Textarea
                    value={generatedPayload.payloadString}
                    readOnly
                    className="font-mono text-xs min-h-[200px]"
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Collapsible open={showCurl} onOpenChange={setShowCurl}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full justify-between">
                  <span className="flex items-center">
                    <Terminal className="mr-2 h-4 w-4" />
                    cURL Command
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${showCurl ? "rotate-180" : ""}`}
                  />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="relative mt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-2 h-6 px-2"
                    onClick={() =>
                      copyToClipboard(generatedPayload.curlCommand, "cURL")
                    }
                  >
                    {copiedItem === "cURL" ? (
                      <CheckCircle2 className="h-3 w-3 text-green-600" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                  <Textarea
                    value={generatedPayload.curlCommand}
                    readOnly
                    className="font-mono text-xs min-h-[150px]"
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}

        {testResult && (
          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center gap-2">
              {testResult.success ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <h4 className="font-medium text-sm">
                {testResult.success ? "Test Passed" : "Test Failed"}
              </h4>
              {testResult.duration !== undefined && (
                <Badge variant="outline" className="ml-auto">
                  <Clock className="mr-1 h-3 w-3" />
                  {testResult.duration}ms
                </Badge>
              )}
            </div>

            {testResult.status && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">HTTP Status:</span>
                <Badge
                  variant={testResult.status < 400 ? "default" : "destructive"}
                >
                  {testResult.status}
                </Badge>
              </div>
            )}

            {testResult.error && (
              <div className="rounded bg-red-50 p-3">
                <p className="text-sm text-red-600">
                  {testResult.error}
                </p>
              </div>
            )}

            {testResult.response !== undefined && (
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Response</Label>
                <pre className="rounded bg-muted p-3 text-xs overflow-auto max-h-[200px]">
                  {JSON.stringify(testResult.response, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
