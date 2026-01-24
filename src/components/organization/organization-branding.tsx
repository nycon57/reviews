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
  BuildingOffice as Building2,
  Palette,
} from "@phosphor-icons/react";
import {
  getCurrentOrganization,
  updateOrganizationBranding,
  updateOrganizationBrandingSchema,
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
    form.setValue("primary_color", preset.primary);
    form.setValue("secondary_color", preset.secondary);
  }

  if (loading) {
    return (
      <Card>
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
        {/* Logo */}
        <Card>
          <CardHeader>
            <CardTitle>Logo</CardTitle>
            <CardDescription>
              Upload your organization's logo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-start gap-6">
              <div
                className="relative flex h-32 w-32 items-center justify-center rounded-lg border-2 border-dashed"
                style={{ backgroundColor: watchPrimaryColor + "10" }}
              >
                {form.watch("logo_url") ? (
                  <img
                    src={form.watch("logo_url") || ""}
                    alt="Organization logo"
                    className="h-full w-full rounded-lg object-contain p-2"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Building2 className="h-8 w-8" />
                    <span className="text-xs">No logo</span>
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-4">
                <FormField
                  control={form.control}
                  name="logo_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Logo URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com/logo.png" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormDescription>
                        Enter a URL to your logo image. Recommended size: 256x256px
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Colors */}
        <Card>
          <CardHeader>
            <CardTitle>Brand Colors</CardTitle>
            <CardDescription>
              Customize your organization's color scheme
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Color presets */}
            <div>
              <Label className="text-sm font-medium">Color Presets</Label>
              <div className="mt-2 flex flex-wrap gap-2">
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

            {/* Custom colors */}
            <div className="grid gap-6 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="primary_color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primary Color</FormLabel>
                    <div className="flex gap-2">
                      <div
                        className="h-10 w-10 rounded-md border"
                        style={{ backgroundColor: field.value || "#3B82F6" }}
                      />
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="#3B82F6"
                          {...field}
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
                    <FormLabel>Secondary Color</FormLabel>
                    <div className="flex gap-2">
                      <div
                        className="h-10 w-10 rounded-md border"
                        style={{ backgroundColor: field.value || "#1E40AF" }}
                      />
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="#1E40AF"
                          {...field}
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
              <p className="mb-4 text-sm font-medium text-muted-foreground">Preview</p>
              <div className="flex items-center gap-4">
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
          </CardContent>
        </Card>

        {/* Typography */}
        <Card>
          <CardHeader>
            <CardTitle>Typography</CardTitle>
            <CardDescription>
              Choose your organization's font family
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="font_family"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Font Family</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full sm:w-[300px]">
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
              <p className="mb-2 text-sm font-medium text-muted-foreground">Font Preview</p>
              <h3 className="text-2xl font-bold" style={{ fontFamily: watchFontFamily }}>
                The quick brown fox jumps over the lazy dog
              </h3>
              <p className="mt-2 text-base" style={{ fontFamily: watchFontFamily }}>
                The quick brown fox jumps over the lazy dog. 0123456789
              </p>
            </div>
          </CardContent>
        </Card>

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
