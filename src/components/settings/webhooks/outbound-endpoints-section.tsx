"use client";

import { Fragment, useEffect, useRef, useState, useTransition } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  CaretDown,
  CheckCircle,
  Copy,
  Link as LinkIcon,
  Plus,
  SpinnerGap,
  Trash,
  WarningCircle,
} from "@phosphor-icons/react";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  createOutboundEndpoint,
  deleteOutboundEndpoint,
  listOutboundDeliveries,
  listOutboundEndpoints,
  toggleOutboundEndpoint,
  type OutboundWebhookDelivery,
  type OutboundWebhookEvent,
  type OutboundWebhookSubscription,
} from "./outbound-webhook-actions";

const eventOptions: Array<{ value: OutboundWebhookEvent; label: string }> = [
  { value: "review.published", label: "Review published" },
  { value: "review.negative", label: "Negative review" },
  { value: "review.responded", label: "Review responded" },
  { value: "survey.completed", label: "Survey completed" },
  { value: "contact.created", label: "Contact created" },
];

const eventLabels = Object.fromEntries(
  eventOptions.map((event) => [event.value, event.label])
) as Record<OutboundWebhookEvent, string>;

function formatDate(value: string | null): string {
  if (!value) return "Never";
  return formatDistanceToNow(new Date(value), { addSuffix: true });
}

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  if (status === "delivered" || status === "success") return "outline";
  if (status === "failed" || status === "exhausted") return "destructive";
  if (status === "pending" || status === "scheduled") return "secondary";
  return "default";
}

function validateEndpointUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.hostname === "localhost";
  } catch {
    return false;
  }
}

