"use client";

import { useState } from "react";
import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./base-node";
import { useWorkflowState } from "../hooks/use-workflow-state";
import type { WorkflowNode } from "../lib/workflow-types";

export function DelayNode(props: NodeProps<WorkflowNode>) {
  const [isEditing, setIsEditing] = useState(false);
  const updateNodeData = useWorkflowState((state) => state.updateNodeData);

  const data = props.data;
  const value = Number(data.value ?? 1);
  const unit = String(data.unit ?? "days");

  return (
    <BaseNode
      {...props}
      body={
        <div className="flex items-center gap-1 text-sm">
          <span className="text-muted-foreground">Wait</span>
          {isEditing ? (
            <input
              autoFocus
              type="number"
              min={1}
              max={999}
              value={value}
              onChange={(event) => {
                const next = Number(event.target.value || "0");
                updateNodeData(props.id, { value: Number.isFinite(next) ? next : 1 });
              }}
              onBlur={() => setIsEditing(false)}
              className="h-6 w-14 rounded border bg-background px-1 text-xs"
              aria-label="Delay value"
            />
          ) : (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="rounded bg-muted px-1.5 py-0.5 text-xs font-semibold"
            >
              {value}
            </button>
          )}
          <span className="text-muted-foreground">{unit}</span>
        </div>
      }
    />
  );
}
