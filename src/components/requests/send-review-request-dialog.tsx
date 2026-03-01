"use client";

import { useState, useEffect, useTransition } from "react";
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
import {
  Envelope,
  ChatText,
  Star,
  VideoCamera,
  User as UserIcon,
  UploadSimple,
} from "@phosphor-icons/react";
import { getActiveTemplatesForSend } from "@/lib/distribution/actions";
import { getSmsTemplatesForSend } from "@/lib/sms/send/actions";
import { unifiedGetUser } from "@/lib/auth/actions";
import { SingleRequestForm } from "./single-request-form";
import { BulkRequestFlow } from "./bulk-request-flow";
import { staggerContainer, fadeInUp } from "@/lib/motion";
import type { RequestType, SendMethod, SurveyTemplateSummary } from "@/lib/requests/bulk-request-types";
import type { SmsTemplate } from "@/lib/sms/types";

const BRANDED_TOGGLE_ITEM =
  "flex-1 gap-2 data-[state=on]:bg-repwell-teal-300 data-[state=on]:text-white data-[state=on]:ring-1 data-[state=on]:ring-repwell-teal-300/50 data-[state=off]:bg-muted/50 data-[state=off]:hover:bg-muted rounded-lg";

interface SendReviewRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function SendReviewRequestDialog({
  open,
  onOpenChange,
  onSuccess,
}: SendReviewRequestDialogProps) {
  const [isPending, startTransition] = useTransition();

  // Toggle state
  const [requestType, setRequestType] = useState<RequestType>("text");
  const [sendMethod, setSendMethod] = useState<SendMethod>("email");
  const [mode, setMode] = useState<"single" | "bulk">("single");

  // Data
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [surveyTemplates, setSurveyTemplates] = useState<SurveyTemplateSummary[]>([]);
  const [smsTemplates, setSmsTemplates] = useState<SmsTemplate[]>([]);
  // Load data each time the dialog opens
  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    startTransition(async () => {
      const [userResult, surveyResult, smsResult] = await Promise.all([
        unifiedGetUser(),
        getActiveTemplatesForSend(),
        getSmsTemplatesForSend(),
      ]);

      if (cancelled) return;

      if (userResult) {
        setCurrentUserId(userResult.id);
      } else {
        setCurrentUserId(null);
      }
      if (surveyResult.success && surveyResult.data) {
        setSurveyTemplates(surveyResult.data);
      }
      if (smsResult.success && smsResult.data) {
        setSmsTemplates(smsResult.data);
      }
    });

    return () => { cancelled = true; };
  }, [open]);

  function handleClose() {
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Send Review Request</DialogTitle>
          <DialogDescription>
            Send a review or video testimonial request to your customer.
          </DialogDescription>
        </DialogHeader>

        {isPending ? (
          <div className="py-12" />
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

              {/* Send Method Toggle */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Send via</Label>
                <ToggleGroup
                  type="single"
                  value={sendMethod}
                  onValueChange={(v) => {
                    if (v) setSendMethod(v as SendMethod);
                  }}
                  className="w-full"
                >
                  <ToggleGroupItem
                    value="email"
                    className={BRANDED_TOGGLE_ITEM}
                    aria-label="Email"
                  >
                    <Envelope className="h-4 w-4" />
                    Email
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="sms"
                    className={BRANDED_TOGGLE_ITEM}
                    aria-label="SMS"
                  >
                    <ChatText className="h-4 w-4" />
                    SMS
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
                    sendMethod={sendMethod}
                    currentUserId={currentUserId}
                    surveyTemplates={surveyTemplates}
                    smsTemplates={smsTemplates}
                    onSuccess={onSuccess}
                    onClose={handleClose}
                  />
                </TabsContent>

                <TabsContent value="bulk" className="pt-4">
                  <BulkRequestFlow
                    requestType={requestType}
                    sendMethod={sendMethod}
                    surveyTemplates={surveyTemplates}
                    smsTemplates={smsTemplates}
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
