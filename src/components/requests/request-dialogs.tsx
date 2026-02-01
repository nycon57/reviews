"use client";

import { useState } from "react";
import {
  ArrowsClockwise as RefreshCw,
  PaperPlaneRight as Send,
  Envelope as Mail,
  UploadSimple as Upload,
  Users,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import {
  createVideoTestimonialRequest,
  createBulkVideoTestimonialRequests,
  type CreateVideoTestimonialRequestInput,
} from "@/lib/video-testimonials/actions";

// ============================================================================
// Types
// ============================================================================

interface TeamMember {
  id: string;
  fullName: string;
  email: string;
}

// ============================================================================
// Create Request Dialog
// ============================================================================

interface CreateRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamMembers: TeamMember[];
  onSuccess: () => void;
}

export function CreateRequestDialog({
  open,
  onOpenChange,
  teamMembers,
  onSuccess,
}: CreateRequestDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"single" | "bulk">("single");

  const [singleForm, setSingleForm] = useState({
    loanOfficerId: "",
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    promptText: "",
    maxDurationSeconds: 120,
  });

  const [bulkText, setBulkText] = useState("");

  const handleSingleSubmit = async () => {
    if (!singleForm.loanOfficerId || !singleForm.customerName || !singleForm.customerEmail) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const input: CreateVideoTestimonialRequestInput = {
        loanOfficerId: singleForm.loanOfficerId,
        customerName: singleForm.customerName,
        customerEmail: singleForm.customerEmail,
        customerPhone: singleForm.customerPhone || undefined,
        promptText: singleForm.promptText || undefined,
        maxDurationSeconds: singleForm.maxDurationSeconds,
        sendImmediately: true,
      };

      const result = await createVideoTestimonialRequest(input);

      if (result.success) {
        toast({ title: "Success", description: "Video testimonial request created successfully" });
        setSingleForm({
          loanOfficerId: "",
          customerName: "",
          customerEmail: "",
          customerPhone: "",
          promptText: "",
          maxDurationSeconds: 120,
        });
        onOpenChange(false);
        onSuccess();
      } else {
        toast({ title: "Error", description: result.error || "Failed to create request", variant: "destructive" });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkSubmit = async () => {
    const lines = bulkText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length === 0) {
      toast({ title: "Error", description: "Please enter at least one request", variant: "destructive" });
      return;
    }

    if (lines.length > 100) {
      toast({ title: "Error", description: `Too many requests (${lines.length}). Maximum is 100 per batch.`, variant: "destructive" });
      return;
    }

    const requests: CreateVideoTestimonialRequestInput[] = [];
    const errors: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const parts = lines[i].split(",").map((p) => p.trim());
      if (parts.length < 3) {
        errors.push(`Line ${i + 1}: Expected format: UserID, CustomerName, CustomerEmail`);
        continue;
      }

      const [loanOfficerId, customerName, customerEmail] = parts;

      if (!loanOfficerId || !customerName || !customerEmail) {
        errors.push(`Line ${i + 1}: Missing required fields`);
        continue;
      }

      if (!teamMembers.some((m) => m.id === loanOfficerId)) {
        errors.push(`Line ${i + 1}: Unknown team member ID "${loanOfficerId}"`);
        continue;
      }

      if (!customerEmail.includes("@")) {
        errors.push(`Line ${i + 1}: Invalid email format`);
        continue;
      }

      requests.push({
        loanOfficerId,
        customerName,
        customerEmail,
        sendImmediately: true,
        maxDurationSeconds: 120,
      });
    }

    if (errors.length > 0) {
      toast({ title: "Error", description: errors.slice(0, 3).join("\n"), variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createBulkVideoTestimonialRequests({ requests });

      if (result.success && result.data) {
        const { totalCreated, totalFailed } = result.data;
        if (totalFailed > 0) {
          toast({ title: "Partial Success", description: `Created ${totalCreated} requests, ${totalFailed} failed` });
        } else {
          toast({ title: "Success", description: `Successfully created ${totalCreated} requests` });
        }
        setBulkText("");
        onOpenChange(false);
        onSuccess();
      } else {
        toast({ title: "Error", description: result.error || "Failed to create bulk requests", variant: "destructive" });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Video Testimonial Request</DialogTitle>
          <DialogDescription>
            Send a video testimonial request to your customers
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "single" | "bulk")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="single" className="gap-2">
              <Mail className="h-4 w-4" />
              Single Request
            </TabsTrigger>
            <TabsTrigger value="bulk" className="gap-2">
              <Upload className="h-4 w-4" />
              Bulk Import
            </TabsTrigger>
          </TabsList>

          <TabsContent value="single" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="loanOfficer">Team Member *</Label>
              <Select
                value={singleForm.loanOfficerId}
                onValueChange={(value) =>
                  setSingleForm((prev) => ({ ...prev, loanOfficerId: value }))
                }
              >
                <SelectTrigger id="loanOfficer">
                  <SelectValue placeholder="Select team member" />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="customerName">Customer Name *</Label>
                <Input
                  id="customerName"
                  value={singleForm.customerName}
                  onChange={(e) =>
                    setSingleForm((prev) => ({ ...prev, customerName: e.target.value }))
                  }
                  placeholder="John Smith"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerEmail">Customer Email *</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  value={singleForm.customerEmail}
                  onChange={(e) =>
                    setSingleForm((prev) => ({ ...prev, customerEmail: e.target.value }))
                  }
                  placeholder="john@example.com"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="customerPhone">Customer Phone (Optional)</Label>
                <Input
                  id="customerPhone"
                  type="tel"
                  value={singleForm.customerPhone}
                  onChange={(e) =>
                    setSingleForm((prev) => ({ ...prev, customerPhone: e.target.value }))
                  }
                  placeholder="(555) 123-4567"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxDuration">Max Video Duration</Label>
                <Select
                  value={String(singleForm.maxDurationSeconds)}
                  onValueChange={(value) =>
                    setSingleForm((prev) => ({ ...prev, maxDurationSeconds: Number(value) }))
                  }
                >
                  <SelectTrigger id="maxDuration">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="60">1 minute</SelectItem>
                    <SelectItem value="120">2 minutes</SelectItem>
                    <SelectItem value="180">3 minutes</SelectItem>
                    <SelectItem value="300">5 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="promptText">Custom Prompt (Optional)</Label>
              <Textarea
                id="promptText"
                value={singleForm.promptText}
                onChange={(e) =>
                  setSingleForm((prev) => ({ ...prev, promptText: e.target.value }))
                }
                placeholder="Share your experience working with us..."
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSingleSubmit} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Request
                  </>
                )}
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="bulk" className="space-y-4 pt-4">
            <div className="rounded-lg border border-dashed p-4">
              <div className="text-sm text-muted-foreground mb-2">
                <strong>Format:</strong> One request per line:{" "}
                <code className="bg-muted px-1 rounded">UserID, CustomerName, CustomerEmail</code>
              </div>
              <div className="text-sm text-muted-foreground">
                <strong>Example:</strong>
                <pre className="mt-1 bg-muted p-2 rounded text-xs">
{`abc123-uuid, John Smith, john@example.com
def456-uuid, Jane Doe, jane@example.com`}
                </pre>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="bulkText">Bulk Requests</Label>
                <span className="text-xs text-muted-foreground">
                  Max 100 requests per batch
                </span>
              </div>
              <Textarea
                id="bulkText"
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder="Paste your CSV data here..."
                rows={10}
                className="font-mono text-sm"
              />
            </div>

            <div className="rounded-lg bg-muted/50 p-3">
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Team Member IDs:</span>
              </div>
              <div className="mt-2 max-h-32 overflow-auto">
                {teamMembers.map((member) => (
                  <div key={member.id} className="text-xs text-muted-foreground py-0.5">
                    <code className="bg-white px-1 rounded">{member.id}</code> - {member.fullName}
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleBulkSubmit} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Import Requests
                  </>
                )}
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Cancel Request Dialog
// ============================================================================

interface CancelRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isCancelling: boolean;
}

export function CancelRequestDialog({
  open,
  onOpenChange,
  onConfirm,
  isCancelling,
}: CancelRequestDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel Video Testimonial Request?</AlertDialogTitle>
          <AlertDialogDescription>
            This will cancel the request and prevent the customer from submitting a video
            testimonial. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isCancelling}>Keep Request</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isCancelling}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isCancelling ? "Cancelling..." : "Cancel Request"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
