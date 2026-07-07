"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Star, CheckCircle, Spinner, PencilSimple } from "@phosphor-icons/react";

import posthog from "posthog-js";
import { cn } from "@/lib/utils";
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
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { submitPublicReview } from "@/lib/pro-profile/actions";

const reviewSchema = z.object({
  rating: z.number().int().min(1, "Please select a rating").max(5),
  title: z.string().max(200).optional(),
  text: z.string().min(10, "Review must be at least 10 characters").max(2000),
  customerName: z.string().max(100).optional(),
  customerEmail: z.string().email("Please enter a valid email"),
  customerLocation: z.string().max(100).optional(),
  consentGiven: z.boolean().refine((val) => val === true, {
    message: "You must agree to the terms to submit a review",
  }),
});

type ReviewFormData = z.infer<typeof reviewSchema>;

interface WriteReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loanOfficerId: string;
  loanOfficerName: string;
}

function StarRatingInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const [hoverValue, setHoverValue] = useState(0);

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className="p-1 focus:outline-none focus:ring-2 focus:ring-repwell-teal-300 rounded"
          onMouseEnter={() => setHoverValue(star)}
          onMouseLeave={() => setHoverValue(0)}
          onClick={() => onChange(star)}
        >
          <Star
            weight="fill"
            className={cn(
              "h-8 w-8 transition-colors",
              (hoverValue || value) >= star
                ? "text-amber-500"
                : "text-gray-200"
            )}
          />
        </button>
      ))}
      {value > 0 && (
        <span className="ml-2 text-sm text-repwell-teal-400">
          {value === 5
            ? "Excellent!"
            : value === 4
              ? "Great"
              : value === 3
                ? "Good"
                : value === 2
                  ? "Fair"
                  : "Poor"}
        </span>
      )}
    </div>
  );
}

export function WriteReviewModal({
  open,
  onOpenChange,
  loanOfficerId,
  loanOfficerName,
}: WriteReviewModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  const form = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 0,
      title: "",
      text: "",
      customerName: "",
      customerEmail: "",
      customerLocation: "",
      consentGiven: false,
    },
  });

  const onSubmit = async (data: ReviewFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await submitPublicReview({
        loanOfficerId,
        ...data,
      });

      if (result.success) {
        posthog.capture("review_submitted", {
          professional_id: loanOfficerId,
          rating: data.rating,
          has_title: Boolean(data.title),
          review_length: data.text.length,
        });
        setIsSuccess(true);
        setSubmittedEmail(data.customerEmail);
      } else {
        setError(result.error || "Failed to submit review");
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
      // Reset state after modal closes
      setTimeout(() => {
        setIsSuccess(false);
        setSubmittedEmail("");
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
            <PencilSimple className="h-5 w-5" />
            Write a Review
          </DialogTitle>
          <DialogDescription>
            Share your experience working with {loanOfficerName}.
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <div className="py-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-repwell-teal-500 mb-2">
              Check your email to publish your review
            </h3>
            <p className="text-repwell-teal-400 mb-4">
              We sent a confirmation link to {submittedEmail}.
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
              {/* Star Rating */}
              <FormField
                control={form.control}
                name="rating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Rating *</FormLabel>
                    <FormControl>
                      <StarRatingInput
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Review Title */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Review Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Summarize your experience"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Review Text */}
              <FormField
                control={form.control}
                name="text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Review *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell others about your experience..."
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Minimum 10 characters
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Personal Information */}
              <div className="space-y-3 pt-2 border-t">
                <h4 className="font-medium text-repwell-teal-500 text-sm pt-2">
                  Your Information
                </h4>
                <FormField
                  control={form.control}
                  name="customerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John D." {...field} />
                      </FormControl>
                      <FormDescription>
                        This will be shown with your review
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="customerEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="you@example.com"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        We&apos;ll send you a quick link to confirm your review.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="customerLocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="City, State" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Consent */}
              <FormField
                control={form.control}
                name="consentGiven"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="cursor-pointer">
                        I agree to the terms and conditions
                      </FormLabel>
                      <FormDescription>
                        By submitting this review, you agree that it may be
                        displayed publicly and used for marketing purposes.
                      </FormDescription>
                      <FormMessage />
                    </div>
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
                    "Submit Review"
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
