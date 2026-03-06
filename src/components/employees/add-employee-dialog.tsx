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
import { createEmployee } from "@/lib/employees/actions";
import { useToast } from "@/hooks/use-toast";

interface AddEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddEmployeeDialog({ open, onOpenChange, onSuccess }: AddEmployeeDialogProps) {
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
      const result = await createEmployee({
        email: form.email.trim(),
        fullName: form.fullName.trim(),
        department: form.department.trim() || undefined,
        title: form.title.trim() || undefined,
        phone: form.phone.trim() || undefined,
      });

      if (result.success) {
        toast({ title: "Employee added", description: `${form.fullName} has been added.` });
        resetForm();
        onOpenChange(false);
        onSuccess();
      } else {
        toast({ title: "Error", description: result.error || "Failed to add employee", variant: "destructive" });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-heading-accent">
            Add Employee
          </DialogTitle>
          <DialogDescription>
            Add an employee to your organization&apos;s employee directory.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="employee-email" className="text-heading-accent">
              Email <span className="text-red-500">*</span>
            </Label>
            <Input
              id="employee-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="employee@company.com"
              className="focus-visible:ring-repwell-teal-300"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="employee-name" className="text-heading-accent">
              Full Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="employee-name"
              value={form.fullName}
              onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
              placeholder="Jane Smith"
              className="focus-visible:ring-repwell-teal-300"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="employee-department" className="text-heading-accent">
              Department
            </Label>
            <Input
              id="employee-department"
              value={form.department}
              onChange={(e) => setForm((prev) => ({ ...prev, department: e.target.value }))}
              placeholder="e.g., Lending, Operations"
              className="focus-visible:ring-repwell-teal-300"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="employee-title" className="text-heading-accent">
              Job Title
            </Label>
            <Input
              id="employee-title"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Loan Officer"
              className="focus-visible:ring-repwell-teal-300"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="employee-phone" className="text-heading-accent">
              Phone
            </Label>
            <Input
              id="employee-phone"
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
              "Add Employee"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
