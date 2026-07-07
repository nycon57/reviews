import { describe, expect, it } from "vitest";
import { validateGraph } from "@/components/workflow-builder/lib/validator";
import type { WorkflowEdge, WorkflowNode } from "@/components/workflow-builder/lib/workflow-types";

function makeNode(partial: Partial<WorkflowNode> & Pick<WorkflowNode, "id" | "type">): WorkflowNode {
  return {
    id: partial.id,
    type: partial.type,
    position: partial.position || { x: 0, y: 0 },
    data: partial.data || {},
  } as WorkflowNode;
}

function makeEdge(source: string, target: string): WorkflowEdge {
  return {
    id: `${source}-${target}`,
    source,
    target,
  } as WorkflowEdge;
}

describe("validateGraph", () => {
  it("requires exactly one trigger", () => {
    const nodes: WorkflowNode[] = [
      makeNode({ id: "a1", type: "action-email" }),
      makeNode({ id: "a2", type: "action-smart" }),
    ];

    const result = validateGraph(nodes, [makeEdge("a1", "a2")]);
    expect(result.errors.some((issue) => issue.id.startsWith("trigger-count"))).toBe(true);
  });

  it("flags A/B split weight totals that are not 100", () => {
    const nodes: WorkflowNode[] = [
      makeNode({ id: "t1", type: "trigger-event", data: { event: "user_signup" } }),
      makeNode({
        id: "c1",
        type: "condition-absplit",
        data: {
          variants: [
            { id: "a", name: "A", weight: 70 },
            { id: "b", name: "B", weight: 20 },
          ],
        },
      }),
    ];

    const edges: WorkflowEdge[] = [makeEdge("t1", "c1")];
    const result = validateGraph(nodes, edges);

    expect(result.errors.some((issue) => issue.id.startsWith("ab-weight"))).toBe(true);
  });

  it("emits warnings for action nodes without templates", () => {
    const nodes: WorkflowNode[] = [
      makeNode({ id: "t1", type: "trigger-event", data: { event: "user_signup" } }),
      makeNode({ id: "a1", type: "action-email", data: {} }),
    ];

    const edges: WorkflowEdge[] = [makeEdge("t1", "a1")];
    const result = validateGraph(nodes, edges);

    expect(result.warnings.some((issue) => issue.id.startsWith("email-template"))).toBe(true);
  });
});
