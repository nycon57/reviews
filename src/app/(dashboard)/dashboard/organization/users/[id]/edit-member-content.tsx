"use client";

import { useState, useEffect, useMemo, useTransition } from "react";
import Link from "next/link";
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

type Section = "profile" | "role" | "branch" | "org-fields" | "profile-url" | "danger";

interface SidebarItem {
  value: Section;
  label: string;
  icon: React.ElementType;
}

interface EditMemberContentProps {
  member: OrganizationMemberFull;
  isEditingSelf?: boolean;
}

export function EditMemberContent({ member, isEditingSelf = false }: EditMemberContentProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isAdminSaving, startAdminTransition] = useTransition();
  const [activeSection, setActiveSection] = useState<Section>("profile");
  const [currentRole, setCurrentRole] = useState(member.role);
  const [isActive, setIsActive] = useState(member.is_active);
  const [currentBranchId, setCurrentBranchId] = useState(member.branch_id);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [slugDialogOpen, setSlugDialogOpen] = useState(false);
  const [currentSlug, setCurrentSlug] = useState(member.slug || "");
  const [origin, setOrigin] = useState(() =>
    typeof window !== "undefined" ? window.location.origin : ""
  );

  // Admin-only fields state
  const [ctaButtonText, setCtaButtonText] = useState(member.cta_button_text || "");
  const [ctaButtonUrl, setCtaButtonUrl] = useState(member.cta_button_url || "");
  const [hireDate, setHireDate] = useState(member.hire_date || "");
  const [adminFieldsDirty, setAdminFieldsDirty] = useState(false);

  const memberProfile = useMemo(() => toUserProfileData(member), [member]);

  const showDangerZone = !member.is_owner && !isEditingSelf && isActive;

  const sidebarItems = useMemo<SidebarItem[]>(() => {
    const items: SidebarItem[] = [
      { value: "profile", label: "Profile", icon: UserCircle },
      { value: "role", label: "Role & Access", icon: ShieldCheck },
      { value: "branch", label: "Branch", icon: MapPin },
      { value: "org-fields", label: "Org Fields", icon: Briefcase },
    ];
    if (currentSlug) {
      items.push({ value: "profile-url", label: "Profile URL", icon: LinkIcon });
    }
    if (showDangerZone) {
      items.push({ value: "danger", label: "Danger Zone", icon: Warning });
    }
    return items;
  }, [currentSlug, showDangerZone]);

  useEffect(() => {
    if (!origin) setOrigin(window.location.origin);
    getBranches({ isActive: true }).then((result) => {
      if (result.success && result.data) {
        setBranches(result.data);
      }
    });
  }, []);

  // Fall back to profile if the selected section is no longer available
  const effectiveSection = sidebarItems.some((item) => item.value === activeSection)
    ? activeSection
    : "profile";

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
        <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30 p-4 mb-6">
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

      <div className="flex gap-6">
        {/* Sidebar nav */}
        <nav className="w-48 shrink-0 border-r border-border pr-4">
          <ul className="space-y-1">
            {sidebarItems.map((item) => {
              const isItemActive = effectiveSection === item.value;
              const Icon = item.icon;
              return (
                <li key={item.value}>
                  <button
                    onClick={() => setActiveSection(item.value)}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-sans transition-all duration-200",
                      isItemActive
                        ? item.value === "danger"
                          ? "bg-destructive/10 text-destructive font-semibold"
                          : "bg-repwell-sage-100/50 dark:bg-repwell-teal-300/15 text-heading-accent font-semibold"
                        : item.value === "danger"
                          ? "text-destructive/70 hover:text-destructive hover:bg-destructive/5"
                          : "text-repwell-teal-300 hover:text-repwell-teal-400 dark:hover:text-repwell-sage-100/80 hover:bg-repwell-sage-100/30 dark:hover:bg-repwell-teal-300/10"
                    )}
                  >
                    <Icon
                      weight={isItemActive ? "duotone" : "regular"}
                      className={cn(
                        "h-4 w-4 shrink-0",
                        item.value === "danger"
                          ? isItemActive ? "text-destructive" : "text-destructive/50"
                          : isItemActive ? "text-repwell-teal-300" : "text-repwell-teal-300/50"
                      )}
                    />
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Content area */}
        <div className="flex-1 min-w-0">
          {/* Profile */}
          {effectiveSection === "profile" && (
            <div className="space-y-6">
              <ProfileBanner loanOfficerId={member.id} />
              <ProfileForm
                profile={memberProfile}
                isAdmin
                targetUserId={member.id}
                memberName={member.full_name || member.email}
              />
            </div>
          )}

          {/* Role & Access */}
          {effectiveSection === "role" && (
            <div className="space-y-6">
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
                          ? "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/30 dark:text-green-400"
                          : "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400"
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
            </div>
          )}

          {/* Branch */}
          {effectiveSection === "branch" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Branch</CardTitle>
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
          )}

          {/* Organization Fields */}
          {effectiveSection === "org-fields" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Organization-Managed Fields</CardTitle>
                <CardDescription>
                  These fields are managed by admins. Members can view these read-only in their Settings.
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
          )}

          {/* Profile URL */}
          {effectiveSection === "profile-url" && currentSlug && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Profile URL</CardTitle>
                <CardDescription>
                  The public URL for this member&apos;s profile.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between gap-4 rounded-lg border bg-muted/50 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-mono break-all text-repwell-teal-400 dark:text-repwell-sage-100/80">
                      {origin}/pro/{currentSlug}
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
          {effectiveSection === "danger" && showDangerZone && (
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
                        disabled={isPending || member.is_owner || isEditingSelf}
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
        </div>
      </div>

      {/* Slug Edit Dialog */}
      {origin && <EditSlugDialog
        open={slugDialogOpen}
        onOpenChange={setSlugDialogOpen}
        currentSlug={currentSlug}
        entityName={member.full_name || "User"}
        entityType="user"
        baseUrl={origin}
        pathPrefix="/pro"
        onSave={async (newSlug) => {
          const result = await updateUserSlug(member.id, newSlug);
          if (result.success) {
            setCurrentSlug(newSlug);
          }
          return { success: result.success, error: result.error };
        }}
      />}
    </>
  );
}
