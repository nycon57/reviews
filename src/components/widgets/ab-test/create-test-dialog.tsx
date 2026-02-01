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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { createAbTest } from "@/lib/widgets/ab-testing";
import type { WidgetConfig } from "@/lib/widgets/types";

interface CreateTestDialogProps {
  widget: WidgetConfig;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

export function CreateTestDialog({
  widget,
  open,
  onOpenChange,
  onCreated,
}: CreateTestDialogProps) {
  const [variantName, setVariantName] = useState(`${widget.name} (Variant B)`);
  const [splitPercent, setSplitPercent] = useState(50);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  function handleCreate() {
    startTransition(async () => {
      const result = await createAbTest({
        parentWidgetId: widget.id,
        variantConfig: {},
        variantName,
        splitPercent,
      });

      if (result.success) {
        toast({
          title: "A/B test created",
          description: `Traffic split: ${100 - splitPercent}% / ${splitPercent}%. Edit the variant to configure differences.`,
        });
        onOpenChange(false);
        onCreated?.();
      } else {
        toast({
          title: "Failed to create test",
          description: result.error,
          variant: "destructive",
        });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Create A/B Test</DialogTitle>
          <DialogDescription>
            Create a variant of &ldquo;{widget.name}&rdquo; to test different configurations.
            Visitors will be randomly assigned to see either the original or variant.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="variant-name">Variant name</Label>
            <Input
              id="variant-name"
              value={variantName}
              onChange={(e) => setVariantName(e.target.value)}
              placeholder="e.g. Dark theme variant"
            />
          </div>

          <div className="space-y-3">
            <Label>Traffic split</Label>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Slider
                  value={[splitPercent]}
                  onValueChange={([v]) => setSplitPercent(v)}
                  min={10}
                  max={90}
                  step={5}
                />
              </div>
              <div className="min-w-[120px] text-sm text-muted-foreground text-right">
                A: {100 - splitPercent}% / B: {splitPercent}%
              </div>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Original (A): {100 - splitPercent}%</span>
              <span>Variant (B): {splitPercent}%</span>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
            After creating the test, edit the variant widget to change its theme,
            content, or filters. The test starts immediately once both widgets are active.
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={isPending || !variantName.trim()}>
            {isPending ? "Creating..." : "Create test"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
