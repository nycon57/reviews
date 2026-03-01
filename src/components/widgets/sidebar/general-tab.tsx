"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EntitySelector } from "../entity-selector";
import type { WidgetEntityType } from "@/lib/widgets/types";
import { ENTITY_TYPE_LABELS } from "@/lib/widgets/constants";

interface GeneralTabProps {
  entityType: WidgetEntityType;
  entityId: string | null;
  onEntityTypeChange: (entityType: WidgetEntityType) => void;
  onEntityIdChange: (entityId: string | null) => void;
}

export function GeneralTab({
  entityType,
  entityId,
  onEntityTypeChange,
  onEntityIdChange,
}: GeneralTabProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label className="text-xs text-muted-foreground">Entity Type</Label>
        <Select
          value={entityType}
          onValueChange={(v) => {
            onEntityTypeChange(v as WidgetEntityType);
            onEntityIdChange(null);
          }}
        >
          <SelectTrigger className="h-8 text-xs mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="user">{ENTITY_TYPE_LABELS.user}</SelectItem>
            <SelectItem value="branch">{ENTITY_TYPE_LABELS.branch}</SelectItem>
            <SelectItem value="organization">{ENTITY_TYPE_LABELS.organization}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <EntitySelector
        entityType={entityType}
        entityId={entityId}
        onSelect={(id) => onEntityIdChange(id)}
        label="Entity"
      />
    </div>
  );
}
