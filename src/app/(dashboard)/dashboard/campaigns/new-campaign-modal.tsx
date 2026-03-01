"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowCounterClockwise,
  CreditCard,
  Envelope,
  Hourglass,
  Plus,
  RocketLaunch,
  SpinnerGap as Loader2,
  VideoCamera,
  type Icon,
} from "@phosphor-icons/react";
import {
  Background,
  BackgroundVariant,
  Controls,
  ReactFlow,
  type Edge,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createCampaign } from "@/lib/campaigns/actions";
import type { WorkflowTemplate } from "@/lib/campaigns/types";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface NewCampaignModalProps {
  templates: WorkflowTemplate[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TEMPLATE_ICON_MAP: Record<string, Icon> = {
  Envelope,
  RocketLaunch,
  ArrowCounterClockwise,
  VideoCamera,
  Hourglass,
  CreditCard,
};

type TemplateFilter = "all" | "review" | "onboarding" | "retention" | "payment";

const CATEGORY_LABELS: Record<WorkflowTemplate["category"], string> = {
  review_collection: "Review",
  onboarding: "Onboarding",
  retention: "Retention",
  win_back: "Win-back",
  testimonial: "Testimonial",
  payment: "Payment",
};

function getTemplateIcon(iconName: string): Icon {
  return TEMPLATE_ICON_MAP[iconName] ?? Envelope;
}

function toRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function toNodeList(value: unknown): Node[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      const record = toRecord(item);
      const id = String(record.id ?? "");
      const type = String(record.type ?? "default");
      if (!id) return null;

      const position = toRecord(record.position);
      return {
        id,
        type,
        position: {
          x: Number(position.x ?? 0),
          y: Number(position.y ?? 0),
        },
        data: toRecord(record.data),
      } as Node;
    })
    .filter((node): node is Node => Boolean(node));
}

function toEdgeList(value: unknown): Edge[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      const record = toRecord(item);
      const id = String(record.id ?? "");
      const source = String(record.source ?? "");
      const target = String(record.target ?? "");
      if (!id || !source || !target) return null;
      return {
        id,
        source,
        target,
      } as Edge;
    })
    .filter((edge): edge is Edge => Boolean(edge));
}

function estimateDuration(definition: Record<string, unknown>): string {
  const steps = Array.isArray(definition.steps) ? definition.steps : [];

  let hours = 0;
  for (const step of steps) {
    const record = toRecord(step);
    const delay = toRecord(record.delay);
    const value = Number(delay.value ?? 0);
    const unit = String(delay.unit || "hours");

    if (unit === "weeks") hours += value * 24 * 7;
    else if (unit === "days") hours += value * 24;
    else if (unit === "hours") hours += value;
    else if (unit === "minutes") hours += value / 60;
  }

  if (hours === 0) {
    return "0h";
  }

  if (hours <= 24) {
    return `~${Math.max(1, Math.round(hours))}h`;
  }

  return `~${Math.max(1, Math.round(hours / 24))}d`;
}

function matchesFilter(template: WorkflowTemplate, filter: TemplateFilter): boolean {
  if (filter === "all") return true;
  if (filter === "review") {
    return template.category === "review_collection" || template.category === "testimonial";
  }
  if (filter === "onboarding") {
    return template.category === "onboarding";
  }
  if (filter === "retention") {
    return template.category === "retention" || template.category === "win_back";
  }
  return template.category === "payment";
}

function TemplatePreview({ template }: { template: WorkflowTemplate | null }) {
  if (!template) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
        Select a template to preview
      </div>
    );
  }

  const canvas = toRecord(template.canvasMetadata);
  const nodes = toNodeList(canvas.nodes);
  const edges = toEdgeList(canvas.edges);

  if (nodes.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
        Template has no preview canvas
      </div>
    );
  }

  return (
    <div className="h-64 overflow-hidden rounded-lg border">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={18} size={1.2} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}

