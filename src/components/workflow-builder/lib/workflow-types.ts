import type { Edge, Node, Viewport, XYPosition } from "@xyflow/react";

export const TRIGGER_EVENTS = [
  "user_signup",
  "user_login",
  "org_created",
  "team_member_invited",
  "survey_sent",
  "review_received",
  "video_submitted",
  "trial_started",
  "trial_ending",
  "payment_failed",
  "subscription_changed",
  "user_inactive",
  "action_abandoned",
  "milestone_reached",
  "referral_created",
  "sms_received",
  "sms_opt_in",
  "sms_opt_out",
  "sms_delivered",
  "sms_failed",
  "custom_event",
] as const;

export const CONDITION_OPERATORS = [
  "equals",
  "not_equals",
  "greater_than",
  "less_than",
  "greater_than_or_equals",
  "less_than_or_equals",
  "contains",
  "not_contains",
  "is_true",
  "is_false",
  "is_null",
  "is_not_null",
  "in_list",
  "not_in_list",
] as const;

export const DELAY_UNITS = ["minutes", "hours", "days", "weeks"] as const;

export const EXIT_REASONS = [
  "activation_milestone_reached",
  "user_returned",
  "user_disabled_notifications",
  "email_unsubscribed",
  "sms_consent_revoked",
  "sms_credits_exhausted",
  "no_phone_number",
  "action_completed",
  "timeout",
  "manual_cancel",
  "sequence_replaced",
  "error",
  "custom",
] as const;

export const WINNING_METRICS = ["open_rate", "click_rate", "conversion"] as const;

export type TriggerEvent = (typeof TRIGGER_EVENTS)[number];
export type ConditionOperator = (typeof CONDITION_OPERATORS)[number];
export type DelayUnit = (typeof DELAY_UNITS)[number];
export type ExitReason = (typeof EXIT_REASONS)[number];
export type WinningMetric = (typeof WINNING_METRICS)[number];

export type WorkflowNodeType =
  | "trigger-event"
  | "trigger-time"
  | "trigger-manual"
  | "action-email"
  | "action-smart"
  | "action-survey"
  | "condition-ifelse"
  | "condition-absplit"
  | "delay-wait"
  | "control-exit";

export type NodeCategory = "triggers" | "actions" | "conditions" | "timing" | "control";
export type NodeFamily = "trigger" | "action" | "condition" | "delay" | "exit";

export interface WorkflowCondition {
  id: string;
  field: string;
  operator: ConditionOperator;
  value?: string;
}

export interface WorkflowVariant {
  id: string;
  name: string;
  weight: number;
}

export interface WorkflowNodeData {
  label?: string;
  summary?: string;
  templateName?: string;
  emailTemplateId?: string;
  surveyTemplateId?: string;
  subjectOverride?: string;
  event?: TriggerEvent;
  customEvent?: string;
  allowMultiple?: boolean;
  replaceExisting?: boolean;
  conditions?: WorkflowCondition[];
  frequency?: "daily" | "weekly" | "monthly";
  time?: string;
  daysOfWeek?: string[];
  strategy?: "prefer_email" | "best_available";
  fallbackToEmail?: boolean;
  enableAbTest?: boolean;
  abVariants?: WorkflowVariant[];
  winningMetric?: WinningMetric;
  variants?: WorkflowVariant[];
  value?: number;
  unit?: DelayUnit;
  reason?: ExitReason;
  milestone?: string;
  message?: string;
  __validationError?: string;
  __validationWarning?: string;
  [key: string]: unknown;
}

export interface WorkflowEdgeData {
  label?: string;
  branchType?: "yes" | "no" | "variant";
  [key: string]: unknown;
}

export type WorkflowNode = Node<WorkflowNodeData, WorkflowNodeType>;
export type WorkflowEdge = Edge<WorkflowEdgeData>;

export interface WorkflowSnapshot {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export interface WorkflowCanvasMetadata {
  version: number;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  viewport?: Viewport;
}

export interface ValidationIssue {
  id: string;
  message: string;
  severity: "error" | "warning";
  nodeId?: string;
  edgeId?: string;
}

export interface ValidationResult {
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  isValid: boolean;
}

export interface NewNodePayload {
  type: WorkflowNodeType;
  position: XYPosition;
}

export const EMPTY_CANVAS_METADATA: WorkflowCanvasMetadata = {
  version: 1,
  nodes: [],
  edges: [],
  viewport: { x: 0, y: 0, zoom: 1 },
};

export const NODE_FAMILY_BY_TYPE: Record<WorkflowNodeType, NodeFamily> = {
  "trigger-event": "trigger",
  "trigger-time": "trigger",
  "trigger-manual": "trigger",
  "action-email": "action",
  "action-smart": "action",
  "action-survey": "action",
  "condition-ifelse": "condition",
  "condition-absplit": "condition",
  "delay-wait": "delay",
  "control-exit": "exit",
};

export const CONNECTION_MATRIX: Record<NodeFamily, NodeFamily[]> = {
  trigger: ["action", "condition", "delay", "exit"],
  action: ["action", "condition", "delay", "exit"],
  condition: ["action", "condition", "delay", "exit"],
  delay: ["action", "condition", "exit"],
  exit: [],
};

export function isWorkflowNodeType(value: string): value is WorkflowNodeType {
  return value in NODE_FAMILY_BY_TYPE;
}

export function getNodeFamily(type: string): NodeFamily | null {
  if (!isWorkflowNodeType(type)) {
    return null;
  }

  return NODE_FAMILY_BY_TYPE[type];
}

export function toRelativeLabel(input: string): string {
  return input
    .split(/[_-]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
