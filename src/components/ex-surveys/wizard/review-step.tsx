"use client";

import { Badge } from "@/components/ui/badge";
import {
  ClipboardText,
  Users,
  CalendarBlank,
  Lightning,
  EyeSlash,
  Eye,
  Check,
} from "@phosphor-icons/react";
import { format } from "date-fns";
import { StepProps } from "./types";

interface ReviewItemProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}

function ReviewItem({ icon, label, value }: ReviewItemProps) {
  return (
    <div className="flex items-start gap-4 py-4 border-b border-border last:border-0">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-repwell-sage-100/50 dark:bg-repwell-teal-300/15 text-label flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <span className="block text-sm text-muted-foreground">{label}</span>
        <span className="block mt-0.5 font-medium text-heading">{value}</span>
      </div>
    </div>
  );
}

export function ReviewStep({ formData, templates }: StepProps) {
  const selectedTemplate = templates.find((t) => t.id === formData.templateId);
  const selectedDepartment =
    formData.targetDepartment === "__all__"
      ? null
      : formData.targetDepartment;

  return (
    <div className="space-y-8">
      {/* Section header */}
      <div>
        <h2 className="font-display text-2xl font-bold text-heading">
          Review & Create
        </h2>
        <p className="mt-1 text-label">
          Review your survey configuration before creating
        </p>
      </div>

      {/* Summary Card */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-repwell-teal-300 to-repwell-teal-400 px-6 py-4">
          <h3 className="font-semibold text-white text-lg">{formData.name}</h3>
          {formData.description && (
            <p className="mt-1 text-white/80 text-sm">{formData.description}</p>
          )}
        </div>

        {/* Details */}
        <div className="px-6 py-2">
          <ReviewItem
            icon={<ClipboardText weight="duotone" className="h-5 w-5" />}
            label="Template"
            value={
              <span className="flex items-center gap-2">
                {selectedTemplate?.name || "Unknown template"}
                <Badge variant="outline" className="text-xs capitalize">
                  {selectedTemplate?.surveyType ?? "Unknown"}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {selectedTemplate?.questions?.length ?? 0} questions
                </Badge>
              </span>
            }
          />

          <ReviewItem
            icon={<Users weight="duotone" className="h-5 w-5" />}
            label="Target Audience"
            value={
              selectedDepartment
                ? selectedDepartment
                : "All Departments"
            }
          />

          <ReviewItem
            icon={
              formData.isAnonymous ? (
                <EyeSlash weight="duotone" className="h-5 w-5" />
              ) : (
                <Eye weight="duotone" className="h-5 w-5" />
              )
            }
            label="Response Type"
            value={
              <span className="flex items-center gap-2">
                {formData.isAnonymous ? "Anonymous" : "Identified"}
                <Badge
                  variant={formData.isAnonymous ? "secondary" : "outline"}
                  className="text-xs"
                >
                  {formData.isAnonymous ? "Identity protected" : "Names visible"}
                </Badge>
              </span>
            }
          />

          <ReviewItem
            icon={
              formData.launchImmediately ? (
                <Lightning weight="duotone" className="h-5 w-5" />
              ) : (
                <CalendarBlank weight="duotone" className="h-5 w-5" />
              )
            }
            label="Launch Timing"
            value={
              formData.launchImmediately
                ? "Immediately upon creation"
                : formData.startDate
                ? format(formData.startDate, "PPP")
                : "Not scheduled"
            }
          />

          {formData.endDate && (
            <ReviewItem
              icon={<CalendarBlank weight="duotone" className="h-5 w-5" />}
              label="Response Deadline"
              value={format(formData.endDate, "PPP")}
            />
          )}
        </div>
      </div>

      {/* Checklist */}
      <div className="rounded-xl border border-border bg-repwell-sage-100/30 dark:bg-repwell-teal-300/10 p-6">
        <h4 className="font-semibold text-heading mb-4">
          Ready to launch
        </h4>
        <ul className="space-y-3">
          <li className="flex items-center gap-3 text-sm text-label">
            <Check weight="bold" className="h-4 w-4 text-repwell-sage-200" />
            Survey template selected
          </li>
          <li className="flex items-center gap-3 text-sm text-label">
            <Check weight="bold" className="h-4 w-4 text-repwell-sage-200" />
            Name and details configured
          </li>
          <li className="flex items-center gap-3 text-sm text-label">
            <Check weight="bold" className="h-4 w-4 text-repwell-sage-200" />
            Target audience defined
          </li>
          <li className="flex items-center gap-3 text-sm text-label">
            <Check weight="bold" className="h-4 w-4 text-repwell-sage-200" />
            Schedule configured
          </li>
        </ul>
        <p className="mt-4 text-xs text-muted-foreground">
          {formData.launchImmediately
            ? "Survey will be sent to recipients immediately after creation."
            : "Survey will be saved as a draft and sent on the scheduled date."}
        </p>
      </div>
    </div>
  );
}
