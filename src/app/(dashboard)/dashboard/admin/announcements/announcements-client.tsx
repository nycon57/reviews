"use client";

import * as React from "react";
import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Megaphone,
  Sparkles,
  Wrench,
  Shield,
  Send,
  Eye,
  Calendar,
  Users,
  Mail,
  Loader2,
  Clock,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
  Video,
  FileText,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

// =============================================================================
// TYPES
// =============================================================================

type AnnouncementType = "feature" | "update" | "maintenance" | "security";
type AnnouncementAudience =
  | "all"
  | "admins_only"
  | "managers_only"
  | "loan_officers_only"
  | "free_tier"
  | "starter_tier"
  | "professional_tier"
  | "enterprise_tier"
  | "trial_users";

interface AnnouncementFormData {
  title: string;
  subtitle: string;
  content: string;
  contentPlain: string;
  type: AnnouncementType;
  audience: AnnouncementAudience;
  imageUrl: string;
  gifUrl: string;
  videoUrl: string;
  ctaText: string;
  ctaUrl: string;
  secondaryCtaText: string;
  secondaryCtaUrl: string;
  maintenanceStartAt: string;
  maintenanceEndAt: string;
  affectedServices: string[];
  scheduledAt: string;
}

interface AnnouncementSummary {
  id: string;
  title: string;
  type: AnnouncementType;
  status: "draft" | "scheduled" | "sending" | "sent" | "cancelled";
  audience: AnnouncementAudience;
  sentAt: string | null;
  scheduledAt: string | null;
  totalRecipients: number;
  totalSent: number;
  totalOpened: number;
  totalClicked: number;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const ANNOUNCEMENT_TYPES: { value: AnnouncementType; label: string; icon: React.ElementType; color: string }[] = [
  { value: "feature", label: "Feature Launch", icon: Sparkles, color: "bg-violet-100 text-violet-700" },
  { value: "update", label: "Product Update", icon: FileText, color: "bg-blue-100 text-blue-700" },
  { value: "maintenance", label: "Maintenance", icon: Wrench, color: "bg-amber-100 text-amber-700" },
  { value: "security", label: "Security Update", icon: Shield, color: "bg-red-100 text-red-700" },
];

const AUDIENCE_OPTIONS: { value: AnnouncementAudience; label: string }[] = [
  { value: "all", label: "All Users" },
  { value: "admins_only", label: "Admins Only" },
  { value: "managers_only", label: "Managers Only" },
  { value: "loan_officers_only", label: "Loan Officers Only" },
  { value: "free_tier", label: "Free Tier Users" },
  { value: "starter_tier", label: "Starter Plan Users" },
  { value: "professional_tier", label: "Professional Plan Users" },
  { value: "enterprise_tier", label: "Enterprise Plan Users" },
  { value: "trial_users", label: "Trial Users" },
];

const AFFECTED_SERVICES = [
  "Surveys",
  "Reviews",
  "Testimonials",
  "Reports",
  "API",
  "Integrations",
  "Dashboard",
  "Mobile App",
];

const initialFormData: AnnouncementFormData = {
  title: "",
  subtitle: "",
  content: "",
  contentPlain: "",
  type: "feature",
  audience: "all",
  imageUrl: "",
  gifUrl: "",
  videoUrl: "",
  ctaText: "",
  ctaUrl: "",
  secondaryCtaText: "",
  secondaryCtaUrl: "",
  maintenanceStartAt: "",
  maintenanceEndAt: "",
  affectedServices: [],
  scheduledAt: "",
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function AnnouncementsClient() {
  const [activeTab, setActiveTab] = useState<"compose" | "history">("compose");
  const [formData, setFormData] = useState<AnnouncementFormData>(initialFormData);
  const [isScheduled, setIsScheduled] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [announcements, setAnnouncements] = useState<AnnouncementSummary[]>([]);
  const [sendResult, setSendResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Handle form field changes
  const handleChange = useCallback(
    (field: keyof AnnouncementFormData, value: string | string[]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  // Handle affected services toggle
  const toggleAffectedService = useCallback((service: string) => {
    setFormData((prev) => ({
      ...prev,
      affectedServices: prev.affectedServices.includes(service)
        ? prev.affectedServices.filter((s) => s !== service)
        : [...prev.affectedServices, service],
    }));
  }, []);

  // Preview announcement
  const handlePreview = useCallback(async () => {
    setIsPreviewLoading(true);
    try {
      const response = await fetch("/api/admin/announcements/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (data.html) {
        setPreviewHtml(data.html);
      }
    } catch (error) {
      console.error("Preview error:", error);
    } finally {
      setIsPreviewLoading(false);
    }
  }, [formData]);

  // Send test email
  const handleTestSend = useCallback(async () => {
    setIsSending(true);
    setSendResult(null);
    try {
      const response = await fetch("/api/admin/announcements/test-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      setSendResult({
        success: data.success,
        message: data.success
          ? "Test email sent successfully!"
          : data.error || "Failed to send test email",
      });
    } catch (error) {
      setSendResult({
        success: false,
        message: error instanceof Error ? error.message : "Failed to send test email",
      });
    } finally {
      setIsSending(false);
    }
  }, [formData]);

  // Send or schedule announcement
  const handleSend = useCallback(async () => {
    setIsSending(true);
    setSendResult(null);
    try {
      const response = await fetch("/api/admin/announcements/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          scheduledAt: isScheduled ? formData.scheduledAt : null,
        }),
      });
      const data = await response.json();
      setSendResult({
        success: data.success,
        message: data.success
          ? isScheduled
            ? "Announcement scheduled successfully!"
            : `Announcement sent to ${data.sentCount} recipients!`
          : data.error || "Failed to send announcement",
      });
      if (data.success) {
        setFormData(initialFormData);
        setIsScheduled(false);
      }
    } catch (error) {
      setSendResult({
        success: false,
        message: error instanceof Error ? error.message : "Failed to send announcement",
      });
    } finally {
      setIsSending(false);
    }
  }, [formData, isScheduled]);

  // Get type config
  const typeConfig = ANNOUNCEMENT_TYPES.find((t) => t.value === formData.type);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
            <Megaphone className="h-6 w-6" />
            Announcements
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Create and send product updates, feature announcements, and notifications
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "compose" | "history")}>
        <TabsList>
          <TabsTrigger value="compose" className="gap-2">
            <FileText className="h-4 w-4" />
            Compose
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>

        {/* Compose Tab */}
        <TabsContent value="compose" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Type Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Announcement Type</CardTitle>
                  <CardDescription>Select the type of announcement to send</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {ANNOUNCEMENT_TYPES.map((type) => {
                      const Icon = type.icon;
                      return (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => handleChange("type", type.value)}
                          className={cn(
                            "flex flex-col items-center p-4 rounded-lg border-2 transition-all",
                            formData.type === type.value
                              ? "border-primary bg-primary/5"
                              : "border-gray-200 hover:border-gray-300"
                          )}
                        >
                          <div className={cn("p-2 rounded-lg mb-2", type.color)}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <span className="text-sm font-medium">{type.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Content */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Content</CardTitle>
                  <CardDescription>Write your announcement message</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleChange("title", e.target.value)}
                      placeholder="Enter announcement title..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subtitle">Subtitle</Label>
                    <Input
                      id="subtitle"
                      value={formData.subtitle}
                      onChange={(e) => handleChange("subtitle", e.target.value)}
                      placeholder="Optional subtitle..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="content">Message *</Label>
                    <Textarea
                      id="content"
                      value={formData.content}
                      onChange={(e) => handleChange("content", e.target.value)}
                      placeholder="Write your announcement message..."
                      rows={6}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Media (for feature announcements) */}
              {formData.type === "feature" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Media</CardTitle>
                    <CardDescription>Add images or videos to showcase the feature</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="imageUrl" className="flex items-center gap-2">
                        <ImageIcon className="h-4 w-4" />
                        Screenshot URL
                      </Label>
                      <Input
                        id="imageUrl"
                        value={formData.imageUrl}
                        onChange={(e) => handleChange("imageUrl", e.target.value)}
                        placeholder="https://..."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gifUrl" className="flex items-center gap-2">
                        <Video className="h-4 w-4" />
                        GIF URL (animated demo)
                      </Label>
                      <Input
                        id="gifUrl"
                        value={formData.gifUrl}
                        onChange={(e) => handleChange("gifUrl", e.target.value)}
                        placeholder="https://..."
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Maintenance Fields */}
              {formData.type === "maintenance" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Maintenance Window</CardTitle>
                    <CardDescription>Specify the maintenance schedule</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="maintenanceStartAt">Start Time</Label>
                        <Input
                          id="maintenanceStartAt"
                          type="datetime-local"
                          value={formData.maintenanceStartAt}
                          onChange={(e) => handleChange("maintenanceStartAt", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="maintenanceEndAt">End Time</Label>
                        <Input
                          id="maintenanceEndAt"
                          type="datetime-local"
                          value={formData.maintenanceEndAt}
                          onChange={(e) => handleChange("maintenanceEndAt", e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Affected Services</Label>
                      <div className="flex flex-wrap gap-2">
                        {AFFECTED_SERVICES.map((service) => (
                          <Badge
                            key={service}
                            variant={
                              formData.affectedServices.includes(service)
                                ? "default"
                                : "outline"
                            }
                            className="cursor-pointer"
                            onClick={() => toggleAffectedService(service)}
                          >
                            {service}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Call to Action */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Call to Action</CardTitle>
                  <CardDescription>Add buttons to drive engagement</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="ctaText">Primary Button Text</Label>
                      <Input
                        id="ctaText"
                        value={formData.ctaText}
                        onChange={(e) => handleChange("ctaText", e.target.value)}
                        placeholder="e.g., Learn More"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ctaUrl">Primary Button URL</Label>
                      <Input
                        id="ctaUrl"
                        value={formData.ctaUrl}
                        onChange={(e) => handleChange("ctaUrl", e.target.value)}
                        placeholder="https://..."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="secondaryCtaText">Secondary Button Text</Label>
                      <Input
                        id="secondaryCtaText"
                        value={formData.secondaryCtaText}
                        onChange={(e) => handleChange("secondaryCtaText", e.target.value)}
                        placeholder="e.g., View Documentation"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="secondaryCtaUrl">Secondary Button URL</Label>
                      <Input
                        id="secondaryCtaUrl"
                        value={formData.secondaryCtaUrl}
                        onChange={(e) => handleChange("secondaryCtaUrl", e.target.value)}
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Audience */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Audience
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Select
                    value={formData.audience}
                    onValueChange={(v) => handleChange("audience", v as AnnouncementAudience)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AUDIENCE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {/* Schedule */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Schedule
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="schedule-toggle">Schedule for later</Label>
                    <Switch
                      id="schedule-toggle"
                      checked={isScheduled}
                      onCheckedChange={setIsScheduled}
                    />
                  </div>

                  {isScheduled && (
                    <div className="space-y-2">
                      <Label htmlFor="scheduledAt">Send Date & Time</Label>
                      <Input
                        id="scheduledAt"
                        type="datetime-local"
                        value={formData.scheduledAt}
                        onChange={(e) => handleChange("scheduledAt", e.target.value)}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handlePreview}
                    disabled={isPreviewLoading || !formData.title}
                  >
                    {isPreviewLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Eye className="h-4 w-4 mr-2" />
                    )}
                    Preview
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleTestSend}
                    disabled={isSending || !formData.title}
                  >
                    {isSending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Mail className="h-4 w-4 mr-2" />
                    )}
                    Send Test Email
                  </Button>

                  <Separator />

                  <Button
                    className="w-full"
                    onClick={handleSend}
                    disabled={isSending || !formData.title || !formData.content}
                  >
                    {isSending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : isScheduled ? (
                      <Clock className="h-4 w-4 mr-2" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    {isScheduled ? "Schedule Send" : "Send Now"}
                  </Button>

                  {/* Result Message */}
                  {sendResult && (
                    <div
                      className={cn(
                        "flex items-center gap-2 p-3 rounded-lg text-sm",
                        sendResult.success
                          ? "bg-green-50 text-green-700"
                          : "bg-red-50 text-red-700"
                      )}
                    >
                      {sendResult.success ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <AlertCircle className="h-4 w-4" />
                      )}
                      {sendResult.message}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Preview Panel */}
          {previewHtml && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Email Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg bg-white overflow-hidden">
                  <iframe
                    srcDoc={previewHtml}
                    className="w-full h-[600px]"
                    title="Email Preview"
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Sent Announcements</CardTitle>
              <CardDescription>
                View history and analytics for past announcements
              </CardDescription>
            </CardHeader>
            <CardContent>
              {announcements.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Megaphone className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No announcements sent yet</p>
                  <p className="text-sm mt-1">
                    Create your first announcement in the Compose tab
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {announcements.map((announcement) => (
                    <div
                      key={announcement.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={cn(
                            "p-2 rounded-lg",
                            ANNOUNCEMENT_TYPES.find((t) => t.value === announcement.type)
                              ?.color
                          )}
                        >
                          {(() => {
                            const Icon =
                              ANNOUNCEMENT_TYPES.find((t) => t.value === announcement.type)
                                ?.icon || FileText;
                            return <Icon className="h-5 w-5" />;
                          })()}
                        </div>
                        <div>
                          <h4 className="font-medium">{announcement.title}</h4>
                          <p className="text-sm text-gray-500">
                            {announcement.sentAt
                              ? `Sent ${format(new Date(announcement.sentAt), "PPp")}`
                              : announcement.scheduledAt
                                ? `Scheduled for ${format(new Date(announcement.scheduledAt), "PPp")}`
                                : announcement.status}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 text-sm">
                        <div className="text-center">
                          <div className="font-semibold">
                            {announcement.totalRecipients}
                          </div>
                          <div className="text-gray-500">Recipients</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold">{announcement.totalOpened}</div>
                          <div className="text-gray-500">Opened</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold">{announcement.totalClicked}</div>
                          <div className="text-gray-500">Clicked</div>
                        </div>
                        <Badge
                          variant={
                            announcement.status === "sent"
                              ? "default"
                              : announcement.status === "scheduled"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {announcement.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
