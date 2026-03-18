"use client";

import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  SpinnerGap as Loader2,
  EnvelopeSimple,
  ArrowsClockwise,
  ShieldCheck,
} from "@phosphor-icons/react";
import {
  emailBrandingConfigSchema,
  type EmailBrandingConfig,
} from "@/lib/organization/types";
import {
  getEmailBrandingConfig,
  updateEmailBrandingConfig,
} from "@/lib/organization/actions";

export function EmailBrandingTab() {
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<EmailBrandingConfig>({
    resolver: zodResolver(emailBrandingConfigSchema),
    defaultValues: emailBrandingConfigSchema.parse({}),
  });

  useEffect(() => {
    async function load() {
      try {
        const { branding } = await getEmailBrandingConfig();
        if (branding) {
          form.reset(branding);
        }
      } catch {
        toast({
          title: "Error",
          description: "Failed to load email branding settings",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onSubmit(values: EmailBrandingConfig) {
    startTransition(async () => {
      const result = await updateEmailBrandingConfig(values);
      if (result.success) {
        toast({ title: "Email branding saved" });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to save",
          variant: "destructive",
        });
      }
    });
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Enable toggle */}
        <FormField
          control={form.control}
          name="enabled"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border border-border p-4">
              <div>
                <FormLabel className="text-sm font-semibold">
                  Enable Org-Level Email Branding
                </FormLabel>
                <FormDescription>
                  When enabled, emails without custom header/footer blocks will
                  use these defaults.
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Header Defaults */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <EnvelopeSimple weight="duotone" className="h-5 w-5 text-repwell-teal-300" />
              <CardTitle className="text-base">Header Defaults</CardTitle>
            </div>
            <CardDescription>
              Logo and navigation shown at the top of emails.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="header.logoSrc"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Logo URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="header.logoAlt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Logo Alt Text</FormLabel>
                    <FormControl>
                      <Input placeholder="Company Logo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="header.logoHeight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Logo Height (px)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={20}
                        max={120}
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="header.backgroundColor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Background Color</FormLabel>
                    <FormControl>
                      <Input placeholder="#ffffff" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="header.linkColor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Link Color</FormLabel>
                    <FormControl>
                      <Input placeholder="rgb(75,85,99)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="header.socialLinks.twitter"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>X / Twitter URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://x.com/..." {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="header.socialLinks.linkedin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>LinkedIn URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://linkedin.com/..." {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Footer Defaults */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <ArrowsClockwise weight="duotone" className="h-5 w-5 text-repwell-teal-300" />
              <CardTitle className="text-base">Footer Defaults</CardTitle>
            </div>
            <CardDescription>
              Company info and links shown at the bottom of emails (before compliance strip).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="footer.companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Acme Corp" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="footer.tagline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tagline</FormLabel>
                    <FormControl>
                      <Input placeholder="Your trusted partner" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="footer.address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Main St, City, ST 12345" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="footer.contactInfo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Info</FormLabel>
                  <FormControl>
                    <Input placeholder="support@company.com | (555) 123-4567" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="footer.logoSrc"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Footer Logo URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="footer.socialLinks.facebook"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Facebook URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://facebook.com/..." {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="footer.socialLinks.instagram"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instagram URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://instagram.com/..." {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Compliance */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <ShieldCheck weight="duotone" className="h-5 w-5 text-repwell-teal-300" />
              <CardTitle className="text-base">CAN-SPAM Compliance</CardTitle>
            </div>
            <CardDescription>
              Required info auto-included at the bottom of every email.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="compliance.physicalAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Physical Address</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="123 Main St, Suite 100, City, ST 12345"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Required by CAN-SPAM. Falls back to RepWell address if empty.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="compliance.copyrightHolder"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Copyright Holder</FormLabel>
                  <FormControl>
                    <Input placeholder="Your Company Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="compliance.unsubscribeText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Custom Unsubscribe Text</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Click here to unsubscribe"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional. The unsubscribe link is always included automatically.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Button type="submit" disabled={isPending}>
          {isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Save Email Branding
        </Button>
      </form>
    </Form>
  );
}
