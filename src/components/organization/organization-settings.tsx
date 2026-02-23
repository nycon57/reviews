"use client";

import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  SpinnerGap as Loader2,
  FloppyDisk as Save,
  LinkedinLogo,
  FacebookLogo,
  InstagramLogo,
  XLogo,
  Globe,
  Phone,
  Envelope,
  MapPin,
} from "@phosphor-icons/react";
import {
  getCurrentOrganization,
  updateOrganizationSettings,
  updateOrganizationSettingsSchema,
  type UpdateOrganizationSettings,
} from "@/lib/organization";
import { getBranches } from "@/lib/branches";
import type { Branch } from "@/lib/branches/types";

const TIMEZONES = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/Phoenix", label: "Arizona Time" },
  { value: "America/Anchorage", label: "Alaska Time" },
  { value: "Pacific/Honolulu", label: "Hawaii Time" },
  { value: "UTC", label: "UTC" },
];

const DATE_FORMATS = [
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
];

export function OrganizationSettings() {
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [branches, setBranches] = useState<Branch[]>([]);
  const { toast } = useToast();

  const form = useForm<UpdateOrganizationSettings>({
    resolver: zodResolver(updateOrganizationSettingsSchema),
    defaultValues: {
      name: "",
      domain: "",
      company_email: "",
      company_phone: "",
      timezone: "America/New_York",
      date_format: "MM/DD/YYYY",
      company_address: {
        street: "",
        street2: "",
        city: "",
        state: "",
        postal_code: "",
        country: "US",
      },
      email: "",
      phone: "",
      website_url: "",
      linkedin_url: "",
      facebook_url: "",
      instagram_url: "",
      twitter_url: "",
      headquarters_branch_id: "",
    },
  });

  useEffect(() => {
    async function loadOrganization() {
      const [{ organization: org }, branchResult] = await Promise.all([
        getCurrentOrganization(),
        getBranches({ isActive: true }),
      ]);
      if (branchResult.success && branchResult.data) {
        setBranches(branchResult.data);
      }
      if (org) {
        form.reset({
          name: org.name || "",
          domain: org.domain || "",
          company_email: org.company_email || "",
          company_phone: org.company_phone || "",
          timezone: org.timezone || "America/New_York",
          date_format: org.date_format || "MM/DD/YYYY",
          company_address: {
            street: org.company_address?.street || "",
            street2: org.company_address?.street2 || "",
            city: org.company_address?.city || "",
            state: org.company_address?.state || "",
            postal_code: org.company_address?.postal_code || "",
            country: org.company_address?.country || "US",
          },
          email: org.email || "",
          phone: org.phone || "",
          website_url: org.website_url || "",
          linkedin_url: org.linkedin_url || "",
          facebook_url: org.facebook_url || "",
          instagram_url: org.instagram_url || "",
          twitter_url: org.twitter_url || "",
          headquarters_branch_id: org.headquarters_branch_id || "",
        });
      }
      setLoading(false);
    }

    loadOrganization();
  }, [form]);

  function onSubmit(data: UpdateOrganizationSettings) {
    startTransition(async () => {
      const result = await updateOrganizationSettings(data);

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Settings updated",
          description: "Your organization settings have been saved.",
        });
      }
    });
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
            <CardDescription>
              Basic information about your organization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organization Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Acme Corp" {...field} />
                  </FormControl>
                  <FormDescription>
                    This name will appear across the platform
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="domain"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Domain</FormLabel>
                  <FormControl>
                    <Input placeholder="acme.com" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormDescription>
                    Your company domain (optional)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="company_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="contact@acme.com" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="company_phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="+1 (555) 000-0000" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="timezone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Timezone</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select timezone" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TIMEZONES.map((tz) => (
                          <SelectItem key={tz.value} value={tz.value}>
                            {tz.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date_format"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date Format</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select format" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DATE_FORMATS.map((fmt) => (
                          <SelectItem key={fmt.value} value={fmt.value}>
                            {fmt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Address */}
        <Card>
          <CardHeader>
            <CardTitle>Company Address</CardTitle>
            <CardDescription>
              Your organization's physical address
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="company_address.street"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Street Address</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Main St" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="company_address.street2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Street Address 2</FormLabel>
                  <FormControl>
                    <Input placeholder="Suite 100" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="company_address.city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input placeholder="New York" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="company_address.state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State</FormLabel>
                    <FormControl>
                      <Input placeholder="NY" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="company_address.postal_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ZIP Code</FormLabel>
                    <FormControl>
                      <Input placeholder="10001" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Public Profile */}
        <Card>
          <CardHeader>
            <CardTitle>Public Profile</CardTitle>
            <CardDescription>
              These appear on your public organization profile page
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Public Contact Email</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Envelope className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input type="email" placeholder="info@company.com" className="pl-9" {...field} value={field.value || ""} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Public Contact Phone</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input placeholder="+1 (555) 000-0000" className="pl-9" {...field} value={field.value || ""} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="website_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input type="url" placeholder="https://www.company.com" className="pl-9" {...field} value={field.value || ""} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Social Links */}
        <Card>
          <CardHeader>
            <CardTitle>Social Links</CardTitle>
            <CardDescription>
              Link your social media profiles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="linkedin_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>LinkedIn</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <LinkedinLogo className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input placeholder="https://linkedin.com/company/..." className="pl-9" {...field} value={field.value || ""} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="facebook_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Facebook</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <FacebookLogo className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input placeholder="https://facebook.com/..." className="pl-9" {...field} value={field.value || ""} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="instagram_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instagram</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <InstagramLogo className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input placeholder="https://instagram.com/..." className="pl-9" {...field} value={field.value || ""} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="twitter_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>X / Twitter</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <XLogo className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input placeholder="https://x.com/..." className="pl-9" {...field} value={field.value || ""} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Headquarters Branch */}
        <Card>
          <CardHeader>
            <CardTitle>Headquarters Branch</CardTitle>
            <CardDescription>
              The headquarters address and contact info will appear on your public profile
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="headquarters_branch_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Headquarters</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl>
                      <SelectTrigger>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <SelectValue placeholder="Select a branch" />
                        </div>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {branches.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name}
                          {branch.address?.city && branch.address?.state
                            ? ` — ${branch.address.city}, ${branch.address.state}`
                            : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
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
                <Save className="mr-2 h-4 w-4" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
