"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { contactProfessional } from "@/lib/pro/contact-actions";

interface ContactFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  professionalId: string;
  professionalName: string;
}

export function ContactFormModal({
  open,
  onOpenChange,
  professionalId,
  professionalName,
}: ContactFormModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  function reset() {
    setName("");
    setEmail("");
    setPhone("");
    setMessage("");
    setStatus("idle");
    setErrorMsg("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    const result = await contactProfessional({
      professionalId,
      name,
      email,
      phone: phone || undefined,
      message,
    });

    if (result.success) {
      setStatus("success");
    } else {
      setStatus("error");
      setErrorMsg(result.error || "Failed to send message. Please try again.");
    }
  }

  function handleOpenChange(open: boolean) {
    if (!open) reset();
    onOpenChange(open);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-repwell-teal-500 font-display">
            Send a Message to {professionalName}
          </DialogTitle>
        </DialogHeader>

        {status === "success" ? (
          <div className="py-6 text-center space-y-3">
            <p className="text-repwell-teal-500 font-semibold text-lg">Message Sent!</p>
            <p className="text-sm text-muted-foreground">
              {professionalName} will get back to you soon.
            </p>
            <Button
              onClick={() => handleOpenChange(false)}
              className="bg-repwell-teal-300 hover:bg-repwell-teal-400"
            >
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="cf-name">Name <span className="text-destructive">*</span></Label>
              <Input
                id="cf-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Your full name"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cf-email">Email <span className="text-destructive">*</span></Label>
              <Input
                id="cf-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cf-phone">Phone (optional)</Label>
              <Input
                id="cf-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 000-0000"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cf-message">Message <span className="text-destructive">*</span></Label>
              <Textarea
                id="cf-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                placeholder="How can they help you?"
                rows={4}
              />
            </div>

            {status === "error" && (
              <p className="text-sm text-destructive">{errorMsg}</p>
            )}

            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={status === "loading"}
                className="flex-1 bg-repwell-teal-300 hover:bg-repwell-teal-400"
              >
                {status === "loading" ? "Sending…" : "Send Message"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
