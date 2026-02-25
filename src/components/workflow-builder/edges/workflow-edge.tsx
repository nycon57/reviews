"use client";

import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from "@xyflow/react";
import { X } from "@phosphor-icons/react";
import { useWorkflowState } from "../hooks/use-workflow-state";
import type { WorkflowEdgeData } from "../lib/workflow-types";

export function WorkflowEdge(props: EdgeProps) {
  const removeEdge = useWorkflowState((state) => state.removeEdge);

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    sourcePosition: props.sourcePosition,
    targetX: props.targetX,
    targetY: props.targetY,
    targetPosition: props.targetPosition,
  });

  const label = (props.data as WorkflowEdgeData | undefined)?.label;

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
            {label ? <span className="px-1 text-[10px] font-medium text-muted-foreground">{label}</span> : null}
            <button
              type="button"
              onClick={() => removeEdge(props.id)}
              className="rounded p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
              aria-label="Delete connection"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
