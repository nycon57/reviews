"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  SpinnerGap as Loader2,
  PaperPlaneRight as Send,
  Clock,
} from "@phosphor-icons/react";
import {
  createSurveyAndQueue,
  getLoanOfficersForSend,
  getActiveTemplatesForSend,
} from "@/lib/distribution";

interface LoanOfficer {
  id: string;
  fullName: string;
  email: string;
}

interface Template {
  id: string;
  name: string;
  description: string | null;
}

interface SendSurveyDialogProps {
  onSuccess?: () => void;
}

export function SendSurveyDialog({ onSuccess }: SendSurveyDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const [loanOfficers, setLoanOfficers] = useState<LoanOfficer[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);

  const [formData, setFormData] = useState({
    loanOfficerId: "",
    templateId: "",
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    sendImmediately: true,
  });

  function loadOptions(): void {
    startTransition(async () => {
      setIsLoading(true);
      const [loResult, templateResult] = await Promise.all([
        getLoanOfficersForSend(),
        getActiveTemplatesForSend(),
      ]);

      if (loResult.success && loResult.data) {
        setLoanOfficers(loResult.data);
      }
      if (templateResult.success && templateResult.data) {
        setTemplates(templateResult.data);
      }
      setIsLoading(false);
    });
  }

  function handleOpenChange(newOpen: boolean): void {
    setOpen(newOpen);
    if (newOpen && loanOfficers.length === 0) {
      loadOptions();
    }
  }

  function handleSubmit(e: React.FormEvent): void {
    e.preventDefault();

    if (!formData.loanOfficerId || !formData.templateId) {
      toast({
        title: "Missing fields",
        description: "Please select a loan officer and template",
        variant: "destructive",
      });
      return;
    }

    if (!formData.customerName || !formData.customerEmail) {
      toast({
        title: "Missing fields",
        description: "Please enter customer name and email",
        variant: "destructive",
      });
      return;
    }

    startTransition(async () => {
      const result = await createSurveyAndQueue({
        loanOfficerId: formData.loanOfficerId,
        templateId: formData.templateId,
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone || undefined,
        sendImmediately: formData.sendImmediately,
      });

      if (result.success) {
        const statusMessage =
          result.data?.status === "sent"
            ? "Survey sent successfully"
            : "Survey queued for delivery";

        toast({
          title: "Survey created",
          description: statusMessage,
        });

        setFormData({
          loanOfficerId: "",
          templateId: "",
          customerName: "",
          customerEmail: "",
          customerPhone: "",
          sendImmediately: true,
        });
        setOpen(false);
        onSuccess?.();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to send survey",
          variant: "destructive",
        });
      }
    });
  }

  function updateField<K extends keyof typeof formData>(
    field: K,
    value: (typeof formData)[K]
  ): void {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Send Survey
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Send Survey Request</DialogTitle>
            <DialogDescription>
              Send a survey invitation to a customer. They will receive an email
              with a link to complete the survey.
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="loanOfficer">Loan Officer</Label>
                <Select
                  value={formData.loanOfficerId}
                  onValueChange={(value) => updateField("loanOfficerId", value)}
                >
                  <SelectTrigger id="loanOfficer">
                    <SelectValue placeholder="Select loan officer" />
                  </SelectTrigger>
                  <SelectContent>
                    {loanOfficers.map((lo) => (
                      <SelectItem key={lo.id} value={lo.id}>
                        {lo.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {loanOfficers.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    No active loan officers found
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="template">Survey Template</Label>
                <Select
                  value={formData.templateId}
                  onValueChange={(value) => updateField("templateId", value)}
                >
                  <SelectTrigger id="template">
                    <SelectValue placeholder="Select template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {templates.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    No active templates found. Create one in Surveys.
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="customerName">Customer Name</Label>
                <Input
                  id="customerName"
                  placeholder="John Smith"
                  value={formData.customerName}
                  onChange={(e) => updateField("customerName", e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="customerEmail">Customer Email</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.customerEmail}
                  onChange={(e) => updateField("customerEmail", e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="customerPhone">
                  Customer Phone{" "}
                  <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  id="customerPhone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={formData.customerPhone}
                  onChange={(e) => updateField("customerPhone", e.target.value)}
                />
              </div>

              <div className="flex items-center gap-4 pt-2">
                <Button
                  type="button"
                  variant={formData.sendImmediately ? "default" : "outline"}
                  size="sm"
                  className="flex-1"
                  onClick={() => updateField("sendImmediately", true)}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Send Now
                </Button>
                <Button
                  type="button"
                  variant={formData.sendImmediately ? "outline" : "default"}
                  size="sm"
                  className="flex-1"
                  onClick={() => updateField("sendImmediately", false)}
                >
                  <Clock className="mr-2 h-4 w-4" />
                  Queue for Later
                </Button>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || isLoading}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {formData.sendImmediately ? "Send Survey" : "Queue Survey"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
