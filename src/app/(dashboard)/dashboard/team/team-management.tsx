"use client";

import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from "@/components/ui/dropdown-menu";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  SpinnerGap as Loader2,
  UserPlus,
  DotsThree as MoreHorizontal,
  Envelope as Mail,
  Shield,
  UserMinus as UserX,
  UserCheck,
  X,
  Clock,
  Star,
  ArrowSquareOut as ExternalLink,
  MagnifyingGlass as Search,
  Users,
  User,
  Medal as Award,
  ChartBar as BarChart,
  DownloadSimple as Download,
  Pencil,
  UserGear as UserCog,
} from "@phosphor-icons/react";
import {
  getOrganizationMembers,
  getPendingInvitations,
  createInvitation,
  revokeInvitation,
  updateMemberRole,
  deactivateMember,
  reactivateMember,
  createInvitationSchema,
  type OrganizationMember,
  type Invitation,
  type CreateInvitation,
} from "@/lib/organization";
import { GiveRecognitionDialog } from "@/components/recognition/give-recognition-dialog";
import { EditTeamMemberDialog } from "@/components/organization/edit-team-member-dialog";
import { usePermissions } from "@/lib/permissions/context";

const ROLE_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  admin: { label: "Admin", variant: "default" },
  manager: { label: "Manager", variant: "secondary" },
  user: { label: "User", variant: "outline" },
};

interface TeamManagementProps {
  userRole: string;
}

