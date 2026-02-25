"use client";

import { Badge } from "@/components/ui/badge";
import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./base-node";
import { getNodeSummary } from "../lib/node-registry";
import type { WorkflowNode } from "../lib/workflow-types";

export function ConditionNode(props: NodeProps<WorkflowNode>) {
  const summary = getNodeSummary(props.type || "", props.data);

  return (
    <BaseNode
      {...props}
      body={<p className="text-xs text-muted-foreground">{summary}</p>}
      footer={
        <div className="flex flex-wrap gap-1">
          {props.type === "condition-ifelse" ? (
            <>
              <Badge variant="success" className="text-[10px]">Yes</Badge>
              <Badge variant="destructive" className="text-[10px]">No</Badge>
            </>
          ) : (
            <Badge variant="outline" className="text-[10px]">Weighted Branches</Badge>
          )}
        </div>
      }
    />
  );
}
