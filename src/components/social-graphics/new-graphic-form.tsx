"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TemplateLibrary } from "./template-library";
import { createGraphic } from "@/lib/social-graphics/actions";
import { getTemplate } from "@/lib/social-graphics/templates";
import {
  CANVAS_PRESETS,
  type CanvasSize,
  type TemplateId,
  type ReviewForGraphic,
} from "@/lib/social-graphics/types";

interface ReviewOption {
  id: string;
  rating: number;
  text: string | null;
  customer_name: string | null;
  source: string;
}

interface NewGraphicFormProps {
  reviews: ReviewOption[];
  orgName: string;
}

export function NewGraphicForm({ reviews, orgName }: NewGraphicFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTemplate = searchParams.get("template") as TemplateId | null;

  const [name, setName] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] =
    useState<TemplateId | null>(initialTemplate);
  const [canvasPresetIndex, setCanvasPresetIndex] = useState<number>(0);
  const [selectedReviewId, setSelectedReviewId] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const canvasSize: CanvasSize = CANVAS_PRESETS[canvasPresetIndex];

  const handleCreate = () => {
    setError(null);

    const template = selectedTemplateId
      ? getTemplate(selectedTemplateId)
      : null;

    let review: ReviewForGraphic | undefined;
    if (selectedReviewId) {
      const row = reviews.find((r) => r.id === selectedReviewId);
      if (row) {
        review = {
          id: row.id,
          rating: row.rating,
          text: row.text,
          customerName: row.customer_name,
          reviewDate: new Date().toISOString(),
          source: row.source,
        };
      }
    }

    const elements = template
      ? template.generate({ canvasSize, review, orgName })
      : [];

    const graphicName =
      name.trim() ||
      (template ? template.metadata.name : "Untitled Graphic");

    startTransition(async () => {
      const result = await createGraphic({
        name: graphicName,
        canvasSize,
        elements,
        templateId: selectedTemplateId ?? undefined,
        reviewIds: selectedReviewId ? [selectedReviewId] : undefined,
      });

      if (result.success) {
        router.push(`/dashboard/social-graphics/${result.data.id}`);
      } else {
        setError(result.error);
      }
    });
  };

  const truncate = (text: string | null, len: number) => {
    if (!text) return "No text";
    return text.length > len ? text.slice(0, len) + "..." : text;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            New Graphic
          </h1>
          <p className="text-sm text-muted-foreground">
            Choose a template and configure your graphic
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/social-graphics")}
          >
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={isPending}>
            {isPending ? "Creating..." : "Create Graphic"}
          </Button>
        </div>
      </div>

      {/* Form */}
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          {/* Template selection */}
          <TemplateLibrary
            onSelectTemplate={setSelectedTemplateId}
            selectedTemplateId={selectedTemplateId}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="rounded-xl border p-4 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Settings</h3>

            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Name
              </label>
              <Input
                placeholder="Graphic name (optional)"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* Canvas size */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Canvas Size
              </label>
              <Select
                value={String(canvasPresetIndex)}
                onValueChange={(v) => setCanvasPresetIndex(Number(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CANVAS_PRESETS.map((preset, i) => (
                    <SelectItem key={preset.name} value={String(i)}>
                      {preset.name} ({preset.width}x{preset.height})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Review selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Populate with Review (optional)
              </label>
              <Select
                value={selectedReviewId}
                onValueChange={setSelectedReviewId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a review" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No review</SelectItem>
                  {reviews.map((review) => (
                    <SelectItem key={review.id} value={review.id}>
                      {"★".repeat(review.rating)}{" "}
                      {truncate(review.customer_name, 20)} -{" "}
                      {truncate(review.text, 40)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      </div>
    </div>
  );
}
