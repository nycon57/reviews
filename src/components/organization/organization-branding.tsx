"use client";

import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  SpinnerGap as Loader2,
  Palette,
  Image as ImageIcon,
  TextAa,
} from "@phosphor-icons/react";
import { ImageUpload } from "@/components/shared/image-upload";
import {
  getCurrentOrganization,
  updateOrganizationBranding,
  updateOrganizationBrandingSchema,
  uploadOrganizationLogo,
  removeOrganizationLogo,
  uploadOrganizationAvatar,
  removeOrganizationAvatar,
  uploadOrganizationBanner,
  removeOrganizationBanner,
  type UpdateOrganizationBranding,
} from "@/lib/organization";
import { cn } from "@/lib/utils";

const FONT_FAMILIES = [
  { value: "Inter", label: "Inter" },
  { value: "Roboto", label: "Roboto" },
  { value: "Open Sans", label: "Open Sans" },
  { value: "Lato", label: "Lato" },
  { value: "Montserrat", label: "Montserrat" },
  { value: "Poppins", label: "Poppins" },
  { value: "Source Sans Pro", label: "Source Sans Pro" },
  { value: "Nunito", label: "Nunito" },
];

const PRESET_COLORS = [
  { name: "Blue", primary: "#3B82F6", secondary: "#1E40AF" },
  { name: "Green", primary: "#10B981", secondary: "#047857" },
  { name: "Purple", primary: "#8B5CF6", secondary: "#6D28D9" },
  { name: "Red", primary: "#EF4444", secondary: "#B91C1C" },
  { name: "Orange", primary: "#F97316", secondary: "#C2410C" },
  { name: "Teal", primary: "#14B8A6", secondary: "#0F766E" },
  { name: "Pink", primary: "#EC4899", secondary: "#BE185D" },
  { name: "Indigo", primary: "#6366F1", secondary: "#4338CA" },
];

