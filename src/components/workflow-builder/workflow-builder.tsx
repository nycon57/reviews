"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ReactFlowProvider, type ReactFlowInstance } from "@xyflow/react";
import { useToast } from "@/hooks/use-toast";
import type { CampaignStatus, CampaignWorkflow } from "@/lib/campaigns/types";
import {
  acquireLock,
  activateCampaign,
  releaseLock,
  updateCampaign,
} from "@/lib/campaigns/actions";
import { NodePalette } from "./node-palette";
import { WorkflowCanvas } from "./canvas";
import { PropertiesPanel } from "./properties-panel";
import { WorkflowToolbar } from "./toolbar";
import { MobileTimeline } from "./mobile-timeline";
import { WorkflowBuilderErrorBoundary } from "./workflow-builder-error";
import { useCanRedo, useCanUndo, useWorkflowState } from "./hooks/use-workflow-state";
import { useValidation } from "./hooks/use-validation";
import { autoLayout } from "./hooks/use-auto-layout";
import {
  canvasToSequenceDefinition,
  parseCanvasMetadata,
  sequenceDefinitionToCanvas,
  toCanvasMetadata,
} from "./lib/serializer";
import {
  getNodeValidationMessage,
  hasBlockingActivationWarnings,
} from "./lib/validator";

interface WorkflowBuilderProps {
  initialCampaign: CampaignWorkflow;
  initiallyReadOnly?: boolean;
  lockedByName?: string | null;
}

const LOCK_HEARTBEAT_MS = 5 * 60 * 1000;
const AUTOSAVE_DEBOUNCE_MS = 10_000;

function inferReadOnlyLockMessage(lockedByName: string | null): string {
  if (lockedByName) {
    return `Editing locked by ${lockedByName}`;
  }

  return "Editing locked by another teammate";
}