export function OutboundEndpointsSection() {
  const [isPending, startTransition] = useTransition();
  const [subscriptions, setSubscriptions] = useState<OutboundWebhookSubscription[] | null>(null);
  const [deliveries, setDeliveries] = useState<Record<string, OutboundWebhookDelivery[] | null>>(
    {}
  );
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [targetUrl, setTargetUrl] = useState("");
  const [description, setDescription] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<OutboundWebhookEvent[]>([
    "review.published",
  ]);
  const [createdSecret, setCreatedSecret] = useState<OutboundWebhookSubscription | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const loadStarted = useRef(false);

  function loadSubscriptions(): void {
    startTransition(async () => {
      const result = await listOutboundEndpoints();
      if (result.success && result.data) {
        setSubscriptions(result.data);
        setLoadError(null);
      } else {
        setSubscriptions([]);
        setLoadError(result.error || "Failed to load outbound endpoints");
      }
    });
  }

  useEffect(() => {
    if (!loadStarted.current) {
      loadStarted.current = true;
      loadSubscriptions();
    }
  }, []);

  function resetCreateForm(): void {
    setTargetUrl("");
    setDescription("");
    setSelectedEvents(["review.published"]);
    setCreatedSecret(null);
    setCopied(false);
  }

  function toggleEvent(event: OutboundWebhookEvent, checked: boolean): void {
    setSelectedEvents((current) => {
      if (checked) return [...new Set([...current, event])];
      return current.filter((item) => item !== event);
    });
  }

  function handleCreate(): void {
    if (!validateEndpointUrl(targetUrl.trim())) {
      toast({
        title: "Valid URL required",
        description: "Use an HTTPS endpoint, or localhost while testing.",
        variant: "destructive",
      });
      return;
    }

    if (selectedEvents.length === 0) {
      toast({
        title: "Choose at least one event",
        description: "Outbound endpoints need at least one event subscription.",
        variant: "destructive",
      });
      return;
    }

    startTransition(async () => {
      const result = await createOutboundEndpoint({
        targetUrl: targetUrl.trim(),
        events: selectedEvents,
        description: description.trim() || undefined,
      });

      if (result.success && result.data) {
        setCreatedSecret(result.data);
        toast({
          title: "Endpoint created",
          description: "Copy the signing secret before closing this dialog.",
        });
        loadSubscriptions();
      } else {
        toast({
          title: "Endpoint not created",
          description: result.error || "Failed to create outbound endpoint.",
          variant: "destructive",
        });
      }
    });
  }

  function handleToggle(subscription: OutboundWebhookSubscription): void {
    startTransition(async () => {
      const result = await toggleOutboundEndpoint(subscription.id, !subscription.isActive);

      if (result.success) {
        toast({
          title: subscription.isActive ? "Endpoint paused" : "Endpoint active",
          description: subscription.isActive
            ? "RepWell will stop sending events to this endpoint."
            : "RepWell will resume sending events to this endpoint.",
        });
        loadSubscriptions();
      } else {
        toast({
          title: "Endpoint not updated",
          description: result.error || "Failed to update outbound endpoint.",
          variant: "destructive",
        });
      }
    });
  }

  function handleDelete(): void {
    if (!deleteId) return;

    startTransition(async () => {
      const result = await deleteOutboundEndpoint(deleteId);
      if (result.success) {
        toast({
          title: "Endpoint deleted",
          description: "The outbound endpoint has been removed.",
        });
        setDeleteId(null);
        loadSubscriptions();
      } else {
        toast({
          title: "Endpoint not deleted",
          description: result.error || "Failed to delete outbound endpoint.",
          variant: "destructive",
        });
      }
    });
  }

  function toggleDeliveries(subscriptionId: string): void {
    const nextExpanded = !expanded[subscriptionId];
    setExpanded((current) => ({ ...current, [subscriptionId]: nextExpanded }));

    if (!nextExpanded || deliveries[subscriptionId] !== undefined) {
      return;
    }

    setDeliveries((current) => ({ ...current, [subscriptionId]: null }));
    startTransition(async () => {
      const result = await listOutboundDeliveries(subscriptionId);
      setDeliveries((current) => ({
        ...current,
        [subscriptionId]: result.success && result.data ? result.data : [],
      }));

      if (!result.success) {
        toast({
          title: "Deliveries not loaded",
          description: result.error || "Failed to load recent deliveries.",
          variant: "destructive",
        });
      }
    });
  }

  async function copySecret(secret: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      toast({ title: "Copied", description: "Signing secret copied." });
    } catch {
      toast({
        title: "Copy failed",
        description: "Could not copy the signing secret.",
        variant: "destructive",
      });
    }
  }

  const isLoading = subscriptions === null;

  return (
    <Card className="border-border/70">
      <CardHeader className="gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-heading-accent">
            <LinkIcon weight="duotone" className="h-5 w-5 text-repwell-teal-300" />
            Outbound endpoints
          </CardTitle>
          <CardDescription>
            Send signed RepWell events to Zapier, middleware, or your own HTTPS endpoint.
          </CardDescription>
        </div>
        <Dialog
          open={createOpen}
          onOpenChange={(open) => {
            setCreateOpen(open);
            if (!open) resetCreateForm();
          }}
        >
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add endpoint
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            {createdSecret ? (
              <>
                <DialogHeader>
                  <DialogTitle>Copy the signing secret</DialogTitle>
                  <DialogDescription>
                    This secret is shown once. Store it with the receiving service so it can verify
                    RepWell webhook signatures.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <Alert className="border-repwell-sage-100 bg-repwell-sage-100/30">
                    <CheckCircle className="h-4 w-4 text-repwell-teal-300" />
                    <AlertDescription>
                      Endpoint created for {createdSecret.events.length} event
                      {createdSecret.events.length === 1 ? "" : "s"}.
                    </AlertDescription>
                  </Alert>
                  <div className="rounded-lg border bg-muted/50 p-3">
                    <p className="text-xs font-medium text-muted-foreground">Signing secret</p>
                    <code className="mt-2 block break-all text-sm">
                      {createdSecret.secret || "Secret returned by server action"}
                    </code>
                  </div>
                </div>
                <DialogFooter>
                  {createdSecret.secret && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => copySecret(createdSecret.secret!)}
                    >
                      {copied ? (
                        <CheckCircle className="mr-2 h-4 w-4" />
                      ) : (
                        <Copy className="mr-2 h-4 w-4" />
                      )}
                      {copied ? "Copied" : "Copy secret"}
                    </Button>
                  )}
                  <Button onClick={() => setCreateOpen(false)}>Done</Button>
                </DialogFooter>
              </>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle>Add outbound endpoint</DialogTitle>
                  <DialogDescription>
                    RepWell will sign each delivery with HMAC-SHA256 and send only the events
                    selected here.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-5 py-2">
                  <div className="grid gap-2">
                    <Label htmlFor="outbound-url">Endpoint URL</Label>
                    <Input
                      id="outbound-url"
                      value={targetUrl}
                      onChange={(event) => setTargetUrl(event.target.value)}
                      placeholder="https://hooks.zapier.com/hooks/catch/..."
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="outbound-description">Description</Label>
                    <Textarea
                      id="outbound-description"
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      placeholder="Zapier review alerts"
                      rows={3}
                    />
                  </div>
                  <div className="grid gap-3">
                    <Label>Events</Label>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {eventOptions.map((event) => (
                        <label
                          key={event.value}
                          className="flex items-center gap-3 rounded-lg border border-border/70 p-3 text-sm"
                        >
                          <Checkbox
                            checked={selectedEvents.includes(event.value)}
                            onCheckedChange={(checked) =>
                              toggleEvent(event.value, checked === true)
                            }
                          />
                          <span>{event.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreate} disabled={isPending}>
                    {isPending && <SpinnerGap className="mr-2 h-4 w-4 animate-spin" />}
                    Create endpoint
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-4">
        {loadError && (
          <Alert variant="destructive">
            <WarningCircle className="h-4 w-4" />
            <AlertDescription>{loadError}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <SpinnerGap className="h-8 w-8 animate-spin text-repwell-teal-300" />
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border/70 p-8 text-center">
            <LinkIcon className="mx-auto h-9 w-9 text-repwell-teal-300/60" />
            <p className="mt-3 text-sm font-medium text-heading-accent">
              No outbound endpoints yet
            </p>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
              Add an endpoint to send review, survey, and contact events to an external workflow.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Endpoint</TableHead>
                  <TableHead>Events</TableHead>
                  <TableHead>Failures</TableHead>
                  <TableHead>Last delivery</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptions.map((subscription) => (
                  <Fragment key={subscription.id}>
                    <TableRow key={subscription.id}>
                      <TableCell className="min-w-72 align-top">
                        <p className="break-all font-medium text-heading-accent">
                          {subscription.targetUrl}
                        </p>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          <Badge variant={subscription.isActive ? "outline" : "secondary"}>
                            {subscription.isActive ? "Active" : "Inactive"}
                          </Badge>
                          <Badge variant="secondary">{subscription.source}</Badge>
                        </div>
                        {subscription.description && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {subscription.description}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="min-w-56 align-top">
                        <div className="flex flex-wrap gap-1.5">
                          {subscription.events.map((event) => (
                            <Badge
                              key={event}
                              variant="outline"
                              className="border-repwell-sage-100 text-repwell-teal-400"
                            >
                              {eventLabels[event] || event}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="align-top">
                        <Badge
                          variant={subscription.failureCount > 0 ? "destructive" : "secondary"}
                        >
                          {subscription.failureCount}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap align-top text-sm text-muted-foreground">
                        {formatDate(subscription.lastDeliveryAt)}
                      </TableCell>
                      <TableCell className="align-top">
                        <Switch
                          checked={subscription.isActive}
                          onCheckedChange={() => handleToggle(subscription)}
                          disabled={isPending}
                          aria-label={`Toggle ${subscription.targetUrl}`}
                        />
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="flex justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleDeliveries(subscription.id)}
                          >
                            <CaretDown
                              className={cn(
                                "mr-1 h-4 w-4 transition-transform",
                                expanded[subscription.id] && "rotate-180"
                              )}
                            />
                            Deliveries
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => setDeleteId(subscription.id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {expanded[subscription.id] && (
                      <TableRow key={`${subscription.id}-deliveries`}>
                        <TableCell colSpan={6} className="bg-muted/30 p-0">
                          <div className="p-4">
                            <RecentDeliveriesTable deliveries={deliveries[subscription.id]} />
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete outbound endpoint?</AlertDialogTitle>
            <AlertDialogDescription>
              RepWell will stop sending events to this endpoint. This does not delete any historical
              delivery records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete endpoint
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

function RecentDeliveriesTable({
  deliveries,
}: {
  deliveries: OutboundWebhookDelivery[] | null | undefined;
}) {
  if (deliveries === null) {
    return (
      <div className="flex items-center justify-center py-6">
        <SpinnerGap className="h-5 w-5 animate-spin text-repwell-teal-300" />
      </div>
    );
  }

  if (!deliveries || deliveries.length === 0) {
    return (
      <p className="py-4 text-sm text-muted-foreground">No recent deliveries for this endpoint.</p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Status</TableHead>
            <TableHead>Event</TableHead>
            <TableHead>Response</TableHead>
            <TableHead>Attempts</TableHead>
            <TableHead>Error</TableHead>
            <TableHead>Last attempt</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {deliveries.map((delivery) => (
            <TableRow key={delivery.id}>
              <TableCell>
                <Badge variant={statusVariant(delivery.status)}>{delivery.status}</Badge>
              </TableCell>
              <TableCell>{delivery.eventType}</TableCell>
              <TableCell>{delivery.responseStatus ?? "-"}</TableCell>
              <TableCell>
                {delivery.attemptCount}/{delivery.maxAttempts}
              </TableCell>
              <TableCell className="max-w-80 truncate">{delivery.errorMessage || "-"}</TableCell>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {formatDate(delivery.lastAttemptAt || delivery.createdAt)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
