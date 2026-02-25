"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { WidgetTypeSelector } from "@/components/widgets/widget-type-selector";
import { createWidget } from "@/lib/widgets/actions";
import { EntitySelector } from "@/components/widgets/entity-selector";
import type { WidgetType, WidgetEntityType } from "@/lib/widgets/types";

type Step = "type" | "entity" | "name";

const ENTITY_TYPE_LABELS: Record<WidgetEntityType, string> = {
  user: "Loan Officer",
  branch: "Branch",
  organization: "Organization",
};

export function NewWidgetPageClient() {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [step, setStep] = useState<Step>("type");
  const [widgetType, setWidgetType] = useState<WidgetType | null>(null);
  const [entityType, setEntityType] = useState<WidgetEntityType>("organization");
  const [entityId, setEntityId] = useState<string | null>(null);
  const [name, setName] = useState("");

  const handleCreate = () => {
    if (!widgetType || !name.trim()) return;

    startTransition(async () => {
      const result = await createWidget({
        name: name.trim(),
        widget_type: widgetType,
        entity_type: entityType,
        entity_id: entityId ?? undefined,
        status: "draft",
      });

      if (result.success) {
        if (!result.data?.id) {
          toast({ title: "Creation failed", description: "Widget was created but no ID was returned.", variant: "destructive" });
          return;
        }
        toast({ title: "Widget created", description: "Opening the editor..." });
        router.push(`/dashboard/widgets/${result.data.id}`);
      } else {
        toast({ title: "Creation failed", description: result.error || "Unknown error", variant: "destructive" });
      }
    });
  };

  return (
    <div className="flex-1 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/dashboard/widgets")}
          className="gap-1 text-muted-foreground mb-6"
        >
          <ArrowLeft size={16} />
          Back to Widgets
        </Button>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {(["type", "entity", "name"] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              {i > 0 && <div className="w-8 h-px bg-border" />}
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                  step === s
                    ? "bg-repwell-teal-300 text-white"
                    : (["type", "entity", "name"].indexOf(step) > i)
                      ? "bg-repwell-sage-100 text-repwell-teal-400"
                      : "bg-gray-100 text-gray-400"
                }`}
              >
                {i + 1}
              </div>
            </div>
          ))}
        </div>

        {/* Step: Select Type */}
        {step === "type" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-repwell-teal-500">
                Choose Widget Type
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Select the type of widget you want to create.
              </p>
            </div>

            <WidgetTypeSelector
              value={widgetType}
              onChange={(type) => setWidgetType(type)}
            />

            <div className="flex justify-end">
              <Button
                onClick={() => setStep("entity")}
                disabled={!widgetType}
                className="gap-1.5 bg-repwell-teal-300 hover:bg-repwell-teal-400"
              >
                Next
                <ArrowRight size={16} />
              </Button>
            </div>
          </div>
        )}

        {/* Step: Select Entity */}
        {step === "entity" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-repwell-teal-500">
                Select Entity
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Choose which entity this widget should display reviews for.
              </p>
            </div>

            <div>
              <Label className="text-sm font-medium text-repwell-teal-500 mb-2 block">
                Entity Type
              </Label>
              <Select
                value={entityType}
                onValueChange={(v) => {
                  setEntityType(v as WidgetEntityType);
                  setEntityId(null);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(ENTITY_TYPE_LABELS) as [WidgetEntityType, string][]).map(
                    ([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium text-repwell-teal-500 mb-2 block">
                Select {ENTITY_TYPE_LABELS[entityType]}
              </Label>
              <EntitySelector
                entityType={entityType}
                entityId={entityId}
                onSelect={(id) => setEntityId(id)}
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                Search and select a specific {ENTITY_TYPE_LABELS[entityType].toLowerCase()} to display reviews for.
              </p>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep("type")}>
                Back
              </Button>
              <Button
                onClick={() => setStep("name")}
                className="gap-1.5 bg-repwell-teal-300 hover:bg-repwell-teal-400"
              >
                Next
                <ArrowRight size={16} />
              </Button>
            </div>
          </div>
        )}

        {/* Step: Name */}
        {step === "name" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-repwell-teal-500">
                Name Your Widget
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Give your widget a name to identify it in your dashboard.
              </p>
            </div>

            <div>
              <Label className="text-sm font-medium text-repwell-teal-500 mb-2 block">
                Widget Name
              </Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Homepage Reviews Widget"
                className="text-base"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && name.trim()) handleCreate();
                }}
              />
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep("entity")}>
                Back
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!name.trim() || isPending}
                className="gap-1.5 bg-repwell-teal-300 hover:bg-repwell-teal-400"
              >
                {isPending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : null}
                Create & Open Editor
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
