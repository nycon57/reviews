import { incomingEdges, outgoingEdges } from "./graph-helpers";
import type {
  ValidationIssue,
  ValidationResult,
  WorkflowEdge,
  WorkflowNode,
  WorkflowVariant,
} from "./workflow-types";
import { getNodeFamily } from "./workflow-types";

const WEIGHT_EPS = 1e-6;

function makeIssueId(prefix: string, token: string): string {
  return `${prefix}:${token}`;
}

function detectCycles(nodes: WorkflowNode[], edges: WorkflowEdge[]): string[] {
  const indegree = new Map<string, number>();
  const outgoing = new Map<string, string[]>();

  for (const node of nodes) {
    indegree.set(node.id, 0);
    outgoing.set(node.id, []);
  }

  for (const edge of edges) {
    if (!indegree.has(edge.source) || !indegree.has(edge.target)) {
      continue;
    }

    outgoing.get(edge.source)?.push(edge.target);
    indegree.set(edge.target, (indegree.get(edge.target) ?? 0) + 1);
  }

  const queue: string[] = [];
  for (const [nodeId, degree] of indegree.entries()) {
    if (degree === 0) {
      queue.push(nodeId);
    }
  }

  let visited = 0;
  while (queue.length > 0) {
    const current = queue.shift() as string;
    visited += 1;

    for (const targetId of outgoing.get(current) ?? []) {
      const next = (indegree.get(targetId) ?? 1) - 1;
      indegree.set(targetId, next);
      if (next === 0) {
        queue.push(targetId);
      }
    }
  }

  if (visited === nodes.length) {
    return [];
  }

  return nodes.filter((node) => (indegree.get(node.id) ?? 0) > 0).map((node) => node.id);
}

function toNumber(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
}

