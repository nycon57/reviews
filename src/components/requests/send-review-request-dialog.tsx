"use client";

import { useState, useEffect, useTransition, type RefObject } from "react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Star,
  VideoCamera,
  User as UserIcon,
  UploadSimple,
} from "@phosphor-icons/react";
import { unifiedGetUser } from "@/lib/auth/actions";
import { SingleRequestForm } from "./single-request-form";
import { BulkRequestFlow } from "./bulk-request-flow";
import { staggerContainer, fadeInUp } from "@/lib/motion";
import type { RequestType } from "@/lib/requests/bulk-request-types";

const BRANDED_TOGGLE_ITEM =
  "flex-1 gap-2 data-[state=on]:bg-repwell-teal-300 data-[state=on]:text-white data-[state=on]:ring-1 data-[state=on]:ring-repwell-teal-300/50 data-[state=off]:bg-muted/50 data-[state=off]:hover:bg-muted rounded-lg";

interface SendReviewRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  currentUserId?: string | null;
  restoreFocusRef?: RefObject<HTMLElement | null>;
}

function SendReviewRequestSkeleton() {
  return (
    <div className="space-y-5 py-1" aria-label="Loading review request form">
      <div className="rounded-xl bg-muted/30 p-4">
        <Skeleton className="h-4 w-24" />
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Skeleton className="h-10 rounded-lg" />
          <Skeleton className="h-10 rounded-lg" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Skeleton className="h-10 rounded-lg" />
        <Skeleton className="h-10 rounded-lg" />
      </div>
      <div className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-10 rounded-md" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-10 rounded-md" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 rounded-md" />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Skeleton className="h-10 w-20 rounded-md" />
        <Skeleton className="h-10 w-40 rounded-md" />
      </div>
    </div>
  );
}

export function SendReviewRequestDialog({
  open,
  onOpenChange,
  onSuccess,
  currentUserId: providedCurrentUserId,
  restoreFocusRef,
}: SendReviewRequestDialogProps) {
  const [isPending, startTransition] = useTransition();

  // Toggle state
  const [requestType, setRequestType] = useState<RequestType>("text");
  const [mode, setMode] = useState<"single" | "bulk">("single");

  // Data
  const [fallbackCurrentUserId, setFallbackCurrentUserId] = useState<string | null>(null);
  const currentUserId = providedCurrentUserId ?? fallbackCurrentUserId;

  // Prefer the caller-provided user id; fetch only as a fallback.
  useEffect(() => {
    if (!open) return;
    if (providedCurrentUserId) return;
    if (currentUserId) return;

    let cancelled = false;

    startTransition(async () => {
      const userResult = await unifiedGetUser();

      if (cancelled) return;

      if (userResult) {
        setFallbackCurrentUserId(userResult.id);
      } else {
        setFallbackCurrentUserId(null);
      }
    });

    return () => { cancelled = true; };
  }, [open, providedCurrentUserId, currentUserId]);

  function handleClose() {
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto"
        onCloseAutoFocus={(event) => {
          if (!restoreFocusRef?.current) return;
          event.preventDefault();
          restoreFocusRef.current.focus();
        }}
      >
        <DialogHeader>
          <DialogTitle>Send review request</DialogTitle>
          <DialogDescription>
            Send a review request or video testimonial request to your customer.
          </DialogDescription>
        </DialogHeader>

        {isPending && !currentUserId ? (
          <SendReviewRequestSkeleton />
        ) : !currentUserId ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-sm text-muted-foreground">
              Unable to load user data. Please try again.
            </p>
          </div>
        ) : (
          <motion.div
            className="space-y-5"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {/* Config card */}
            <motion.div
              variants={fadeInUp}
              className="bg-muted/30 rounded-xl p-4 space-y-4"
            >
              {/* Request Type Toggle */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Request type</Label>
                <ToggleGroup
                  type="single"
                  value={requestType}
                  onValueChange={(v) => {
                    if (v) setRequestType(v as RequestType);
                  }}
                  className="w-full"
                >
                  <ToggleGroupItem
                    value="text"
                    className={BRANDED_TOGGLE_ITEM}
                    aria-label="Text review"
                  >
                    <Star className="h-4 w-4" />
                    Text Review
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="video"
                    className={BRANDED_TOGGLE_ITEM}
                    aria-label="Video review"
                  >
                    <VideoCamera className="h-4 w-4" />
                    Video Review
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            </motion.div>

            {/* Mode Tabs: Single vs Bulk */}
            <motion.div variants={fadeInUp}>
              <Tabs
                value={mode}
                onValueChange={(v) => setMode(v as "single" | "bulk")}
              >
                <TabsList variant="pills" className="w-full">
                  <TabsTrigger variant="pills" value="single" className="flex-1 gap-2">
                    <UserIcon className="h-4 w-4" />
                    Single
                  </TabsTrigger>
                  <TabsTrigger variant="pills" value="bulk" className="flex-1 gap-2">
                    <UploadSimple className="h-4 w-4" />
                    Bulk Import
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="single" className="pt-4">
                  <SingleRequestForm
                    requestType={requestType}
                    currentUserId={currentUserId}
                    onSuccess={onSuccess}
                    onClose={handleClose}
                  />
                </TabsContent>

                <TabsContent value="bulk" className="pt-4">
                  <BulkRequestFlow
                    requestType={requestType}
                    onSuccess={onSuccess}
                    onClose={handleClose}
                  />
                </TabsContent>
              </Tabs>
            </motion.div>
          </motion.div>
        )}
      </DialogContent>
    </Dialog>
  );
}
