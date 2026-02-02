"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TemplateLibrary } from "./template-library";
import { batchGenerateFromReviews } from "@/lib/social-graphics/batch-generate";
import {
  CANVAS_PRESETS,
  type CanvasSize,
  type TemplateId,
} from "@/lib/social-graphics/types";

interface ReviewOption {
  id: string;
  rating: number;
  text: string | null;
  customer_name: string | null;
  source: string;
}

interface BatchGenerateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reviews: ReviewOption[];
  onGenerated?: (count: number) => void;
}

export function BatchGenerateDialog({
  open,
  onOpenChange,
  reviews,
  onGenerated,
}: BatchGenerateDialogProps) {
  const [selectedReviewIds, setSelectedReviewIds] = useState<Set<string>>(
    new Set()
  );
  const [selectedTemplateId, setSelectedTemplateId] =
    useState<TemplateId | null>(null);
  const [canvasPresetIndex, setCanvasPresetIndex] = useState<number>(0);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"reviews" | "template">("reviews");

  const canvasSize: CanvasSize = CANVAS_PRESETS[canvasPresetIndex];

  const toggleReview = (id: string) => {
    setSelectedReviewIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelectedReviewIds(new Set(reviews.map((r) => r.id)));
  };

  const deselectAll = () => {
    setSelectedReviewIds(new Set());
  };

  const handleGenerate = () => {
    if (!selectedTemplateId || selectedReviewIds.size === 0) return;
    setError(null);

    startTransition(async () => {
      const result = await batchGenerateFromReviews({
        reviewIds: Array.from(selectedReviewIds),
        templateId: selectedTemplateId,
        canvasSize,
      });

      if (result.success) {
        onOpenChange(false);
        onGenerated?.(result.data.length);
        setSelectedReviewIds(new Set());
        setSelectedTemplateId(null);
        setStep("reviews");
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Batch Generate Graphics</DialogTitle>
          <DialogDescription>
            {step === "reviews"
              ? `Select reviews to generate graphics for (${selectedReviewIds.size} selected)`
              : "Choose a template and canvas size for all graphics"}
          </DialogDescription>
        </DialogHeader>

        {step === "reviews" && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={selectAll}>
                Select All
              </Button>
              <Button variant="outline" size="sm" onClick={deselectAll}>
                Deselect All
              </Button>
            </div>
            {reviews.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No approved reviews available
              </p>
            ) : (
              <div className="max-h-[400px] space-y-2 overflow-y-auto pr-1">
                {reviews.map((review) => {
                  const isSelected = selectedReviewIds.has(review.id);
                  return (
                    <button
                      key={review.id}
                      type="button"
                      onClick={() => toggleReview(review.id)}
                      className={`w-full rounded-lg border p-3 text-left transition-colors ${
                        isSelected
                          ? "border-repwell-teal-300 bg-repwell-teal-300/5"
                          : "border-border hover:border-muted-foreground/30"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                            isSelected
                              ? "border-repwell-teal-300 bg-repwell-teal-300"
                              : "border-muted-foreground/30"
                          }`}
                        >
                          {isSelected && (
                            <svg
                              width="10"
                              height="10"
                              viewBox="0 0 12 12"
                              fill="none"
                              aria-hidden="true"
                            >
                              <path
                                d="M2 6L5 9L10 3"
                                stroke="white"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-amber-500">
                              {"★".repeat(review.rating)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {review.source}
                            </span>
                          </div>
                          <p className="text-sm text-foreground">
                            {truncate(review.text, 100)}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {review.customer_name ?? "Anonymous"}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {step === "template" && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
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

            <TemplateLibrary
              onSelectTemplate={setSelectedTemplateId}
              selectedTemplateId={selectedTemplateId}
            />
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        <DialogFooter className="gap-2">
          {step === "template" && (
            <Button
              variant="outline"
              onClick={() => setStep("reviews")}
              disabled={isPending}
            >
              Back
            </Button>
          )}
          {step === "reviews" ? (
            <Button
              onClick={() => setStep("template")}
              disabled={selectedReviewIds.size === 0}
            >
              Next ({selectedReviewIds.size} reviews)
            </Button>
          ) : (
            <Button
              onClick={handleGenerate}
              disabled={isPending || !selectedTemplateId}
            >
              {isPending
                ? "Generating..."
                : `Generate ${selectedReviewIds.size} Graphics`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
