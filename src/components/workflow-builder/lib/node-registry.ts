import {
  ArrowBendDownRight,
  ClipboardText,
  Clock,
  Envelope,
  GitBranch,
  Hand,
  Lightning,
  SignOut,
  Sparkle,
  Timer,
  type Icon,
} from "@phosphor-icons/react";
import { Position, type XYPosition } from "@xyflow/react";
import {
  getNodeFamily as getNodeFamilyFromType,
  toRelativeLabel,
} from "./workflow-types";
import type {
  NodeCategory,
  NodeFamily,
  WorkflowCondition,
  WorkflowNode,
  WorkflowNodeData,
  WorkflowNodeType,
  WorkflowVariant,
} from "./workflow-types";

export interface HandleConfig {
  id: string;
  position: Position;
  label?: string;
  colorClassName?: string;
}

export interface FieldDefinition {
  key: string;
  label: string;
  type:
    | "text"
    | "textarea"
    | "number"
    | "select"
    | "switch"
    | "conditions"
    | "schedule"
    | "ab-variants"
    | "exit-config"
    | "email-template-selector"
    | "survey-template-selector";
  placeholder?: string;
  description?: string;
  min?: number;
  max?: number;
  step?: number;
  options?: Array<{ label: string; value: string }>;
}

export interface NodeTypeConfig {
  type: WorkflowNodeType;
  label: string;
  description: string;
  category: NodeCategory;
  family: NodeFamily;
  icon: Icon;
  iconName: string;
  accentClassName: string;
  handles: {
    sources: HandleConfig[];
    targets: HandleConfig[];
  };
  defaultData: WorkflowNodeData;
  configFields: FieldDefinition[];
}

const DEFAULT_VARIANTS: WorkflowVariant[] = [
  { id: "variant_a", name: "Variant A", weight: 50 },
  { id: "variant_b", name: "Variant B", weight: 50 },
];

const DEFAULT_CONDITIONS: WorkflowCondition[] = [
  {
    id: "condition_1",
    field: "metadata.flag",
    operator: "equals",
    value: "true",
  },
];

export const NODE_CATEGORY_LABELS: Record<NodeCategory, string> = {
  triggers: "Triggers",
  actions: "Actions",
  conditions: "Conditions",
  timing: "Timing",
  control: "Control",
};

export const NODE_CATEGORY_ORDER: NodeCategory[] = [
  "triggers",
  "actions",
  "conditions",
  "timing",
  "control",
];

