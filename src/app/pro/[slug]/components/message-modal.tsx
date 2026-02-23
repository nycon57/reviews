"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ChatCircle, CheckCircle, Spinner } from "@phosphor-icons/react";

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
import { contactRecipient, type ContactRecipientType } from "@/lib/pro/contact-actions";

const messageSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().max(20).optional().or(z.literal("")),
  message: z.string().min(10, "Message must be at least 10 characters").max(2000),
});

type MessageFormData = z.infer<typeof messageSchema>;

interface MessageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** @deprecated Use recipientId instead */
  professionalId?: string;
  /** @deprecated Use recipientName instead */
  professionalName?: string;
  recipientType?: ContactRecipientType;
  recipientId?: string;
  recipientName?: string;
}

export function MessageModal({
  open,
  onOpenChange,
  professionalId,
  professionalName,
  recipientType = "professional",
  recipientId,
  recipientName,
}: MessageModalProps) {
  const resolvedId = recipientId || professionalId || "";
  const resolvedName = recipientName || professionalName || "";
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const missingRecipient = !resolvedId;

  const form = useForm<MessageFormData>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      message: "",
    },
  });

  const onSubmit = async (data: MessageFormData) => {
    if (!resolvedId) {
      setError("Unable to send message — recipient information is missing.");
      return;
    }
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await contactRecipient({
        recipientType,
        recipientId: resolvedId,
        name: data.name,
        email: data.email,
        phone: data.phone || undefined,
        message: data.message,
      });

      if (!result.success) {
        setError(result.error ?? "Failed to send message. Please try again.");
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
            <ChatCircle className="h-5 w-5" />
            Send a Message
          </DialogTitle>
          <DialogDescription>
            Reach out to {resolvedName} directly.
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <div className="py-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-repwell-teal-500 mb-2">
              Message Sent!
            </h3>
            <p className="text-repwell-teal-400 mb-4">
              {resolvedName} will get back to you soon.
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
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
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
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="you@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="(555) 123-4567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="How can they help you?"
                        rows={4}
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
                  disabled={isSubmitting || missingRecipient}
                  className="bg-repwell-teal-300 hover:bg-repwell-teal-400"
                >
                  {isSubmitting ? (
                    <>
                      <Spinner className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Message"
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
