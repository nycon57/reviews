"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
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


import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
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
  Plus,
  DotsThree as MoreHorizontal,
  Pencil,
  Eye,
  Power,
  MagnifyingGlass,
  MapPin,
  UserCheck,
  Buildings,
  Funnel,
  CaretUp,
  CaretDown,
  CaretUpDown,
  X,
  UploadSimple,
} from "@phosphor-icons/react";
import { useToast } from "@/hooks/use-toast";
import { getBranches, updateBranch } from "@/lib/branches/actions";
import { CreateBranchDialog } from "./create-branch-dialog";
import { BulkBranchImportWizard } from "./bulk-branch-import-wizard";
import type { Branch } from "@/lib/branches/types";

type BranchSortField = "name" | "manager" | "region" | "members" | "status";
type SortDir = "asc" | "desc";

export function OrganizationBranches() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [regionFilter, setRegionFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<BranchSortField>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
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

  const regions = useMemo(
    () => [...new Set(branches.map((b) => b.region).filter((r): r is string => !!r))].sort(),
    [branches]
  );

  const hasActiveFilters = search.trim() !== "" || statusFilter !== "all" || regionFilter !== "all";

  const filteredBranches = useMemo(() => {
    let result = [...branches];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.region?.toLowerCase().includes(q) ||
          b.managerName?.toLowerCase().includes(q) ||
          b.address?.city?.toLowerCase().includes(q) ||
          b.address?.state?.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((b) =>
        statusFilter === "active" ? b.isActive : !b.isActive
      );
    }

    if (regionFilter !== "all") {
      result = result.filter((b) => b.region === regionFilter);
    }

    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "name":
          cmp = a.name.localeCompare(b.name);
          break;
        case "manager":
          cmp = (a.managerName || "").localeCompare(b.managerName || "");
          break;
        case "region":
          cmp = (a.region || "").localeCompare(b.region || "");
          break;
        case "members":
          cmp = a.totalMembers - b.totalMembers;
          break;
        case "status":
          cmp = Number(b.isActive) - Number(a.isActive);
          break;
      }
      return sortDir === "desc" ? -cmp : cmp;
    });

    return result;
  }, [branches, search, statusFilter, regionFilter, sortField, sortDir]);

  function toggleSort(field: BranchSortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
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
                  {branches.length} branch{branches.length !== 1 ? "es" : ""}
                  {filteredBranches.length !== branches.length && ` \u00b7 ${filteredBranches.length} shown`}
                </CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
                <UploadSimple className="mr-2 h-4 w-4" />
                Import CSV
              </Button>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Branch
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search & Filters */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search branches..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Funnel className="h-4 w-4 text-muted-foreground shrink-0" />
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
              {regions.length > 0 && (
                <Select value={regionFilter} onValueChange={setRegionFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Region" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Regions</SelectItem>
                    {regions.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setSearch(""); setStatusFilter("all"); setRegionFilter("all"); }}
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
                <BranchSortableHead field="name" current={sortField} dir={sortDir} onToggle={toggleSort}>Branch</BranchSortableHead>
                <BranchSortableHead field="manager" current={sortField} dir={sortDir} onToggle={toggleSort}>Manager</BranchSortableHead>
                <BranchSortableHead field="region" current={sortField} dir={sortDir} onToggle={toggleSort}>Region</BranchSortableHead>
                <BranchSortableHead field="members" current={sortField} dir={sortDir} onToggle={toggleSort} className="text-center">Members</BranchSortableHead>
                <BranchSortableHead field="status" current={sortField} dir={sortDir} onToggle={toggleSort}>Status</BranchSortableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBranches.map((branch) => (
                <TableRow
                  key={branch.id}
                  className={`cursor-pointer ${!branch.isActive ? "opacity-60" : ""}`}
                  onClick={() => router.push(`/dashboard/organization/branches/${branch.id}`)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${branch.isActive ? "bg-repwell-teal-300/10" : "bg-muted"}`}>
                        <Buildings className={`h-4 w-4 ${branch.isActive ? "text-repwell-teal-300" : "text-muted-foreground"}`} weight="duotone" />
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
                      <span className="text-muted-foreground">&mdash;</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {branch.region || <span className="text-muted-foreground">&mdash;</span>}
                  </TableCell>
                  <TableCell className="text-center">
                    {branch.totalMembers}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <Switch
                        checked={branch.isActive}
                        onCheckedChange={() => handleToggleActive(branch)}
                        disabled={isPending}
                        className={branch.isActive ? "data-[state=checked]:bg-green-500" : "data-[state=unchecked]:bg-gray-300"}
                      />
                      <span className={`text-sm font-medium ${branch.isActive ? "text-green-600" : "text-muted-foreground"}`}>
                        {branch.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
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
                            router.push(`/dashboard/organization/branches/${branch.id}`);
                          }}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        {branch.globalSlug && (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(`/branch/${branch.globalSlug}`, "_blank");
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Public Profile
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className={branch.isActive ? "text-destructive" : ""}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleActive(branch);
                          }}
                          disabled={isPending}
                        >
                          <Power className="mr-2 h-4 w-4" />
                          {branch.isActive ? "Deactivate" : "Reactivate"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {filteredBranches.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    {hasActiveFilters ? "No branches match your filters" : "No branches yet"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <CreateBranchDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={refreshBranches}
      />

      <BulkBranchImportWizard
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onSuccess={refreshBranches}
      />
    </div>
  );
}

function BranchSortableHead({
  field,
  current,
  dir,
  onToggle,
  className,
  children,
}: {
  field: BranchSortField;
  current: BranchSortField;
  dir: SortDir;
  onToggle: (f: BranchSortField) => void;
  className?: string;
  children: React.ReactNode;
}) {
  const active = field === current;
  return (
    <TableHead className={className}>
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
