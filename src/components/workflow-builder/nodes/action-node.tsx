"use client";

import { Badge } from "@/components/ui/badge";
import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./base-node";
import { getNodeSummary } from "../lib/node-registry";
import type { WorkflowNode } from "../lib/workflow-types";

export function ActionNode(props: NodeProps<WorkflowNode>) {
  const summary = getNodeSummary(props.type || "", props.data);

  return (
    <BaseNode
      {...props}
      body={<p className="text-xs text-muted-foreground">{summary}</p>}
      footer={
        props.type === "action-smart" ? (
          <Badge variant="secondary" className="w-fit text-[10px] uppercase tracking-wide">
            Smart Routing
          </Badge>
        ) : null
      }
    />
  );
}
