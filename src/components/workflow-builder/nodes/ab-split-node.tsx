"use client";

import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./base-node";
import type { WorkflowNode, WorkflowVariant } from "../lib/workflow-types";

export function ABSplitNode(props: NodeProps<WorkflowNode>) {
  const data = props.data;
  const variants = (data.variants as WorkflowVariant[] | undefined) ?? [];

  return (
    <BaseNode
      {...props}
      body={
        <div className="space-y-2">
          <div className="flex h-2 overflow-hidden rounded-full bg-muted">
            {variants.map((variant) => (
              <span
                key={variant.id}
                className="h-full bg-indigo-500"
                style={{ width: `${variant.weight}%` }}
                title={`${variant.name}: ${variant.weight}%`}
              />
            ))}
          </div>
          <div className="space-y-1">
            {variants.map((variant) => (
              <p key={`label:${variant.id}`} className="text-[11px] text-muted-foreground">
                {variant.name} {variant.weight}%
              </p>
            ))}
          </div>
        </div>
      }
    />
  );
}
