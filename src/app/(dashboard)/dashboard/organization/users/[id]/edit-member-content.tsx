"use client";

import { useState, useEffect, useMemo, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  UserCircle,
  ShieldCheck,
  SpinnerGap as Loader2,
  Warning,
  MapPin,
  Link as LinkIcon,
  PencilSimple,
  Info,
  Briefcase,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { ProfileForm } from "@/components/settings/profile-form";
import { ProfileBanner } from "@/components/settings/profile-banner";
import { CoverPhotoUpload } from "@/components/settings/cover-photo-upload";
import { EditSlugDialog } from "@/components/shared/edit-slug-dialog";
import { toUserProfileData } from "@/lib/auth/profile-schemas";
import {
  updateMemberRole,
  updateMemberProfile,
  deactivateMember,
  reactivateMember,
} from "@/lib/organization/actions";
import { updateUserSlug } from "@/lib/auth/profile-actions";
import { getBranches } from "@/lib/branches/actions";
import type { OrganizationMemberFull } from "@/lib/organization/types";
import type { Branch } from "@/lib/branches/types";

type EditTab = "profile" | "account";

interface EditMemberContentProps {
  member: OrganizationMemberFull;
  isEditingSelf?: boolean;
}

export function EditMemberContent({ member, isEditingSelf = false }: EditMemberContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isAdminSaving, startAdminTransition] = useTransition();
  const [currentRole, setCurrentRole] = useState(member.role);
  const [isActive, setIsActive] = useState(member.is_active);
  const [currentBranchId, setCurrentBranchId] = useState(member.branch_id);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [slugDialogOpen, setSlugDialogOpen] = useState(false);
  const [currentSlug, setCurrentSlug] = useState(member.slug || "");

  // Admin-only fields state
  const [ctaButtonText, setCtaButtonText] = useState(member.cta_button_text || "");
  const [ctaButtonUrl, setCtaButtonUrl] = useState(member.cta_button_url || "");
  const [hireDate, setHireDate] = useState(member.hire_date || "");
  const [industry, setIndustry] = useState(member.industry || "");
  const [region, setRegion] = useState(member.region || "");
  const [adminFieldsDirty, setAdminFieldsDirty] = useState(false);

  const memberProfile = useMemo(() => toUserProfileData(member), [member]);

  const tabParam = searchParams.get("tab");
  const currentTab: EditTab =
    tabParam === "account" ? "account" : "profile";

  useEffect(() => {
    getBranches({ isActive: true }).then((result) => {
      if (result.success && result.data) {
        setBranches(result.data);
      }
    });
  }, []);

  function handleTabChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.push(
      `/dashboard/organization/users/${member.id}?${params.toString()}`,
      { scroll: false }
    );
  }

  function handleRoleChange(newRole: string) {
    startTransition(async () => {
      const result = await updateMemberRole(
        member.id,
        newRole as "admin" | "manager" | "user"
      );
      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        setCurrentRole(newRole as "admin" | "manager" | "user");
        toast({
          title: "Role updated",
          description: `Role changed to ${newRole}.`,
        });
      }
    });
  }

  function handleDeactivate() {
    startTransition(async () => {
      const result = await deactivateMember(member.id);
      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        setIsActive(false);
        toast({
          title: "Member deactivated",
          description: "Member has been deactivated.",
        });
      }
    });
  }

  function handleReactivate() {
    startTransition(async () => {
      const result = await reactivateMember(member.id);
      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        setIsActive(true);
        toast({
          title: "Member reactivated",
          description: "Member has been reactivated.",
        });
      }
    });
  }

  function handleSaveAdminFields() {
    startAdminTransition(async () => {
      const result = await updateMemberProfile(member.id, {
        ctaButtonText,
        ctaButtonUrl,
        hireDate,
        industry,
        region,
      });
      if (result.error) {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      } else {
        setAdminFieldsDirty(false);
        toast({ title: "Saved", description: "Admin fields updated." });
      }
    });
  }

  return (
    <>
      {/* Self-edit banner */}
      {isEditingSelf && (
        <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 mb-6">
          <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-800">
              Viewing your own profile as admin
            </p>
            <p className="text-sm text-blue-600 mt-0.5">
              Go to <Link href="/dashboard/settings?tab=account" className="underline font-medium">Settings</Link> for password, billing, and notifications.
            </p>
          </div>
        </div>
      )}

      <Tabs
        value={currentTab}
        onValueChange={handleTabChange}
        className="w-full"
      >
        <TabsList className="w-full justify-start border-b border-border bg-transparent p-0 h-auto gap-0">
          {[
            { value: "profile" as const, label: "Profile", icon: UserCircle },
            {
              value: "account" as const,
              label: "Account & Access",
              icon: ShieldCheck,
            },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className={cn(
                  "relative px-4 py-3 text-sm font-medium",
                  "text-muted-foreground hover:text-repwell-teal-400",
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
          {/* Profile Tab */}
          <TabsContent value="profile" className="m-0 space-y-6">
            <ProfileBanner loanOfficerId={member.id} />
            <CoverPhotoUpload
              currentBannerUrl={member.banner_url}
              targetUserId={member.id}
            />
            <ProfileForm
              profile={memberProfile}
              isAdmin
              targetUserId={member.id}
            />
          </TabsContent>

          {/* Account & Access Tab */}
          <TabsContent value="account" className="m-0 space-y-6">
            {/* Role */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Role</CardTitle>
                <CardDescription>
                  Controls what this member can access in the dashboard.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-w-xs">
                  <Label htmlFor="member-role" className="sr-only">
                    Role
                  </Label>
                  <Select
                    value={currentRole}
                    onValueChange={handleRoleChange}
                    disabled={isPending || member.is_owner || isEditingSelf}
                  >
                    <SelectTrigger id="member-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                    </SelectContent>
                  </Select>
                  {member.is_owner && (
                    <p className="text-xs text-muted-foreground mt-2">
                      This member is the organization owner. Their role cannot
                      be changed.
                    </p>
                  )}
                  {isEditingSelf && !member.is_owner && (
                    <p className="text-xs text-muted-foreground mt-2">
                      You cannot change your own role.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Status</CardTitle>
                <CardDescription>
                  Active members can log in and access the dashboard.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Badge
                    variant="outline"
                    className={
                      isActive
                        ? "border-green-200 bg-green-50 text-green-700"
                        : "border-red-200 bg-red-50 text-red-700"
                    }
                  >
                    {isActive ? "Active" : "Inactive"}
                  </Badge>
                  {isActive ? (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          disabled={isPending || member.is_owner || isEditingSelf}
                        >
                          Deactivate
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Deactivate team member?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            This will revoke their access to the dashboard. You
                            can reactivate them later.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={handleDeactivate}
                          >
                            Deactivate
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleReactivate}
                      disabled={isPending}
                    >
                      {isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Reactivate
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Branch */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Branch
                </CardTitle>
                <CardDescription>
                  The branch this member is assigned to.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-w-xs">
                  <Select
                    value={currentBranchId || "none"}
                    onValueChange={(val) =>
                      setCurrentBranchId(val === "none" ? null : val)
                    }
                    disabled
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="No branch assigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No branch</SelectItem>
                      {branches.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-2">
                    Branch assignment is managed through the branch settings
                    page.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Admin-Only Fields */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Organization-Managed Fields
                </CardTitle>
                <CardDescription>
                  These fields are managed by admins and not visible in the member&apos;s own Settings page.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="cta-button-text">CTA Button Text</Label>
                    <Input
                      id="cta-button-text"
                      value={ctaButtonText}
                      onChange={(e) => { setCtaButtonText(e.target.value); setAdminFieldsDirty(true); }}
                      placeholder="e.g., Schedule a Call"
                      maxLength={50}
                    />
                    <p className="text-xs text-muted-foreground">{ctaButtonText.length}/50 characters</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cta-button-url">CTA Button URL</Label>
                    <Input
                      id="cta-button-url"
                      type="url"
                      value={ctaButtonUrl}
                      onChange={(e) => { setCtaButtonUrl(e.target.value); setAdminFieldsDirty(true); }}
                      placeholder="https://calendly.com/..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hire-date">Hire Date</Label>
                    <Input
                      id="hire-date"
                      type="date"
                      value={hireDate}
                      onChange={(e) => { setHireDate(e.target.value); setAdminFieldsDirty(true); }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="industry">Industry</Label>
                    <Input
                      id="industry"
                      value={industry}
                      onChange={(e) => { setIndustry(e.target.value); setAdminFieldsDirty(true); }}
                      placeholder="e.g., Mortgage, Real Estate"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="region">Region</Label>
                    <Input
                      id="region"
                      value={region}
                      onChange={(e) => { setRegion(e.target.value); setAdminFieldsDirty(true); }}
                      placeholder="e.g., Northeast, California"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <Button
                    onClick={handleSaveAdminFields}
                    disabled={isAdminSaving || !adminFieldsDirty}
                    size="sm"
                  >
                    {isAdminSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Admin Fields
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Profile URL */}
            {currentSlug && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <LinkIcon className="h-5 w-5" />
                    Profile URL
                  </CardTitle>
                  <CardDescription>
                    The public URL for this member&apos;s profile.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between gap-4 rounded-lg border bg-muted/50 p-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-mono break-all text-repwell-teal-400">
                        {typeof window !== "undefined"
                          ? window.location.origin
                          : ""}
                        /pro/{currentSlug}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSlugDialogOpen(true)}
                      className="shrink-0"
                    >
                      <PencilSimple className="h-4 w-4 mr-2" />
                      Edit URL
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Danger Zone */}
            {!member.is_owner && !isEditingSelf && isActive && (
              <Card className="border-destructive/50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-destructive">
                    <Warning className="h-5 w-5" />
                    Danger Zone
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        Deactivate this member
                      </p>
                      <p className="text-sm text-muted-foreground">
                        They will lose access to the dashboard immediately.
                      </p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={isPending}
                        >
                          Deactivate Member
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Deactivate team member?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            This will revoke{" "}
                            {member.full_name || "this member"}&apos;s access to
                            the dashboard. You can reactivate them later from the
                            team page.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={handleDeactivate}
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

      {/* Slug Edit Dialog */}
      <EditSlugDialog
        open={slugDialogOpen}
        onOpenChange={setSlugDialogOpen}
        currentSlug={currentSlug}
        entityName={member.full_name || "User"}
        entityType="user"
        baseUrl={typeof window !== "undefined" ? window.location.origin : ""}
        pathPrefix="/pro"
        onSave={async (newSlug) => {
          const result = await updateUserSlug(member.id, newSlug);
          if (result.success) {
            setCurrentSlug(newSlug);
          }
          return { success: result.success, error: result.error };
        }}
      />
    </>
  );
}
