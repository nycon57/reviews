"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SpinnerGap as Loader2 } from "@phosphor-icons/react";
import { createContact } from "@/lib/contacts/actions";
import { useToast } from "@/hooks/use-toast";

interface AddContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddContactDialog({ open, onOpenChange, onSuccess }: AddContactDialogProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    email: "",
    fullName: "",
    department: "",
    title: "",
    phone: "",
  });

  const resetForm = () => {
    setForm({ email: "", fullName: "", department: "", title: "", phone: "" });
  };

  const handleSubmit = () => {
    if (!form.email.trim() || !form.fullName.trim()) return;

    startTransition(async () => {
      const result = await createContact({
        email: form.email.trim(),
        fullName: form.fullName.trim(),
        department: form.department.trim() || undefined,
        title: form.title.trim() || undefined,
        phone: form.phone.trim() || undefined,
      });

      if (result.success) {
        toast({ title: "Contact added", description: `${form.fullName} has been added.` });
        resetForm();
        onOpenChange(false);
        onSuccess();
      } else {
        toast({ title: "Error", description: result.error || "Failed to add contact", variant: "destructive" });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-repwell-teal-500">
            Add Contact
          </DialogTitle>
          <DialogDescription>
            Add an employee to your organization&apos;s contact directory.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="contact-email" className="text-repwell-teal-500">
              Email <span className="text-red-500">*</span>
            </Label>
            <Input
              id="contact-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="employee@company.com"
              className="focus-visible:ring-repwell-teal-300"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact-name" className="text-repwell-teal-500">
              Full Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="contact-name"
              value={form.fullName}
              onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
              placeholder="Jane Smith"
              className="focus-visible:ring-repwell-teal-300"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact-department" className="text-repwell-teal-500">
              Department
            </Label>
            <Input
              id="contact-department"
              value={form.department}
              onChange={(e) => setForm((prev) => ({ ...prev, department: e.target.value }))}
              placeholder="e.g., Lending, Operations"
              className="focus-visible:ring-repwell-teal-300"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact-title" className="text-repwell-teal-500">
              Job Title
            </Label>
            <Input
              id="contact-title"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Loan Officer"
              className="focus-visible:ring-repwell-teal-300"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact-phone" className="text-repwell-teal-500">
              Phone
            </Label>
            <Input
              id="contact-phone"
              type="tel"
              value={form.phone}
              onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
              placeholder="(555) 123-4567"
              className="focus-visible:ring-repwell-teal-300"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { resetForm(); onOpenChange(false); }}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || !form.email.trim() || !form.fullName.trim()}
            className="bg-repwell-teal-300 hover:bg-repwell-teal-400 text-white"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              "Add Contact"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
