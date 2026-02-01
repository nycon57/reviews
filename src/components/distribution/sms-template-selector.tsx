"use client";

import { useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { renderTemplatePreview } from "@/lib/sms/templates/merge-engine";
import type { SmsTemplate, SmsTemplateCategory } from "@/lib/sms/types";
import {
  ChatText,
  TextAlignLeft,
} from "@phosphor-icons/react";

const CATEGORY_LABELS: Record<SmsTemplateCategory, string> = {
  review_request: "Review Request",
  follow_up: "Follow Up",
  thank_you: "Thank You",
  video_request: "Video Request",
  custom: "Custom",
};

interface SmsTemplateSelectorProps {
  templates: SmsTemplate[];
  selectedTemplateId: string;
  onSelectTemplate: (templateId: string) => void;
  isLoading: boolean;
  /** Category filter, null for all */
  category: SmsTemplateCategory | null;
  onCategoryChange: (cat: SmsTemplateCategory | null) => void;
}

export function SmsTemplateSelector({
  templates,
  selectedTemplateId,
  onSelectTemplate,
  isLoading,
  category,
  onCategoryChange,
}: SmsTemplateSelectorProps) {
  const filtered = category
    ? templates.filter((t) => t.category === category)
    : templates;

  const selected = templates.find((t) => t.id === selectedTemplateId);

  const preview = useMemo(() => {
    if (!selected) return null;
    const result = renderTemplatePreview(selected.body);
    return {
      body: result.body,
      segments: result.segmentInfo.segments,
      encoding: result.segmentInfo.encoding,
    };
  }, [selected?.id, selected?.body]);

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Category</Label>
        <div className="flex flex-wrap gap-1.5">
          <Badge
            variant={category === null ? "default" : "outline"}
            className="cursor-pointer text-xs"
            onClick={() => onCategoryChange(null)}
          >
            All
          </Badge>
          {(Object.entries(CATEGORY_LABELS) as [SmsTemplateCategory, string][]).map(
            ([key, label]) => (
              <Badge
                key={key}
                variant={category === key ? "default" : "outline"}
                className="cursor-pointer text-xs"
                onClick={() => onCategoryChange(key)}
              >
                {label}
              </Badge>
            )
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="sms-template" className="text-sm font-medium">
          Template
        </Label>
        <Select
          value={selectedTemplateId}
          onValueChange={onSelectTemplate}
          disabled={isLoading}
        >
          <SelectTrigger id="sms-template">
            <SelectValue placeholder={isLoading ? "Loading templates..." : "Select a template"} />
          </SelectTrigger>
          <SelectContent>
            {filtered.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                <div className="flex items-center gap-2">
                  <ChatText className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{t.name}</span>
                  {t.is_default && (
                    <Badge variant="secondary" className="text-[10px] px-1 py-0">
                      Default
                    </Badge>
                  )}
                </div>
              </SelectItem>
            ))}
            {filtered.length === 0 && !isLoading && (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                No templates available
              </div>
            )}
          </SelectContent>
        </Select>
      </div>

      {preview && (
        <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <TextAlignLeft className="h-3.5 w-3.5" />
              Preview
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px]">
                {preview.segments} segment{preview.segments !== 1 ? "s" : ""}
              </Badge>
              <Badge variant="outline" className="text-[10px]">
                {preview.encoding}
              </Badge>
            </div>
          </div>
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
            {preview.body}
          </p>
        </div>
      )}
    </div>
  );
}