export function validateGraph(nodes: WorkflowNode[], edges: WorkflowEdge[]): ValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  const triggerNodes = nodes.filter(
    (node) => getNodeFamily(node.type ?? "") === "trigger"
  );

  if (triggerNodes.length !== 1) {
    errors.push({
      id: makeIssueId("trigger-count", String(triggerNodes.length)),
      message:
        triggerNodes.length === 0
          ? "Add exactly one trigger node to start the workflow."
          : "Only one trigger node is allowed per workflow.",
      severity: "error",
      nodeId: triggerNodes[1]?.id,
    });
  }

  const triggerNode = triggerNodes[0];

  for (const node of nodes) {
    const incoming = incomingEdges(node.id, edges);
    const outgoing = outgoingEdges(node.id, edges);

    if (incoming.length === 0 && outgoing.length === 0) {
      errors.push({
        id: makeIssueId("orphan", node.id),
        message: "Node is not connected.",
        severity: "error",
        nodeId: node.id,
      });
    }

    if (node.type === "delay-wait") {
      const delayValue = toNumber(node.data?.value, 0);
      if (delayValue <= 0) {
        errors.push({
          id: makeIssueId("delay", node.id),
          message: "Delay must be greater than 0.",
          severity: "error",
          nodeId: node.id,
        });
      }
    }

    if (node.type === "condition-ifelse") {
      const hasYesEdge = outgoing.some((edge) => edge.sourceHandle === "yes");
      const hasNoEdge = outgoing.some((edge) => edge.sourceHandle === "no");
      if (!hasYesEdge) {
        errors.push({
          id: makeIssueId("if-yes", node.id),
          message: "If / Else nodes must include a Yes branch.",
          severity: "error",
          nodeId: node.id,
        });
      }
      // Bug 6: warn about orphaned (disconnected) No branch
      if (hasYesEdge && !hasNoEdge) {
        warnings.push({
          id: makeIssueId("if-no-missing", node.id),
          message: "If / Else node has no No branch connected. Users failing the condition will stop here.",
          severity: "warning",
          nodeId: node.id,
        });
      }
    }

    if (node.type === "condition-absplit") {
      const variants = (node.data?.variants as WorkflowVariant[] | undefined) ?? [];
      const totalWeight = variants.reduce((sum, variant) => sum + toNumber(variant.weight, 0), 0);
      if (variants.length < 2) {
        errors.push({
          id: makeIssueId("ab-count", node.id),
          message: "A/B split must have at least two variants.",
          severity: "error",
          nodeId: node.id,
        });
      }

      if (Math.abs(totalWeight - 100) > WEIGHT_EPS) {
        errors.push({
          id: makeIssueId("ab-weight", node.id),
          message: `A/B split weights must sum to 100 (currently ${totalWeight}).`,
          severity: "error",
          nodeId: node.id,
        });
      }

      // Bug 8: validate variant names are non-empty and unique
      const variantNames = variants.map((v) => (v.name ?? "").trim());
      const hasEmptyName = variantNames.some((name) => !name);
      if (hasEmptyName) {
        warnings.push({
          id: makeIssueId("ab-empty-name", node.id),
          message: "A/B split has variants with empty names.",
          severity: "warning",
          nodeId: node.id,
        });
      }

      const uniqueNames = new Set(variantNames.filter(Boolean));
      if (uniqueNames.size < variantNames.filter(Boolean).length) {
        warnings.push({
          id: makeIssueId("ab-duplicate-name", node.id),
          message: "A/B split has duplicate variant names.",
          severity: "warning",
          nodeId: node.id,
        });
      }
    }

    if (node.type === "action-email") {
      const template = String(node.data?.templateName ?? "").trim();
      if (!template) {
        warnings.push({
          id: makeIssueId("email-template", node.id),
          message: "Email action has no template selected.",
          severity: "warning",
          nodeId: node.id,
        });
      }
    }

    if (node.type === "action-sms") {
      const template = String(node.data?.smsTemplateName ?? "").trim();
      if (!template) {
        warnings.push({
          id: makeIssueId("sms-template", node.id),
          message: "SMS action has no template selected.",
          severity: "warning",
          nodeId: node.id,
        });
      }
    }

    if (node.type === "action-smart") {
      const emailTemplate = String(node.data?.templateName ?? "").trim();
      const smsTemplate = String(node.data?.smsTemplateName ?? "").trim();
      if (!emailTemplate && !smsTemplate) {
        warnings.push({
          id: makeIssueId("smart-template", node.id),
          message: "Smart send action should define at least one template.",
          severity: "warning",
          nodeId: node.id,
        });
      }
    }
  }

  // Bug 7: duplicate edge prevention — each source handle can have at most 1 outgoing edge
  const sourceHandleMap = new Map<string, number>();
  for (const edge of edges) {
    const key = `${edge.source}::${edge.sourceHandle ?? "default"}`;
    sourceHandleMap.set(key, (sourceHandleMap.get(key) ?? 0) + 1);
  }
  for (const [key, count] of sourceHandleMap) {
    if (count <= 1) continue;
    const [nodeId] = key.split("::");
    errors.push({
      id: makeIssueId("duplicate-edge", key),
      message: "Multiple edges from the same output. Remove duplicate connections.",
      severity: "error",
      nodeId,
    });
  }

  if (triggerNode) {
    const visited = new Set<string>();
    const queue: string[] = [triggerNode.id];

    while (queue.length > 0) {
      const current = queue.shift() as string;
      if (visited.has(current)) {
        continue;
      }

      visited.add(current);

      for (const edge of outgoingEdges(current, edges)) {
        if (!visited.has(edge.target)) {
          queue.push(edge.target);
        }
      }
    }

    for (const node of nodes) {
      if (!visited.has(node.id)) {
        errors.push({
          id: makeIssueId("unreachable", node.id),
          message: "Node cannot be reached from the trigger.",
          severity: "error",
          nodeId: node.id,
        });
      }
    }
  }

  const cycleNodes = detectCycles(nodes, edges);
  for (const nodeId of cycleNodes) {
    const family = getNodeFamily(nodes.find((node) => node.id === nodeId)?.type ?? "");
    if (family === "condition") {
      continue;
    }

    errors.push({
      id: makeIssueId("cycle", nodeId),
      message: "Cycle detected. Remove circular connections.",
      severity: "error",
      nodeId,
    });
  }

  return {
    errors,
    warnings,
    isValid: errors.length === 0,
  };
}

export function hasBlockingActivationWarnings(warnings: ValidationIssue[]): boolean {
  return warnings.some((warning) => {
    if (!warning.nodeId) return false;
    return warning.id.startsWith("email-template")
      || warning.id.startsWith("sms-template")
      || warning.id.startsWith("smart-template");
  });
}

export function isEdgeBranch(edge: WorkflowEdge): boolean {
  return Boolean(edge.data?.branchType || edge.sourceHandle === "yes" || edge.sourceHandle === "no");
}

export function getNodeValidationMessage(
  nodeId: string,
  errors: ValidationIssue[],
  warnings: ValidationIssue[]
): { error?: string; warning?: string } {
  const error = errors.find((issue) => issue.nodeId === nodeId)?.message;
  const warning = warnings.find((issue) => issue.nodeId === nodeId)?.message;

  return {
    error,
    warning,
  };
}
