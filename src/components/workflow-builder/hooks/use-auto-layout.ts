"use client";

import dagre from "@dagrejs/dagre";
import type { WorkflowEdge, WorkflowNode } from "../lib/workflow-types";

function getNodeDimensions(node: WorkflowNode): { width: number; height: number } {
  if (node.type === "condition-ifelse" || node.type === "condition-absplit") {
    return { width: 260, height: 128 };
  }

  if (node.type === "control-exit") {
    return { width: 220, height: 96 };
  }

  return { width: 240, height: 112 };
}

export function autoLayout(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
): WorkflowNode[] {
  if (nodes.length === 0) {
    return nodes;
  }

  const graph = new dagre.graphlib.Graph();
  graph.setDefaultEdgeLabel(() => ({}));
  graph.setGraph({
    rankdir: "TB",
    nodesep: 50,
    ranksep: 80,
    marginx: 24,
    marginy: 24,
  });

  for (const node of nodes) {
    const dimensions = getNodeDimensions(node);
    graph.setNode(node.id, dimensions);
  }

  for (const edge of edges) {
    graph.setEdge(edge.source, edge.target);
  }

  dagre.layout(graph);

  return nodes.map((node) => {
    const positioned = graph.node(node.id);
    const dimensions = getNodeDimensions(node);

    return {
      ...node,
      position: {
        x: positioned.x - dimensions.width / 2,
        y: positioned.y - dimensions.height / 2,
      },
      style: {
        ...(node.style || {}),
        transition: "transform 300ms ease, left 300ms ease, top 300ms ease",
      },
    };
  });
}
