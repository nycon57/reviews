"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  PaperPlaneTilt,
  CheckCircle,
  Spinner,
  CaretDown,
} from "@phosphor-icons/react";

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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { submitReferral } from "@/lib/pro-profile/actions";

/** Format digits as (XXX) XXX-XXXX while typing */
function formatPhoneInput(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length === 0) return "";
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

const phoneSchema = z
  .string()
  .refine((val) => !val || val.replace(/\D/g, "").length === 0 || val.replace(/\D/g, "").length === 10, {
    message: "Please enter a valid 10-digit phone number",
  })
  .optional();

const referralSchema = z.object({
  referredName: z.string().min(1, "Name is required").max(100),
  referredEmail: z.string().email("Please enter a valid email"),
  referredPhone: phoneSchema,
  subject: z.string().min(1, "Subject is required").max(200),
  message: z.string().min(1, "Message is required").max(2000),
  referrerName: z.string().max(100).optional(),
  referrerEmail: z
    .string()
    .email("Please enter a valid email")
    .optional()
    .or(z.literal("")),
  referrerPhone: phoneSchema,
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
  const [successName, setSuccessName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [referrerOpen, setReferrerOpen] = useState(false);

  const defaultMessage = `I'd like to introduce you to ${loanOfficerName}. I think they'd be a great fit for what you're looking for. Take a look at their profile and reviews — I think you'll be impressed.`;

  const form = useForm<ReferralFormData>({
    resolver: zodResolver(referralSchema),
    defaultValues: {
      referredName: "",
      referredEmail: "",
      referredPhone: "",
      subject: `Introducing ${loanOfficerName}`,
      message: defaultMessage,
      referrerName: "",
      referrerEmail: "",
      referrerPhone: "",
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
        setSuccessName(data.referredName);
        setIsSuccess(true);
      } else {
        setError(result.error || "Failed to send introduction");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onOpenChange(false);
      setTimeout(() => {
        setIsSuccess(false);
        setSuccessName("");
        setError(null);
        setReferrerOpen(false);
        form.reset({
          referredName: "",
          referredEmail: "",
          referredPhone: "",
          subject: `Introducing ${loanOfficerName}`,
          message: defaultMessage,
          referrerName: "",
          referrerEmail: "",
          referrerPhone: "",
        });
      }, 200);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-repwell-teal-500">
            <PaperPlaneTilt className="h-5 w-5" />
            Introduce a Friend
          </DialogTitle>
          <DialogDescription>
            Send {loanOfficerName}&apos;s profile directly to someone you think
            would benefit from working with them.
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <div className="py-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-repwell-teal-500 mb-2">
              Introduction Sent!
            </h3>
            <p className="text-repwell-teal-400 mb-4">
              {successName} will receive an email with {loanOfficerName}&apos;s
              profile.
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
              {/* Recipient Section */}
              <div className="space-y-3">
                <h4 className="font-medium text-repwell-teal-500 text-sm">
                  Recipient
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
                        <FormLabel>Their Email *</FormLabel>
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
                          <Input
                            placeholder="(555) 123-4567"
                            type="tel"
                            {...field}
                            onChange={(e) => field.onChange(formatPhoneInput(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Email Content */}
              <div className="space-y-3 pt-2 border-t">
                <h4 className="font-medium text-repwell-teal-500 text-sm pt-2">
                  Email
                </h4>
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Message *</FormLabel>
                      <FormControl>
                        <Textarea rows={4} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Collapsible Referrer Info */}
              <Collapsible
                open={referrerOpen}
                onOpenChange={setReferrerOpen}
                className="border-t pt-2"
              >
                <CollapsibleTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-1.5 text-sm font-medium text-repwell-teal-400 hover:text-repwell-teal-500 transition-colors w-full"
                  >
                    <CaretDown
                      className={`h-4 w-4 transition-transform ${referrerOpen ? "rotate-180" : ""}`}
                    />
                    Your Information (Optional)
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-3 pt-3">
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
                            <Input
                              placeholder="(555) 123-4567"
                              type="tel"
                              {...field}
                              onChange={(e) => field.onChange(formatPhoneInput(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CollapsibleContent>
              </Collapsible>

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
                      Sending...
                    </>
                  ) : (
                    <>
                      <PaperPlaneTilt className="h-4 w-4 mr-2" />
                      Send Introduction
                    </>
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
