"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  Send,
  Clock,
  Loader2,
  User,
  Mail,
  Phone,
  FileText,
  CheckCircle2,
  Users,
  Plus,
  X,
} from "lucide-react";
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

interface CustomerEntry {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export function SendSurveyForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const [loanOfficers, setLoanOfficers] = useState<LoanOfficer[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);

  const [formData, setFormData] = useState({
    loanOfficerId: "",
    templateId: "",
    sendImmediately: "now" as "now" | "later",
  });

  const [customers, setCustomers] = useState<CustomerEntry[]>([
    { id: "1", name: "", email: "", phone: "" },
  ]);

  const [sentCount, setSentCount] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);

  const loadOptions = useCallback(() => {
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
  }, []);

  useEffect(() => {
    loadOptions();
  }, [loadOptions]);

  function updateField<K extends keyof typeof formData>(
    field: K,
    value: (typeof formData)[K]
  ) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  function updateCustomer(id: string, field: keyof CustomerEntry, value: string) {
    setCustomers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  }

  function addCustomer() {
    setCustomers((prev) => [
      ...prev,
      { id: Date.now().toString(), name: "", email: "", phone: "" },
    ]);
  }

  function removeCustomer(id: string) {
    if (customers.length > 1) {
      setCustomers((prev) => prev.filter((c) => c.id !== id));
    }
  }

  function validateForm(): boolean {
    if (!formData.loanOfficerId) {
      toast({
        title: "Missing loan officer",
        description: "Please select a loan officer",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.templateId) {
      toast({
        title: "Missing template",
        description: "Please select a survey template",
        variant: "destructive",
      });
      return false;
    }

    const validCustomers = customers.filter((c) => c.name && c.email);
    if (validCustomers.length === 0) {
      toast({
        title: "Missing customer info",
        description: "Please enter at least one customer name and email",
        variant: "destructive",
      });
      return false;
    }

    // Validate email formats
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (const customer of validCustomers) {
      if (!emailRegex.test(customer.email)) {
        toast({
          title: "Invalid email",
          description: `Invalid email format for ${customer.name || "customer"}`,
          variant: "destructive",
        });
        return false;
      }
    }

    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!validateForm()) return;

    const validCustomers = customers.filter((c) => c.name && c.email);
    const sendImmediately = formData.sendImmediately === "now";

    startTransition(async () => {
      let successCount = 0;
      let failCount = 0;

      for (const customer of validCustomers) {
        const result = await createSurveyAndQueue({
          loanOfficerId: formData.loanOfficerId,
          templateId: formData.templateId,
          customerName: customer.name,
          customerEmail: customer.email,
          customerPhone: customer.phone || undefined,
          sendImmediately,
        });

        if (result.success) {
          successCount++;
        } else {
          failCount++;
        }
      }

      if (successCount > 0) {
        setSentCount(successCount);
        setShowSuccess(true);

        if (failCount > 0) {
          toast({
            title: "Partially sent",
            description: `${successCount} surveys sent, ${failCount} failed`,
          });
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to send surveys. Please try again.",
          variant: "destructive",
        });
      }
    });
  }

  function handleReset() {
    setShowSuccess(false);
    setSentCount(0);
    setFormData({
      loanOfficerId: "",
      templateId: "",
      sendImmediately: "now",
    });
    setCustomers([{ id: "1", name: "", email: "", phone: "" }]);
  }

  if (showSuccess) {
    return (
      <Card className="max-w-2xl">
        <CardContent className="pt-12 pb-8">
          <div className="text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold">Surveys Sent!</h2>
            <p className="text-muted-foreground">
              {sentCount} survey {sentCount === 1 ? "invitation has" : "invitations have"} been{" "}
              {formData.sendImmediately === "now" ? "sent" : "queued for delivery"}.
            </p>
            <div className="flex justify-center gap-4 pt-4">
              <Button variant="outline" onClick={handleReset}>
                Send More
              </Button>
              <Button onClick={() => router.push("/dashboard/distribution")}>
                View Distribution Queue
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="max-w-2xl">
        <CardContent className="pt-12 pb-8">
          <div className="flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground">Loading options...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-6 max-w-2xl">
        {/* Survey Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Survey Configuration
            </CardTitle>
            <CardDescription>
              Select the loan officer and survey template
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {lo.fullName}
                      </div>
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
                      <div className="flex flex-col">
                        <span>{template.name}</span>
                        {template.description && (
                          <span className="text-xs text-muted-foreground">
                            {template.description}
                          </span>
                        )}
                      </div>
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
          </CardContent>
        </Card>

        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Customer Information
            </CardTitle>
            <CardDescription>
              Enter the customer details for survey recipients
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {customers.map((customer, index) => (
              <div key={customer.id} className="space-y-3">
                {index > 0 && <Separator />}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Customer {index + 1}</span>
                  {customers.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => removeCustomer(customer.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor={`name-${customer.id}`}>Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id={`name-${customer.id}`}
                        placeholder="John Smith"
                        value={customer.name}
                        onChange={(e) => updateCustomer(customer.id, "name", e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`email-${customer.id}`}>Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id={`email-${customer.id}`}
                        type="email"
                        placeholder="john@example.com"
                        value={customer.email}
                        onChange={(e) => updateCustomer(customer.id, "email", e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`phone-${customer.id}`}>
                    Phone <span className="text-muted-foreground">(optional)</span>
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id={`phone-${customer.id}`}
                      type="tel"
                      placeholder="(555) 123-4567"
                      value={customer.phone}
                      onChange={(e) => updateCustomer(customer.id, "phone", e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>
            ))}

            <Button type="button" variant="outline" className="w-full" onClick={addCustomer}>
              <Plus className="mr-2 h-4 w-4" />
              Add Another Customer
            </Button>
          </CardContent>
        </Card>

        {/* Delivery Options */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Delivery Options
            </CardTitle>
            <CardDescription>
              Choose when to send the survey invitations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={formData.sendImmediately}
              onValueChange={(value) => updateField("sendImmediately", value as "now" | "later")}
              className="grid gap-4 sm:grid-cols-2"
            >
              <div>
                <RadioGroupItem
                  value="now"
                  id="send-now"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="send-now"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  <Send className="mb-3 h-6 w-6" />
                  <span className="font-medium">Send Now</span>
                  <span className="text-xs text-muted-foreground text-center mt-1">
                    Deliver immediately
                  </span>
                </Label>
              </div>

              <div>
                <RadioGroupItem
                  value="later"
                  id="send-later"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="send-later"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  <Clock className="mb-3 h-6 w-6" />
                  <span className="font-medium">Queue for Later</span>
                  <span className="text-xs text-muted-foreground text-center mt-1">
                    Add to distribution queue
                  </span>
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Submit button */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={handleReset}>
            Reset
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                {formData.sendImmediately === "now" ? "Send Survey" : "Queue Survey"}
                {customers.filter((c) => c.name && c.email).length > 1 &&
                  `s (${customers.filter((c) => c.name && c.email).length})`}
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
