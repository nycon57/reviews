"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  SpinnerGap as Loader2,
  Plus,
  DotsThree as MoreHorizontal,
  Pencil,
  Eye,
  Power,
  MagnifyingGlass,
  MapPin,
  UserCheck,
  Buildings,
} from "@phosphor-icons/react";
import { useToast } from "@/hooks/use-toast";
import { getBranches, updateBranch } from "@/lib/branches/actions";
import { CreateBranchDialog } from "./create-branch-dialog";
import type { Branch } from "@/lib/branches/types";

export function OrganizationBranches() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      const result = await getBranches();
      if (mounted) {
        if (result.success && result.data) {
          setBranches(result.data);
        }
        setLoading(false);
      }
    }

    loadData();
    return () => { mounted = false; };
  }, []);

  async function refreshBranches() {
    const result = await getBranches();
    if (result.success && result.data) {
      setBranches(result.data);
    }
  }

  async function handleToggleActive(branch: Branch) {
    startTransition(async () => {
      const result = await updateBranch(branch.id, {
        isActive: !branch.isActive,
      });

      if (!result.success) {
        toast({
          title: "Error",
          description: result.error || "Failed to update branch",
          variant: "destructive",
        });
      } else {
        toast({
          title: branch.isActive ? "Branch deactivated" : "Branch reactivated",
          description: `${branch.name} has been ${branch.isActive ? "deactivated" : "reactivated"}.`,
        });
        await refreshBranches();
      }
    });
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="border border-border shadow-soft">
          <CardHeader className="bg-gradient-to-r from-repwell-sage-100/30 to-transparent border-b border-border/50">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-lg" />
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

  const filtered = branches.filter((b) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      b.name.toLowerCase().includes(q) ||
      b.region?.toLowerCase().includes(q) ||
      b.managerName?.toLowerCase().includes(q) ||
      b.address?.city?.toLowerCase().includes(q) ||
      b.address?.state?.toLowerCase().includes(q)
    );
  });

  const activeBranches = filtered.filter((b) => b.isActive);
  const inactiveBranches = filtered.filter((b) => !b.isActive);

  return (
    <div className="space-y-6">
      <Card className="border border-border shadow-soft">
        <CardHeader className="bg-gradient-to-r from-repwell-sage-100/30 to-transparent border-b border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-repwell-teal-300/10">
                <Buildings className="h-5 w-5 text-repwell-teal-300" weight="duotone" />
              </div>
              <div>
                <CardTitle className="text-lg">Branches</CardTitle>
                <CardDescription>
                  Manage your organization&apos;s branch locations
                </CardDescription>
              </div>
            </div>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Branch
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative max-w-sm">
            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search branches..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Branch</TableHead>
                <TableHead>Manager</TableHead>
                <TableHead>Region</TableHead>
                <TableHead className="text-center">Members</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeBranches.map((branch) => (
                <TableRow
                  key={branch.id}
                  className="cursor-pointer"
                  onClick={() =>
                    router.push(
                      `/dashboard/organization/branches/${branch.id}`
                    )
                  }
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-repwell-teal-300/10">
                        <Buildings className="h-4 w-4 text-repwell-teal-300" weight="duotone" />
                      </div>
                      <div>
                        <p className="font-medium">{branch.name}</p>
                        {(branch.address?.city || branch.address?.state) && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {[branch.address.city, branch.address.state]
                              .filter(Boolean)
                              .join(", ")}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {branch.managerName ? (
                      <span className="flex items-center gap-1.5">
                        <UserCheck className="h-3.5 w-3.5 text-muted-foreground" />
                        {branch.managerName}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {branch.region || (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {branch.totalMembers}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="border-green-200 bg-green-50 text-green-700"
                    >
                      Active
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(
                              `/dashboard/organization/branches/${branch.id}`
                            );
                          }}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        {branch.globalSlug && (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(
                                `/branch/${branch.globalSlug}`,
                                "_blank"
                              );
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Public Profile
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleActive(branch);
                          }}
                          disabled={isPending}
                        >
                          <Power className="mr-2 h-4 w-4" />
                          Deactivate
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {activeBranches.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground py-8"
                  >
                    {search
                      ? "No branches match your search"
                      : "No active branches yet"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Inactive branches */}
      {inactiveBranches.length > 0 && (
        <Card className="border border-border shadow-soft">
          <CardHeader className="bg-gradient-to-r from-repwell-sage-100/30 to-transparent border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-repwell-teal-300/10">
                <Buildings className="h-5 w-5 text-repwell-teal-300" weight="duotone" />
              </div>
              <div>
                <CardTitle className="text-lg">Inactive Branches</CardTitle>
                <CardDescription>
                  Branches that have been deactivated
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Branch</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead className="w-[120px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inactiveBranches.map((branch) => (
                  <TableRow key={branch.id} className="opacity-60">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                          <Buildings className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">{branch.name}</p>
                          {(branch.address?.city ||
                            branch.address?.state) && (
                            <p className="text-sm text-muted-foreground">
                              {[branch.address.city, branch.address.state]
                                .filter(Boolean)
                                .join(", ")}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {branch.region || (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleActive(branch)}
                        disabled={isPending}
                      >
                        {isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Power className="mr-2 h-4 w-4" />
                        )}
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

      <CreateBranchDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={refreshBranches}
      />
    </div>
  );
}
