"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { SurveyBranding } from "@/types/survey.types";

interface BrandingTabProps {
  branding: SurveyBranding;
  onChange: (branding: SurveyBranding) => void;
}

export function BrandingTab({ branding, onChange }: BrandingTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Survey Branding</CardTitle>
        <CardDescription>
          Customize the look and feel of your survey
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-2">
          <Label htmlFor="logo">Logo URL</Label>
          <Input
            id="logo"
            value={branding.logo || ""}
            onChange={(e) =>
              onChange({ ...branding, logo: e.target.value || undefined })
            }
            placeholder="https://example.com/logo.png"
          />
          <p className="text-xs text-muted-foreground">
            Enter a URL to your company logo
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="primaryColor">Primary Color</Label>
            <div className="flex gap-2">
              <Input
                id="primaryColor"
                type="color"
                value={branding.primaryColor || "#000000"}
                onChange={(e) =>
                  onChange({ ...branding, primaryColor: e.target.value })
                }
                className="h-10 w-14 cursor-pointer p-1"
              />
              <Input
                value={branding.primaryColor || ""}
                onChange={(e) =>
                  onChange({ ...branding, primaryColor: e.target.value })
                }
                placeholder="#000000"
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="backgroundColor">Background Color</Label>
            <div className="flex gap-2">
              <Input
                id="backgroundColor"
                type="color"
                value={branding.backgroundColor || "#ffffff"}
                onChange={(e) =>
                  onChange({ ...branding, backgroundColor: e.target.value })
                }
                className="h-10 w-14 cursor-pointer p-1"
              />
              <Input
                value={branding.backgroundColor || ""}
                onChange={(e) =>
                  onChange({ ...branding, backgroundColor: e.target.value })
                }
                placeholder="#ffffff"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <Label>Show Progress Bar</Label>
            <p className="text-sm text-muted-foreground">
              Display a progress indicator during the survey
            </p>
          </div>
          <Switch
            checked={branding.showProgressBar ?? true}
            onCheckedChange={(checked) =>
              onChange({ ...branding, showProgressBar: checked })
            }
          />
        </div>

        <div className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <Label>Show Question Numbers</Label>
            <p className="text-sm text-muted-foreground">
              Display question numbers (1, 2, 3...) in the survey
            </p>
          </div>
          <Switch
            checked={branding.showQuestionNumbers ?? true}
            onCheckedChange={(checked) =>
              onChange({ ...branding, showQuestionNumbers: checked })
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}
