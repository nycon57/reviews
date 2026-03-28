"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getBranchPublicPath, getBranchPublicSlug } from "@/lib/branches/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useDropzone } from "react-dropzone";
import {
  SpinnerGap as Loader2,
  Warning,
  MapPin,
  Clock,
  PencilSimple,
  UserPlus,
  UserMinus,
  MagnifyingGlass,
  Star,
  Buildings,
  GearSix,
  Globe,
  Eye,
  EyeSlash,
  UserCircleGear,
  UploadSimple as Upload,
  Image as ImageIcon,
  Users,
  ChatCircleDots,
  ArrowSquareOut,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { ImageUpload } from "@/components/shared/image-upload";
import { EditSlugDialog } from "@/components/shared/edit-slug-dialog";
import {
  updateBranch,
  updateBranchSlug,
  updateBranchHours,
  uploadBranchPhoto,
  uploadBranchCoverImage,
  assignUserToBranch,
  getUnassignedMembers,
} from "@/lib/branches/actions";
import type { BranchWithTeamMembers, BranchAddress } from "@/lib/branches/types";

type EditTab = "details" | "settings";

const DAYS = [
  { key: "monday", label: "Mon" },
  { key: "tuesday", label: "Tue" },
  { key: "wednesday", label: "Wed" },
  { key: "thursday", label: "Thu" },
  { key: "friday", label: "Fri" },
  { key: "saturday", label: "Sat" },
  { key: "sunday", label: "Sun" },
] as const;

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const hours = Math.floor(i / 2);
  const minutes = i % 2 === 0 ? "00" : "30";
  const h = hours.toString().padStart(2, "0");
  return { value: `${h}:${minutes}`, label: `${h}:${minutes}` };
});

interface HoursSchedule {
  open: string;
  close: string;
  is24hr: boolean;
}

interface EditBranchContentProps {
  branch: BranchWithTeamMembers;
}

