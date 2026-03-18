"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import {
  SpinnerGap as Loader2,
  UserPlus,
  DotsThree as MoreHorizontal,
  Envelope as Mail,

  X,
  Clock,
  Pencil,
  SignIn,
  UsersThree,
  UploadSimple,
  MagnifyingGlass,
  Funnel,
  CaretUp,
  CaretDown,
  CaretUpDown,
} from "@phosphor-icons/react";
import { CsvImportWizard } from "@/components/shared/csv-import-wizard";
import { StatusBadge } from "@/components/shared/status-badge";
import { createUserImportConfig } from "@/lib/organization/user-import-config";
import {
  getOrganizationMembers,
  getPendingInvitations,
  revokeInvitation,
  createOrganizationUser,
  deactivateMember,
  reactivateMember,
  startUserImpersonation,
  type OrganizationMember,
  type Invitation,
} from "@/lib/organization";
import { usePermissions } from "@/lib/permissions/context";

type SortField = "name" | "role" | "status" | "joined" | "completion";
type SortDir = "asc" | "desc";

const ROLE_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  admin: { label: "Admin", variant: "default" },
  manager: { label: "Manager", variant: "secondary" },
  user: { label: "User", variant: "outline" },
};

function DeactivateSwitch({
  memberId,
  memberName,
  isPending,
  onDeactivate,
}: {
  memberId: string;
  memberName: string;
  isPending: boolean;
  onDeactivate: (id: string) => void;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-2">
        <Switch
          checked
          disabled={isPending}
          onCheckedChange={() => setDialogOpen(true)}
          className="data-[state=checked]:bg-repwell-teal-300"
        />
        <span className="text-sm font-medium text-repwell-teal-300">Active</span>
      </div>
      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate member?</AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately revoke {memberName}&apos;s access to RepWell. They will be signed out on their next page load.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDeactivate(memberId);
                setDialogOpen(false);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function OrganizationTeam() {
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const userImportConfig = useMemo(() => createUserImportConfig(), []);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserRole, setNewUserRole] = useState<"admin" | "manager" | "user">("user");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [impersonationTarget, setImpersonationTarget] = useState<OrganizationMember | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();
  const { canImpersonateUsers, userContext } = usePermissions();
  const impersonationFeatureEnabled = process.env.NEXT_PUBLIC_ENABLE_USER_IMPERSONATION !== "false";
  const showImpersonationAction = impersonationFeatureEnabled && canImpersonateUsers();

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      const [membersResult, invitationsResult] = await Promise.all([
        getOrganizationMembers(),
        getPendingInvitations(),
      ]);

      if (mounted) {
        if (membersResult.members) {
          setMembers(membersResult.members);
        }
        if (invitationsResult.invitations) {
          setInvitations(invitationsResult.invitations);
        }
        setLoading(false);
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  async function refreshData() {
    const [membersResult, invitationsResult] = await Promise.all([
      getOrganizationMembers(),
      getPendingInvitations(),
    ]);

    if (membersResult.members) {
      setMembers(membersResult.members);
    }
    if (invitationsResult.invitations) {
      setInvitations(invitationsResult.invitations);
    }
  }

  function handleAddUser() {
    if (!newUserEmail.trim() || !newUserName.trim()) return;
    startTransition(async () => {
      const result = await createOrganizationUser({
        email: newUserEmail.trim(),
        fullName: newUserName.trim(),
        role: newUserRole,
      });

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else if (result.userId) {
        toast({
          title: "User created",
          description: `Account created for ${newUserName.trim()}`,
        });
        setAddUserDialogOpen(false);
        setNewUserEmail("");
        setNewUserName("");
        setNewUserRole("user");
        router.push(`/dashboard/organization/users/${result.userId}`);
      }
    });
  }

  async function handleRevokeInvitation(invitationId: string) {
    startTransition(async () => {
      const result = await revokeInvitation(invitationId);

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Invitation revoked",
          description: "The invitation has been revoked.",
        });
        refreshData();
      }
    });
  }


  async function handleDeactivate(memberId: string) {
    startTransition(async () => {
      const result = await deactivateMember(memberId);

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Member deactivated",
          description: "Member has been deactivated.",
        });
        refreshData();
      }
    });
  }

  async function handleReactivate(memberId: string) {
    startTransition(async () => {
      const result = await reactivateMember(memberId);

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Member reactivated",
          description: "Member has been reactivated.",
        });
        refreshData();
      }
    });
  }

  function getImpersonationDisabledReason(member: OrganizationMember): string | null {
    if (!userContext) return "You don't have permission to impersonate users.";
    if (member.id === userContext.userId) return "You can't impersonate yourself.";
    if (member.role === "admin") return "Admin accounts cannot be impersonated.";
    if (!member.is_active) return "Cannot impersonate inactive users.";
    return null;
  }

  function openImpersonationConfirm(member: OrganizationMember) {
    const reason = getImpersonationDisabledReason(member);
    if (reason) {
      toast({
        title: "Unable to impersonate user",
        description: reason,
        variant: "destructive",
      });
      return;
    }
    setImpersonationTarget(member);
  }

  function handleStartImpersonation() {
    if (!impersonationTarget) return;

    startTransition(async () => {
      const result = await startUserImpersonation(impersonationTarget.id);

      if (result.error) {
        toast({
          title: "Impersonation failed",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Impersonation started",
        description: `You are now impersonating ${impersonationTarget.full_name || impersonationTarget.email}.`,
      });
      setImpersonationTarget(null);
      window.location.href = "/dashboard";
    });
  }

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  }

  const filteredMembers = useMemo(() => {
    let result = [...members];

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (m) =>
          (m.full_name || "").toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q),
      );
    }

    // Role filter
    if (roleFilter !== "all") {
      result = result.filter((m) => m.role === roleFilter);
    }

    // Status filter
    if (statusFilter !== "all") {
      const wantActive = statusFilter === "active";
      result = result.filter((m) => m.is_active === wantActive);
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "name":
          cmp = (a.full_name || a.email).localeCompare(b.full_name || b.email);
          break;
        case "role": {
          const order = { admin: 0, manager: 1, user: 2 };
          cmp = (order[a.role] ?? 3) - (order[b.role] ?? 3);
          break;
        }
        case "status":
          cmp = Number(b.is_active) - Number(a.is_active); // active first
          break;
        case "joined":
          cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case "completion":
          cmp = Number(a.profile_completion) - Number(b.profile_completion);
          break;
      }
      return sortDir === "desc" ? -cmp : cmp;
    });

    return result;
  }, [members, searchQuery, roleFilter, statusFilter, sortField, sortDir]);

  const hasActiveFilters = searchQuery.trim() !== "" || roleFilter !== "all" || statusFilter !== "all";

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="border border-border shadow-soft">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Team members */}
      <Card className="border border-border shadow-soft">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-repwell-teal-300/10">
                <UsersThree className="h-5 w-5 text-repwell-teal-300" weight="duotone" />
              </div>
              <div>
                <CardTitle className="text-lg">Team Members</CardTitle>
                <CardDescription>
                  Manage your organization&apos;s team members and their roles
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setBulkImportOpen(true)}>
                <UploadSimple className="mr-2 h-4 w-4" />
                Import CSV
              </Button>
              <Dialog open={addUserDialogOpen} onOpenChange={(open) => {
                setAddUserDialogOpen(open);
                if (!open) {
                  setNewUserEmail("");
                  setNewUserName("");
                  setNewUserRole("user");
                }
              }}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add User
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Team Member</DialogTitle>
                    <DialogDescription>
                      Create a new user account. You&apos;ll be taken to their profile to fill in details.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="add-user-name" className="text-sm font-medium">Full Name</label>
                      <Input
                        id="add-user-name"
                        placeholder="John Smith"
                        value={newUserName}
                        onChange={(e) => setNewUserName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="add-user-email" className="text-sm font-medium">Email</label>
                      <Input
                        id="add-user-email"
                        type="email"
                        placeholder="john@example.com"
                        value={newUserEmail}
                        onChange={(e) => setNewUserEmail(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="add-user-role" className="text-sm font-medium">Role</label>
                      <Select value={newUserRole} onValueChange={(v) => setNewUserRole(v as "admin" | "manager" | "user")}>
                        <SelectTrigger id="add-user-role">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin - Full access</SelectItem>
                          <SelectItem value="manager">Manager - Team management</SelectItem>
                          <SelectItem value="user">User - Basic access</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setAddUserDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAddUser}
                      disabled={isPending || !newUserEmail.trim() || !newUserName.trim()}
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <UserPlus className="mr-2 h-4 w-4" />
                          Create &amp; Edit Profile
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search & Filters */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Funnel className="h-4 w-4 text-muted-foreground shrink-0" />
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setSearchQuery(""); setRoleFilter("all"); setStatusFilter("all"); }}
                  className="text-muted-foreground h-8 px-2"
                >
                  <X className="h-3.5 w-3.5 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Unified Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <SortableHead field="name" current={sortField} dir={sortDir} onToggle={toggleSort}>Member</SortableHead>
                <SortableHead field="role" current={sortField} dir={sortDir} onToggle={toggleSort}>Role</SortableHead>
                <SortableHead field="completion" current={sortField} dir={sortDir} onToggle={toggleSort}>Profile</SortableHead>
                <SortableHead field="status" current={sortField} dir={sortDir} onToggle={toggleSort}>Status</SortableHead>
                <SortableHead field="joined" current={sortField} dir={sortDir} onToggle={toggleSort}>Joined</SortableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.map((member) => {
                const isEnterpriseOwnerSelf = userContext?.isOwner && userContext.accountType !== "individual" && member.id === userContext.userId;
                const impersonationDisabledReason = getImpersonationDisabledReason(member);

                return (
                  <TableRow key={member.id} className={member.is_active ? "" : "opacity-60"}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={member.avatar_url || undefined} />
                          <AvatarFallback>
                            {(member.full_name || member.email)
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{member.full_name || "No name"}</p>
                          <p className="text-sm text-muted-foreground">{member.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={member.role} config={ROLE_LABELS} />
                    </TableCell>
                    <TableCell>
                      <ProfileCompletionCell value={member.profile_completion} />
                    </TableCell>
                    <TableCell>
                      {member.is_active ? (
                        isEnterpriseOwnerSelf ? (
                          <div className="flex items-center gap-2">
                            <Switch checked disabled className="data-[state=checked]:bg-repwell-teal-300 opacity-50" />
                            <span className="text-sm font-medium text-repwell-teal-300">Active</span>
                          </div>
                        ) : (
                          <DeactivateSwitch
                            memberId={member.id}
                            memberName={member.full_name || member.email}
                            isPending={isPending}
                            onDeactivate={handleDeactivate}
                          />
                        )
                      ) : (
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={false}
                            onCheckedChange={() => handleReactivate(member.id)}
                            disabled={isPending}
                          />
                          <span className="text-sm font-medium text-muted-foreground">Inactive</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(member.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/dashboard/organization/users/${member.id}`)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          {showImpersonationAction && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="block w-full">
                                    <DropdownMenuItem
                                      disabled={Boolean(impersonationDisabledReason)}
                                      onSelect={(event) => {
                                        if (impersonationDisabledReason) {
                                          event.preventDefault();
                                          return;
                                        }
                                        openImpersonationConfirm(member);
                                      }}
                                    >
                                      <SignIn className="mr-2 h-4 w-4" />
                                      Impersonate user
                                    </DropdownMenuItem>
                                  </span>
                                </TooltipTrigger>
                                {impersonationDisabledReason && (
                                  <TooltipContent>
                                    {impersonationDisabledReason}
                                  </TooltipContent>
                                )}
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredMembers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    {hasActiveFilters ? "No members match your filters" : "No team members"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pending invitations */}
      {invitations.length > 0 && (
        <Card className="border border-border shadow-soft">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-repwell-teal-300/10">
                <Clock className="h-5 w-5 text-repwell-teal-300" weight="duotone" />
              </div>
              <div>
                <CardTitle className="text-lg">Pending Invitations</CardTitle>
                <CardDescription>
                  Invitations that haven&apos;t been accepted yet
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((invite) => (
                  <TableRow key={invite.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <span>{invite.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={invite.role} config={ROLE_LABELS} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(invite.expires_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleRevokeInvitation(invite.id)}
                        disabled={isPending}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <AlertDialog
        open={Boolean(impersonationTarget)}
        onOpenChange={(open) => {
          if (!open) setImpersonationTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Impersonate this user?</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to sign in as{" "}
              <span className="font-medium">
                {impersonationTarget?.full_name || impersonationTarget?.email}
              </span>
              . All actions will be audited and attributed to your admin account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleStartImpersonation}
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Starting...
                </>
              ) : (
                "Start impersonation"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CsvImportWizard
        open={bulkImportOpen}
        onOpenChange={setBulkImportOpen}
        onComplete={() => {
          setBulkImportOpen(false);
          refreshData();
        }}
        config={userImportConfig}
      />
    </div>
  );
}

function ProfileCompletionCell({ value }: { value: number }) {
  const pct = value ?? 0;
  const color = pct >= 80 ? "text-green-600" : pct >= 50 ? "text-yellow-600" : "text-orange-500";
  const strokeColor = pct >= 80 ? "stroke-green-500" : pct >= 50 ? "stroke-yellow-500" : "stroke-orange-400";
  const r = 14;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="flex items-center gap-2">
      <svg width="32" height="32" viewBox="0 0 32 32" className="shrink-0">
        <circle cx="16" cy="16" r={r} fill="none" stroke="currentColor" strokeWidth="3" className="text-muted/30" />
        <circle
          cx="16"
          cy="16"
          r={r}
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={strokeColor}
          transform="rotate(-90 16 16)"
        />
      </svg>
      <span className={`text-sm font-medium tabular-nums ${color}`}>{pct}%</span>
    </div>
  );
}

function SortableHead({
  field,
  current,
  dir,
  onToggle,
  children,
}: {
  field: SortField;
  current: SortField;
  dir: SortDir;
  onToggle: (f: SortField) => void;
  children: React.ReactNode;
}) {
  const active = field === current;
  return (
    <TableHead>
      <button
        type="button"
        onClick={() => onToggle(field)}
        className="inline-flex items-center gap-1 hover:text-foreground transition-colors -ml-1 px-1 py-0.5 rounded"
      >
        {children}
        {active ? (
          dir === "asc" ? <CaretUp className="h-3.5 w-3.5" /> : <CaretDown className="h-3.5 w-3.5" />
        ) : (
          <CaretUpDown className="h-3.5 w-3.5 opacity-40" />
        )}
      </button>
    </TableHead>
  );
}
