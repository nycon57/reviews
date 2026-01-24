"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Play,
  StopCircle,
} from "@phosphor-icons/react";
import { launchEXSurvey, closeEXSurvey } from "@/lib/ex-surveys/actions";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface EXSurveyLaunchButtonProps {
  surveyId: string;
  surveyName?: string;
  action?: "launch" | "close";
  className?: string;
}

export function EXSurveyLaunchButton({
  surveyId,
  surveyName: _surveyName,
  action = "launch",
  className,
}: EXSurveyLaunchButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleAction = () => {
    startTransition(async () => {
      try {
        if (action === "launch") {
          const result = await launchEXSurvey(surveyId);
          if (result.success) {
            toast({ title: "Survey launched successfully" });
            router.refresh();
          } else {
            toast({ title: "Error", description: result.error || "Failed to launch survey", variant: "destructive" });
          }
        } else {
          const result = await closeEXSurvey(surveyId);
          if (result.success) {
            toast({ title: "Survey closed successfully" });
            router.refresh();
          } else {
            toast({ title: "Error", description: result.error || "Failed to close survey", variant: "destructive" });
          }
        }
      } catch (error) {
        console.error(`Failed to ${action} survey:`, error);
        toast({ title: "Error", description: `Failed to ${action} survey`, variant: "destructive" });
      }
    });
  };

  if (action === "launch") {
    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button className={cn(className)} disabled={isPending}>
            <Play className="mr-2 h-4 w-4" />
            {isPending ? "Launching..." : "Launch Survey"}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Launch Survey</AlertDialogTitle>
            <AlertDialogDescription>
              This will send invitations to all targeted employees. The survey will become active
              and start collecting responses. Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleAction} disabled={isPending}>
              {isPending ? "Launching..." : "Launch Survey"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className={cn(className)} disabled={isPending}>
          <StopCircle className="mr-2 h-4 w-4" />
          {isPending ? "Closing..." : "Close Survey"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Close Survey</AlertDialogTitle>
          <AlertDialogDescription>
            This will stop collecting responses. Employees who haven&apos;t responded yet will
            no longer be able to submit. Are you sure you want to close this survey?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleAction} disabled={isPending}>
            {isPending ? "Closing..." : "Close Survey"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
