import type { WorkflowEdge } from "./workflow-types";

export function outgoingEdges(nodeId: string, edges: WorkflowEdge[]): WorkflowEdge[] {
  return edges.filter((e) => e.source === nodeId);
}

export function incomingEdges(nodeId: string, edges: WorkflowEdge[]): WorkflowEdge[] {
  return edges.filter((e) => e.target === nodeId);
}