export function OrganizationBranding() {
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<UpdateOrganizationBranding>({
    resolver: zodResolver(updateOrganizationBrandingSchema),
    defaultValues: {
      logo_url: "",
      avatar_url: "",
      banner_url: "",
      primary_color: "#3B82F6",
      secondary_color: "#1E40AF",
      font_family: "Inter",
    },
  });

  const watchPrimaryColor = form.watch("primary_color");
  const watchSecondaryColor = form.watch("secondary_color");
  const watchFontFamily = form.watch("font_family");

  useEffect(() => {
    async function loadOrganization() {
      const { organization: org } = await getCurrentOrganization();
      if (org) {
        form.reset({
          logo_url: org.logo_url || "",
          avatar_url: org.avatar_url || "",
          banner_url: org.banner_url || "",
          primary_color: org.primary_color || "#3B82F6",
          secondary_color: org.secondary_color || "#1E40AF",
          font_family: org.font_family || "Inter",
        });
      }
      setLoading(false);
    }

    loadOrganization();
  }, [form]);

  function onSubmit(data: UpdateOrganizationBranding) {
    startTransition(async () => {
      const result = await updateOrganizationBranding(data);

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Branding updated",
          description: "Your organization branding has been saved.",
        });
      }
    });
  }

  function applyPresetColors(preset: typeof PRESET_COLORS[0]) {
    form.setValue("primary_color", preset.primary, { shouldDirty: true });
    form.setValue("secondary_color", preset.secondary, { shouldDirty: true });
  }

  if (loading) {
    return (
      <Card className="border border-border shadow-soft">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-6">
          <Skeleton className="h-32 w-32" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Logo & Profile Photo */}
        <Card className="border border-border shadow-soft">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-repwell-teal-300/10">
                <ImageIcon className="h-5 w-5 text-repwell-teal-300" weight="duotone" />
              </div>
              <div>
                <CardTitle className="text-lg">Images</CardTitle>
                <CardDescription>
                  Upload your organization&apos;s logo, profile photo, and cover image
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-8 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Logo</Label>
                <p className="text-xs text-muted-foreground mb-3">
                  Used in emails, widgets, and branding
                </p>
                <ImageUpload
                  variant="logo"
                  currentUrl={form.watch("logo_url")}
                  primaryColor={watchPrimaryColor}
                  onUpload={async (file) => { const fd = new FormData(); fd.append("file", file); return uploadOrganizationLogo(fd); }}
                  onRemove={removeOrganizationLogo}
                  onChange={(url) => form.setValue("logo_url", url || "", { shouldDirty: true })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Profile Photo</Label>
                <p className="text-xs text-muted-foreground mb-3">
                  Shown as your organization&apos;s avatar
                </p>
                <ImageUpload
                  variant="avatar"
                  currentUrl={form.watch("avatar_url")}
                  primaryColor={watchPrimaryColor}
                  onUpload={async (file) => { const fd = new FormData(); fd.append("file", file); return uploadOrganizationAvatar(fd); }}
                  onRemove={removeOrganizationAvatar}
                  onChange={(url) => form.setValue("avatar_url", url || "", { shouldDirty: true })}
                />
              </div>
            </div>
            <div className="mt-8 space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Cover Photo</Label>
              <p className="text-xs text-muted-foreground mb-3">
                Banner displayed on your organization&apos;s public page
              </p>
              <ImageUpload
                variant="banner"
                currentUrl={form.watch("banner_url")}
                primaryColor={watchPrimaryColor}
                onUpload={async (file) => { const fd = new FormData(); fd.append("file", file); return uploadOrganizationBanner(fd); }}
                onRemove={removeOrganizationBanner}
                onChange={(url) => form.setValue("banner_url", url || "", { shouldDirty: true })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Colors & Typography — side by side */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Colors */}
          <Card className="border border-border shadow-soft">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-repwell-teal-300/10">
                  <Palette className="h-5 w-5 text-repwell-teal-300" weight="duotone" />
                </div>
                <div>
                  <CardTitle className="text-lg">Brand Colors</CardTitle>
                  <CardDescription>
                    Customize your color scheme
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Custom colors */}
              <div className="grid gap-6 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="primary_color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Primary Color</FormLabel>
                      <div className="flex gap-2">
                        <label className="relative h-10 w-10 shrink-0 cursor-pointer overflow-hidden rounded-md border transition-shadow hover:shadow-md">
                          <div
                            className="absolute inset-0"
                            style={{ backgroundColor: field.value || "#3B82F6" }}
                          />
                          <input
                            type="color"
                            value={field.value || "#3B82F6"}
                            onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                            className="absolute inset-0 cursor-pointer opacity-0"
                          />
                        </label>
                        <FormControl>
                          <Input
                            type="text"
                            placeholder="#3B82F6"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                            className="font-mono"
                          />
                        </FormControl>
                      </div>
                      <FormDescription>
                        Used for buttons and accents
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="secondary_color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Secondary Color</FormLabel>
                      <div className="flex gap-2">
                        <label className="relative h-10 w-10 shrink-0 cursor-pointer overflow-hidden rounded-md border transition-shadow hover:shadow-md">
                          <div
                            className="absolute inset-0"
                            style={{ backgroundColor: field.value || "#1E40AF" }}
                          />
                          <input
                            type="color"
                            value={field.value || "#1E40AF"}
                            onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                            className="absolute inset-0 cursor-pointer opacity-0"
                          />
                        </label>
                        <FormControl>
                          <Input
                            type="text"
                            placeholder="#1E40AF"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                            className="font-mono"
                          />
                        </FormControl>
                      </div>
                      <FormDescription>
                        Used for hover states and emphasis
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Preview */}
              <div className="rounded-lg border p-4">
                <p className="mb-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Preview</p>
                <div className="flex flex-wrap items-center gap-4">
                  <button
                    type="button"
                    className="rounded-md px-4 py-2 text-sm font-medium text-white transition-colors"
                    style={{
                      backgroundColor: watchPrimaryColor,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = watchSecondaryColor || "")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = watchPrimaryColor || "")}
                  >
                    Primary Button
                  </button>
                  <button
                    type="button"
                    className="rounded-md border px-4 py-2 text-sm font-medium transition-colors"
                    style={{
                      borderColor: watchPrimaryColor,
                      color: watchPrimaryColor,
                    }}
                  >
                    Secondary Button
                  </button>
                  <div
                    className="rounded-full px-3 py-1 text-xs font-medium text-white"
                    style={{ backgroundColor: watchPrimaryColor }}
                  >
                    Badge
                  </div>
                </div>
              </div>

              {/* Presets */}
              <div>
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Quick Start Presets</Label>
                <p className="mt-0.5 mb-2 text-xs text-muted-foreground">Pick a preset to get started, then customize above</p>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => applyPresetColors(preset)}
                      className={cn(
                        "flex h-10 items-center gap-2 rounded-md border px-3 transition-colors hover:bg-muted",
                        watchPrimaryColor === preset.primary && watchSecondaryColor === preset.secondary
                          ? "border-primary bg-primary/5"
                          : "border-border"
                      )}
                    >
                      <div className="flex gap-1">
                        <div
                          className="h-4 w-4 rounded-full"
                          style={{ backgroundColor: preset.primary }}
                        />
                        <div
                          className="h-4 w-4 rounded-full"
                          style={{ backgroundColor: preset.secondary }}
                        />
                      </div>
                      <span className="text-sm">{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Typography */}
          <Card className="border border-border shadow-soft">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-repwell-teal-300/10">
                  <TextAa className="h-5 w-5 text-repwell-teal-300" weight="duotone" />
                </div>
                <div>
                  <CardTitle className="text-lg">Typography</CardTitle>
                  <CardDescription>
                    Choose your font family
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="font_family"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Font Family</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select font" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {FONT_FAMILIES.map((font) => (
                          <SelectItem key={font.value} value={font.value}>
                            <span style={{ fontFamily: font.value }}>{font.label}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      This font will be used in surveys and public-facing pages
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Typography preview */}
              <div className="rounded-lg border p-4" style={{ fontFamily: watchFontFamily }}>
                <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Font Preview</p>
                <h3 className="text-2xl font-bold" style={{ fontFamily: watchFontFamily }}>
                  The quick brown fox jumps over the lazy dog
                </h3>
                <p className="mt-2 text-base" style={{ fontFamily: watchFontFamily }}>
                  The quick brown fox jumps over the lazy dog. 0123456789
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Palette className="mr-2 h-4 w-4" />
                Save Branding
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