export function WorkflowBuilder({
  initialCampaign,
  initiallyReadOnly = false,
  lockedByName = null,
}: WorkflowBuilderProps) {
  const router = useRouter();
  const { toast } = useToast();

  const nodes = useWorkflowState((state) => state.nodes);
  const edges = useWorkflowState((state) => state.edges);
  const selectedNodeId = useWorkflowState((state) => state.selectedNodeId);
  const isDirty = useWorkflowState((state) => state.isDirty);
  const hasLoaded = useWorkflowState((state) => state.hasLoaded);
  const setDirty = useWorkflowState((state) => state.setDirty);
  const setFromSaved = useWorkflowState((state) => state.setFromSaved);
  const setNodesAndEdges = useWorkflowState((state) => state.setNodesAndEdges);
  const pushUndo = useWorkflowState((state) => state.pushUndo);
  const removeNode = useWorkflowState((state) => state.removeNode);
  const undo = useWorkflowState((state) => state.undo);
  const redo = useWorkflowState((state) => state.redo);
  const reset = useWorkflowState((state) => state.reset);

  const canUndo = useCanUndo();
  const canRedo = useCanRedo();

  const [campaignName, setCampaignName] = useState(initialCampaign.name);
  const [savedCampaignName, setSavedCampaignName] = useState(initialCampaign.name);
  const [campaignStatus, setCampaignStatus] = useState<CampaignStatus>(initialCampaign.status);
  const [isSaving, setIsSaving] = useState(false);
  const [isHydrating, setIsHydrating] = useState(true);
  const [readOnly, setReadOnly] = useState(initiallyReadOnly);
  const [lockBanner, setLockBanner] = useState<string | null>(
    initiallyReadOnly ? inferReadOnlyLockMessage(lockedByName) : null
  );
  const [isMobile, setIsMobile] = useState(false);
  const [initialViewport, setInitialViewport] = useState<{ x: number; y: number; zoom: number } | null>(
    null
  );

  const flowRef = useRef<ReactFlowInstance | null>(null);

  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedNodeId) || null,
    [nodes, selectedNodeId]
  );

  const validation = useValidation(nodes, edges);
  const hasActivationBlockingWarning = hasBlockingActivationWarnings(validation.warnings);

  const validationByNode = useMemo(() => {
    const map = new Map<string, { error?: string; warning?: string }>();

    for (const node of nodes) {
      const state = getNodeValidationMessage(node.id, validation.errors, validation.warnings);
      if (state.error || state.warning) {
        map.set(node.id, state);
      }
    }

    return map;
  }, [nodes, validation.errors, validation.warnings]);

  const hasNameChanges = campaignName.trim() !== savedCampaignName.trim();
  const hasUnsavedChanges = isDirty || hasNameChanges;

  const validationMessage =
    validation.errors[0]?.message
    || validation.warnings[0]?.message
    || "Resolve validation issues before activating.";

  const canActivate = !readOnly && validation.errors.length === 0 && !hasActivationBlockingWarning;

  const saveDraft = useCallback(
    async (options?: { silent?: boolean }) => {
      if (readOnly || isSaving) {
        return false;
      }

      const trimmedName = campaignName.trim();
      if (!trimmedName) {
        if (!options?.silent) {
          toast({
            title: "Campaign name required",
            description: "Add a campaign name before saving.",
            variant: "destructive",
          });
        }
        return false;
      }

      setIsSaving(true);

      try {
        const viewport = flowRef.current?.getViewport();
        const canvasMetadata = toCanvasMetadata(nodes, edges, viewport);
        const sequenceDefinition = canvasToSequenceDefinition(nodes, edges, trimmedName);

        const updated = await updateCampaign(initialCampaign.id, {
          name: trimmedName,
          sequenceDefinition,
          canvasMetadata: canvasMetadata as unknown as Record<string, unknown>,
        });

        setCampaignName(updated.name);
        setSavedCampaignName(updated.name);
        setCampaignStatus(updated.status);
        setFromSaved(nodes, edges);

        if (!options?.silent) {
          toast({
            title: "Draft saved",
            description: "Workflow changes were saved.",
          });
        }

        return true;
      } catch (error) {
        toast({
          title: "Save failed",
          description: error instanceof Error ? error.message : "Unable to save campaign.",
          variant: "destructive",
        });
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [
      campaignName,
      edges,
      initialCampaign.id,
      isSaving,
      nodes,
      readOnly,
      setFromSaved,
      toast,
    ]
  );

  const handleActivate = useCallback(async () => {
    if (!canActivate || isSaving) {
      return;
    }

    if (hasUnsavedChanges) {
      const saved = await saveDraft({ silent: true });
      if (!saved) {
        return;
      }
    }

    setIsSaving(true);

    try {
      const activated = await activateCampaign(initialCampaign.id);
      setCampaignStatus(activated.status);
      setSavedCampaignName(activated.name);
      setCampaignName(activated.name);
      setDirty(false);
      toast({
        title: "Campaign activated",
        description: `${activated.name} is now active.`,
      });
      router.refresh();
    } catch (error) {
      toast({
        title: "Activation failed",
        description: error instanceof Error ? error.message : "Unable to activate campaign.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }, [
    canActivate,
    hasUnsavedChanges,
    initialCampaign.id,
    isSaving,
    router,
    saveDraft,
    setDirty,
    toast,
  ]);

  const handleBack = useCallback(() => {
    if (!hasUnsavedChanges || readOnly) {
      router.push("/dashboard/campaigns");
      return;
    }

    const confirmed = window.confirm("You have unsaved changes. Leave without saving?");
    if (confirmed) {
      router.push("/dashboard/campaigns");
    }
  }, [hasUnsavedChanges, readOnly, router]);

  const handleAutoLayout = useCallback(() => {
    if (readOnly || nodes.length === 0) {
      return;
    }

    pushUndo();
    setNodesAndEdges(autoLayout(nodes, edges), edges, true);
  }, [edges, nodes, pushUndo, readOnly, setNodesAndEdges]);

  const handleZoomIn = useCallback(() => {
    flowRef.current?.zoomIn({ duration: 200 });
  }, []);

  const handleZoomOut = useCallback(() => {
    flowRef.current?.zoomOut({ duration: 200 });
  }, []);

  const handleZoomFit = useCallback(() => {
    flowRef.current?.fitView({ duration: 250, padding: 0.2 });
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 1023px)");
    const update = () => setIsMobile(mediaQuery.matches);
    update();

    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const canvasMetadata = parseCanvasMetadata(initialCampaign.canvasMetadata);
    const hydrated =
      canvasMetadata.nodes.length > 0
        ? { nodes: canvasMetadata.nodes, edges: canvasMetadata.edges }
        : sequenceDefinitionToCanvas(initialCampaign.sequenceDefinition);

    setFromSaved(hydrated.nodes, hydrated.edges);
    setCampaignName(initialCampaign.name);
    setSavedCampaignName(initialCampaign.name);
    setCampaignStatus(initialCampaign.status);
    setInitialViewport(canvasMetadata.viewport ?? null);
    setIsHydrating(false);

    return () => {
      reset();
    };
  }, [
    initialCampaign.canvasMetadata,
    initialCampaign.name,
    initialCampaign.sequenceDefinition,
    initialCampaign.status,
    reset,
    setFromSaved,
  ]);

  useEffect(() => {
    if (readOnly) {
      return;
    }

    let cancelled = false;

    const acquire = async () => {
      try {
        const lock = await acquireLock(initialCampaign.id);
        if (cancelled) return;

        if (!lock.acquired) {
          setReadOnly(true);
          setLockBanner(inferReadOnlyLockMessage(lock.lockedByName));
        } else {
          setReadOnly(false);
          setLockBanner(null);
        }
      } catch (error) {
        if (!cancelled) {
          setReadOnly(true);
          setLockBanner("Unable to acquire edit lock right now.");
          toast({
            title: "Lock unavailable",
            description: error instanceof Error ? error.message : "Try refreshing.",
            variant: "destructive",
          });
        }
      }
    };

    void acquire();

    const heartbeat = window.setInterval(() => {
      void acquire();
    }, LOCK_HEARTBEAT_MS);

    return () => {
      cancelled = true;
      window.clearInterval(heartbeat);
      void releaseLock(initialCampaign.id);
    };
  }, [initialCampaign.id, readOnly, toast]);

  useEffect(() => {
    if (readOnly || !hasUnsavedChanges || isHydrating) {
      return;
    }

    const timeout = window.setTimeout(() => {
      void saveDraft({ silent: true });
    }, AUTOSAVE_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [hasUnsavedChanges, isHydrating, readOnly, saveDraft]);

  useEffect(() => {
    if (!hasUnsavedChanges || readOnly) {
      return;
    }

    const beforeUnload = (event: unknown) => {
      const unloadEvent = event as { preventDefault: () => void; returnValue: string };
      unloadEvent.preventDefault();
      unloadEvent.returnValue = "";
    };

    const clickGuard = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor) {
        return;
      }

      if (anchor.target === "_blank" || anchor.download) {
        return;
      }

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) {
        return;
      }

      if (href === window.location.pathname || href === `${window.location.pathname}${window.location.search}`) {
        return;
      }

      const confirmed = window.confirm("You have unsaved changes. Leave this page?");
      if (!confirmed) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("click", clickGuard, true);

    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      document.removeEventListener("click", clickGuard, true);
    };
  }, [hasUnsavedChanges, readOnly]);

  useEffect(() => {
    if (isHydrating) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTextInput = target
        && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.getAttribute("contenteditable") === "true");

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        if (!readOnly) {
          void saveDraft();
        }
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (readOnly) return;
        if (event.shiftKey) {
          redo();
        } else {
          undo();
        }
        return;
      }

      if (isTextInput || readOnly || !selectedNodeId) {
        return;
      }

      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        const connected = edges.filter(
          (edge) => edge.source === selectedNodeId || edge.target === selectedNodeId
        ).length;
        if (connected > 0) {
          const confirmed = window.confirm("Remove this node and its connections?");
          if (!confirmed) return;
        }
        removeNode(selectedNodeId);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    edges,
    isHydrating,
    readOnly,
    redo,
    removeNode,
    saveDraft,
    selectedNodeId,
    undo,
  ]);

  if (isHydrating || !hasLoaded) {
    return (
      <div className="space-y-4">
        <div className="h-12 animate-pulse rounded-lg bg-muted" />
        <div className="h-[600px] animate-pulse rounded-lg border bg-muted/30" />
      </div>
    );
  }

  return (
    <ReactFlowProvider>
      <div className="overflow-hidden rounded-2xl border bg-card">
        {lockBanner ? (
          <div className="border-b bg-amber-100 px-4 py-2 text-sm font-medium text-amber-800">
            {lockBanner}
          </div>
        ) : null}

        <WorkflowToolbar
          campaignName={campaignName}
          campaignStatus={campaignStatus}
          readOnly={readOnly}
          isDirty={hasUnsavedChanges}
          isSaving={isSaving}
          canUndo={canUndo}
          canRedo={canRedo}
          canActivate={canActivate}
          validationMessage={validationMessage}
          onBack={handleBack}
          onRename={(next) => {
            setCampaignName(next);
            setDirty(true);
          }}
          onSave={() => {
            void saveDraft();
          }}
          onActivate={() => {
            void handleActivate();
          }}
          onUndo={undo}
          onRedo={redo}
          onAutoLayout={handleAutoLayout}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onZoomFit={handleZoomFit}
        />

        {isMobile ? (
          <MobileTimeline nodes={nodes} edges={edges} />
        ) : (
          <div className="grid h-[calc(100vh-16rem)] grid-cols-[auto_1fr_auto]">
            <NodePalette readOnly={readOnly} />

            <WorkflowBuilderErrorBoundary fallbackMessage="Something went wrong while rendering the workflow canvas.">
              <WorkflowCanvas
                readOnly={readOnly}
                validationByNode={validationByNode}
                onInit={(instance) => {
                  flowRef.current = instance;
                  if (initialViewport) {
                    instance.setViewport(initialViewport, { duration: 0 });
                  }
                }}
              />
            </WorkflowBuilderErrorBoundary>

            {selectedNode ? (
              <WorkflowBuilderErrorBoundary fallbackMessage="The properties panel failed to load.">
                <PropertiesPanel
                  selectedNode={selectedNode}
                  edges={edges}
                  readOnly={readOnly}
                />
              </WorkflowBuilderErrorBoundary>
            ) : (
              <aside className="w-80 border-l bg-card p-4 text-sm text-muted-foreground">
                Select a node to edit properties.
                <div className="mt-4 rounded-lg border border-dashed p-3 text-xs">
                  Validation: {validation.errors.length} error(s), {validation.warnings.length} warning(s)
                </div>
              </aside>
            )}
          </div>
        )}
      </div>
    </ReactFlowProvider>
  );
}
