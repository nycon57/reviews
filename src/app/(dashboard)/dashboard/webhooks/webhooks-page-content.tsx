"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Settings, TestTube, Activity, Book, Building2 } from "lucide-react";
import { WebhookConfigManager } from "@/components/distribution";
import { WebhookTester } from "@/components/webhooks/webhook-tester";
import { WebhookLogsViewer } from "@/components/webhooks/webhook-logs-viewer";
import { WebhookDocumentation } from "./webhook-documentation";
import { MilestoneMappingForm } from "@/components/webhooks/milestone-mapping-form";
import { getWebhookConfigs, type WebhookConfig } from "@/lib/distribution";

export function WebhooksPageContent() {
  const [_isPending, startTransition] = useTransition();
  const [webhookConfigs, setWebhookConfigs] = useState<WebhookConfig[] | null>(null);
  const loadStarted = useRef(false);

  useEffect(() => {
    if (!loadStarted.current) {
      loadStarted.current = true;
      startTransition(async () => {
        const result = await getWebhookConfigs();
        if (result.success && result.data) {
          setWebhookConfigs(result.data);
        } else {
          setWebhookConfigs([]);
        }
      });
    }
  }, []);

  if (webhookConfigs === null) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Tabs defaultValue="configs" className="space-y-6">
      <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:grid-cols-none">
        <TabsTrigger value="configs" className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          <span className="hidden sm:inline">Configurations</span>
        </TabsTrigger>
        <TabsTrigger value="encompass" className="flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          <span className="hidden sm:inline">Encompass</span>
        </TabsTrigger>
        <TabsTrigger value="tester" className="flex items-center gap-2">
          <TestTube className="h-4 w-4" />
          <span className="hidden sm:inline">Test</span>
        </TabsTrigger>
        <TabsTrigger value="logs" className="flex items-center gap-2">
          <Activity className="h-4 w-4" />
          <span className="hidden sm:inline">Logs</span>
        </TabsTrigger>
        <TabsTrigger value="docs" className="flex items-center gap-2">
          <Book className="h-4 w-4" />
          <span className="hidden sm:inline">Docs</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="configs" className="space-y-6">
        <WebhookConfigManager />
      </TabsContent>

      <TabsContent value="encompass" className="space-y-6">
        <MilestoneMappingForm />
      </TabsContent>

      <TabsContent value="tester" className="space-y-6">
        <WebhookTester webhookConfigs={webhookConfigs} />
      </TabsContent>

      <TabsContent value="logs" className="space-y-6">
        <WebhookLogsViewer />
      </TabsContent>

      <TabsContent value="docs" className="space-y-6">
        <WebhookDocumentation />
      </TabsContent>
    </Tabs>
  );
}