export const NODE_REGISTRY: Record<WorkflowNodeType, NodeTypeConfig> = {
  "trigger-event": {
    type: "trigger-event",
    label: "Event Trigger",
    description: "Starts a workflow when a tracked event occurs.",
    category: "triggers",
    family: "trigger",
    icon: Lightning,
    iconName: "Lightning",
    accentClassName: "bg-emerald-500",
    handles: {
      sources: [{ id: "source", position: Position.Bottom }],
      targets: [],
    },
    defaultData: {
      event: "user_signup",
      conditions: DEFAULT_CONDITIONS,
      allowMultiple: false,
      replaceExisting: false,
    },
    configFields: [
      {
        key: "event",
        label: "Event Type",
        type: "select",
        options: [
          "user_signup",
          "review_received",
          "trial_ending",
          "payment_failed",
          "user_inactive",
          "custom_event",
        ].map((value) => ({ label: toRelativeLabel(value), value })),
      },
      { key: "conditions", label: "Conditions", type: "conditions" },
      {
        key: "allowMultiple",
        label: "Allow Multiple",
        type: "switch",
        description: "Allow multiple active runs per user.",
      },
      {
        key: "replaceExisting",
        label: "Replace Existing",
        type: "switch",
        description: "Replace any in-progress workflow.",
      },
    ],
  },
  "trigger-time": {
    type: "trigger-time",
    label: "Schedule Trigger",
    description: "Starts on a recurring schedule.",
    category: "triggers",
    family: "trigger",
    icon: Clock,
    iconName: "Clock",
    accentClassName: "bg-emerald-500",
    handles: {
      sources: [{ id: "source", position: Position.Bottom }],
      targets: [],
    },
    defaultData: {
      frequency: "weekly",
      time: "09:00",
      daysOfWeek: ["monday"],
    },
    configFields: [{ key: "schedule", label: "Schedule", type: "schedule" }],
  },
  "trigger-manual": {
    type: "trigger-manual",
    label: "Manual Trigger",
    description: "Starts from a manual or API invocation.",
    category: "triggers",
    family: "trigger",
    icon: Hand,
    iconName: "Hand",
    accentClassName: "bg-emerald-500",
    handles: {
      sources: [{ id: "source", position: Position.Bottom }],
      targets: [],
    },
    defaultData: {
      customEvent: "manual_start",
      conditions: [],
      allowMultiple: true,
      replaceExisting: false,
    },
    configFields: [
      {
        key: "customEvent",
        label: "Custom Event",
        type: "text",
        placeholder: "manual_start",
      },
      { key: "conditions", label: "Conditions", type: "conditions" },
      {
        key: "allowMultiple",
        label: "Allow Multiple",
        type: "switch",
      },
      {
        key: "replaceExisting",
        label: "Replace Existing",
        type: "switch",
      },
    ],
  },
  "action-email": {
    type: "action-email",
    label: "Send Email",
    description: "Delivers an email template to the recipient.",
    category: "actions",
    family: "action",
    icon: Envelope,
    iconName: "Envelope",
    accentClassName: "bg-sky-500",
    handles: {
      targets: [{ id: "target", position: Position.Top }],
      sources: [{ id: "source", position: Position.Bottom }],
    },
    defaultData: {
      emailTemplateId: "",
      subjectOverride: "",
      enableAbTest: false,
      abVariants: DEFAULT_VARIANTS,
    },
    configFields: [
      {
        key: "emailTemplateId",
        label: "Email Template",
        type: "email-template-selector",
      },
      {
        key: "subjectOverride",
        label: "Subject Override",
        type: "text",
        placeholder: "Optional subject",
      },
      {
        key: "enableAbTest",
        label: "Enable A/B Test",
        type: "switch",
      },
      {
        key: "abVariants",
        label: "A/B Variants",
        type: "ab-variants",
      },
    ],
  },
  "action-survey": {
    type: "action-survey",
    label: "Send Survey",
    description: "Sends a survey invitation email to the recipient.",
    category: "actions",
    family: "action",
    icon: ClipboardText,
    iconName: "ClipboardText",
    accentClassName: "bg-emerald-500",
    handles: {
      targets: [{ id: "target", position: Position.Top }],
      sources: [{ id: "source", position: Position.Bottom }],
    },
    defaultData: {
      emailTemplateId: "",
      surveyTemplateId: "",
      subjectOverride: "",
      enableAbTest: false,
      abVariants: DEFAULT_VARIANTS,
    },
    configFields: [
      {
        key: "emailTemplateId",
        label: "Email Template",
        type: "email-template-selector",
      },
      {
        key: "surveyTemplateId",
        label: "Survey Template",
        type: "survey-template-selector",
      },
      {
        key: "subjectOverride",
        label: "Subject Override",
        type: "text",
        placeholder: "Optional subject",
      },
      {
        key: "enableAbTest",
        label: "Enable A/B Test",
        type: "switch",
      },
      {
        key: "abVariants",
        label: "A/B Variants",
        type: "ab-variants",
      },
    ],
  },
  "action-smart": {
    type: "action-smart",
    label: "Smart Send",
    description: "Chooses the best channel at send time.",
    category: "actions",
    family: "action",
    icon: Sparkle,
    iconName: "Sparkle",
    accentClassName: "bg-sky-500",
    handles: {
      targets: [{ id: "target", position: Position.Top }],
      sources: [{ id: "source", position: Position.Bottom }],
    },
    defaultData: {
      strategy: "best_available",
      emailTemplateId: "",
      templateName: "",
    },
    configFields: [
      {
        key: "strategy",
        label: "Strategy",
        type: "select",
        options: [
          { label: "Prefer Email", value: "prefer_email" },
          { label: "Best Available", value: "best_available" },
        ],
      },
      {
        key: "emailTemplateId",
        label: "Email Template",
        type: "email-template-selector",
      },
    ],
  },
  "condition-ifelse": {
    type: "condition-ifelse",
    label: "If / Else",
    description: "Routes flow based on condition logic.",
    category: "conditions",
    family: "condition",
    icon: GitBranch,
    iconName: "GitBranch",
    accentClassName: "bg-amber-500",
    handles: {
      targets: [{ id: "target", position: Position.Top }],
      sources: [
        {
          id: "yes",
          position: Position.Bottom,
          label: "Yes",
          colorClassName: "bg-emerald-500",
        },
        {
          id: "no",
          position: Position.Bottom,
          label: "No",
          colorClassName: "bg-rose-500",
        },
      ],
    },
    defaultData: {
      conditions: DEFAULT_CONDITIONS,
    },
    configFields: [{ key: "conditions", label: "Conditions", type: "conditions" }],
  },
  "condition-absplit": {
    type: "condition-absplit",
    label: "A/B Split",
    description: "Splits traffic across weighted variants.",
    category: "conditions",
    family: "condition",
    icon: ArrowBendDownRight,
    iconName: "ArrowBendDownRight",
    accentClassName: "bg-amber-500",
    handles: {
      targets: [{ id: "target", position: Position.Top }],
      sources: [
        {
          id: "variant_0",
          position: Position.Bottom,
          label: "A",
          colorClassName: "bg-indigo-500",
        },
        {
          id: "variant_1",
          position: Position.Bottom,
          label: "B",
          colorClassName: "bg-indigo-500",
        },
      ],
    },
    defaultData: {
      variants: DEFAULT_VARIANTS,
      winningMetric: "open_rate",
    },
    configFields: [
      {
        key: "variants",
        label: "Variants",
        type: "ab-variants",
      },
      {
        key: "winningMetric",
        label: "Winning Metric",
        type: "select",
        options: [
          { label: "Open Rate", value: "open_rate" },
          { label: "Click Rate", value: "click_rate" },
          { label: "Conversion", value: "conversion" },
        ],
      },
    ],
  },
  "delay-wait": {
    type: "delay-wait",
    label: "Wait / Delay",
    description: "Pauses before moving to the next step.",
    category: "timing",
    family: "delay",
    icon: Timer,
    iconName: "Timer",
    accentClassName: "bg-orange-500",
    handles: {
      targets: [{ id: "target", position: Position.Top }],
      sources: [{ id: "source", position: Position.Bottom }],
    },
    defaultData: {
      value: 3,
      unit: "days",
    },
    configFields: [
      {
        key: "value",
        label: "Value",
        type: "number",
        min: 1,
        max: 999,
      },
      {
        key: "unit",
        label: "Unit",
        type: "select",
        options: [
          { label: "Minutes", value: "minutes" },
          { label: "Hours", value: "hours" },
          { label: "Days", value: "days" },
          { label: "Weeks", value: "weeks" },
        ],
      },
    ],
  },
  "control-exit": {
    type: "control-exit",
    label: "Exit Workflow",
    description: "Ends the workflow run.",
    category: "control",
    family: "exit",
    icon: SignOut,
    iconName: "SignOut",
    accentClassName: "bg-rose-600",
    handles: {
      targets: [{ id: "target", position: Position.Top }],
      sources: [],
    },
    defaultData: {
      reason: "action_completed",
      milestone: "",
      message: "",
    },
    configFields: [{ key: "exit", label: "Exit Settings", type: "exit-config" }],
  },
};

