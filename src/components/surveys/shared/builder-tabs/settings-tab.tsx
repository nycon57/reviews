"use client";

import { ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface SettingsTabProps {
  isActive: boolean;
  onIsActiveChange: (active: boolean) => void;
  isDefault: boolean;
  onIsDefaultChange: (isDefault: boolean) => void;
  /** Slot for system-specific settings (EX: survey type, frequency, anonymity) */
  renderExtraSettings?: () => ReactNode;
}

export function SettingsTab({
  isActive,
  onIsActiveChange,
  isDefault,
  onIsDefaultChange,
  renderExtraSettings,
}: SettingsTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Template Settings</CardTitle>
        <CardDescription>
          Configure template behavior and status
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <Label>Active Status</Label>
            <p className="text-sm text-muted-foreground">
              Active templates can be used to create new surveys
            </p>
          </div>
          <Switch checked={isActive} onCheckedChange={onIsActiveChange} />
        </div>
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <Label>Default Template</Label>
            <p className="text-sm text-muted-foreground">
              Use this as the default template for new surveys
            </p>
          </div>
          <Switch checked={isDefault} onCheckedChange={onIsDefaultChange} />
        </div>
        {renderExtraSettings?.()}
      </CardContent>
    </Card>
  );
}
