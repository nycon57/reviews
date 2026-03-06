"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, EyeSlash, Users } from "@phosphor-icons/react";
import { StepProps } from "./types";

export function DetailsAudienceStep({ formData, setFormData, departments }: StepProps) {
  return (
    <div className="space-y-8">
      {/* Section header */}
      <div>
        <h2 className="font-display text-2xl font-bold text-heading">
          Survey Details
        </h2>
        <p className="mt-1 text-label">
          Configure the name, description, and target audience
        </p>
      </div>

      {/* Survey Details Card */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h3 className="font-sans text-lg font-semibold text-heading mb-4">
          Basic Information
        </h3>

        <div className="space-y-4">
          {/* Survey Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-heading">
              Survey Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Q1 2024 Employee Engagement Survey"
              className="focus-visible:ring-repwell-teal-300"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-heading">
              Description <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of the survey purpose..."
              rows={3}
              className="resize-none focus-visible:ring-repwell-teal-300"
            />
          </div>
        </div>
      </div>

      {/* Anonymous Toggle Card */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-repwell-sage-100/50 dark:bg-repwell-teal-300/15 text-label">
              {formData.isAnonymous ? (
                <EyeSlash weight="duotone" className="h-5 w-5" />
              ) : (
                <Eye weight="duotone" className="h-5 w-5" />
              )}
            </div>
            <div>
              <Label htmlFor="anonymous" className="text-base font-semibold text-heading">
                Anonymous Responses
              </Label>
              <p className="mt-1 text-sm text-label">
                {formData.isAnonymous
                  ? "Responses will not be linked to individual employees, encouraging honest feedback."
                  : "Responses will be linked to employees, allowing for follow-up conversations."}
              </p>
            </div>
          </div>
          <Switch
            id="anonymous"
            checked={formData.isAnonymous}
            onCheckedChange={(checked) =>
              setFormData((prev) => ({ ...prev, isAnonymous: checked }))
            }
          />
        </div>
      </div>

      {/* Target Audience Card */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-start gap-4 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-repwell-sage-100/50 dark:bg-repwell-teal-300/15 text-label">
            <Users weight="duotone" className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-sans text-lg font-semibold text-heading">
              Target Audience
            </h3>
            <p className="mt-1 text-sm text-label">
              Choose which employees should receive this survey
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="department" className="text-heading">
            Department
          </Label>
          <Select
            value={formData.targetDepartment}
            onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, targetDepartment: value }))
            }
          >
            <SelectTrigger className="focus:ring-repwell-teal-300">
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  All Departments
                </span>
              </SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept} value={dept}>
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {formData.targetDepartment === "__all__"
              ? "Survey will be sent to all employees in the organization."
              : "Survey will only be sent to employees in the selected department."}
          </p>
        </div>
      </div>
    </div>
  );
}