export function getNodeConfig(type: string): NodeTypeConfig | null {
  if (!(type in NODE_REGISTRY)) {
    return null;
  }

  return NODE_REGISTRY[type as WorkflowNodeType];
}

export function getNodeFamily(type: string): NodeFamily | null {
  return getNodeFamilyFromType(type);
}

export function getCategoryNodeTypes(category: NodeCategory): NodeTypeConfig[] {
  return Object.values(NODE_REGISTRY).filter((config) => config.category === category);
}

function makeNodeId(type: WorkflowNodeType): string {
  const runtimeCrypto = globalThis.crypto;
  if (runtimeCrypto?.randomUUID) {
    return `${type}-${runtimeCrypto.randomUUID()}`;
  }

  return `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function getDefaultNodeData(type: WorkflowNodeType): WorkflowNodeData {
  const template = NODE_REGISTRY[type].defaultData;
  return JSON.parse(JSON.stringify(template)) as WorkflowNodeData;
}

export function createWorkflowNode(type: WorkflowNodeType, position: XYPosition): WorkflowNode {
  return {
    id: makeNodeId(type),
    type,
    position,
    data: getDefaultNodeData(type),
    draggable: true,
    selectable: true,
  };
}

function summarizeConditionList(conditions: WorkflowCondition[] | undefined): string {
  if (!conditions || conditions.length === 0) {
    return "No conditions";
  }

  const [first, ...rest] = conditions;
  const firstSummary = `${first.field || "field"} ${toRelativeLabel(first.operator)}${first.value ? ` ${first.value}` : ""}`;
  if (rest.length === 0) {
    return firstSummary;
  }

  return `${firstSummary} (+${rest.length})`;
}

export function getNodeSummary(type: string, data: WorkflowNodeData): string {
  switch (type) {
    case "trigger-event":
      return data.event ? `Event: ${toRelativeLabel(String(data.event))}` : "Choose an event";
    case "trigger-time": {
      const frequency = toRelativeLabel(String(data.frequency || "weekly"));
      const time = String(data.time || "09:00");
      return `${frequency} at ${time}`;
    }
    case "trigger-manual":
      return data.customEvent ? `Manual: ${String(data.customEvent)}` : "Manual/API start";
    case "action-email":
      return data.emailTemplateId ? "Custom email template" : "Select email template...";
    case "action-survey":
      return data.emailTemplateId || data.surveyTemplateId
        ? "Survey invitation configured"
        : "Select templates...";
    case "action-smart":
      return data.strategy ? `Strategy: ${toRelativeLabel(String(data.strategy))}` : "Choose strategy";
    case "condition-ifelse":
      return summarizeConditionList(data.conditions as WorkflowCondition[] | undefined);
    case "condition-absplit": {
      const variants = (data.variants as WorkflowVariant[] | undefined) ?? [];
      if (variants.length === 0) return "Add variants";
      return variants.map((variant) => `${variant.name} ${variant.weight}%`).join(" | ");
    }
    case "delay-wait": {
      const value = Number(data.value ?? 0);
      const unit = String(data.unit || "days");
      return `Wait ${value} ${unit}`;
    }
    case "control-exit":
      return data.reason ? toRelativeLabel(String(data.reason)) : "Set exit reason";
    default:
      return "";
  }
}

export function isTriggerType(type: string): boolean {
  return getNodeFamily(type) === "trigger";
}

export function isConditionType(type: string): boolean {
  return getNodeFamily(type) === "condition";
}

export function isExitType(type: string): boolean {
  return getNodeFamily(type) === "exit";
}

export function normalizeVariantHandles(variants: WorkflowVariant[] | undefined): HandleConfig[] {
  const safeVariants = variants && variants.length > 0 ? variants : DEFAULT_VARIANTS;

  return safeVariants.map((variant, index) => ({
    id: `variant_${index}`,
    position: Position.Bottom,
    label: `${variant.name} (${variant.weight}%)`,
    colorClassName: "bg-indigo-500",
  }));
}
