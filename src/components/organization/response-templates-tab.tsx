"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  DotsThreeVertical as MoreVertical,
  PencilSimple as Edit,
  Trash,
  SpinnerGap as Loader2,
  FileText,
  CheckCircle,
  WarningCircle as AlertCircle,
} from "@phosphor-icons/react";
import {
  getResponseTemplates,
  createResponseTemplate,
  updateResponseTemplate,
  deleteResponseTemplate,
  type ResponseTemplate,
} from "@/lib/reviews/response-actions";

export function ResponseTemplatesTab() {
  const [isPending, startTransition] = useTransition();
  const [templates, setTemplates] = useState<ResponseTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ResponseTemplate | null>(null);
  const [deleteTemplate, setDeleteTemplate] = useState<ResponseTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "thank_you" as ResponseTemplate["category"],
    tone: "professional" as ResponseTemplate["tone"],
    content: "",
    isDefault: false,
    isActive: true,
    variables: [] as string[],
  });

  const loadTemplates = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getResponseTemplates();
      if (result.success && result.data) {
        setTemplates(result.data);
      } else {
        setError(result.error || "Failed to load templates");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load templates");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadTemplates();
  }, [loadTemplates]);

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      category: "thank_you",
      tone: "professional",
      content: "",
      isDefault: false,
      isActive: true,
      variables: [],
    });
    setEditingTemplate(null);
    setShowForm(false);
  };

  const handleEdit = (template: ResponseTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || "",
      category: template.category,
      tone: template.tone,
      content: template.content,
      isDefault: template.isDefault,
      isActive: template.isActive,
      variables: template.variables,
    });
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!formData.name.trim() || !formData.content.trim()) {
      setError("Name and content are required");
      return;
    }

    // Extract variables from content
    const variableMatches = formData.content.match(/\{\{(\w+)\}\}/g) || [];
    const variables = variableMatches.map((v) => v.replace(/\{\{|\}\}/g, ""));

    startTransition(async () => {
      setError(null);

      if (editingTemplate) {
        const result = await updateResponseTemplate(editingTemplate.id, {
          ...formData,
          variables,
        });
        if (result.success) {
          setSuccess("Template updated successfully");
          loadTemplates();
          resetForm();
        } else {
          setError(result.error || "Failed to update template");
        }
      } else {
        const result = await createResponseTemplate({
          ...formData,
          variables,
        });
        if (result.success) {
          setSuccess("Template created successfully");
          loadTemplates();
          resetForm();
        } else {
          setError(result.error || "Failed to create template");
        }
      }

      setTimeout(() => setSuccess(null), 3000);
    });
  };

  const handleDeleteConfirm = () => {
    if (!deleteTemplate) return;

    startTransition(async () => {
      const result = await deleteResponseTemplate(deleteTemplate.id);
      if (result.success) {
        setSuccess("Template deleted successfully");
        loadTemplates();
      } else {
        setError(result.error || "Failed to delete template");
      }
      setDeleteTemplate(null);
      setTimeout(() => setSuccess(null), 3000);
    });
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      thank_you: "Thank You",
      apologetic: "Apologetic",
      follow_up: "Follow Up",
      promotional: "Promotional",
      custom: "Custom",
    };
    return labels[category] || category;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      thank_you: "bg-green-100 text-green-700",
      apologetic: "bg-red-100 text-red-700",
      follow_up: "bg-blue-100 text-blue-700",
      promotional: "bg-purple-100 text-purple-700",
      custom: "bg-gray-100 text-gray-700",
    };
    return colors[category] || "bg-gray-100 text-gray-700";
  };

  const getToneLabel = (tone: string) => {
    return tone.charAt(0).toUpperCase() + tone.slice(1);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Response Templates</CardTitle>
              <CardDescription>
                Create and manage reusable templates for responding to customer reviews
              </CardDescription>
            </div>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Template
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Status Messages */}
          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              {success}
            </div>
          )}

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              {error}
              <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setError(null)}>
                Dismiss
              </Button>
            </div>
          )}

          {/* Templates Grid */}
          {templates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No templates yet</h3>
              <p className="text-muted-foreground max-w-sm mb-4">
                Create response templates to quickly respond to reviews with consistent messaging.
              </p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Template
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => (
                <Card key={template.id} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-base">{template.name}</CardTitle>
                        <CardDescription className="line-clamp-2">
                          {template.description || "No description"}
                        </CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(template)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeleteTemplate(template)}
                            className="text-red-600"
                          >
                            <Trash className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge className={getCategoryColor(template.category)}>
                        {getCategoryLabel(template.category)}
                      </Badge>
                      <Badge variant="outline">{getToneLabel(template.tone)}</Badge>
                      {template.isDefault && (
                        <Badge variant="secondary">Default</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-2">
                      {template.content}
                    </p>
                    <div className="text-xs text-muted-foreground">
                      Used {template.usageCount} times
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? "Edit Template" : "Create Template"}
            </DialogTitle>
            <DialogDescription>
              Create a reusable template for responding to reviews. Use {"{{variable_name}}"} for
              dynamic content.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <Input
                  placeholder="Template name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category: value as ResponseTemplate["category"] })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="thank_you">Thank You</SelectItem>
                    <SelectItem value="apologetic">Apologetic</SelectItem>
                    <SelectItem value="follow_up">Follow Up</SelectItem>
                    <SelectItem value="promotional">Promotional</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tone</label>
                <Select
                  value={formData.tone}
                  onValueChange={(value) =>
                    setFormData({ ...formData, tone: value as ResponseTemplate["tone"] })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="friendly">Friendly</SelectItem>
                    <SelectItem value="empathetic">Empathetic</SelectItem>
                    <SelectItem value="formal">Formal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Input
                  placeholder="Brief description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Template Content</label>
              <Textarea
                placeholder="Write your template content. Use {{customer_name}} and {{professional_name}} for dynamic values."
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={8}
                className="resize-none font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Available variables: {"{{customer_name}}"}, {"{{professional_name}}"}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={resetForm} disabled={isPending}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              {editingTemplate ? "Update Template" : "Create Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteTemplate !== null} onOpenChange={() => setDeleteTemplate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteTemplate?.name}&quot;? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
