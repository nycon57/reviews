"use client";

import { useTransition } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { cancelAbTest } from "@/lib/widgets/ab-testing";

interface CancelTestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentWidgetId: string;
  parentWidgetName: string;
  onCancelled?: () => void;
}

export function CancelTestDialog({
  open,
  onOpenChange,
  parentWidgetId,
  parentWidgetName,
  onCancelled,
}: CancelTestDialogProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  function handleCancel() {
    startTransition(async () => {
      const result = await cancelAbTest(parentWidgetId);

      if (result.success) {
        toast({
          title: "Test cancelled",
          description: `All visitors will now see the original widget "${parentWidgetName}".`,
        });
        onOpenChange(false);
        onCancelled?.();
      } else {
        toast({
          title: "Failed to cancel test",
          description: result.error,
          variant: "destructive",
        });
      }
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel A/B test?</AlertDialogTitle>
          <AlertDialogDescription>
            This will end the test and revert all visitors to the original widget
            &ldquo;{parentWidgetName}&rdquo;. The variant will be deactivated.
            Analytics history will be preserved.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Keep running</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleCancel}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? "Cancelling..." : "Cancel test"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
