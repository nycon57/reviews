"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import {
  Minus,
  Plus,
  Trash,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { EmailTemplatePicker } from "@/components/email-builder/email-template-picker";
import { getActiveTemplatesForSend } from "@/lib/distribution/actions";
import {
  CONDITION_OPERATORS,
  EXIT_REASONS,
  WINNING_METRICS,
  type ConditionOperator,
  type WorkflowCondition,
  type WorkflowEdge,
  type WorkflowNode,
  type WorkflowVariant,
} from "./lib/workflow-types";
import { getNodeConfig, getNodeSummary } from "./lib/node-registry";
import { useWorkflowState } from "./hooks/use-workflow-state";

interface PropertiesPanelProps {
  selectedNode: WorkflowNode | null;
  edges: WorkflowEdge[];
  readOnly?: boolean;
}

const DAY_OPTIONS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

function createCondition(): WorkflowCondition {
  return {
    id: `condition_${Math.random().toString(36).slice(2, 8)}`,
    field: "metadata.field",
    operator: "equals",
    value: "",
  };
}

function createVariant(index: number): WorkflowVariant {
  return {
    id: `variant_${Math.random().toString(36).slice(2, 8)}`,
    name: `Variant ${String.fromCharCode(65 + index)}`,
    weight: 50,
  };
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function updateWeightDistribution(variants: WorkflowVariant[]): WorkflowVariant[] {
  if (variants.length === 0) {
    return variants;
  }

  const total = variants.reduce((sum, variant) => sum + Number(variant.weight || 0), 0);
  if (total === 100) {
    return variants;
  }

  const evenWeight = Math.floor(100 / variants.length);
  const remainder = 100 - evenWeight * variants.length;

  return variants.map((variant, index) => ({
    ...variant,
    weight: evenWeight + (index === 0 ? remainder : 0),
  }));
}

export function PropertiesPanel({
  selectedNode,
  edges,
  readOnly = false,
}: PropertiesPanelProps) {
  const updateNodeData = useWorkflowState((state) => state.updateNodeData);
  const removeNode = useWorkflowState((state) => state.removeNode);
  const selectNode = useWorkflowState((state) => state.selectNode);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const config = selectedNode ? getNodeConfig(selectedNode.type || "") : null;

  const connectedEdgeCount = useMemo(() => {
    if (!selectedNode) {
      return 0;
    }

    return edges.filter(
      (edge) => edge.source === selectedNode.id || edge.target === selectedNode.id
    ).length;
  }, [edges, selectedNode]);

  // Persist default variants if the node data has empty arrays
  useEffect(() => {
    if (readOnly || !selectedNode || !config) return;

    const variantFields = config.configFields.filter((f) => f.type === "ab-variants");
    for (const field of variantFields) {
      const source = (selectedNode.data[field.key] as WorkflowVariant[] | undefined) ?? [];
      if (source.length === 0) {
        const defaults = updateWeightDistribution([createVariant(0), createVariant(1)]);
        updateNodeData(selectedNode.id, { [field.key]: defaults });
      }
    }
  }, [selectedNode?.id, readOnly, config, updateNodeData, selectedNode]);

  if (!selectedNode || !config) {
    return null;
  }

  const updateData = (patch: Record<string, unknown>) => {
    updateNodeData(selectedNode.id, patch);
  };

  const conditions = (selectedNode.data.conditions as WorkflowCondition[] | undefined) ?? [];
  const variants = (selectedNode.data.variants as WorkflowVariant[] | undefined) ?? [];
  const abVariants = (selectedNode.data.abVariants as WorkflowVariant[] | undefined) ?? [];

  const summary = getNodeSummary(selectedNode.type || "", selectedNode.data);

  const handleDelete = () => {
    if (connectedEdgeCount > 0) {
      setConfirmDeleteOpen(true);
      return;
    }

    removeNode(selectedNode.id);
    selectNode(null);
  };

  return (
    <aside className="w-80 border-l bg-card">
      <div className="flex h-14 items-center justify-between border-b px-4">
        <div>
          <p className="text-sm font-semibold">{config.label}</p>
          <p className="text-xs text-muted-foreground">{summary}</p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="gap-1"
          onClick={handleDelete}
          disabled={readOnly}
        >
          <Trash className="h-3.5 w-3.5" />
          Delete
        </Button>
      </div>

      <div className="h-[calc(100%-3.5rem)] space-y-5 overflow-y-auto p-4">
        {config.configFields.map((field) => {
          if (field.type === "text") {
            return (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={`${selectedNode.id}:${field.key}`}>{field.label}</Label>
                <Input
                  id={`${selectedNode.id}:${field.key}`}
                  value={String(selectedNode.data[field.key] ?? "")}
                  onChange={(event) => updateData({ [field.key]: event.target.value })}
                  placeholder={field.placeholder}
                  disabled={readOnly}
                />
              </div>
            );
          }

          if (field.type === "textarea") {
            return (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={`${selectedNode.id}:${field.key}`}>{field.label}</Label>
                <Textarea
                  id={`${selectedNode.id}:${field.key}`}
                  value={String(selectedNode.data[field.key] ?? "")}
                  onChange={(event) => updateData({ [field.key]: event.target.value })}
                  placeholder={field.placeholder}
                  disabled={readOnly}
                />
              </div>
            );
          }

          if (field.type === "number") {
            return (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={`${selectedNode.id}:${field.key}`}>{field.label}</Label>
                <Input
                  id={`${selectedNode.id}:${field.key}`}
                  type="number"
                  min={field.min}
                  max={field.max}
                  step={field.step ?? 1}
                  value={Number(selectedNode.data[field.key] ?? 0)}
                  onChange={(event) => {
                    const value = Number(event.target.value || "0");
                    updateData({ [field.key]: Number.isFinite(value) ? value : 0 });
                  }}
                  disabled={readOnly}
                />
              </div>
            );
          }

          if (field.type === "select") {
            return (
              <div key={field.key} className="space-y-2">
                <Label>{field.label}</Label>
                <Select
                  value={String(selectedNode.data[field.key] ?? "")}
                  onValueChange={(value) => updateData({ [field.key]: value })}
                  disabled={readOnly}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {(field.options || []).map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            );
          }

          if (field.type === "switch") {
            return (
              <div key={field.key} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label>{field.label}</Label>
                  {field.description ? (
                    <p className="text-xs text-muted-foreground">{field.description}</p>
                  ) : null}
                </div>
                <Switch
                  checked={Boolean(selectedNode.data[field.key])}
                  onCheckedChange={(checked) => updateData({ [field.key]: checked })}
                  disabled={readOnly}
                />
              </div>
            );
          }

          if (field.type === "conditions") {
            return (
              <div key={field.key} className="space-y-2 rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <Label>{field.label}</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1"
                    onClick={() => updateData({ conditions: conditions.concat(createCondition()) })}
                    disabled={readOnly}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add
                  </Button>
                </div>
                <div className="space-y-2">
                  {conditions.map((condition, index) => (
                    <div key={condition.id} className="space-y-2 rounded-md border p-2">
                      <Input
                        value={condition.field}
                        onChange={(event) => {
                          const next = conditions.map((item) =>
                            item.id === condition.id ? { ...item, field: event.target.value } : item
                          );
                          updateData({ conditions: next });
                        }}
                        placeholder="Field path"
                        disabled={readOnly}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <Select
                          value={condition.operator}
                          onValueChange={(value) => {
                            const next = conditions.map((item) =>
                              item.id === condition.id
                                ? { ...item, operator: value as ConditionOperator }
                                : item
                            );
                            updateData({ conditions: next });
                          }}
                          disabled={readOnly}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CONDITION_OPERATORS.map((operator) => (
                              <SelectItem key={operator} value={operator}>
                                {operator}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          value={String(condition.value ?? "")}
                          onChange={(event) => {
                            const next = conditions.map((item) =>
                              item.id === condition.id ? { ...item, value: event.target.value } : item
                            );
                            updateData({ conditions: next });
                          }}
                          placeholder="Value"
                          disabled={readOnly}
                        />
                      </div>

                      <div className="flex justify-end">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            const next = conditions.filter((item) => item.id !== condition.id);
                            updateData({ conditions: next });
                          }}
                          disabled={readOnly || conditions.length <= 1}
                          className="h-7 px-2"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      </div>

                      {index < conditions.length - 1 ? (
                        <Badge variant="outline" className="text-[10px]">AND</Badge>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            );
          }

          if (field.type === "schedule") {
            const frequency = String(selectedNode.data.frequency || "weekly");
            const time = String(selectedNode.data.time || "09:00");
            const daysOfWeek = (selectedNode.data.daysOfWeek as string[] | undefined) || ["monday"];

            return (
              <div key={field.key} className="space-y-3 rounded-lg border p-3">
                <Label>Schedule Builder</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Select
                    value={frequency}
                    onValueChange={(value) => updateData({ frequency: value })}
                    disabled={readOnly}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="time"
                    value={time}
                    onChange={(event) => updateData({ time: event.target.value })}
                    disabled={readOnly}
                  />
                </div>

                <div className="flex flex-wrap gap-1">
                  {DAY_OPTIONS.map((day) => {
                    const active = daysOfWeek.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        className={cn(
                          "rounded-full border px-2 py-0.5 text-[11px]",
                          active ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground"
                        )}
                        onClick={() => {
                          if (readOnly) return;
                          const next = active
                            ? daysOfWeek.filter((value) => value !== day)
                            : daysOfWeek.concat(day);
                          updateData({ daysOfWeek: next.length > 0 ? next : ["monday"] });
                        }}
                        aria-pressed={active}
                      >
                        {capitalize(day.slice(0, 3))}
                      </button>
                    );
                  })}
                </div>

                <p className="text-xs text-muted-foreground">
                  Every {capitalize(frequency)} at {time}
                </p>
              </div>
            );
          }

          if (field.type === "ab-variants") {
            const source = field.key === "abVariants" ? abVariants : variants;
            const safeSource = source.length > 0 ? source : [createVariant(0), createVariant(1)];
            const totalWeight = safeSource.reduce((sum, variant) => sum + Number(variant.weight || 0), 0);

            return (
              <div key={field.key} className="space-y-2 rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <Label>{field.label}</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1"
                    onClick={() => {
                      const next = updateWeightDistribution(safeSource.concat(createVariant(safeSource.length)));
                      updateData({ [field.key]: next });
                    }}
                    disabled={readOnly}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Total weight: {totalWeight}%</p>
                <div className="space-y-2">
                  {safeSource.map((variant) => (
                    <div key={variant.id} className="grid grid-cols-[1fr_72px_32px] gap-2">
                      <Input
                        value={variant.name}
                        onChange={(event) => {
                          const next = safeSource.map((item) =>
                            item.id === variant.id ? { ...item, name: event.target.value } : item
                          );
                          updateData({ [field.key]: next });
                        }}
                        disabled={readOnly}
                      />
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={variant.weight}
                        onChange={(event) => {
                          const next = safeSource.map((item) =>
                            item.id === variant.id
                              ? { ...item, weight: Number(event.target.value || "0") }
                              : item
                          );
                          updateData({ [field.key]: next });
                        }}
                        disabled={readOnly}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const next = safeSource.filter((item) => item.id !== variant.id);
                          updateData({ [field.key]: updateWeightDistribution(next) });
                        }}
                        disabled={readOnly || safeSource.length <= 2}
                        aria-label="Remove variant"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            );
          }

          if (field.type === "email-template-selector") {
            const templateId = String(selectedNode.data[field.key] ?? "");
            return (
              <EmailTemplatePicker
                key={field.key}
                label={field.label}
                disabled={readOnly}
                value={templateId ? { id: templateId, name: "Custom template" } : null}
                onChange={(val) => updateData({ [field.key]: val?.id ?? "" })}
              />
            );
          }

          if (field.type === "survey-template-selector") {
            return (
              <SurveyTemplateField
                key={field.key}
                fieldKey={field.key}
                label={field.label}
                value={String(selectedNode.data[field.key] ?? "")}
                readOnly={readOnly}
                onUpdate={updateData}
              />
            );
          }

          if (field.type === "exit-config") {
            return (
              <div key={field.key} className="space-y-2 rounded-lg border p-3">
                <Label>Exit Configuration</Label>
                <Select
                  value={String(selectedNode.data.reason || "action_completed")}
                  onValueChange={(value) => updateData({ reason: value })}
                  disabled={readOnly}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXIT_REASONS.map((reason) => (
                      <SelectItem key={reason} value={reason}>
                        {reason}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  value={String(selectedNode.data.milestone || "")}
                  onChange={(event) => updateData({ milestone: event.target.value })}
                  placeholder="Milestone (optional)"
                  disabled={readOnly}
                />
                <Textarea
                  value={String(selectedNode.data.message || "")}
                  onChange={(event) => updateData({ message: event.target.value })}
                  placeholder="Exit message (optional)"
                  rows={3}
                  disabled={readOnly}
                />
              </div>
            );
          }

          return null;
        })}

        {selectedNode.type === "condition-absplit" ? (
          <div className="space-y-2">
            <Label>Winning Metric</Label>
            <Select
              value={String(selectedNode.data.winningMetric || "open_rate")}
              onValueChange={(value) => updateData({ winningMetric: value })}
              disabled={readOnly}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WINNING_METRICS.map((metric) => (
                  <SelectItem key={metric} value={metric}>
                    {metric}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}

        {selectedNode.type === "delay-wait" ? (
          <p className="rounded-md bg-muted p-2 text-xs text-muted-foreground">
            Preview: Wait {Number(selectedNode.data.value ?? 0)} {String(selectedNode.data.unit || "days")}
          </p>
        ) : null}
      </div>

      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this node?</AlertDialogTitle>
            <AlertDialogDescription>
              This node has {connectedEdgeCount} connection{connectedEdgeCount === 1 ? "" : "s"}. Removing it will also remove its edges.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                removeNode(selectedNode.id);
                selectNode(null);
              }}
            >
              Remove node
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </aside>
  );
}

// ── Survey template selector field ───────────────────────────────────

function SurveyTemplateField({
  fieldKey,
  label,
  value,
  readOnly,
  onUpdate,
}: {
  fieldKey: string;
  label: string;
  value: string;
  readOnly: boolean;
  onUpdate: (patch: Record<string, unknown>) => void;
}) {
  const [templates, setTemplates] = useState<
    Array<{ id: string; name: string; description: string | null }>
  >([]);
  const [loaded, setLoaded] = useState(false);
  const fetchingRef = useRef(false);

  const handleOpen = useCallback(async (open: boolean) => {
    if (!open || fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      const result = await getActiveTemplatesForSend();
      if (result.success && result.data) {
        setTemplates(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch survey templates:", error);
    } finally {
      fetchingRef.current = false;
      setLoaded(true);
    }
  }, []);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select
        value={value}
        onValueChange={(v) => onUpdate({ [fieldKey]: v })}
        disabled={readOnly}
        onOpenChange={handleOpen}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select survey template" />
        </SelectTrigger>
        <SelectContent>
          {templates.map((t) => (
            <SelectItem key={t.id} value={t.id}>
              {t.name}
            </SelectItem>
          ))}
          {templates.length === 0 && loaded && (
            <div className="px-2 py-3 text-center text-xs text-muted-foreground">
              No active survey templates
            </div>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
