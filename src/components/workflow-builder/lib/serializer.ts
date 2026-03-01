import type { Viewport } from "@xyflow/react";
import { incomingEdges, outgoingEdges } from "./graph-helpers";
import {
  EMPTY_CANVAS_METADATA,
  getNodeFamily,
  type WorkflowCanvasMetadata,
  type WorkflowCondition,
  type WorkflowEdge,
  type WorkflowNode,
  type WorkflowNodeData,
  type WorkflowNodeType,
  type WorkflowVariant,
} from "./workflow-types";

// ============================================================================
// Sanitization helpers
// ============================================================================

function sanitizeNodeData(data: WorkflowNodeData): Record<string, unknown> {
  const clean: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if (key.startsWith("__")) {
      continue;
    }

    clean[key] = value;
  }

  return clean;
}

function sanitizeNodes(nodes: WorkflowNode[]): WorkflowNode[] {
  return nodes.map((node) => ({
    ...node,
    data: sanitizeNodeData(node.data),
  }));
}

function sanitizeEdges(edges: WorkflowEdge[]): WorkflowEdge[] {
  return edges.map((edge) => ({
    ...edge,
    data: edge.data ? { ...edge.data } : undefined,
  }));
}

function makeNodeId(type: WorkflowNodeType): string {
  const runtimeCrypto = globalThis.crypto;
  if (runtimeCrypto?.randomUUID) {
    return `${type}-${runtimeCrypto.randomUUID()}`;
  }

  return `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function createBasicNode(type: WorkflowNodeType, position: { x: number; y: number }): WorkflowNode {
  return {
    id: makeNodeId(type),
    type,
    position,
    data: {},
  };
}

// ============================================================================
// Canvas metadata serialization
// ============================================================================

export function toCanvasMetadata(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
  viewport?: Viewport
): WorkflowCanvasMetadata {
  return {
    version: 1,
    nodes: sanitizeNodes(nodes),
    edges: sanitizeEdges(edges),
    viewport: viewport ?? EMPTY_CANVAS_METADATA.viewport,
  };
}

// ============================================================================
// Graph traversal helpers
// ============================================================================

/** Walk backward from a node to find the nearest delay node in its incoming path. */
function findUpstreamDelay(
  nodeId: string,
  nodesById: Map<string, WorkflowNode>,
  edges: WorkflowEdge[],
  visited: Set<string> = new Set()
): WorkflowNode | null {
  if (visited.has(nodeId)) return null;
  visited.add(nodeId);

  for (const edge of incomingEdges(nodeId, edges)) {
    const sourceNode = nodesById.get(edge.source);
    if (!sourceNode) continue;

    if (sourceNode.type === "delay-wait") {
      return sourceNode;
    }

    // Walk through non-action nodes (conditions, etc.) to find delay
    const family = getNodeFamily(sourceNode.type ?? "");
    if (family === "condition" || family === "delay") {
      const deeper = findUpstreamDelay(sourceNode.id, nodesById, edges, visited);
      if (deeper) return deeper;
    }
  }

  return null;
}

/** Topological sort of nodes starting from trigger. Returns node IDs in order. */
function topologicalOrder(nodes: WorkflowNode[], edges: WorkflowEdge[]): string[] {
  const triggerNode = nodes.find((n) => getNodeFamily(n.type ?? "") === "trigger");
  if (!triggerNode) {
    return nodes.map((n) => n.id);
  }

  const nodesById = new Map(nodes.map((n) => [n.id, n]));
  const visited = new Set<string>();
  const ordered: string[] = [];
  const queue: string[] = [triggerNode.id];

  while (queue.length > 0) {
    const id = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);
    ordered.push(id);

    const out = outgoingEdges(id, edges).sort((a, b) => {
      const an = nodesById.get(a.target);
      const bn = nodesById.get(b.target);
      return (an?.position.y ?? 0) - (bn?.position.y ?? 0);
    });

    for (const edge of out) {
      if (!visited.has(edge.target)) {
        queue.push(edge.target);
      }
    }
  }

  // Append unvisited nodes
  for (const n of nodes) {
    if (!visited.has(n.id)) ordered.push(n.id);
  }

  return ordered;
}

// ============================================================================
// Canvas → SequenceDefinition
// ============================================================================

function mapTriggerNodeToDefinition(node: WorkflowNode | undefined): Record<string, unknown> {
  if (!node) {
    return {
      type: "event",
      event: "custom_event",
      customEvent: "workflow_started",
      allowMultiple: false,
      replaceExisting: false,
    };
  }

  if (node.type === "trigger-time") {
    const frequency = String(node.data.frequency || "weekly");
    const time = String(node.data.time || "09:00");
    const days = Array.isArray(node.data.daysOfWeek) ? node.data.daysOfWeek.join(",") : "monday";

    return {
      type: "time",
      schedule: `${frequency}:${time}:${days}`,
      conditions: serializeConditions(node.data.conditions),
      allowMultiple: node.data.allowMultiple ?? false,
      replaceExisting: node.data.replaceExisting ?? false,
    };
  }

  if (node.type === "trigger-manual") {
    return {
      type: "manual",
      customEvent: node.data.customEvent || "manual_start",
      conditions: serializeConditions(node.data.conditions),
      allowMultiple: node.data.allowMultiple ?? true,
      replaceExisting: node.data.replaceExisting ?? false,
    };
  }

  return {
    type: "event",
    event: node.data.event || "custom_event",
    customEvent:
      node.data.event === "custom_event"
        ? node.data.customEvent || "workflow_started"
        : undefined,
    conditions: serializeConditions(node.data.conditions),
    allowMultiple: node.data.allowMultiple ?? false,
    replaceExisting: node.data.replaceExisting ?? false,
  };
}

function serializeConditions(conditions: WorkflowCondition[] | undefined): Record<string, unknown>[] {
  if (!Array.isArray(conditions) || conditions.length === 0) return [];
  return conditions.map((c) => ({
    field: c.field,
    operator: c.operator,
    value: c.value,
  }));
}

function buildStepFromActionNode(node: WorkflowNode, step: number): Record<string, unknown> {
  if (node.type === "action-sms") {
    return {
      step,
      template: { name: node.data.smsTemplateName || "sms_template" },
      delay: { value: 0, unit: "hours" },
      channelConfig: {
        channel: "sms",
        smsTemplate: { templateId: node.data.smsTemplateName || "sms_template" },
        fallbackChannel: node.data.fallbackToEmail ? "email" : undefined,
      },
      description: `Send SMS${node.data.smsTemplateName ? ` (${String(node.data.smsTemplateName)})` : ""}`,
    };
  }

  if (node.type === "action-smart") {
    return {
      step,
      template: { name: (node.data.templateName as string) || "survey_invitation" },
      delay: { value: 0, unit: "hours" },
      smartChannel: {
        strategy: node.data.strategy || "best_available",
        smsRequirements: node.data.smsRequirements || {
          requireConsent: true,
          requirePhoneNumber: true,
          respectQuietHours: true,
        },
      },
      channelConfig: {
        channel: "email",
        smsTemplate: node.data.smsTemplateName
          ? { templateId: String(node.data.smsTemplateName) }
          : undefined,
      },
      description: "Smart send action",
    };
  }

  // Default: action-email
  return {
    step,
    template: {
      name: (node.data.templateName as string) || "survey_invitation",
      subjectOverride: node.data.subjectOverride || undefined,
    },
    delay: { value: 0, unit: "hours" },
    channelConfig: { channel: "email" },
    description: `Send email${node.data.templateName ? ` (${String(node.data.templateName)})` : ""}`,
  };
}

/**
 * For a given action node, find the step number of the target node reachable
 * from a given source handle of a condition/AB-split node.
 */
function resolveTargetStepNumber(
  fromNodeId: string,
  sourceHandle: string | undefined,
  edges: WorkflowEdge[],
  nodesById: Map<string, WorkflowNode>,
  actionStepMap: Map<string, number>
): number | undefined {
  const edge = edges.find(
    (e) => e.source === fromNodeId && e.sourceHandle === sourceHandle
  );
  if (!edge) return undefined;

  // Walk forward until we hit an action node
  const visited = new Set<string>();
  const queue = [edge.target];
  while (queue.length > 0) {
    const id = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);

    const stepNum = actionStepMap.get(id);
    if (stepNum !== undefined) return stepNum;

    // Continue through delay/condition nodes
    const node = nodesById.get(id);
    if (node) {
      const family = getNodeFamily(node.type ?? "");
      if (family !== "action" && family !== "exit") {
        for (const e of outgoingEdges(id, edges)) {
          if (!visited.has(e.target)) queue.push(e.target);
        }
      }
    }
  }

  return undefined;
}

/**
 * Find which action step a condition/exit node is logically parented to
 * by walking backward through the graph.
 */
function findParentActionStep(
  nodeId: string,
  nodesById: Map<string, WorkflowNode>,
  edges: WorkflowEdge[],
  actionStepMap: Map<string, number>,
  visited: Set<string> = new Set()
): number | undefined {
  if (visited.has(nodeId)) return undefined;
  visited.add(nodeId);

  for (const edge of incomingEdges(nodeId, edges)) {
    const step = actionStepMap.get(edge.source);
    if (step !== undefined) return step;

    const sourceNode = nodesById.get(edge.source);
    if (sourceNode) {
      const family = getNodeFamily(sourceNode.type ?? "");
      if (family !== "trigger") {
        const parentStep = findParentActionStep(edge.source, nodesById, edges, actionStepMap, visited);
        if (parentStep !== undefined) return parentStep;
      }
    }
  }

  return undefined;
}

export function canvasToSequenceDefinition(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
  campaignName?: string
): Record<string, unknown> {
  const order = topologicalOrder(nodes, edges);
  const nodesById = new Map(nodes.map((n) => [n.id, n]));
  const triggerNode = nodes.find((n) => getNodeFamily(n.type ?? "") === "trigger");

  // Collect action nodes in topological order
  const actionNodes = order
    .map((id) => nodesById.get(id)!)
    .filter((n) => n && getNodeFamily(n.type ?? "") === "action");

  // Build action node ID → step number mapping
  const actionStepMap = new Map<string, number>();
  actionNodes.forEach((n, i) => actionStepMap.set(n.id, i + 1));

  // Build steps from action nodes
  const steps: Record<string, unknown>[] = actionNodes.map((node, index) => {
    const step = buildStepFromActionNode(node, index + 1);

    // Infer delay by walking backward through all incoming paths
    const delayNode = findUpstreamDelay(node.id, nodesById, edges);
    if (delayNode) {
      step.delay = {
        value: Number(delayNode.data.value ?? 0),
        unit: String(delayNode.data.unit ?? "hours"),
      };
    }

    // Attach A/B test config from the action node itself (inline AB test)
    if (node.data.enableAbTest && Array.isArray(node.data.abVariants) && node.data.abVariants.length >= 2) {
      const variants = node.data.abVariants as WorkflowVariant[];
      step.abTest = {
        testId: `step_${index + 1}_ab`,
        variants: variants.map((v) => ({
          id: v.id,
          weight: v.weight,
        })),
        winningMetric: node.data.winningMetric || "open_rate",
      };
    }

    return step;
  });

  // Process condition nodes → attach branches to parent steps
  const conditionNodes = nodes.filter((n) => n.type === "condition-ifelse");
  for (const condNode of conditionNodes) {
    const parentStep = findParentActionStep(condNode.id, nodesById, edges, actionStepMap);
    if (parentStep === undefined) continue;

    const stepObj = steps[parentStep - 1];
    if (!stepObj) continue;

    const conditions = serializeConditions(condNode.data.conditions as WorkflowCondition[] | undefined);

    const yesTarget = resolveTargetStepNumber(condNode.id, "yes", edges, nodesById, actionStepMap);
    const noTarget = resolveTargetStepNumber(condNode.id, "no", edges, nodesById, actionStepMap);

    // Check if yes/no lead to exit nodes
    const yesEdge = edges.find((e) => e.source === condNode.id && e.sourceHandle === "yes");
    const noEdge = edges.find((e) => e.source === condNode.id && e.sourceHandle === "no");
    const yesNode = yesEdge ? nodesById.get(yesEdge.target) : undefined;
    const noNode = noEdge ? nodesById.get(noEdge.target) : undefined;

    const branches: Record<string, unknown>[] = [];

    // Yes branch
    if (yesNode && getNodeFamily(yesNode.type ?? "") === "exit") {
      branches.push({
        conditions,
        action: "exit",
        exitReason: yesNode.data.reason || "custom",
      });
    } else if (yesTarget !== undefined) {
      branches.push({
        conditions,
        action: "goto_step",
        targetStep: yesTarget,
      });
    }

    // No branch (inverse of conditions)
    if (noNode && getNodeFamily(noNode.type ?? "") === "exit") {
      branches.push({
        conditions: conditions.length > 0
          ? [{ field: "__branch", operator: "equals", value: "no" }]
          : [],
        action: "exit",
        exitReason: noNode.data.reason || "custom",
      });
    } else if (noTarget !== undefined) {
      branches.push({
        conditions: conditions.length > 0
          ? [{ field: "__branch", operator: "equals", value: "no" }]
          : [],
        action: "goto_step",
        targetStep: noTarget,
      });
    }

    if (branches.length > 0) {
      stepObj.branches = branches;
    }
  }

  // Process AB split nodes → attach abTest config to parent steps
  const abSplitNodes = nodes.filter((n) => n.type === "condition-absplit");
  for (const abNode of abSplitNodes) {
    const parentStep = findParentActionStep(abNode.id, nodesById, edges, actionStepMap);
    if (parentStep === undefined) continue;

    const stepObj = steps[parentStep - 1];
    if (!stepObj) continue;

    const variants = (abNode.data.variants as WorkflowVariant[] | undefined) ?? [];
    if (variants.length >= 2) {
      stepObj.abTest = {
        testId: `absplit_${abNode.id}`,
        variants: variants.map((v, i) => {
          const target = resolveTargetStepNumber(abNode.id, `variant_${i}`, edges, nodesById, actionStepMap);
          return {
            id: v.id,
            weight: v.weight,
            targetStep: target,
          };
        }),
        winningMetric: abNode.data.winningMetric || "open_rate",
      };
    }
  }

  // Process exit nodes → collect as top-level exit conditions or attach to parent step
  const exitConditions: Record<string, unknown>[] = [];
  const exitNodes = nodes.filter((n) => n.type === "control-exit");
  for (const exitNode of exitNodes) {
    const parentStep = findParentActionStep(exitNode.id, nodesById, edges, actionStepMap);

    const exitCondition: Record<string, unknown> = {
      conditions: [],
      reason: exitNode.data.reason || "action_completed",
      milestone: exitNode.data.milestone || undefined,
      message: exitNode.data.message || undefined,
    };

    if (parentStep !== undefined) {
      const stepObj = steps[parentStep - 1];
      if (stepObj) {
        const existingExitConditions = (stepObj.exitConditions as Record<string, unknown>[]) ?? [];
        stepObj.exitConditions = [...existingExitConditions, exitCondition];
        continue;
      }
    }

    // No parent action found — add as top-level exit
    exitConditions.push(exitCondition);
  }

  return {
    type: "custom",
    name: campaignName || "Untitled Campaign",
    description: "Generated from visual workflow builder",
    triggers: [mapTriggerNodeToDefinition(triggerNode)],
    steps,
    exitConditions: exitConditions.length > 0 ? exitConditions : undefined,
    metadata: {
      generatedBy: "visual-workflow-builder",
      graph: {
        nodeCount: nodes.length,
        edgeCount: edges.length,
        nodeTypes: nodes.map((n) => n.type),
      },
    },
  };
}

// ============================================================================
// SequenceDefinition → Canvas (deserialization)
// ============================================================================

function inferActionTypeFromStep(step: Record<string, unknown>): WorkflowNodeType {
  const channelConfig = (step.channelConfig || {}) as { channel?: unknown; smsTemplate?: unknown };
  const smartChannel = (step.smartChannel || {}) as { strategy?: unknown };

  if (smartChannel.strategy) {
    return "action-smart";
  }

  if (channelConfig.channel === "sms" || channelConfig.smsTemplate) {
    return "action-sms";
  }

  return "action-email";
}

function safePosition(index: number, x = 280, yOffset = 140): { x: number; y: number } {
  return { x, y: 80 + index * yOffset };
}

function toRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function normalizeLoadedNodes(rawNodes: unknown): WorkflowNode[] {
  if (!Array.isArray(rawNodes)) {
    return [];
  }

  return rawNodes
    .map((item) => {
      const record = toRecord(item);
      const type = record.type;
      const id = String(record.id ?? "");
      if (!id || typeof type !== "string") {
        return null;
      }

      const position = toRecord(record.position);
      const x = Number(position.x ?? 0);
      const y = Number(position.y ?? 0);

      return {
        id,
        type: type as WorkflowNodeType,
        position: {
          x: Number.isFinite(x) ? x : 0,
          y: Number.isFinite(y) ? y : 0,
        },
        data: toRecord(record.data) as WorkflowNodeData,
      } as WorkflowNode;
    })
    .filter((node): node is WorkflowNode => Boolean(node));
}

function normalizeLoadedEdges(rawEdges: unknown): WorkflowEdge[] {
  if (!Array.isArray(rawEdges)) {
    return [];
  }

  return rawEdges
    .map((item) => {
      const record = toRecord(item);
      const id = String(record.id ?? "");
      const source = String(record.source ?? "");
      const target = String(record.target ?? "");
      if (!id || !source || !target) {
        return null;
      }

      return {
        id,
        source,
        target,
        type: typeof record.type === "string" ? record.type : "workflow",
        sourceHandle: typeof record.sourceHandle === "string" ? record.sourceHandle : undefined,
        targetHandle: typeof record.targetHandle === "string" ? record.targetHandle : undefined,
        animated: Boolean(record.animated),
        data: toRecord(record.data),
      } as WorkflowEdge;
    })
    .filter((edge): edge is WorkflowEdge => Boolean(edge));
}

export function sequenceDefinitionToCanvas(definition: unknown): {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
} {
  const record = toRecord(definition);
  const embeddedNodes = normalizeLoadedNodes(record.nodes);
  const embeddedEdges = normalizeLoadedEdges(record.edges);

  if (embeddedNodes.length > 0) {
    return {
      nodes: embeddedNodes,
      edges: embeddedEdges,
    };
  }

  const triggers = Array.isArray(record.triggers) ? record.triggers : [];
  const steps = Array.isArray(record.steps) ? record.steps : [];

  const nodes: WorkflowNode[] = [];
  const edges: WorkflowEdge[] = [];
  let layoutIndex = 0;

  // Build trigger node
  const triggerConfig = toRecord(triggers[0]);
  const triggerType = String(triggerConfig.type || "event");

  let triggerNodeType: WorkflowNodeType;
  if (triggerType === "time") {
    triggerNodeType = "trigger-time";
  } else if (triggerType === "manual" || triggerType === "api") {
    triggerNodeType = "trigger-manual";
  } else {
    triggerNodeType = "trigger-event";
  }

  const triggerNode = createBasicNode(triggerNodeType, safePosition(layoutIndex++));

  triggerNode.id = "trigger_1";
  triggerNode.data.event = String(triggerConfig.event || "user_signup") as WorkflowNodeData["event"];
  triggerNode.data.customEvent = String(triggerConfig.customEvent || "");

  // Restore trigger conditions
  if (Array.isArray(triggerConfig.conditions) && triggerConfig.conditions.length > 0) {
    triggerNode.data.conditions = triggerConfig.conditions.map((c: unknown) => {
      const cond = toRecord(c);
      return {
        id: `cond_${Math.random().toString(36).slice(2, 9)}`,
        field: String(cond.field ?? ""),
        operator: String(cond.operator ?? "equals"),
        value: cond.value !== undefined ? String(cond.value) : undefined,
      };
    }) as WorkflowCondition[];
  }

  // Restore trigger flags
  if (triggerConfig.allowMultiple !== undefined) {
    triggerNode.data.allowMultiple = Boolean(triggerConfig.allowMultiple);
  }
  if (triggerConfig.replaceExisting !== undefined) {
    triggerNode.data.replaceExisting = Boolean(triggerConfig.replaceExisting);
  }
  // Restore schedule data for time triggers
  if (triggerType === "time" && typeof triggerConfig.schedule === "string") {
    const parts = triggerConfig.schedule.split(":");
    if (parts.length >= 3) {
      triggerNode.data.frequency = parts[0] as WorkflowNodeData["frequency"];
      triggerNode.data.time = parts.slice(1, -1).join(":");
      triggerNode.data.daysOfWeek = parts[parts.length - 1].split(",");
    }
  }

  nodes.push(triggerNode);

  let previousNodeId = triggerNode.id;

  steps.forEach((rawStep, index) => {
    const step = toRecord(rawStep);
    const delay = toRecord(step.delay);
    const hasDelay = Number(delay.value ?? 0) > 0;

    // Create delay node if needed
    if (hasDelay) {
      const delayNode = createBasicNode("delay-wait", safePosition(layoutIndex++));
      delayNode.id = `delay_${index + 1}`;
      delayNode.data.value = Number(delay.value ?? 0);
      delayNode.data.unit = String(delay.unit || "hours") as WorkflowNodeData["unit"];
      nodes.push(delayNode);
      edges.push({
        id: `edge_${previousNodeId}_${delayNode.id}`,
        source: previousNodeId,
        target: delayNode.id,
        type: "workflow",
      });
      previousNodeId = delayNode.id;
    }

    // Create action node
    const actionType = inferActionTypeFromStep(step);
    const actionNode = createBasicNode(actionType, safePosition(layoutIndex++));
    actionNode.id = `action_${index + 1}`;

    const template = toRecord(step.template);
    const channelConfig = toRecord(step.channelConfig);

    if (actionType === "action-sms") {
      const smsTemplate = toRecord(channelConfig.smsTemplate);
      actionNode.data.smsTemplateName = String(smsTemplate.templateId || "");
      actionNode.data.fallbackToEmail = Boolean(channelConfig.fallbackChannel === "email");
    } else if (actionType === "action-smart") {
      actionNode.data.templateName = String(template.name || "");
      const smartChannel = toRecord(step.smartChannel);
      actionNode.data.strategy = smartChannel.strategy as WorkflowNodeData["strategy"];
      actionNode.data.smsRequirements = toRecord(smartChannel.smsRequirements) as WorkflowNodeData["smsRequirements"];
      actionNode.data.smsTemplateName = String(toRecord(channelConfig.smsTemplate).templateId || "");
    } else {
      actionNode.data.templateName = String(template.name || "");
      actionNode.data.subjectOverride = String(template.subjectOverride || "");
    }

    // Restore A/B test config on the action node
    const abTest = toRecord(step.abTest);
    if (Array.isArray(abTest.variants) && abTest.variants.length >= 2) {
      actionNode.data.enableAbTest = true;
      actionNode.data.abVariants = abTest.variants.map((v: unknown) => {
        const variant = toRecord(v);
        return {
          id: String(variant.id ?? `variant_${Math.random().toString(36).slice(2, 7)}`),
          name: String(variant.id ?? "Variant"),
          weight: Number(variant.weight ?? 50),
        };
      }) as WorkflowVariant[];
      actionNode.data.winningMetric = (abTest.winningMetric as WorkflowNodeData["winningMetric"]) || "open_rate";
    }

    nodes.push(actionNode);
    edges.push({
      id: `edge_${previousNodeId}_${actionNode.id}`,
      source: previousNodeId,
      target: actionNode.id,
      type: "workflow",
    });

    // Restore branches as condition nodes
    const branches = Array.isArray(step.branches) ? step.branches : [];
    if (branches.length > 0) {
      const condNode = createBasicNode("condition-ifelse", safePosition(layoutIndex++, 480));
      condNode.id = `condition_${index + 1}`;

      // Extract conditions from the first branch
      const firstBranch = toRecord(branches[0]);
      const branchConditions = Array.isArray(firstBranch.conditions) ? firstBranch.conditions : [];
      condNode.data.conditions = branchConditions
        .filter((c: unknown) => {
          const cond = toRecord(c);
          return String(cond.field ?? "") !== "__branch";
        })
        .map((c: unknown) => {
          const cond = toRecord(c);
          return {
            id: `cond_${Math.random().toString(36).slice(2, 9)}`,
            field: String(cond.field ?? ""),
            operator: String(cond.operator ?? "equals"),
            value: cond.value !== undefined ? String(cond.value) : undefined,
          };
        }) as WorkflowCondition[];

      nodes.push(condNode);
      edges.push({
        id: `edge_${actionNode.id}_${condNode.id}`,
        source: actionNode.id,
        target: condNode.id,
        type: "workflow",
      });

      // Don't chain to next action from this one — the condition does the routing
      previousNodeId = condNode.id;

      // Create exit nodes for exit branches
      for (const rawBranch of branches) {
        const branch = toRecord(rawBranch);
        const branchConds = Array.isArray(branch.conditions) ? branch.conditions : [];
        const isNoBranch = branchConds.some((c: unknown) => {
          const cond = toRecord(c);
          return cond.field === "__branch" && cond.value === "no";
        });
        const handle = isNoBranch ? "no" : "yes";

        if (branch.action === "exit") {
          const exitNode = createBasicNode("control-exit", safePosition(layoutIndex++, isNoBranch ? 600 : 360));
          exitNode.id = `exit_branch_${index + 1}_${handle}`;
          exitNode.data.reason = String(branch.exitReason || "action_completed") as WorkflowNodeData["reason"];
          nodes.push(exitNode);
          edges.push({
            id: `edge_${condNode.id}_${exitNode.id}`,
            source: condNode.id,
            sourceHandle: handle,
            target: exitNode.id,
            type: "workflow",
          });
        }
      }
    } else {
      previousNodeId = actionNode.id;
    }

    // Restore step-level exit conditions as exit nodes
    const stepExitConditions = Array.isArray(step.exitConditions) ? step.exitConditions : [];
    for (let ei = 0; ei < stepExitConditions.length; ei++) {
      const exitCond = toRecord(stepExitConditions[ei]);
      const exitNode = createBasicNode("control-exit", safePosition(layoutIndex++, 600));
      exitNode.id = `exit_step_${index + 1}_${ei}`;
      exitNode.data.reason = String(exitCond.reason || "action_completed") as WorkflowNodeData["reason"];
      exitNode.data.milestone = String(exitCond.milestone || "");
      exitNode.data.message = String(exitCond.message || "");
      nodes.push(exitNode);
      edges.push({
        id: `edge_${actionNode.id}_${exitNode.id}`,
        source: actionNode.id,
        target: exitNode.id,
        type: "workflow",
      });
    }
  });

  // Restore top-level exit conditions as exit nodes
  const topExitConditions = Array.isArray(record.exitConditions) ? record.exitConditions : [];
  for (let i = 0; i < topExitConditions.length; i++) {
    const exitCond = toRecord(topExitConditions[i]);
    const exitNode = createBasicNode("control-exit", safePosition(layoutIndex++, 600));
    exitNode.id = `exit_top_${i}`;
    exitNode.data.reason = String(exitCond.reason || "action_completed") as WorkflowNodeData["reason"];
    exitNode.data.milestone = String(exitCond.milestone || "");
    exitNode.data.message = String(exitCond.message || "");
    nodes.push(exitNode);

    // Connect to the last node if possible
    if (previousNodeId) {
      edges.push({
        id: `edge_${previousNodeId}_${exitNode.id}`,
        source: previousNodeId,
        sourceHandle: `exit_${i}`,
        target: exitNode.id,
        type: "workflow",
      });
    }
  }

  return {
    nodes,
    edges,
  };
}

// ============================================================================
// Canvas metadata parser
// ============================================================================

export function parseCanvasMetadata(input: unknown): WorkflowCanvasMetadata {
  const record = toRecord(input);
  const nodes = normalizeLoadedNodes(record.nodes);
  const edges = normalizeLoadedEdges(record.edges);
  const viewportRecord = toRecord(record.viewport);

  const viewport: Viewport = {
    x: Number(viewportRecord.x ?? 0),
    y: Number(viewportRecord.y ?? 0),
    zoom: Number(viewportRecord.zoom ?? 1),
  };

  return {
    version: Number(record.version ?? 1),
    nodes,
    edges,
    viewport,
  };
}
