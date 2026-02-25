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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  SpinnerGap as Loader2,
  UserPlus,
  DotsThree as MoreHorizontal,
  Envelope as Mail,
  UserCheck,
  X,
  Clock,
  ArrowSquareOut as ExternalLink,
  MagnifyingGlass as Search,
  User,
  Medal as Award,
  ChartBar as BarChart,
  DownloadSimple as Download,
  Users,
  EnvelopeSimple,
  UserCircleMinus,
} from "@phosphor-icons/react";
import {
  getOrganizationMembers,
  getPendingInvitations,
  createInvitation,
  revokeInvitation,
  reactivateMember,
  createInvitationSchema,
  type OrganizationMember,
  type Invitation,
  type CreateInvitation,
} from "@/lib/organization";
import { GiveRecognitionDialog } from "@/components/recognition/give-recognition-dialog";
import { usePermissions } from "@/lib/permissions/context";
import { Phone } from "@phosphor-icons/react";
import { formatForDisplay } from "@/lib/sms/phone-utils";
import { getLoPhoneAssignments } from "@/lib/sms/enterprise/per-lo-numbers";
import { cn } from "@/lib/utils";

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
  const [loPhoneMap, setLoPhoneMap] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();
  const { canInviteTeam } = usePermissions();

  // Dialog state for role-based actions
  const [recognitionMember, setRecognitionMember] = useState<OrganizationMember | null>(null);
  // Confirmation state for destructive actions
  const [inviteToRevoke, setInviteToRevoke] = useState<string | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);

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
      const [membersResult, invitationsResult, phoneResult] = await Promise.all([
        getOrganizationMembers(),
        getPendingInvitations(),
        getLoPhoneAssignments(),
      ]);

      if (mounted) {
        if (membersResult.members) {
          setMembers(membersResult.members);
        }
        if (invitationsResult.invitations) {
          setInvitations(invitationsResult.invitations);
        }
        if (phoneResult.success && phoneResult.data) {
          const map = new Map<string, string>();
          for (const a of phoneResult.data) {
            if (a.loanOfficerId) {
              map.set(a.loanOfficerId, a.phoneNumber);
            }
          }
          setLoPhoneMap(map);
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
    const [membersResult, invitationsResult, phoneResult] = await Promise.all([
      getOrganizationMembers(),
      getPendingInvitations(),
      getLoPhoneAssignments(),
    ]);

    if (membersResult.members) {
      setMembers(membersResult.members);
    }
    if (invitationsResult.invitations) {
      setInvitations(invitationsResult.invitations);
    }
    if (phoneResult.success && phoneResult.data) {
      const map = new Map<string, string>();
      for (const a of phoneResult.data) {
        if (a.loanOfficerId) {
          map.set(a.loanOfficerId, a.phoneNumber);
        }
      }
      setLoPhoneMap(map);
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
    setTimeout(() => URL.revokeObjectURL(url), 100);

    toast({
      title: "Report downloaded",
      description: `Performance report for ${member.full_name || "team member"} downloaded`,
    });
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Stats skeleton */}
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl border border-border/50 bg-card p-4">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="space-y-1.5">
                <Skeleton className="h-6 w-12" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
        {/* Table skeleton */}
        <Card className="border border-border shadow-soft">
          <CardHeader className="bg-gradient-to-r from-repwell-sage-100/30 to-transparent border-b border-border/50">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-xl" />
              <div className="space-y-1.5">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
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

  const filteredActiveMembers = activeMembers.filter((member) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      member.full_name?.toLowerCase().includes(searchLower) ||
      member.email.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      {/* Stats Overview Strip */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Members", value: members.length, icon: Users },
          { label: "Active", value: activeMembers.length, icon: UserCheck },
          { label: "Pending Invites", value: invitations.length, icon: EnvelopeSimple },
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
                <p className="text-2xl font-semibold tracking-tight text-repwell-teal-500">
                  {stat.value}
                </p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Team Members */}
      <Card className="border border-border shadow-soft">
        <CardHeader className="bg-gradient-to-r from-repwell-sage-100/30 to-transparent border-b border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-repwell-teal-300/10">
                <Users className="h-5 w-5 text-repwell-teal-300" />
              </div>
              <div>
                <CardTitle className="text-lg">Team Members</CardTitle>
                <CardDescription>
                  {activeMembers.length} active member{activeMembers.length !== 1 ? "s" : ""}
                </CardDescription>
              </div>
            </div>
            {showInviteButton && (
              <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Invite Member
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <UserPlus className="h-5 w-5 text-repwell-teal-300" />
                      Invite Team Member
                    </DialogTitle>
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
        </CardHeader>
        <CardContent className="p-0">
          {/* Search bar */}
          <div className="px-6 py-4 border-b border-border/50">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search team members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {filteredActiveMembers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-6">Member</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>SMS Number</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="w-[70px] pr-6"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredActiveMembers.map((member) => (
                  <TableRow key={member.id} className="group">
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={member.avatar_url || undefined} />
                          <AvatarFallback className="text-xs bg-repwell-sage-100/50 text-repwell-teal-400">
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
                            <p className="font-medium text-sm">{member.full_name || "No name"}</p>
                            {member.role === "user" && (
                              <Link
                                href={`/dashboard/analytics/member/${member.id}`}
                                className="text-muted-foreground hover:text-repwell-teal-400 transition-colors"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </Link>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{member.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={ROLE_LABELS[member.role]?.variant || "outline"}>
                        {ROLE_LABELS[member.role]?.label || member.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {loPhoneMap.has(member.id) ? (
                        <span className="flex items-center gap-1.5 text-sm font-mono">
                          <Phone className="h-3.5 w-3.5 text-repwell-teal-300" />
                          {formatForDisplay(loPhoneMap.get(member.id)!)}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="border-repwell-sage-200 bg-repwell-sage-100/30 text-repwell-teal-400"
                      >
                        Active
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(member.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="pr-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {member.slug && (
                            <DropdownMenuItem onClick={() => router.push(`/pro/${member.slug}`)}>
                              <User className="mr-2 h-4 w-4" />
                              View Profile
                            </DropdownMenuItem>
                          )}
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
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-repwell-sage-100/30 mb-3">
                <Users className="h-6 w-6 text-repwell-teal-300/50" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                {searchQuery ? "No members found matching your search" : "No active team members"}
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                {searchQuery ? "Try a different search term" : "Invite your first team member to get started"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <Card className="border border-border shadow-soft">
          <CardHeader className="bg-gradient-to-r from-repwell-sage-100/30 to-transparent border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-repwell-teal-300/10">
                <EnvelopeSimple className="h-5 w-5 text-repwell-teal-300" />
              </div>
              <div>
                <CardTitle className="text-lg">Pending Invitations</CardTitle>
                <CardDescription>
                  {invitations.length} invitation{invitations.length !== 1 ? "s" : ""} awaiting acceptance
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-6">Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="w-[70px] pr-6"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((invite) => (
                  <TableRow key={invite.id} className="group">
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-repwell-sage-100/50">
                          <Mail className="h-4 w-4 text-repwell-teal-300" />
                        </div>
                        <span className="text-sm">{invite.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={ROLE_LABELS[invite.role]?.variant || "outline"}>
                        {ROLE_LABELS[invite.role]?.label || invite.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        {new Date(invite.expires_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="pr-6">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive transition-all"
                        onClick={() => setInviteToRevoke(invite.id)}
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

      {/* Inactive Members */}
      {inactiveMembers.length > 0 && (
        <Card className="border border-border shadow-soft">
          <CardHeader className="bg-gradient-to-r from-repwell-sage-100/30 to-transparent border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-repwell-teal-300/10">
                <UserCircleMinus className="h-5 w-5 text-repwell-teal-300" />
              </div>
              <div>
                <CardTitle className="text-lg">Inactive Members</CardTitle>
                <CardDescription>
                  {inactiveMembers.length} deactivated member{inactiveMembers.length !== 1 ? "s" : ""}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-6">Member</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="w-[120px] pr-6"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inactiveMembers.map((member) => (
                  <TableRow key={member.id} className="group opacity-60 hover:opacity-100 transition-opacity">
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={member.avatar_url || undefined} />
                          <AvatarFallback className="text-xs bg-repwell-sage-100/50 text-repwell-teal-400">
                            {(member.full_name || member.email)
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{member.full_name || "No name"}</p>
                          <p className="text-xs text-muted-foreground">{member.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {ROLE_LABELS[member.role]?.label || member.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="pr-6">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReactivate(member.id)}
                        disabled={isPending}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
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

      {/* Revoke Invitation Confirmation */}
      <AlertDialog
        open={!!inviteToRevoke}
        onOpenChange={(open) => {
          if (!open && !isRevoking) setInviteToRevoke(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke invitation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel the pending invitation. The invitee will no longer be able to use the invite link.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRevoking}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isRevoking}
              onClick={async (e) => {
                e.preventDefault();
                if (!inviteToRevoke || isRevoking) return;
                setIsRevoking(true);
                try {
                  await handleRevokeInvitation(inviteToRevoke);
                } finally {
                  setIsRevoking(false);
                  setInviteToRevoke(null);
                }
              }}
            >
              {isRevoking ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Revoking...
                </>
              ) : (
                "Revoke"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
