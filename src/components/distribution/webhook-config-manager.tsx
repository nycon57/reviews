"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Loader2,
  Webhook,
  Copy,
  RefreshCw,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Eye,
  EyeOff,
  CheckCircle2,
} from "lucide-react";
import {
  getWebhookConfigs,
  createWebhookConfig,
  toggleWebhookConfig,
  deleteWebhookConfig,
  regenerateWebhookSecret,
  type WebhookConfig,
} from "@/lib/distribution";
import { formatDistanceToNow } from "date-fns";

export function WebhookConfigManager() {
  const [isPending, startTransition] = useTransition();
  const [configs, setConfigs] = useState<WebhookConfig[] | null>(null);
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const { toast } = useToast();
  const loadStarted = useRef(false);

  function loadConfigs(): void {
    startTransition(async () => {
      const result = await getWebhookConfigs();
      if (result.success && result.data) {
        setConfigs(result.data);
      } else {
        // Error case (including non-admin users) - show empty state
        setConfigs([]);
      }
    });
  }

  useEffect(() => {
    if (!loadStarted.current) {
      loadStarted.current = true;
      loadConfigs();
    }
  }, []);

  const isLoading = configs === null;

  function handleCreate(): void {
    if (!newName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for the webhook",
        variant: "destructive",
      });
      return;
    }

    startTransition(async () => {
      const result = await createWebhookConfig({ name: newName.trim() });
      if (result.success) {
        toast({
          title: "Webhook created",
          description: "Your new webhook endpoint has been created.",
        });
        setNewName("");
        setCreateOpen(false);
        loadConfigs();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create webhook",
          variant: "destructive",
        });
      }
    });
  }

  function handleToggle(id: string, currentActive: boolean): void {
    startTransition(async () => {
      const result = await toggleWebhookConfig(id, !currentActive);
      if (result.success) {
        const title = currentActive ? "Webhook disabled" : "Webhook enabled";
        const description = currentActive
          ? "The webhook will no longer accept requests"
          : "The webhook is now active and accepting requests";
        toast({ title, description });
        loadConfigs();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update webhook",
          variant: "destructive",
        });
      }
    });
  }

  function handleDelete(): void {
    if (!deleteId) return;

    startTransition(async () => {
      const result = await deleteWebhookConfig(deleteId);
      if (result.success) {
        toast({
          title: "Webhook deleted",
          description: "The webhook configuration has been removed.",
        });
        setDeleteId(null);
        loadConfigs();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete webhook",
          variant: "destructive",
        });
      }
    });
  }

  function handleRegenerate(id: string): void {
    startTransition(async () => {
      const result = await regenerateWebhookSecret(id);
      if (result.success) {
        toast({
          title: "Secret regenerated",
          description:
            "A new secret key has been generated. Update your integrations.",
        });
        loadConfigs();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to regenerate secret",
          variant: "destructive",
        });
      }
    });
  }

  async function copyToClipboard(text: string, id: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
      toast({
        title: "Copied",
        description: "Secret key copied to clipboard",
      });
    } catch {
      toast({
        title: "Copy failed",
        description: "Could not copy secret to clipboard",
        variant: "destructive",
      });
    }
  }

  const webhookEndpoint =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/webhooks/survey-trigger`
      : "/api/webhooks/survey-trigger";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">Webhook Configurations</h3>
          <p className="text-xs text-muted-foreground">
            Create webhook endpoints for external integrations (LOS, CRM)
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Create Webhook
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Webhook Endpoint</DialogTitle>
              <DialogDescription>
                Create a new webhook endpoint for external systems to trigger
                survey sends.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="webhookName">Webhook Name</Label>
                <Input
                  id="webhookName"
                  placeholder="e.g., Encompass LOS Integration"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <div className="rounded-md bg-muted p-3">
                <p className="text-xs font-medium">Endpoint URL</p>
                <code className="mt-1 block text-xs break-all">
                  {webhookEndpoint}
                </code>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {configs.length === 0 ? (
        <div className="rounded-lg border border-dashed p-6 text-center">
          <Webhook className="mx-auto h-8 w-8 text-muted-foreground/50" />
          <p className="mt-2 text-sm text-muted-foreground">
            No webhook configurations yet
          </p>
          <p className="text-xs text-muted-foreground">
            Create a webhook to allow external systems to trigger survey sends
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {configs.map((config) => (
            <div
              key={config.id}
              className="rounded-lg border p-4 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Webhook className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{config.name}</span>
                    <Badge variant={config.isActive ? "default" : "secondary"}>
                      {config.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Created {formatDistanceToNow(new Date(config.createdAt), { addSuffix: true })}
                    {config.triggerCount > 0 && (
                      <span className="ml-2">
                        {config.triggerCount} trigger{config.triggerCount !== 1 && "s"}
                      </span>
                    )}
                    {config.lastTriggeredAt && (
                      <span className="ml-2">
                        Last triggered {formatDistanceToNow(new Date(config.lastTriggeredAt), { addSuffix: true })}
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleToggle(config.id, config.isActive)}
                    disabled={isPending}
                  >
                    {config.isActive ? (
                      <ToggleRight className="h-4 w-4" />
                    ) : (
                      <ToggleLeft className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => setDeleteId(config.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="rounded-md bg-muted p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium">API Key (Secret)</p>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() =>
                        setShowSecret({
                          ...showSecret,
                          [config.id]: !showSecret[config.id],
                        })
                      }
                    >
                      {showSecret[config.id] ? (
                        <EyeOff className="h-3 w-3" />
                      ) : (
                        <Eye className="h-3 w-3" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => copyToClipboard(config.secretKey, config.id)}
                    >
                      {copiedId === config.id ? (
                        <CheckCircle2 className="h-3 w-3 text-green-600" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleRegenerate(config.id)}
                      disabled={isPending}
                    >
                      <RefreshCw className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <code className="block text-xs font-mono break-all">
                  {showSecret[config.id]
                    ? config.secretKey
                    : "••••••••••••••••••••••••••••••••"}
                </code>
              </div>

              <div className="text-xs text-muted-foreground">
                <p className="font-medium">Usage:</p>
                <code className="mt-1 block bg-muted rounded p-2 overflow-x-auto">
                  POST {webhookEndpoint}
                  <br />
                  Headers: x-api-key: {showSecret[config.id] ? config.secretKey : "<your-secret-key>"}
                </code>
              </div>
            </div>
          ))}
        </div>
      )}

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Webhook</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this webhook configuration? This
              action cannot be undone and any integrations using this webhook
              will stop working.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
