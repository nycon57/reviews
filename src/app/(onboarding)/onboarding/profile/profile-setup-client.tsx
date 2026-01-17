"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Building2, Palette, MapPin, ChevronLeft, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { toast } from "@/hooks/use-toast";
import { setupProfile, uploadLogo } from "@/lib/onboarding/actions";
import type { SetupProfileInput } from "@/lib/onboarding/schemas";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import { LogoUpload } from "@/components/shared/logo-upload";

interface ProfileSetupClientProps {
  initialData: {
    organizationName: string;
    industry: string;
    companySize: string;
    address: Record<string, string>;
    logoUrl: string;
    primaryColor: string;
    website: string;
    phone: string;
    companyEmail: string;
  };
}

const industries = [
  { value: "mortgage", label: "Mortgage / Lending" },
  { value: "real_estate", label: "Real Estate" },
  { value: "banking", label: "Banking / Credit Union" },
  { value: "insurance", label: "Insurance" },
  { value: "financial_services", label: "Financial Services" },
  { value: "other", label: "Other" },
];

const companySizes = [
  { value: "1-5", label: "1-5 employees" },
  { value: "6-20", label: "6-20 employees" },
  { value: "21-50", label: "21-50 employees" },
  { value: "51-200", label: "51-200 employees" },
  { value: "201-500", label: "201-500 employees" },
  { value: "500+", label: "500+ employees" },
];

export function ProfileSetupClient({ initialData }: ProfileSetupClientProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({
    organizationName: initialData.organizationName,
    industry: initialData.industry,
    companySize: initialData.companySize,
    street: initialData.address?.street || "",
    city: initialData.address?.city || "",
    state: initialData.address?.state || "",
    zip: initialData.address?.zip || "",
    logoUrl: initialData.logoUrl,
    primaryColor: initialData.primaryColor || "#52796f",
    website: initialData.website,
    phone: initialData.phone,
    companyEmail: initialData.companyEmail,
  });

  // Handle logo upload
  const handleLogoUpload = async (file: File) => {
    const formDataObj = new FormData();
    formDataObj.append("file", file);
    const result = await uploadLogo(formDataObj);
    if (result.success && result.url) {
      setFormData((prev) => ({ ...prev, logoUrl: result.url! }));
    }
    return result;
  };

  // Handle color extracted from logo
  const handleColorExtracted = (color: string) => {
    setFormData((prev) => ({ ...prev, primaryColor: color }));
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const input: SetupProfileInput = {
        organizationName: formData.organizationName,
        industry: formData.industry || undefined,
        companySize: formData.companySize || undefined,
        address: {
          street: formData.street || undefined,
          city: formData.city || undefined,
          state: formData.state || undefined,
          zip: formData.zip || undefined,
        },
        logoUrl: formData.logoUrl || undefined,
        primaryColor: formData.primaryColor || undefined,
        website: formData.website || undefined,
        phone: formData.phone || undefined,
        companyEmail: formData.companyEmail || undefined,
      };

      const result = await setupProfile(input);

      if (result.success && result.redirectTo) {
        router.push(result.redirectTo);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to save profile",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="max-w-2xl mx-auto space-y-8"
    >
      {/* Header */}
      <motion.div variants={fadeInUp} className="text-center space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">
          Set up your organization
        </h1>
        <p className="text-muted-foreground">
          Tell us a bit about your business. You can always update this later.
        </p>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <motion.div variants={fadeInUp}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Basic Information
              </CardTitle>
              <CardDescription>Your organization details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="organizationName">Organization Name *</Label>
                <Input
                  id="organizationName"
                  value={formData.organizationName}
                  onChange={(e) => handleChange("organizationName", e.target.value)}
                  placeholder="Acme Mortgage"
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Select
                    value={formData.industry}
                    onValueChange={(value) => handleChange("industry", value)}
                  >
                    <SelectTrigger id="industry">
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {industries.map((industry) => (
                        <SelectItem key={industry.value} value={industry.value}>
                          {industry.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companySize">Company Size</Label>
                  <Select
                    value={formData.companySize}
                    onValueChange={(value) => handleChange("companySize", value)}
                  >
                    <SelectTrigger id="companySize">
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      {companySizes.map((size) => (
                        <SelectItem key={size.value} value={size.value}>
                          {size.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    value={formData.website}
                    onChange={(e) => handleChange("website", e.target.value)}
                    placeholder="https://example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyEmail">Company Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="companyEmail"
                    type="email"
                    value={formData.companyEmail}
                    onChange={(e) => handleChange("companyEmail", e.target.value)}
                    placeholder="contact@yourcompany.com"
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Used for notifications and integrations with business directories
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Address */}
        <motion.div variants={fadeInUp}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Business Address
              </CardTitle>
              <CardDescription>Optional - shown on public profiles</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="street">Street Address</Label>
                <Input
                  id="street"
                  value={formData.street}
                  onChange={(e) => handleChange("street", e.target.value)}
                  placeholder="123 Main St"
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleChange("city", e.target.value)}
                    placeholder="San Francisco"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => handleChange("state", e.target.value)}
                    placeholder="CA"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zip">ZIP Code</Label>
                  <Input
                    id="zip"
                    value={formData.zip}
                    onChange={(e) => handleChange("zip", e.target.value)}
                    placeholder="94102"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Branding */}
        <motion.div variants={fadeInUp}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Branding
              </CardTitle>
              <CardDescription>Customize your surveys and public pages</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo Upload */}
              <div className="space-y-2">
                <Label>Company Logo</Label>
                <LogoUpload
                  currentLogoUrl={formData.logoUrl || null}
                  onUpload={handleLogoUpload}
                  onColorExtracted={handleColorExtracted}
                  disabled={isLoading}
                />
              </div>

              {/* Primary Color - now shows auto-detected or manual */}
              <div className="space-y-2">
                <Label htmlFor="primaryColor">
                  Brand Color
                  {formData.logoUrl && (
                    <span className="ml-2 text-xs font-normal text-repwell-sage-200">
                      Auto-detected from logo
                    </span>
                  )}
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="primaryColor"
                    type="color"
                    value={formData.primaryColor}
                    onChange={(e) => handleChange("primaryColor", e.target.value)}
                    className="w-12 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    value={formData.primaryColor}
                    onChange={(e) => handleChange("primaryColor", e.target.value)}
                    placeholder="#52796f"
                    className="flex-1 font-mono text-sm"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {formData.logoUrl
                    ? "Adjust if the auto-detected color doesn't match your brand"
                    : "Upload a logo to auto-detect your brand color, or choose manually"}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Actions */}
        <motion.div variants={fadeInUp} className="flex items-center justify-between pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push("/onboarding/plan")}
            className="text-muted-foreground"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>

          <Button type="submit" size="lg" disabled={isLoading}>
            {isLoading ? "Saving..." : "Continue"}
          </Button>
        </motion.div>
      </form>
    </motion.div>
  );
}
