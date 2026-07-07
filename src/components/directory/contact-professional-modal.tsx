"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PaperPlaneTilt, CheckCircle } from "@phosphor-icons/react";
import { contactProfessional } from "@/lib/directory/contact-action";
import { getInitials } from "@/lib/utils";

interface ContactProfessionalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  professional: {
    id: string;
    full_name: string;
    title: string | null;
    photo_url: string | null;
  };
}

export function ContactProfessionalModal({
  open,
  onOpenChange,
  professional,
}: ContactProfessionalModalProps) {
  const [isPending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await contactProfessional({
        professionalId: professional.id,
        professionalName: professional.full_name,
        senderName: form.name,
        senderEmail: form.email,
        message: form.message,
      });
      if (result.success) {
        setSent(true);
      } else {
        setError(result.error ?? "Something went wrong.");
      }
    });
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      // Reset after close animation finishes
      setTimeout(() => {
        setSent(false);
        setError(null);
        setForm({ name: "", email: "", message: "" });
      }, 200);
    }
    onOpenChange(open);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        {sent ? (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <CheckCircle className="h-12 w-12 text-repwell-teal-300" weight="duotone" />
            <DialogTitle>Message sent!</DialogTitle>
            <DialogDescription>
              {professional.full_name} will receive your message and can reply directly to your
              email.
            </DialogDescription>
            <Button onClick={() => handleOpenChange(false)} className="mt-2">
              Done
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3 mb-1">
                <Avatar className="h-10 w-10 border border-muted">
                  <AvatarImage src={professional.photo_url ?? undefined} alt={professional.full_name} />
                  <AvatarFallback className="text-sm font-semibold bg-primary/10 text-primary">
                    {getInitials(professional.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <DialogTitle>Contact {professional.full_name}</DialogTitle>
                  {professional.title && (
                    <DialogDescription>{professional.title}</DialogDescription>
                  )}
                </div>
              </div>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="contact-name">Your name</Label>
                  <Input
                    id="contact-name"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Jane Smith"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="contact-email">Your email</Label>
                  <Input
                    id="contact-email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="jane@example.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="contact-message">Message</Label>
                <Textarea
                  id="contact-message"
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  placeholder={`Hi ${professional.full_name.split(" ")[0]}, I found your profile on RepWell and…`}
                  rows={5}
                  required
                  minLength={10}
                />
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => handleOpenChange(false)}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  <PaperPlaneTilt className="mr-1.5 h-4 w-4" />
                  {isPending ? "Sending…" : "Send message"}
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
