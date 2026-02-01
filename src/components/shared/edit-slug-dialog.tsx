"use client";

import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  SpinnerGap as Loader2,
  Warning,
  Link as LinkIcon,
  Check,
  X,
} from "@phosphor-icons/react";
import { useToast } from "@/hooks/use-toast";

const slugSchema = z.object({
  slug: z
    .string()
    .min(2, "URL must be at least 2 characters")
    .max(100, "URL must be 100 characters or less")
    .regex(
      /^[a-z0-9-]+$/,
      "URL can only contain lowercase letters, numbers, and hyphens"
    )
    .refine((val) => !val.startsWith("-") && !val.endsWith("-"), {
      message: "URL cannot start or end with a hyphen",
    })
    .refine((val) => !val.includes("--"), {
      message: "URL cannot contain consecutive hyphens",
    }),
});

type SlugForm = z.infer<typeof slugSchema>;

interface EditSlugDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentSlug: string;
  entityName: string;
  entityType: "user" | "organization";
  baseUrl: string;
  pathPrefix: string;
  onSave: (newSlug: string) => Promise<{ success: boolean; error?: string | null }>;
  onSuccess?: () => void;
}

export function EditSlugDialog({
  open,
  onOpenChange,
  currentSlug,
  entityName,
  entityType,
  baseUrl,
  pathPrefix,
  onSave,
  onSuccess,
}: EditSlugDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [validationState, setValidationState] = useState<"idle" | "checking" | "valid" | "invalid">("idle");
  const { toast } = useToast();

  const form = useForm<SlugForm>({
    resolver: zodResolver(slugSchema),
    defaultValues: {
      slug: currentSlug || "",
    },
  });

  const watchedSlug = form.watch("slug");

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      form.reset({ slug: currentSlug || "" });
      setValidationState("idle");
    }
  }, [open, currentSlug, form]);

  // Real-time validation feedback
  useEffect(() => {
    if (!watchedSlug || watchedSlug === currentSlug) {
      setValidationState("idle");
      return;
    }

    const result = slugSchema.safeParse({ slug: watchedSlug });
    if (result.success) {
      setValidationState("valid");
    } else {
      setValidationState("invalid");
    }
  }, [watchedSlug, currentSlug]);

  function onSubmit(data: SlugForm) {
    if (data.slug === currentSlug) {
      onOpenChange(false);
      return;
    }

    startTransition(async () => {
      const result = await onSave(data.slug);

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "URL Updated",
          description: `Your public URL has been changed to ${pathPrefix}/${data.slug}`,
        });
        onSuccess?.();
        onOpenChange(false);
      }
    });
  }

  const hasChanges = watchedSlug !== currentSlug;
  const previewUrl = `${baseUrl}${pathPrefix}/${watchedSlug || currentSlug}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5 text-repwell-teal-300" />
            Edit Public URL
          </DialogTitle>
          <DialogDescription>
            Customize the public URL for {entityName}'s {entityType === "user" ? "profile" : "page"}.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Warning Alert */}
            {hasChanges && (
              <Alert variant="destructive" className="border-amber-500/50 bg-amber-50 text-amber-900 dark:bg-amber-950/20 dark:text-amber-200">
                <Warning className="h-4 w-4" />
                <AlertDescription>
                  Changing this URL will break any existing links. Make sure to update any bookmarks or shared links.
                </AlertDescription>
              </Alert>
            )}

            {/* URL Preview */}
            <div className="rounded-lg border bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground mb-1">Preview</p>
              <p className="text-sm font-mono break-all text-repwell-teal-400">
                {previewUrl}
              </p>
            </div>

            {/* Slug Input */}
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL Slug</FormLabel>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      {pathPrefix}/
                    </span>
                    <FormControl>
                      <div className="relative flex-1">
                        <Input
                          placeholder="your-custom-url"
                          {...field}
                          onChange={(e) => {
                            // Auto-lowercase and remove invalid characters as user types
                            const value = e.target.value
                              .toLowerCase()
                              .replace(/[^a-z0-9-]/g, "");
                            field.onChange(value);
                          }}
                          className="pr-10"
                        />
                        {validationState !== "idle" && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            {validationState === "checking" && (
                              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            )}
                            {validationState === "valid" && (
                              <Check className="h-4 w-4 text-green-500" />
                            )}
                            {validationState === "invalid" && (
                              <X className="h-4 w-4 text-destructive" />
                            )}
                          </div>
                        )}
                      </div>
                    </FormControl>
                  </div>
                  <FormDescription>
                    Use lowercase letters, numbers, and hyphens only.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending || !hasChanges || validationState === "invalid"}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