export function NewCampaignModal({
  templates,
  open,
  onOpenChange,
}: NewCampaignModalProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [filter, setFilter] = useState<TemplateFilter>("all");
  const [previewTemplateId, setPreviewTemplateId] = useState<string | null>(templates[0]?.id ?? null);

  const filteredTemplates = useMemo(
    () => templates.filter((template) => matchesFilter(template, filter)),
    [filter, templates]
  );

  const previewTemplate = useMemo(
    () => templates.find((template) => template.id === previewTemplateId) || null,
    [previewTemplateId, templates]
  );

  const handleTemplateSelect = (template: WorkflowTemplate) => {
    startTransition(async () => {
      try {
        const campaign = await createCampaign({
          name: template.name,
          templateId: template.id,
        });

        onOpenChange(false);
        router.push(`/dashboard/campaigns/${campaign.id}`);
        router.refresh();
      } catch (error) {
        toast({
          title: "Campaign creation failed",
          description:
            error instanceof Error ? error.message : "Please try again.",
          variant: "destructive",
        });
      }
    });
  };

  const handleBlankCanvas = () => {
    startTransition(async () => {
      try {
        const campaign = await createCampaign({ name: "Untitled Campaign" });

        onOpenChange(false);
        router.push(`/dashboard/campaigns/${campaign.id}`);
        router.refresh();
      } catch (error) {
        toast({
          title: "Campaign creation failed",
          description:
            error instanceof Error ? error.message : "Please try again.",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl">
        <DialogHeader>
          <DialogTitle>Create New Campaign</DialogTitle>
          <DialogDescription>
            Pick a ready-made workflow template or start from a blank canvas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Tabs value={filter} onValueChange={(value) => setFilter(value as TemplateFilter)}>
            <TabsList variant="pills" className="h-auto flex-wrap justify-start">
              <TabsTrigger value="all" variant="pills" className="text-xs">All</TabsTrigger>
              <TabsTrigger value="review" variant="pills" className="text-xs">Review</TabsTrigger>
              <TabsTrigger value="onboarding" variant="pills" className="text-xs">Onboarding</TabsTrigger>
              <TabsTrigger value="retention" variant="pills" className="text-xs">Retention</TabsTrigger>
              <TabsTrigger value="payment" variant="pills" className="text-xs">Payment</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
            <div className="space-y-3">
              <button
                type="button"
                className={cn(
                  "flex w-full items-center justify-between rounded-xl border border-dashed border-repwell-teal-300/60 p-4 text-left transition",
                  "hover:border-repwell-teal-300 hover:bg-repwell-sage-50",
                  isPending && "cursor-not-allowed opacity-60"
                )}
                onClick={handleBlankCanvas}
                disabled={isPending}
              >
                <div>
                  <p className="font-medium">Blank Canvas</p>
                  <p className="text-sm text-muted-foreground">
                    Start with an empty workflow and build from scratch.
                  </p>
                </div>
                {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
              </button>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                {filteredTemplates.map((template) => {
                  const TemplateIcon = getTemplateIcon(template.iconName);
                  const metadata = toRecord(template.canvasMetadata);
                  const nodeCount = toNodeList(metadata.nodes).length;
                  const duration = estimateDuration(template.sequenceDefinition);
                  const selected = previewTemplateId === template.id;

                  return (
                    <button
                      key={template.id}
                      type="button"
                      className={cn(
                        "flex h-full flex-col items-start gap-3 rounded-xl border p-4 text-left transition",
                        "hover:border-repwell-teal-300 hover:shadow-sm",
                        selected && "border-repwell-teal-300 ring-1 ring-repwell-teal-300/30",
                        isPending && "cursor-not-allowed opacity-60"
                      )}
                      onClick={() => setPreviewTemplateId(template.id)}
                      disabled={isPending}
                    >
                      <div className="flex w-full items-center justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <TemplateIcon className="h-5 w-5" />
                        </div>
                        <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                          {CATEGORY_LABELS[template.category]}
                        </Badge>
                      </div>

                      <div className="space-y-1">
                        <p className="text-sm font-semibold">{template.name}</p>
                        <p className="line-clamp-2 text-xs text-muted-foreground">
                          {template.description || "System campaign template"}
                        </p>
                      </div>

                      <p className="text-[11px] text-muted-foreground">
                        {nodeCount || 0} nodes, {duration} sequence
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3 rounded-xl border bg-muted/20 p-3">
              <p className="text-sm font-semibold">Template Preview</p>
              <TemplatePreview template={previewTemplate} />
              {previewTemplate ? (
                <>
                  <div>
                    <p className="text-sm font-semibold">{previewTemplate.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {previewTemplate.description || "System template"}
                    </p>
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => handleTemplateSelect(previewTemplate)}
                    disabled={isPending}
                  >
                    {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Use This Template
                  </Button>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
