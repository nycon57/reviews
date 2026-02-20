"use client";

import { ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ThankYouConfig } from "@/types/survey.types";

interface ThankYouTabProps {
  config: ThankYouConfig;
  onChange: (config: ThankYouConfig) => void;
  /** Slot for CX-specific review redirect settings */
  renderExtras?: (config: ThankYouConfig, onChange: (c: ThankYouConfig) => void) => ReactNode;
}

export function ThankYouTab({ config, onChange, renderExtras }: ThankYouTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Thank You Page</CardTitle>
        <CardDescription>
          Customize the completion message shown after submission
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-2">
          <Label htmlFor="thankYouTitle">Title</Label>
          <Input
            id="thankYouTitle"
            value={config.title}
            onChange={(e) => onChange({ ...config, title: e.target.value })}
            placeholder="Thank you!"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="thankYouMessage">Message</Label>
          <Textarea
            id="thankYouMessage"
            value={config.message}
            onChange={(e) => onChange({ ...config, message: e.target.value })}
            placeholder="Your response has been recorded."
            className="min-h-[100px]"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="redirectUrl">Redirect URL (optional)</Label>
          <Input
            id="redirectUrl"
            value={config.redirectUrl || ""}
            onChange={(e) => onChange({ ...config, redirectUrl: e.target.value })}
            placeholder="https://example.com/thank-you"
          />
          <p className="text-xs text-muted-foreground">
            Redirect respondents to this URL after completion
          </p>
        </div>

        {renderExtras?.(config, onChange)}
      </CardContent>
    </Card>
  );
}
