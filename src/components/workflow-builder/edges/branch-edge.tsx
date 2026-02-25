"use client";

import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from "@xyflow/react";
import { X } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { useWorkflowState } from "../hooks/use-workflow-state";
import type { WorkflowEdgeData } from "../lib/workflow-types";

function getBranchStyle(branchType: string | undefined): { badgeClassName: string; label: string } {
  if (branchType === "yes") {
    return {
      badgeClassName: "bg-emerald-500/15 text-emerald-700 border-emerald-500/20",
      label: "Yes",
    };
  }

  if (branchType === "no") {
    return {
      badgeClassName: "bg-rose-500/15 text-rose-700 border-rose-500/20",
      label: "No",
    };
  }

  return {
    badgeClassName: "bg-indigo-500/15 text-indigo-700 border-indigo-500/20",
    label: "Variant",
  };
}

export function BranchEdge(props: EdgeProps) {
  const removeEdge = useWorkflowState((state) => state.removeEdge);

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    sourcePosition: props.sourcePosition,
    targetX: props.targetX,
    targetY: props.targetY,
    targetPosition: props.targetPosition,
  });

  const edgeData = props.data as WorkflowEdgeData | undefined;
  const branch = getBranchStyle(edgeData?.branchType as string | undefined);
  const label = edgeData?.label || branch.label;

  return (
    <>
      <BaseEdge
        id={props.id}
        path={edgePath}
        markerEnd={props.markerEnd}
        style={{
          stroke: "hsl(var(--primary))",
          strokeDasharray: "6 3",
          strokeWidth: 2,
        }}
      />
      <EdgeLabelRenderer>
        <div
          className="nodrag nopan absolute"
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: "all",
          }}
        >
          <div className="flex items-center gap-1 rounded-md border bg-background/95 p-1 shadow-sm">
            <span
              className={cn(
                "rounded border px-1.5 py-0.5 text-[10px] font-semibold",
                branch.badgeClassName
              )}
            >
              {label}
            </span>
            <button
              type="button"
              onClick={() => removeEdge(props.id)}
              className="rounded p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
              aria-label="Delete branch connection"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
