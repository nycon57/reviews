import type { Viewport } from "@xyflow/react";
import {
  EMPTY_CANVAS_METADATA,
  getNodeFamily,
  type WorkflowCanvasMetadata,
  type WorkflowEdge,
  type WorkflowNode,
  type WorkflowNodeData,
  type WorkflowNodeType,
} from "./workflow-types";

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
      conditions: node.data.conditions ?? [],
      allowMultiple: node.data.allowMultiple ?? false,
      replaceExisting: node.data.replaceExisting ?? false,
    };
  }

  if (node.type === "trigger-manual") {
    return {
      type: "manual",
      customEvent: node.data.customEvent || "manual_start",
      conditions: node.data.conditions ?? [],
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
    conditions: node.data.conditions ?? [],
    allowMultiple: node.data.allowMultiple ?? false,
    replaceExisting: node.data.replaceExisting ?? false,
  };
}

function collectLinearNodeOrder(nodes: WorkflowNode[], edges: WorkflowEdge[]): WorkflowNode[] {
  const triggerNode = nodes.find((node) => getNodeFamily(node.type ?? "") === "trigger");
  if (!triggerNode) {
    return [...nodes].sort((a, b) => a.position.y - b.position.y);
  }

  const mapById = new Map(nodes.map((node) => [node.id, node]));
  const visited = new Set<string>();
  const ordered: WorkflowNode[] = [];
  const queue: string[] = [triggerNode.id];

  while (queue.length > 0) {
    const nodeId = queue.shift() as string;
    if (visited.has(nodeId)) {
      continue;
    }

    visited.add(nodeId);
    const node = mapById.get(nodeId);
    if (node) {
      ordered.push(node);
    }

    const outgoing = edges
      .filter((edge) => edge.source === nodeId)
      .sort((left, right) => {
        const leftNode = mapById.get(left.target);
        const rightNode = mapById.get(right.target);
        return (leftNode?.position.y ?? 0) - (rightNode?.position.y ?? 0);
      });

    for (const edge of outgoing) {
      if (!visited.has(edge.target)) {
        queue.push(edge.target);
      }
    }
  }

  const remainder = nodes
    .filter((node) => !visited.has(node.id))
    .sort((a, b) => a.position.y - b.position.y);

  return ordered.concat(remainder);
}

function buildStepFromActionNode(node: WorkflowNode, step: number): Record<string, unknown> {
  if (node.type === "action-sms") {
    return {
      step,
      template: { name: "survey_invitation" },
      delay: { value: 0, unit: "hours" },
      channelConfig: {
        channel: "sms",
        smsTemplate: { templateId: node.data.smsTemplateName || "sms_template" },
        fallbackChannel: node.data.fallbackToEmail ? "email" : undefined,
      },
      description: `Send SMS ${node.data.smsTemplateName ? `(${String(node.data.smsTemplateName)})` : ""}`,
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

  return {
    step,
    template: {
      name: (node.data.templateName as string) || "survey_invitation",
      subjectOverride: node.data.subjectOverride || undefined,
    },
    delay: { value: 0, unit: "hours" },
    description: `Send email ${node.data.templateName ? `(${String(node.data.templateName)})` : ""}`,
  };
}

function inferDelayForActionNode(
  node: WorkflowNode,
  nodesById: Map<string, WorkflowNode>,
  edges: WorkflowEdge[]
): { value: number; unit: string } {
  const incoming = edges.find((edge) => edge.target === node.id);
  if (!incoming) {
    return { value: 0, unit: "hours" };
  }

  const sourceNode = nodesById.get(incoming.source);
  if (!sourceNode || sourceNode.type !== "delay-wait") {
    return { value: 0, unit: "hours" };
  }

  return {
    value: Number(sourceNode.data.value ?? 0),
    unit: String(sourceNode.data.unit ?? "hours"),
  };
}

export function canvasToSequenceDefinition(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
  campaignName?: string
): Record<string, unknown> {
  const orderedNodes = collectLinearNodeOrder(nodes, edges);
  const nodesById = new Map(nodes.map((node) => [node.id, node]));
  const triggerNode = orderedNodes.find((node) => getNodeFamily(node.type ?? "") === "trigger");

  const actionNodes = orderedNodes.filter((node) => {
    const family = getNodeFamily(node.type ?? "");
    return family === "action";
  });

  const steps = actionNodes.map((node, index) => {
    const step = buildStepFromActionNode(node, index + 1);
    step.delay = inferDelayForActionNode(node, nodesById, edges);
    return step;
  });

  return {
    type: "custom",
    name: campaignName || "Untitled Campaign",
    description: "Generated from visual workflow builder",
    triggers: [mapTriggerNodeToDefinition(triggerNode)],
    steps,
    metadata: {
      generatedBy: "visual-workflow-builder",
      graph: {
        nodeCount: nodes.length,
        edgeCount: edges.length,
        nodeTypes: nodes.map((node) => node.type),
      },
    },
  };
}

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

  const triggerConfig = toRecord(triggers[0]);
  const triggerType = String(triggerConfig.type || "event");
  const triggerNode = createBasicNode(
    triggerType === "time"
      ? "trigger-time"
      : triggerType === "manual" || triggerType === "api"
        ? "trigger-manual"
        : "trigger-event",
    safePosition(0)
  );

  triggerNode.id = "trigger_1";
  triggerNode.data.event = String(triggerConfig.event || "user_signup") as WorkflowNodeData["event"];
  triggerNode.data.customEvent = String(triggerConfig.customEvent || "");
  nodes.push(triggerNode);

  let previousNodeId = triggerNode.id;

  steps.forEach((rawStep, index) => {
    const step = toRecord(rawStep);
    const delay = toRecord(step.delay);
    const hasDelay = Number(delay.value ?? 0) > 0;

    if (hasDelay) {
      const delayNode = createBasicNode("delay-wait", safePosition(index * 2 + 1));
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

    const actionType = inferActionTypeFromStep(step);
    const actionNode = createBasicNode(actionType, safePosition(index * 2 + (hasDelay ? 2 : 1)));
    actionNode.id = `action_${index + 1}`;

    const template = toRecord(step.template);
    const channelConfig = toRecord(step.channelConfig);
    if (actionType === "action-sms") {
      const smsTemplate = toRecord(channelConfig.smsTemplate);
      actionNode.data.smsTemplateName = String(smsTemplate.templateId || "");
      actionNode.data.fallbackToEmail = Boolean(channelConfig.fallbackChannel === "email");
    } else {
      actionNode.data.templateName = String(template.name || "");
      actionNode.data.subjectOverride = String(template.subjectOverride || "");
    }

    nodes.push(actionNode);
    edges.push({
      id: `edge_${previousNodeId}_${actionNode.id}`,
      source: previousNodeId,
      target: actionNode.id,
      type: "workflow",
    });

    previousNodeId = actionNode.id;
  });

  return {
    nodes,
    edges,
  };
}

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
