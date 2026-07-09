"use client";

import { useState } from "react";
import { useRef } from "react";
import { House, PaperPlaneRight } from "@phosphor-icons/react";
import { IconContainer } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { SendReviewRequestDialog } from "@/components/requests/send-review-request-dialog";

interface DashboardHeaderProps {
  userName?: string | null;
}

export function DashboardHeader({ userName }: DashboardHeaderProps) {
  const firstName = userName?.split(" ")[0] || "there";
  const [dialogOpen, setDialogOpen] = useState(false);
  const requestButtonRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <IconContainer size="lg" bg="subtle">
            <House className="h-6 w-6 text-repwell-teal-300 dark:text-repwell-sage-200" />
          </IconContainer>
          <div>
            <h1 className="font-display text-heading-lg font-bold leading-tight tracking-tight text-heading">
              Hello, {firstName}
            </h1>
            <p className="text-sm leading-snug text-label">
              Here&apos;s an overview of your performance.
            </p>
          </div>
        </div>
        <Button ref={requestButtonRef} onClick={() => setDialogOpen(true)} size="sm">
          <PaperPlaneRight className="mr-1.5 h-4 w-4" />
          Send review request
        </Button>
      </div>
      <SendReviewRequestDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={() => setDialogOpen(false)}
        restoreFocusRef={requestButtonRef}
      />
    </>
  );
}
