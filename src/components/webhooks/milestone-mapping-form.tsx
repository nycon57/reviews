"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  SpinnerGap as Loader2,
  Plus,
  Trash as Trash2,
  Clock,
  FileText,
  Info,
  ArrowSquareOut as ExternalLink,
} from "@phosphor-icons/react";
import {
  getMilestoneMappings,
  updateMilestoneMapping,
  createMilestoneMapping,
  deleteMilestoneMapping,
  type MilestoneMapping,
} from "@/lib/webhooks/milestone-actions";
import { getSurveyTemplates } from "@/lib/surveys/actions";
import { COMMON_ENCOMPASS_MILESTONES } from "@/lib/webhooks/transformers";

interface SurveyTemplate {
  id: string;
  name: string;
}

export function MilestoneMappingForm() {
  const [isPending, startTransition] = useTransition();
  const [mappings, setMappings] = useState<MilestoneMapping[]>([]);
  const [templates, setTemplates] = useState<SurveyTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [newMilestoneName, setNewMilestoneName] = useState("");
  const { toast } = useToast();

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [mappingsResult, templatesResult] = await Promise.all([
        getMilestoneMappings(),
        getSurveyTemplates(),
      ]);

      if (mappingsResult.success && mappingsResult.data) {
        setMappings(mappingsResult.data);
      }
      if (templatesResult.success && templatesResult.data) {
        setTemplates(
          templatesResult.data
            .filter((t): t is typeof t & { id: string } => !!t.id)
            .map((t) => ({ id: t.id, name: t.name }))
        );
      }
    } catch (error) {
      console.error("Failed to load data:", error);
      toast({
        title: "Error",
        description: "Failed to load milestone mappings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function handleToggleActive(mapping: MilestoneMapping) {
    startTransition(async () => {
      const result = await updateMilestoneMapping(mapping.id, {
        isActive: !mapping.isActive,
      });

      if (result.success && result.data) {
        setMappings((prev) =>
          prev.map((m) => (m.id === mapping.id ? result.data! : m))
        );
        toast({
          title: mapping.isActive ? "Milestone disabled" : "Milestone enabled",
          description: `${mapping.milestoneName} is now ${mapping.isActive ? "disabled" : "enabled"}`,
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update milestone",
          variant: "destructive",
        });
      }
    });
  }

  function handleUpdateTemplate(mapping: MilestoneMapping, templateId: string) {
    startTransition(async () => {
      const result = await updateMilestoneMapping(mapping.id, {
        templateId: templateId === "default" ? null : templateId,
      });

      if (result.success && result.data) {
        setMappings((prev) =>
          prev.map((m) => (m.id === mapping.id ? result.data! : m))
        );
        toast({
          title: "Template updated",
          description: `Survey template for ${mapping.milestoneName} has been updated`,
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update template",
          variant: "destructive",
        });
      }
    });
  }

  function handleUpdateDelay(mapping: MilestoneMapping, delayHours: number) {
    startTransition(async () => {
      const result = await updateMilestoneMapping(mapping.id, { delayHours });

      if (result.success && result.data) {
        setMappings((prev) =>
          prev.map((m) => (m.id === mapping.id ? result.data! : m))
        );
        toast({
          title: "Delay updated",
          description: `Send delay for ${mapping.milestoneName} set to ${delayHours} hours`,
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update delay",
          variant: "destructive",
        });
      }
    });
  }

  function handleAddMilestone() {
    if (!newMilestoneName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a milestone name",
        variant: "destructive",
      });
      return;
    }

    startTransition(async () => {
      const result = await createMilestoneMapping(newMilestoneName.trim(), {
        isActive: false,
        delayHours: 24,
      });

      if (result.success && result.data) {
        setMappings((prev) => [...prev, result.data!].sort((a, b) =>
          a.milestoneName.localeCompare(b.milestoneName)
        ));
        setNewMilestoneName("");
        setIsAddDialogOpen(false);
        toast({
          title: "Milestone added",
          description: `${result.data.milestoneName} has been added. Enable it when ready.`,
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to add milestone",
          variant: "destructive",
        });
      }
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const mapping = mappings.find((m) => m.id === id);
      const result = await deleteMilestoneMapping(id);

      if (result.success) {
        setMappings((prev) => prev.filter((m) => m.id !== id));
        setDeleteConfirmId(null);
        toast({
          title: "Milestone removed",
          description: `${mapping?.milestoneName || "Milestone"} has been removed`,
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete milestone",
          variant: "destructive",
        });
      }
    });
  }

  // Get milestones that aren't already configured
  const availableMilestones = COMMON_ENCOMPASS_MILESTONES.filter(
    (m) => !mappings.some((mapping) => mapping.milestoneName === m.name)
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Encompass Integration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-base">Encompass Integration</CardTitle>
            <CardDescription>
              Configure which Encompass loan milestones trigger survey requests
            </CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Milestone
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Milestone Mapping</DialogTitle>
                <DialogDescription>
                  Add a new Encompass milestone to trigger surveys
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="milestoneName">Milestone Name</Label>
                  {availableMilestones.length > 0 ? (
                    <Select
                      value={newMilestoneName}
                      onValueChange={setNewMilestoneName}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a milestone" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableMilestones.map((m) => (
                          <SelectItem key={m.name} value={m.name}>
                            <div className="flex flex-col">
                              <span>{m.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {m.description}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                        <SelectItem value="__custom__">
                          Custom milestone...
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id="milestoneName"
                      placeholder="e.g., Docs Received"
                      value={newMilestoneName}
                      onChange={(e) => setNewMilestoneName(e.target.value)}
                    />
                  )}
                  {newMilestoneName === "__custom__" && (
                    <Input
                      className="mt-2"
                      placeholder="Enter custom milestone name"
                      value=""
                      onChange={(e) => setNewMilestoneName(e.target.value)}
                    />
                  )}
                </div>
                <div className="flex items-start gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                  <Info className="h-4 w-4 mt-0.5 shrink-0" />
                  <p>
                    The milestone name must match exactly what Encompass sends.
                    Common milestones like &quot;Funded&quot; and &quot;Clear to Close&quot; are
                    pre-configured. Add custom milestones as needed.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddMilestone}
                  disabled={isPending || !newMilestoneName.trim() || newMilestoneName === "__custom__"}
                >
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add Milestone
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Documentation link */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ExternalLink className="h-4 w-4" />
          <span>
            See the{" "}
            <button
              className="text-primary hover:underline"
              onClick={() => {
                // Scroll to docs tab
                const docsTab = document.querySelector('[value="docs"]');
                if (docsTab) {
                  (docsTab as HTMLButtonElement).click();
                }
              }}
            >
              Documentation tab
            </button>
            {" "}for Encompass webhook setup instructions.
          </span>
        </div>

        {mappings.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>No milestone mappings configured yet.</p>
            <p className="text-sm">
              Add a milestone to start triggering surveys from Encompass.
            </p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Active</TableHead>
                  <TableHead>Milestone</TableHead>
                  <TableHead>Survey Template</TableHead>
                  <TableHead className="w-32">Delay</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {mappings.map((mapping) => (
                  <TableRow key={mapping.id}>
                    <TableCell>
                      <Switch
                        checked={mapping.isActive}
                        onCheckedChange={() => handleToggleActive(mapping)}
                        disabled={isPending}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{mapping.milestoneName}</span>
                          {mapping.isActive && (
                            <Badge variant="default" className="text-xs">
                              Active
                            </Badge>
                          )}
                        </div>
                        {mapping.description && (
                          <span className="text-xs text-muted-foreground">
                            {mapping.description}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={mapping.templateId || "default"}
                        onValueChange={(value) => handleUpdateTemplate(mapping, value)}
                        disabled={isPending}
                      >
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder="Select template" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">
                            Default template
                          </SelectItem>
                          {templates.map((template) => (
                            <SelectItem key={template.id} value={template.id}>
                              {template.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <Select
                          value={String(mapping.delayHours)}
                          onValueChange={(value) =>
                            handleUpdateDelay(mapping, parseInt(value, 10))
                          }
                          disabled={isPending}
                        >
                          <SelectTrigger className="w-[100px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">Immediate</SelectItem>
                            <SelectItem value="1">1 hour</SelectItem>
                            <SelectItem value="2">2 hours</SelectItem>
                            <SelectItem value="4">4 hours</SelectItem>
                            <SelectItem value="8">8 hours</SelectItem>
                            <SelectItem value="12">12 hours</SelectItem>
                            <SelectItem value="24">24 hours</SelectItem>
                            <SelectItem value="48">48 hours</SelectItem>
                            <SelectItem value="72">72 hours</SelectItem>
                            <SelectItem value="168">1 week</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteConfirmId(mapping.id)}
                        disabled={isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Delete confirmation dialog */}
        <AlertDialog
          open={!!deleteConfirmId}
          onOpenChange={(open) => !open && setDeleteConfirmId(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Milestone Mapping?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove the milestone &quot;
                {mappings.find((m) => m.id === deleteConfirmId)?.milestoneName}
                &quot; from your configuration. Encompass events for this milestone
                will no longer trigger surveys.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