export function EditBranchContent({ branch }: EditBranchContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const tabParam = searchParams.get("tab");
  const currentTab: EditTab = tabParam === "settings" ? "settings" : "details";

  // Details tab state
  const [name, setName] = useState(branch.name);
  const [description, setDescription] = useState(branch.description || "");
  const [phone, setPhone] = useState(branch.phone || "");
  const [email, setEmail] = useState(branch.email || "");
  const [websiteUrl, setWebsiteUrl] = useState(branch.websiteUrl || "");
  const [googlePlaceId, setGooglePlaceId] = useState(branch.googlePlaceId || "");

  // Address state
  const [street, setStreet] = useState(branch.address?.street || "");
  const [city, setCity] = useState(branch.address?.city || "");
  const [state, setState] = useState(branch.address?.state || "");
  const [postalCode, setPostalCode] = useState(branch.address?.postal_code || "");
  const [country, setCountry] = useState(branch.address?.country || "");

  // Hours state
  const [hours, setHours] = useState<Record<string, HoursSchedule | null>>(() => {
    const initial: Record<string, HoursSchedule | null> = {};
    for (const day of DAYS) {
      const existing = (branch.hoursOfOperation as Record<string, HoursSchedule | null> | null)?.[day.key];
      initial[day.key] = existing || null;
    }
    return initial;
  });

  // Settings tab state
  const [isActive, setIsActive] = useState(branch.isActive);
  const [isPublic, setIsPublic] = useState(branch.isPublic);
  const [managerId, setManagerId] = useState(branch.managerId || "");
  const [slugDialogOpen, setSlugDialogOpen] = useState(false);
  const [currentSlug, setCurrentSlug] = useState(branch.globalSlug || getBranchPublicSlug(branch));
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [teamMembers, setTeamMembers] = useState(branch.teamMembers);

  // Photo state
  const [photoUrl, setPhotoUrl] = useState(branch.photoUrl);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  function handleTabChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.push(
      `/dashboard/organization/branches/${branch.id}?${params.toString()}`,
      { scroll: false }
    );
  }

  function handleSaveInfo() {
    startTransition(async () => {
      const result = await updateBranch(branch.id, {
        name,
        description: description || null,
        phone: phone || null,
        email: email || null,
        websiteUrl: websiteUrl || null,
        googlePlaceId: googlePlaceId || null,
      });

      if (!result.success) {
        toast({
          title: "Error",
          description: result.error || "Failed to update branch",
          variant: "destructive",
        });
      } else {
        toast({ title: "Branch updated", description: "Branch info saved." });
      }
    });
  }

  function handleSaveAddress() {
    startTransition(async () => {
      const address: BranchAddress = {
        street: street || undefined,
        city: city || undefined,
        state: state || undefined,
        postal_code: postalCode || undefined,
        country: country || undefined,
      };

      const result = await updateBranch(branch.id, { address });

      if (!result.success) {
        toast({
          title: "Error",
          description: result.error || "Failed to update address",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Address updated",
          description: "Branch address saved. Coordinates updated automatically.",
        });
      }
    });
  }

  function handleSaveHours() {
    startTransition(async () => {
      const result = await updateBranchHours(branch.id, hours);

      if (!result.success) {
        toast({
          title: "Error",
          description: result.error || "Failed to update hours",
          variant: "destructive",
        });
      } else {
        toast({ title: "Hours updated", description: "Hours of operation saved." });
      }
    });
  }

  function handlePhotoUpload(file: File) {
    setIsUploadingPhoto(true);
    const formData = new FormData();
    formData.append("file", file);

    uploadBranchPhoto(branch.id, formData)
      .then((result) => {
        if (result.success && result.url) {
          setPhotoUrl(result.url);
          toast({ title: "Photo updated", description: "Branch photo saved." });
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to upload photo",
            variant: "destructive",
          });
        }
      })
      .finally(() => setIsUploadingPhoto(false));
  }

  const {
    getRootProps: getPhotoRootProps,
    getInputProps: getPhotoInputProps,
    isDragActive: isPhotoDragActive,
  } = useDropzone({
    onDrop: (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) handlePhotoUpload(acceptedFiles[0]);
    },
    accept: { "image/jpeg": [".jpg", ".jpeg"], "image/png": [".png"], "image/webp": [".webp"] },
    maxSize: 5 * 1024 * 1024,
    multiple: false,
    disabled: isUploadingPhoto,
  });

  function updateHourDay(
    dayKey: string,
    field: "open" | "close" | "is24hr",
    value: string | boolean
  ) {
    setHours((prev) => {
      const current = prev[dayKey] || { open: "09:00", close: "17:00", is24hr: false };
      if (field === "is24hr") {
        return { ...prev, [dayKey]: { ...current, is24hr: value as boolean } };
      }
      return { ...prev, [dayKey]: { ...current, [field]: value as string } };
    });
  }

  function toggleDayEnabled(dayKey: string) {
    setHours((prev) => {
      if (prev[dayKey]) {
        return { ...prev, [dayKey]: null };
      }
      return { ...prev, [dayKey]: { open: "09:00", close: "17:00", is24hr: false } };
    });
  }

  function handleToggleActive() {
    startTransition(async () => {
      const result = await updateBranch(branch.id, { isActive: !isActive });
      if (!result.success) {
        toast({ title: "Error", description: result.error || "Failed to update status", variant: "destructive" });
      } else {
        setIsActive(!isActive);
        toast({
          title: isActive ? "Branch deactivated" : "Branch reactivated",
          description: `Branch has been ${isActive ? "deactivated" : "reactivated"}.`,
        });
      }
    });
  }

  function handleTogglePublic() {
    startTransition(async () => {
      const result = await updateBranch(branch.id, { isPublic: !isPublic });
      if (!result.success) {
        toast({ title: "Error", description: result.error || "Failed to update visibility", variant: "destructive" });
      } else {
        setIsPublic(!isPublic);
        toast({ title: "Visibility updated", description: `Branch is now ${!isPublic ? "public" : "private"}.` });
      }
    });
  }

  function handleManagerChange(newManagerId: string) {
    const actualId = newManagerId === "none" ? "" : newManagerId;
    const member = teamMembers.find((m) => m.id === actualId);
    startTransition(async () => {
      const result = await updateBranch(branch.id, {
        managerId: actualId || null,
        managerName: member?.fullName || null,
        managerEmail: member?.email || null,
      });
      if (!result.success) {
        toast({ title: "Error", description: result.error || "Failed to update manager", variant: "destructive" });
      } else {
        setManagerId(actualId);
        toast({ title: "Manager updated", description: "Branch manager has been updated." });
      }
    });
  }

  function handleRemoveMember(userId: string) {
    startTransition(async () => {
      const result = await assignUserToBranch(userId, null);
      if (!result.success) {
        toast({ title: "Error", description: result.error || "Failed to remove member", variant: "destructive" });
      } else {
        setTeamMembers((prev) => prev.filter((m) => m.id !== userId));
        toast({ title: "Member removed", description: "Member unassigned from branch." });
      }
    });
  }

  return (
    <>
      {/* Stats overview strip */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Members", value: teamMembers.length, icon: Users },
          { label: "Avg Rating", value: branch.averageRating ? `${branch.averageRating.toFixed(1)}` : "—", icon: Star },
          { label: "Reviews", value: branch.totalReviews, icon: ChatCircleDots },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="flex items-center gap-3 rounded-xl border border-border/50 bg-card p-4"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-repwell-teal-300/10">
                <Icon className="h-5 w-5 text-repwell-teal-300" />
              </div>
              <div>
                <p className="text-2xl font-semibold tracking-tight text-heading-accent">
                  {stat.value}
                </p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="w-full justify-start border-b border-border bg-transparent p-0 h-auto gap-0">
          {[
            { value: "details" as const, label: "Details", icon: Buildings },
            { value: "settings" as const, label: "Settings & Team", icon: GearSix },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className={cn(
                  "relative px-4 py-3 text-sm font-medium",
                  "text-muted-foreground hover:text-repwell-teal-400 dark:hover:text-repwell-sage-100/80",
                  "data-[state=active]:text-repwell-teal-300",
                  "border-b-2 border-transparent",
                  "data-[state=active]:border-repwell-teal-300",
                  "rounded-none bg-transparent shadow-none",
                  "transition-colors duration-200",
                  "flex items-center gap-2 whitespace-nowrap"
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <div className="mt-6">
          {/* ===== DETAILS TAB ===== */}
          <TabsContent value="details" className="m-0 space-y-6">
            {/* Two-column layout: Info + Address side by side */}
            <div className="grid gap-6 lg:grid-cols-5">
              {/* Branch Info — 3 cols */}
              <Card className="lg:col-span-3 border border-border shadow-soft">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-repwell-teal-300/10">
                      <Buildings className="h-5 w-5 text-repwell-teal-300" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Branch Information</CardTitle>
                      <CardDescription>Name, contact, and general details</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Branch Name *</Label>
                      <Input value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Phone</Label>
                      <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 123-4567" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</Label>
                      <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="branch@company.com" />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Website URL</Label>
                      <Input value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://..." />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Google Place ID</Label>
                      <Input value={googlePlaceId} onChange={(e) => setGooglePlaceId(e.target.value)} placeholder="ChIJ..." />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Description</Label>
                    <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Brief description of this branch location..." />
                  </div>
                  <div className="flex justify-end pt-2">
                    <Button onClick={handleSaveInfo} disabled={isPending}>
                      {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save Info
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Address — 2 cols */}
              <Card className="lg:col-span-2 border border-border shadow-soft">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-repwell-teal-300/10">
                      <MapPin className="h-5 w-5 text-repwell-teal-300" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Address</CardTitle>
                      <CardDescription>Auto-geocodes on save</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Street</Label>
                    <Input value={street} onChange={(e) => setStreet(e.target.value)} placeholder="123 Main St" />
                  </div>
                  <div className="grid gap-4 grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">City</Label>
                      <Input value={city} onChange={(e) => setCity(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">State</Label>
                      <Input value={state} onChange={(e) => setState(e.target.value)} />
                    </div>
                  </div>
                  <div className="grid gap-4 grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Postal Code</Label>
                      <Input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Country</Label>
                      <Input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="US" />
                    </div>
                  </div>
                  {branch.latitude && branch.longitude && (
                    <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                      Coordinates: {branch.latitude.toFixed(4)}, {branch.longitude.toFixed(4)}
                    </div>
                  )}
                  <div className="flex justify-end pt-2">
                    <Button onClick={handleSaveAddress} disabled={isPending}>
                      {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save Address
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Hours of Operation */}
            <Card className="border border-border shadow-soft">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-repwell-teal-300/10">
                      <Clock className="h-5 w-5 text-repwell-teal-300" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Hours of Operation</CardTitle>
                      <CardDescription>Business hours for each day of the week</CardDescription>
                    </div>
                  </div>
                  <Button onClick={handleSaveHours} disabled={isPending} size="sm">
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Hours
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid gap-2">
                  {/* Header row */}
                  <div className="grid grid-cols-[2.5rem_4.5rem_3rem_1fr] items-center gap-3 px-3 pb-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    <span></span>
                    <span>Day</span>
                    <span>24hr</span>
                    <span>Hours</span>
                  </div>
                  {DAYS.map(({ key, label }) => {
                    const daySchedule = hours[key];
                    const isEnabled = daySchedule !== null;
                    const isWeekend = key === "saturday" || key === "sunday";
                    return (
                      <div
                        key={key}
                        className={cn(
                          "grid grid-cols-[2.5rem_4.5rem_3rem_1fr] items-center gap-3 rounded-lg px-3 py-2.5 transition-all",
                          isEnabled
                            ? "bg-card border border-border/50"
                            : "bg-muted/30",
                          isWeekend && isEnabled && "bg-repwell-sage-100/20 dark:bg-repwell-teal-300/10 border-repwell-sage-200/30"
                        )}
                      >
                        <Checkbox
                          checked={isEnabled}
                          onCheckedChange={() => toggleDayEnabled(key)}
                        />
                        <span className={cn(
                          "text-sm font-medium",
                          !isEnabled && "text-muted-foreground"
                        )}>
                          {label}
                        </span>

                        {isEnabled ? (
                          <>
                            <Checkbox
                              checked={daySchedule?.is24hr || false}
                              onCheckedChange={(checked) => updateHourDay(key, "is24hr", !!checked)}
                            />
                            {daySchedule?.is24hr ? (
                              <span className="text-sm text-repwell-teal-300 font-medium">Open 24 hours</span>
                            ) : (
                              <div className="flex items-center gap-2">
                                <Select
                                  value={daySchedule?.open || "09:00"}
                                  onValueChange={(v) => updateHourDay(key, "open", v)}
                                >
                                  <SelectTrigger className="w-[5.5rem] h-8 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {TIME_OPTIONS.map((t) => (
                                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <span className="text-muted-foreground text-xs font-medium">—</span>
                                <Select
                                  value={daySchedule?.close || "17:00"}
                                  onValueChange={(v) => updateHourDay(key, "close", v)}
                                >
                                  <SelectTrigger className="w-[5.5rem] h-8 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {TIME_OPTIONS.map((t) => (
                                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            <span></span>
                            <span className="text-sm text-muted-foreground italic">Closed</span>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Photo + Cover side by side */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Branch Photo */}
              <Card className="border border-border shadow-soft overflow-hidden">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-repwell-teal-300/10">
                      <ImageIcon className="h-5 w-5 text-repwell-teal-300" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Branch Photo</CardTitle>
                      <CardDescription>Profile image shown in listings and directory</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex items-start gap-6">
                    {/* Current photo preview */}
                    <div className="relative shrink-0">
                      <Avatar className="h-24 w-24 ring-2 ring-repwell-sage-200/50 ring-offset-2">
                        <AvatarImage src={photoUrl || undefined} />
                        <AvatarFallback className="text-xl bg-repwell-sage-100/50 dark:bg-repwell-teal-300/15 text-repwell-teal-400 dark:text-repwell-sage-100/80">
                          {branch.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>

                    {/* Upload dropzone */}
                    <div
                      {...getPhotoRootProps()}
                      className={cn(
                        "flex-1 flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 cursor-pointer transition-all",
                        isPhotoDragActive
                          ? "border-repwell-teal-300 bg-repwell-sage-100/50 dark:bg-repwell-teal-300/15"
                          : "border-border hover:border-repwell-teal-300/50 hover:bg-repwell-sage-100/20 dark:hover:bg-repwell-teal-300/10",
                        isUploadingPhoto && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <input {...getPhotoInputProps()} />
                      {isUploadingPhoto ? (
                        <Loader2 className="h-8 w-8 text-repwell-teal-300 animate-spin" />
                      ) : (
                        <Upload className="h-8 w-8 text-muted-foreground" />
                      )}
                      <p className="text-sm text-muted-foreground mt-2">
                        {isPhotoDragActive ? "Drop image here" : "Click or drag to upload"}
                      </p>
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        JPG, PNG or WebP &middot; max 5MB
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Cover Image */}
              <ImageUpload
                variant="banner"
                currentUrl={branch.coverImageUrl}
                onUpload={async (file) => {
                  const fd = new FormData();
                  fd.append("file", file);
                  return uploadBranchCoverImage(branch.id, fd);
                }}
              />
            </div>
          </TabsContent>

          {/* ===== SETTINGS & TEAM TAB ===== */}
          <TabsContent value="settings" className="m-0 space-y-6">
            {/* Quick Settings — consolidated status/visibility/URL into one card */}
            <Card className="border border-border shadow-soft">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-repwell-teal-300/10">
                    <GearSix className="h-5 w-5 text-repwell-teal-300" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Branch Settings</CardTitle>
                    <CardDescription>Status, visibility, and public URL</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0 divide-y divide-border/50">
                {/* Status row */}
                <div className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs",
                        isActive
                          ? "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/30 dark:text-green-400"
                          : "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400"
                      )}
                    >
                      {isActive ? "Active" : "Inactive"}
                    </Badge>
                    <div>
                      <p className="text-sm font-medium">Status</p>
                      <p className="text-xs text-muted-foreground">
                        {isActive ? "Branch is visible and operational" : "Branch is hidden from public view"}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={isActive}
                    onCheckedChange={handleToggleActive}
                    disabled={isPending}
                  />
                </div>

                {/* Visibility row */}
                <div className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-3">
                    {isPublic ? (
                      <Eye className="h-5 w-5 text-repwell-teal-300" />
                    ) : (
                      <EyeSlash className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div>
                      <p className="text-sm font-medium">Visibility</p>
                      <p className="text-xs text-muted-foreground">
                        {isPublic ? "Visible on directory and public pages" : "Hidden from public view"}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={isPublic}
                    onCheckedChange={handleTogglePublic}
                    disabled={isPending}
                  />
                </div>

                {/* Public URL row */}
                <div className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5 text-repwell-teal-300" />
                    <div>
                      <p className="text-sm font-medium">Public URL</p>
                      <p className="text-xs font-mono text-repwell-teal-400 dark:text-repwell-sage-100/80">
                        /branch/{currentSlug || getBranchPublicSlug(branch)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {(currentSlug || branch.globalSlug) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() =>
                          window.open(
                            currentSlug
                              ? `/branch/${currentSlug}`
                              : getBranchPublicPath(branch),
                            "_blank"
                          )
                        }
                      >
                        <ArrowSquareOut className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => setSlugDialogOpen(true)}>
                      <PencilSimple className="mr-1.5 h-3.5 w-3.5" />
                      Edit
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Manager */}
            <Card className="border border-border shadow-soft">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-repwell-teal-300/10">
                    <UserCircleGear className="h-5 w-5 text-repwell-teal-300" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Branch Manager</CardTitle>
                    <CardDescription>Assign a team member to manage this branch</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="max-w-sm">
                  <Select value={managerId || "none"} onValueChange={handleManagerChange} disabled={isPending}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select manager..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No manager</SelectItem>
                      {teamMembers.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.fullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-2">
                    The manager must be a team member assigned to this branch.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Team Members */}
            <Card className="border border-border shadow-soft">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-repwell-teal-300/10">
                      <Users className="h-5 w-5 text-repwell-teal-300" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Team Members</CardTitle>
                      <CardDescription>
                        {teamMembers.length} member{teamMembers.length !== 1 ? "s" : ""} assigned
                      </CardDescription>
                    </div>
                  </div>
                  <Button size="sm" onClick={() => setAssignDialogOpen(true)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Assign Member
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {teamMembers.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="pl-6">Member</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead className="w-[70px] pr-6"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {teamMembers.map((member) => (
                        <TableRow key={member.id} className="group">
                          <TableCell className="pl-6">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9">
                                <AvatarImage src={member.photoUrl || undefined} />
                                <AvatarFallback className="text-xs bg-repwell-sage-100/50 dark:bg-repwell-teal-300/15 text-repwell-teal-400 dark:text-repwell-sage-100/80">
                                  {member.fullName
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .toUpperCase()
                                    .slice(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-sm">{member.fullName}</p>
                                <p className="text-xs text-muted-foreground">{member.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {member.title || "—"}
                          </TableCell>
                          <TableCell>
                            {member.averageRating ? (
                              <span className="flex items-center gap-1 text-sm">
                                <Star className="h-3.5 w-3.5 text-yellow-500" weight="fill" />
                                {member.averageRating.toFixed(1)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-sm">—</span>
                            )}
                          </TableCell>
                          <TableCell className="pr-6">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive transition-all"
                                >
                                  <UserMinus className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Remove member from branch?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will unassign {member.fullName} from this branch. They will remain in the organization.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleRemoveMember(member.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Remove
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
                      <Users className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">No members assigned</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      Assign team members to this branch to get started
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Danger Zone */}
            {isActive && (
              <Card className="border-destructive/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2 text-destructive">
                    <Warning className="h-4 w-4" />
                    Danger Zone
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Deactivate this branch</p>
                      <p className="text-xs text-muted-foreground">
                        This will hide it from public view and the directory.
                      </p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          Deactivate Branch
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Deactivate branch?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will hide {branch.name} from public view and the directory.
                            Team members will remain assigned but the branch will be inactive.
                            You can reactivate it later.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleToggleActive}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Deactivate
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </div>
      </Tabs>

      {/* Slug Dialog */}
      <EditSlugDialog
        open={slugDialogOpen}
        onOpenChange={setSlugDialogOpen}
        currentSlug={currentSlug || branch.slug}
        entityName={branch.name}
        entityType="branch"
        baseUrl={typeof window !== "undefined" ? window.location.origin : ""}
        pathPrefix="/branch"
        onSave={async (newSlug) => {
          const result = await updateBranchSlug(branch.id, newSlug);
          if (result.success) {
            setCurrentSlug(newSlug);
          }
          return { success: result.success, error: result.error || null };
        }}
        onSuccess={() => {
          router.refresh();
        }}
      />

      {/* Assign Member Dialog */}
      <AssignMemberDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        branchId={branch.id}
        onAssigned={(member) => {
          setTeamMembers((prev) => [...prev, member]);
        }}
      />
    </>
  );
}

// Assign Member Dialog Sub-component
function AssignMemberDialog({
  open,
  onOpenChange,
  branchId,
  onAssigned,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchId: string;
  onAssigned: (member: BranchWithTeamMembers["teamMembers"][0]) => void;
}) {
  const [members, setMembers] = useState<
    { id: string; fullName: string; email: string; title: string | null; photoUrl: string | null }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  // Load unassigned members when dialog opens
  useEffect(() => {
    if (!open) return;
    let mounted = true;

    async function loadData() {
      setLoading(true);
      const result = await getUnassignedMembers();
      if (mounted) {
        if (result.success && result.data) {
          setMembers(result.data);
        }
        setLoading(false);
      }
    }

    loadData();
    return () => { mounted = false; };
  }, [open]);

  function handleAssign(member: (typeof members)[0]) {
    startTransition(async () => {
      const result = await assignUserToBranch(member.id, branchId);
      if (!result.success) {
        toast({ title: "Error", description: result.error || "Failed to assign member", variant: "destructive" });
      } else {
        onAssigned({
          id: member.id,
          fullName: member.fullName,
          email: member.email,
          title: member.title,
          photoUrl: member.photoUrl,
          averageRating: null,
          totalReviews: 0,
        });
        setMembers((prev) => prev.filter((m) => m.id !== member.id));
        toast({ title: "Member assigned", description: `${member.fullName} assigned to branch.` });
      }
    });
  }

  const filtered = members.filter((m) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return m.fullName.toLowerCase().includes(q) || m.email.toLowerCase().includes(q);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-repwell-teal-300" />
            Assign Team Member
          </DialogTitle>
          <DialogDescription>
            Select an unassigned organization member to add to this branch.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="max-h-[300px] overflow-y-auto space-y-1.5">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-repwell-teal-300" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted mb-2">
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                {search ? "No members match your search" : "All members are assigned to branches"}
              </p>
            </div>
          ) : (
            filtered.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between rounded-lg border border-border/50 p-3 hover:bg-repwell-sage-100/20 dark:hover:bg-repwell-teal-300/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={member.photoUrl || undefined} />
                    <AvatarFallback className="text-xs bg-repwell-sage-100/50 dark:bg-repwell-teal-300/15 text-repwell-teal-400 dark:text-repwell-sage-100/80">
                      {member.fullName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{member.fullName}</p>
                    <p className="text-xs text-muted-foreground">{member.email}</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleAssign(member)}
                  disabled={isPending}
                >
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Assign"}
                </Button>
              </div>
            ))
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
