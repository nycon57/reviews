"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Users, CheckCircle, Spinner } from "@phosphor-icons/react";

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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { submitReferral } from "@/lib/pro-profile/actions";

const referralSchema = z.object({
  referrerName: z.string().max(100).optional(),
  referrerEmail: z
    .string()
    .email("Please enter a valid email")
    .optional()
    .or(z.literal("")),
  referrerPhone: z.string().max(20).optional(),
  referredName: z.string().min(1, "Name is required").max(100),
  referredEmail: z
    .string()
    .email("Please enter a valid email")
    .optional()
    .or(z.literal("")),
  referredPhone: z.string().max(20).optional(),
  message: z.string().max(1000).optional(),
});

type ReferralFormData = z.infer<typeof referralSchema>;

interface ReferFriendModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loanOfficerId: string;
  loanOfficerName: string;
}

export function ReferFriendModal({
  open,
  onOpenChange,
  loanOfficerId,
  loanOfficerName,
}: ReferFriendModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<ReferralFormData>({
    resolver: zodResolver(referralSchema),
    defaultValues: {
      referrerName: "",
      referrerEmail: "",
      referrerPhone: "",
      referredName: "",
      referredEmail: "",
      referredPhone: "",
      message: "",
    },
  });

  const onSubmit = async (data: ReferralFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await submitReferral({
        loanOfficerId,
        ...data,
      });

      if (result.success) {
        setIsSuccess(true);
      } else {
        setError(result.error || "Failed to submit referral");
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
        setError(null);
        form.reset();
      }, 200);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-repwell-teal-500">
            <Users className="h-5 w-5" />
            Refer a Friend
          </DialogTitle>
          <DialogDescription>
            Know someone who could benefit from working with {loanOfficerName}?
            Fill out the form below to send a referral.
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <div className="py-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-repwell-teal-500 mb-2">
              Referral Submitted!
            </h3>
            <p className="text-repwell-teal-400 mb-4">
              Thank you for your referral. {loanOfficerName} will reach out to your
              contact soon.
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
              {/* Referred Person Section */}
              <div className="space-y-3">
                <h4 className="font-medium text-repwell-teal-500 text-sm">
                  Person You&apos;re Referring
                </h4>
                <FormField
                  control={form.control}
                  name="referredName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Their Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="John Smith" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="referredEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Their Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="john@example.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="referredPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Their Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="(555) 123-4567" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Referrer Section */}
              <div className="space-y-3 pt-2 border-t">
                <h4 className="font-medium text-repwell-teal-500 text-sm pt-2">
                  Your Information (Optional)
                </h4>
                <FormField
                  control={form.control}
                  name="referrerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="referrerEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="you@example.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="referrerPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="(555) 123-4567" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Message */}
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Message</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any additional information about the referral..."
                        rows={3}
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
                    "Submit Referral"
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
