"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Flag, CheckCircle, Spinner } from "@phosphor-icons/react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { flagReview } from "@/lib/pro-profile/actions";

const REPORT_CATEGORIES = [
  { label: "Inaccurate information", value: "inaccurate_information" },
  { label: "Impersonation", value: "impersonation" },
  { label: "Inappropriate content", value: "inappropriate_content" },
  { label: "Spam/fake review", value: "spam_fake_review" },
  { label: "Other", value: "other" },
] as const;

const reportSchema = z.object({
  reason: z.enum([
    "inaccurate_information",
    "impersonation",
    "inappropriate_content",
    "spam_fake_review",
    "other",
  ], { required_error: "Please select a category" }),
  details: z.string().max(1000).optional(),
  reporterName: z.string().max(100).optional(),
  reporterEmail: z.string().email("Please enter a valid email").optional().or(z.literal("")),
});

type ReportFormData = z.infer<typeof reportSchema>;

interface ReportReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reviewId: string;
}

export function ReportReviewModal({
  open,
  onOpenChange,
  reviewId,
}: ReportReviewModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      reason: undefined,
      details: "",
      reporterName: "",
      reporterEmail: "",
    },
  });

  const onSubmit = async (data: ReportFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await flagReview({
        reviewId,
        reason: data.reason,
        details: data.details || undefined,
        reporterName: data.reporterName || undefined,
        reporterEmail: data.reporterEmail || undefined,
      });

      if (!result.success) {
        setError(result.error ?? "Failed to submit report. Please try again.");
      } else {
        setIsSuccess(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onOpenChange(false);
      setTimeout(() => {
        setIsSuccess(false);
        setError(null);
        form.reset();
      }, 200);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-repwell-teal-500">
            <Flag className="h-5 w-5" />
            Report Review
          </DialogTitle>
          <DialogDescription>
            Help us maintain review quality by reporting issues.
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <div className="py-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-repwell-teal-500 mb-2">
              Report Submitted!
            </h3>
            <p className="text-repwell-teal-400 mb-4">
              We&apos;ll investigate and take appropriate action.
            </p>
            <Button
              onClick={handleClose}
              className="bg-repwell-teal-300 hover:bg-repwell-teal-400"
            >
              Close
            </Button>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a reason" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {REPORT_CATEGORIES.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="details"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Details</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Please describe the issue..."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reporterName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Optional" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reporterEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="So we can follow up if needed"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {error && (
                <p className="text-sm text-red-500 text-center">{error}</p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-repwell-teal-300 hover:bg-repwell-teal-400"
                >
                  {isSubmitting ? (
                    <>
                      <Spinner className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Report"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
