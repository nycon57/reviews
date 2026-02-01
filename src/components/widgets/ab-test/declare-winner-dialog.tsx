"use client";

import { useState, useTransition } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { declareWinner, type AbTestSummary } from "@/lib/widgets/ab-testing";

interface DeclareWinnerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  testData: AbTestSummary;
  onDeclared?: () => void;
}

export function DeclareWinnerDialog({
  open,
  onOpenChange,
  testData,
  onDeclared,
}: DeclareWinnerDialogProps) {
  const [winnerId, setWinnerId] = useState(testData.parentWidgetId);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  function handleDeclare() {
    startTransition(async () => {
      const result = await declareWinner({
        parentWidgetId: testData.parentWidgetId,
        winnerId,
      });

      if (result.success) {
        const winnerLabel =
          winnerId === testData.parentWidgetId
            ? `A (${testData.parentWidgetName})`
            : `B (${testData.variantWidgetName})`;
        toast({
          title: "Winner declared",
          description: `${winnerLabel} is now the active widget. The losing variant has been deactivated.`,
        });
        onOpenChange(false);
        onDeclared?.();
      } else {
        toast({
          title: "Failed to declare winner",
          description: result.error,
          variant: "destructive",
        });
      }
    });
  }

  const ctrA =
    testData.variantA.impressions > 0
      ? ((testData.variantA.clicks / testData.variantA.impressions) * 100).toFixed(2)
      : "0.00";
  const ctrB =
    testData.variantB.impressions > 0
      ? ((testData.variantB.clicks / testData.variantB.impressions) * 100).toFixed(2)
      : "0.00";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Declare a winner</AlertDialogTitle>
          <AlertDialogDescription>
            The winning variant will become the active widget. The losing variant
            will be deactivated but its analytics history is preserved.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <RadioGroup value={winnerId} onValueChange={setWinnerId} className="space-y-3 py-4">
          <div className="flex items-start space-x-3 rounded-lg border border-border p-3 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
            <RadioGroupItem value={testData.parentWidgetId} id="winner-a" className="mt-0.5" />
            <Label htmlFor="winner-a" className="flex-1 cursor-pointer">
              <span className="font-medium">A: {testData.parentWidgetName}</span>
              <span className="block text-sm text-muted-foreground mt-0.5">
                {testData.variantA.impressions.toLocaleString()} impressions &middot; {ctrA}% CTR
              </span>
            </Label>
          </div>
          <div className="flex items-start space-x-3 rounded-lg border border-border p-3 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
            <RadioGroupItem value={testData.variantWidgetId} id="winner-b" className="mt-0.5" />
            <Label htmlFor="winner-b" className="flex-1 cursor-pointer">
              <span className="font-medium">B: {testData.variantWidgetName}</span>
              <span className="block text-sm text-muted-foreground mt-0.5">
                {testData.variantB.impressions.toLocaleString()} impressions &middot; {ctrB}% CTR
              </span>
            </Label>
          </div>
        </RadioGroup>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDeclare} disabled={isPending}>
            {isPending ? "Applying..." : "Declare winner"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
