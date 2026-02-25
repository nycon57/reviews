"use client";

import { Badge } from "@/components/ui/badge";
import { BaseNode } from "./base-node";
import { getNodeSummary } from "../lib/node-registry";
import type { WorkflowNode } from "../lib/workflow-types";
import type { NodeProps } from "@xyflow/react";

export function TriggerNode(props: NodeProps<WorkflowNode>) {
  const summary = getNodeSummary(props.type || "", props.data);

  return (
    <BaseNode
      {...props}
      body={<p className="text-xs text-muted-foreground">{summary}</p>}
      footer={
        <Badge variant="outline" className="w-fit text-[10px] uppercase tracking-wide">
          Entry Point
        </Badge>
      }
    />
  );
}