export function TeamManagement({ userRole }: TeamManagementProps) {
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();
  const { canInviteTeam } = usePermissions();

  // Dialog state for role-based actions
  const [recognitionMember, setRecognitionMember] = useState<OrganizationMember | null>(null);
  const [editMember, setEditMember] = useState<OrganizationMember | null>(null);

  const isAdmin = userRole === "admin";
  const showInviteButton = canInviteTeam();

  const form = useForm<CreateInvitation>({
    resolver: zodResolver(createInvitationSchema),
    defaultValues: {
      email: "",
      role: "user",
    },
  });

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

  function onSubmitInvite(data: CreateInvitation) {
    startTransition(async () => {
      const result = await createInvitation(data);

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Invitation sent",
          description: `Invitation sent to ${data.email}`,
        });
        form.reset();
        setInviteDialogOpen(false);
        refreshData();
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

  async function handleUpdateRole(memberId: string, newRole: "admin" | "manager" | "user") {
    startTransition(async () => {
      const result = await updateMemberRole(memberId, newRole);

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Role updated",
          description: "Member role has been updated.",
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

  function downloadMemberReport(member: OrganizationMember) {
    // Generate CSV with member performance data
    const rows: string[][] = [];
    const date = new Date().toISOString().split("T")[0];

    rows.push(["Team Member Performance Report"]);
    rows.push([`Generated: ${new Date().toLocaleDateString()}`]);
    rows.push([]);
    rows.push(["Name", member.full_name || "N/A"]);
    rows.push(["Email", member.email]);
    rows.push(["Role", ROLE_LABELS[member.role]?.label || member.role]);
    rows.push(["Status", member.is_active ? "Active" : "Inactive"]);
    rows.push(["Joined", new Date(member.created_at).toLocaleDateString()]);
    rows.push([]);
    rows.push(["--- Performance Metrics ---"]);
    rows.push(["(View full analytics at /dashboard/analytics/member/" + member.id + ")"]);

    const csvContent = rows
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const nameSlug = (member.full_name || "member").toLowerCase().replace(/\s+/g, "-");
    link.download = `team-member-report-${nameSlug}-${date}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    // Delay revoking to ensure the browser has finished downloading
    setTimeout(() => URL.revokeObjectURL(url), 100);

    toast({
      title: "Report downloaded",
      description: `Performance report for ${member.full_name || "team member"} downloaded`,
    });
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
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

  const activeMembers = members.filter((m) => m.is_active);
  const inactiveMembers = members.filter((m) => !m.is_active);

  // Filter members by search query
  const filteredActiveMembers = activeMembers.filter((member) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      member.full_name?.toLowerCase().includes(searchLower) ||
      member.email.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      {/* Team members */}
      <Card>
        <CardContent className="pt-6">
          {/* Search and Invite */}
          <div className="mb-4 flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search team members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            {showInviteButton && (
              <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Invite Member
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Invite Team Member</DialogTitle>
                    <DialogDescription>
                      Send an invitation to add a new member to your organization.
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmitInvite)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="john@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Role</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {isAdmin && (
                                  <SelectItem value="admin">Admin - Full access</SelectItem>
                                )}
                                <SelectItem value="manager">Manager - Team management</SelectItem>
                                <SelectItem value="user">User - Basic access</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Choose the role that best fits their responsibilities
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setInviteDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={isPending}>
                          {isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Mail className="mr-2 h-4 w-4" />
                              Send Invitation
                            </>
                          )}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredActiveMembers.map((member) => (
                <TableRow key={member.id}>
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
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{member.full_name || "No name"}</p>
                          {member.role === "user" && (
                            <Link
                              href={`/dashboard/team/${member.id}`}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Link>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={ROLE_LABELS[member.role]?.variant || "outline"}>
                      {ROLE_LABELS[member.role]?.label || member.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">
                      Active
                    </Badge>
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
                        {/* Manager-level actions (available to managers and admins) */}
                        <DropdownMenuItem onClick={() => router.push(`/pro/${member.id}`)}>
                          <User className="mr-2 h-4 w-4" />
                          View Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setRecognitionMember(member)}>
                          <Award className="mr-2 h-4 w-4" />
                          Give Recognition
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(`/dashboard/analytics/member/${member.id}`)}>
                          <BarChart className="mr-2 h-4 w-4" />
                          See Analytics
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => downloadMemberReport(member)}>
                          <Download className="mr-2 h-4 w-4" />
                          Download Report
                        </DropdownMenuItem>

                        {/* Admin-only actions */}
                        {isAdmin && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setEditMember(member)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit Team Member
                            </DropdownMenuItem>
                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger>
                                <UserCog className="mr-2 h-4 w-4" />
                                Change Role
                              </DropdownMenuSubTrigger>
                              <DropdownMenuSubContent>
                                <DropdownMenuItem
                                  onClick={() => handleUpdateRole(member.id, "admin")}
                                  disabled={member.role === "admin"}
                                >
                                  <Shield className="mr-2 h-4 w-4" />
                                  Make Admin
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleUpdateRole(member.id, "manager")}
                                  disabled={member.role === "manager"}
                                >
                                  <Shield className="mr-2 h-4 w-4" />
                                  Make Manager
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleUpdateRole(member.id, "user")}
                                  disabled={member.role === "user"}
                                >
                                  <Shield className="mr-2 h-4 w-4" />
                                  Make User
                                </DropdownMenuItem>
                              </DropdownMenuSubContent>
                            </DropdownMenuSub>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDeactivate(member.id)}
                            >
                              <UserX className="mr-2 h-4 w-4" />
                              Deactivate
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {filteredActiveMembers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    {searchQuery ? "No members found matching your search" : "No active team members"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pending invitations */}
      {invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Invitations</CardTitle>
            <CardDescription>
              Invitations that haven&apos;t been accepted yet
            </CardDescription>
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
                      <Badge variant={ROLE_LABELS[invite.role]?.variant || "outline"}>
                        {ROLE_LABELS[invite.role]?.label || invite.role}
                      </Badge>
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

      {/* Inactive members */}
      {inactiveMembers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Inactive Members</CardTitle>
            <CardDescription>
              Members who have been deactivated
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="w-[120px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inactiveMembers.map((member) => (
                  <TableRow key={member.id} className="opacity-60">
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
                      <Badge variant="outline">
                        {ROLE_LABELS[member.role]?.label || member.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReactivate(member.id)}
                        disabled={isPending}
                      >
                        <UserCheck className="mr-2 h-4 w-4" />
                        Reactivate
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Recognition Dialog */}
      <GiveRecognitionDialog
        open={!!recognitionMember}
        onOpenChange={(open) => !open && setRecognitionMember(null)}
        preselectedUser={
          recognitionMember
            ? {
                id: recognitionMember.id,
                name: recognitionMember.full_name || recognitionMember.email,
                email: recognitionMember.email,
                avatarUrl: recognitionMember.avatar_url || undefined,
              }
            : undefined
        }
        onSuccess={() => {
          const memberName = recognitionMember?.full_name || "team member";
          setRecognitionMember(null);
          toast({
            title: "Recognition sent",
            description: `Recognition sent to ${memberName}`,
          });
        }}
      />

      {/* Edit Team Member Dialog (Admin only) */}
      {editMember && isAdmin && (
        <EditTeamMemberDialog
          member={editMember}
          open={!!editMember}
          onOpenChange={(open) => !open && setEditMember(null)}
          onSuccess={() => {
            setEditMember(null);
            refreshData();
            toast({
              title: "Member updated",
              description: "Team member has been updated successfully.",
            });
          }}
        />
      )}
    </div>
  );
}
