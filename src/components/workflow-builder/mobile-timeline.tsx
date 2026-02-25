"use client";

import { useMemo } from "react";
import { Monitor } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import {
  getNodeConfig,
  getNodeSummary,
} from "./lib/node-registry";
import type { WorkflowEdge, WorkflowNode } from "./lib/workflow-types";

interface MobileTimelineProps {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

interface TimelineItem {
  node: WorkflowNode;
  depth: number;
}

function buildTimeline(nodes: WorkflowNode[], edges: WorkflowEdge[]): TimelineItem[] {
  if (nodes.length === 0) {
    return [];
  }

  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const trigger = nodes.find((node) => node.type?.startsWith("trigger")) || nodes[0];

  const ordered: TimelineItem[] = [];
  const visited = new Set<string>();
  const queue: Array<{ nodeId: string; depth: number }> = [{ nodeId: trigger.id, depth: 0 }];

  while (queue.length > 0) {
    const current = queue.shift() as { nodeId: string; depth: number };
    if (visited.has(current.nodeId)) {
      continue;
    }

    visited.add(current.nodeId);
    const node = nodeById.get(current.nodeId);
    if (!node) {
      continue;
    }

    ordered.push({ node, depth: current.depth });

    const outgoing = edges
      .filter((edge) => edge.source === current.nodeId)
      .map((edge) => ({ edge, target: nodeById.get(edge.target) }))
      .filter((item) => Boolean(item.target))
      .sort((left, right) => (left.target?.position.y || 0) - (right.target?.position.y || 0));

    for (const item of outgoing) {
      const isBranch = item.edge.sourceHandle === "yes" || item.edge.sourceHandle === "no" || item.edge.sourceHandle?.startsWith("variant_");
      queue.push({
        nodeId: item.edge.target,
        depth: current.depth + (isBranch ? 1 : 0),
      });
    }
  }

  const remainder = nodes
    .filter((node) => !visited.has(node.id))
    .sort((a, b) => a.position.y - b.position.y)
    .map((node) => ({ node, depth: 0 }));

  return ordered.concat(remainder);
}

export function MobileTimeline({ nodes, edges }: MobileTimelineProps) {
  const timeline = useMemo(() => buildTimeline(nodes, edges), [nodes, edges]);

  return (
    <div className="space-y-4 p-4">
      <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-amber-800">
        <div className="flex items-start gap-2">
          <Monitor className="mt-0.5 h-4 w-4" />
          <div>
            <p className="text-sm font-semibold">Switch to desktop to edit this workflow</p>
            <p className="text-xs text-amber-700">Mobile view is read-only and optimized for quick review.</p>
          </div>
        </div>
      </div>

      {timeline.length === 0 ? (
        <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          No nodes yet.
        </div>
      ) : (
        <ol className="space-y-3">
          {timeline
            .filter(({ node }) => getNodeConfig(node.type || "") !== null)
            .map(({ node, depth }, index) => {
            const config = getNodeConfig(node.type || "")!;

            const Icon = config.icon;
            const summary = getNodeSummary(node.type || "", node.data);

            return (
              <li
                key={node.id}
                className="rounded-xl border bg-card p-3"
                style={{ marginLeft: `${Math.min(depth, 3) * 16}px` }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5 rounded-md bg-muted p-1.5">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{config.label}</p>
                      <p className="text-xs text-muted-foreground">{summary}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px]">#{index + 1}</Badge>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
