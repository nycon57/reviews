"use client";

import { Badge } from "@/components/ui/badge";
import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./base-node";
import { toRelativeLabel, type WorkflowNode } from "../lib/workflow-types";

export function ExitNode(props: NodeProps<WorkflowNode>) {
  const data = props.data;
  const reason = String(data.reason || "action_completed");

  return (
    <BaseNode
      {...props}
      body={<p className="text-xs text-muted-foreground">{toRelativeLabel(reason)}</p>}
      footer={<Badge variant="destructive" className="text-[10px]">End</Badge>}
    />
  );
}
