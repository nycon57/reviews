"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Pencil,
  Trash as Trash2,
} from "@phosphor-icons/react";
import { createActionPlan, updateActionPlan, deleteActionPlan } from "@/lib/ex-surveys/actions";
import { useToast } from "@/hooks/use-toast";
import type { EXActionPlan } from "@/types/ex-survey.types";

interface ActionPlanDialogProps {
  mode: "create" | "edit";
  plan?: EXActionPlan;
  surveyId?: string;
}

type ActionPlanPriority = "low" | "medium" | "high" | "critical";
type ActionPlanStatus = "planned" | "in_progress" | "completed" | "cancelled";

interface FormData {
  title: string;
  description: string;
  theme: string;
  priority: ActionPlanPriority;
  status: ActionPlanStatus;
  targetDate: string;
  notes: string;
}

const themes = [
  { value: "engagement", label: "Engagement" },
  { value: "leadership", label: "Leadership" },
  { value: "communication", label: "Communication" },
  { value: "work_life_balance", label: "Work-Life Balance" },
  { value: "career_growth", label: "Career Growth" },
  { value: "compensation", label: "Compensation" },
  { value: "culture", label: "Culture" },
  { value: "other", label: "Other" },
];

const priorities = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

const statuses = [
  { value: "planned", label: "Planned" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export function ActionPlanDialog({ mode, plan, surveyId }: ActionPlanDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [formData, setFormData] = useState<FormData>({
    title: plan?.title || "",
    description: plan?.description || "",
    theme: plan?.theme || "engagement",
    priority: (plan?.priority as ActionPlanPriority) || "medium",
    status: (plan?.status as ActionPlanStatus) || "planned",
    targetDate: plan?.targetDate ? plan.targetDate.split("T")[0] : "",
    notes: plan?.notes || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for the action plan",
        variant: "destructive",
      });
      return;
    }

    startTransition(async () => {
      try {
        if (mode === "create") {
          const result = await createActionPlan({
            title: formData.title,
            description: formData.description || undefined,
            theme: formData.theme,
            priority: formData.priority as "low" | "medium" | "high" | "critical",
            targetDate: formData.targetDate || undefined,
            notes: formData.notes || undefined,
            surveyId: surveyId,
          });

          if (result.success) {
            toast({ title: "Action plan created successfully" });
            setOpen(false);
            router.refresh();
          } else {
            toast({
              title: "Error",
              description: result.error || "Failed to create action plan",
              variant: "destructive",
            });
          }
        } else if (plan) {
          const result = await updateActionPlan({
            id: plan.id,
            title: formData.title,
            description: formData.description || undefined,
            theme: formData.theme,
            priority: formData.priority as "low" | "medium" | "high" | "critical",
            status: formData.status as "planned" | "in_progress" | "completed" | "cancelled",
            targetDate: formData.targetDate || null,
            notes: formData.notes || undefined,
          });

          if (result.success) {
            toast({ title: "Action plan updated successfully" });
            setOpen(false);
            router.refresh();
          } else {
            toast({
              title: "Error",
              description: result.error || "Failed to update action plan",
              variant: "destructive",
            });
          }
        }
      } catch (error) {
        console.error("Action plan error:", error);
        toast({
          title: "Error",
          description: `Failed to ${mode} action plan`,
          variant: "destructive",
        });
      }
    });
  };

  const handleDelete = () => {
    if (!plan) return;

    startTransition(async () => {
      try {
        const result = await deleteActionPlan(plan.id);
        if (result.success) {
          toast({ title: "Action plan deleted" });
          setOpen(false);
          router.refresh();
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to delete action plan",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Delete error:", error);
        toast({
          title: "Error",
          description: "Failed to delete action plan",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {mode === "create" ? (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Action Plan
          </Button>
        ) : (
          <Button variant="outline" size="sm">
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {mode === "create" ? "Create Action Plan" : "Edit Action Plan"}
            </DialogTitle>
            <DialogDescription>
              {mode === "create"
                ? "Create an improvement initiative based on survey insights"
                : "Update the action plan details"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Improve team communication"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the initiative and its goals..."
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="theme">Theme</Label>
                <Select
                  value={formData.theme}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, theme: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {themes.map((theme) => (
                      <SelectItem key={theme.value} value={theme.value}>
                        {theme.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, priority: value as ActionPlanPriority }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorities.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {mode === "edit" && (
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, status: value as ActionPlanStatus }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="targetDate">Target Date</Label>
              <Input
                id="targetDate"
                type="date"
                value={formData.targetDate}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, targetDate: e.target.value }))
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes or context..."
                value={formData.notes}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
                rows={2}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            {mode === "edit" && plan && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="destructive" size="sm" className="mr-auto">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Action Plan</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this action plan? This action cannot be
                      undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <Button type="submit" disabled={isPending}>
              {isPending
                ? mode === "create"
                  ? "Creating..."
                  : "Saving..."
                : mode === "create"
                  ? "Create Plan"
                  : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
