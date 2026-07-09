"use client";

import { useEffect, useMemo, useState, useTransition, type FormEvent } from "react";
import posthog from "posthog-js";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Copy,
  DotsThreeVertical as MoreHorizontal,
  MagnifyingGlass,
  Sparkle,
  Pause,
  PencilSimple,
  Play,
  Plus,
  SpinnerGap as Loader2,
  Trash,
} from "@phosphor-icons/react";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  activateCampaign,
  deleteCampaign,
  duplicateCampaign,
  pauseCampaign,
} from "@/lib/campaigns/actions";
import type {
  CampaignListItem,
  CampaignStatus,
  WorkflowTemplate,
} from "@/lib/campaigns/types";
import { formatRelativeTime } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import dynamic from "next/dynamic";

const NewCampaignModal = dynamic(() => import("./new-campaign-modal").then((m) => m.NewCampaignModal), {
  ssr: false,
});

type FilterValue = "all" | CampaignStatus;

interface CampaignsDashboardProps {
  campaigns: CampaignListItem[];
  templates: WorkflowTemplate[];
}

const FILTERS: Array<{ value: FilterValue; label: string }> = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "draft", label: "Draft" },
  { value: "paused", label: "Paused" },
  { value: "archived", label: "Archived" },
];

const STATUS_VARIANTS: Record<CampaignStatus, NonNullable<BadgeProps["variant"]>> = {
  draft: "secondary",
  active: "success",
  paused: "outline",
  completed: "default",
  archived: "subtle",
};

function formatStatus(status: CampaignStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function formatTriggerType(triggerType: string | null): string {
  if (!triggerType) {
    return "-";
  }

  return triggerType
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function formatRelativeTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return formatRelativeTime(date);
}

export function CampaignsDashboard({ campaigns, templates }: CampaignsDashboardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const statusParam = searchParams.get("status");
  const filter = FILTERS.some((item) => item.value === statusParam)
    ? (statusParam as FilterValue)
    : "all";
  const searchParam = searchParams.get("search") ?? "";
  const [searchValue, setSearchValue] = useState(searchParam);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<{
    id: string;
    name: string;
    isDraft: boolean;
  } | null>(null);

  useEffect(() => {
    setSearchValue(searchParam);
  }, [searchParam]);

  const pushParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (!value) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }

    const query = params.toString();
    router.push(query ? `/dashboard/campaigns?${query}` : "/dashboard/campaigns", {
      scroll: false,
    });
  };

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    pushParams({ search: searchValue.trim() || null });
  };

  const stats = useMemo(() => {
    return campaigns.reduce(
      (acc, campaign) => {
        acc.total += 1;
        if (campaign.status === "active") acc.active += 1;
        if (campaign.status === "draft") acc.draft += 1;
        if (campaign.status === "paused") acc.paused += 1;
        return acc;
      },
      { total: 0, active: 0, draft: 0, paused: 0 }
    );
  }, [campaigns]);

  const filteredCampaigns = useMemo(() => {
    const normalizedSearch = searchParam.trim().toLowerCase();

    return campaigns.filter((campaign) => {
      const matchesStatus = filter === "all" || campaign.status === filter;
      const matchesSearch =
        normalizedSearch.length === 0 ||
        campaign.name.toLowerCase().includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });
  }, [campaigns, filter, searchParam]);

  const handleDuplicate = (id: string) => {
    startTransition(async () => {
      try {
        const duplicate = await duplicateCampaign(id);
        toast({
          title: "Campaign duplicated",
          description: `Created ${duplicate.name}.`,
        });
        router.refresh();
      } catch (error) {
        toast({
          title: "Duplication failed",
          description: error instanceof Error ? error.message : "Please try again.",
          variant: "destructive",
        });
      }
    });
  };

  const handleToggleActivation = (campaign: CampaignListItem) => {
    startTransition(async () => {
      try {
        if (campaign.status === "active") {
          await pauseCampaign(campaign.id);
          posthog.capture("campaign_paused", {
            campaign_id: campaign.id,
            campaign_name: campaign.name,
            trigger_type: campaign.triggerType,
          });
          toast({
            title: "Campaign paused",
            description: `${campaign.name} is now paused.`,
          });
        } else {
          await activateCampaign(campaign.id);
          posthog.capture("campaign_activated", {
            campaign_id: campaign.id,
            campaign_name: campaign.name,
            trigger_type: campaign.triggerType,
          });
          toast({
            title: "Campaign activated",
            description: `${campaign.name} is now active.`,
          });
        }

        router.refresh();
      } catch (error) {
        toast({
          title: campaign.status === "active" ? "Pause failed" : "Activation failed",
          description: error instanceof Error ? error.message : "Please try again.",
          variant: "destructive",
        });
      }
    });
  };

  const confirmDeleteOrArchive = () => {
    if (!pendingDelete) {
      return;
    }

    startTransition(async () => {
      try {
        const result = await deleteCampaign(pendingDelete.id);
        toast({
          title: result.action === "deleted" ? "Campaign deleted" : "Campaign archived",
          description:
            result.action === "deleted"
              ? `${pendingDelete.name} has been deleted.`
              : `${pendingDelete.name} has been archived.`,
        });

        setPendingDelete(null);
        router.refresh();
      } catch (error) {
        toast({
          title: "Action failed",
          description: error instanceof Error ? error.message : "Please try again.",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Campaigns</CardDescription>
            <CardTitle className="text-2xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active</CardDescription>
            <CardTitle className="text-2xl">{stats.active}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Draft</CardDescription>
            <CardTitle className="text-2xl">{stats.draft}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Paused</CardDescription>
            <CardTitle className="text-2xl">{stats.paused}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Campaign Workflows</CardTitle>
              <CardDescription>
                Build and manage triggered multi-channel workflow campaigns.
              </CardDescription>
            </div>

            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="gap-2"
              disabled={isPending}
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              New Campaign
            </Button>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <form className="flex flex-1 flex-col gap-2 sm:flex-row" onSubmit={handleSearch}>
              <div className="relative sm:max-w-sm sm:flex-1">
                <MagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                  placeholder="Search campaign name"
                  aria-label="Search campaign name"
                  className="pl-9"
                />
              </div>
              <Button type="submit" variant="outline">
                Search
              </Button>
            </form>

            <Tabs
              value={filter}
              onValueChange={(value) =>
                pushParams({ status: value === "all" ? null : value })
              }
            >
              <TabsList variant="pills" className="h-auto flex-wrap justify-start">
                {FILTERS.map((item) => (
                  <TabsTrigger
                    key={item.value}
                    value={item.value}
                    variant="pills"
                    className="text-xs"
                  >
                    {item.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>

        <CardContent>
          {filteredCampaigns.length === 0 ? (
            <div className="relative flex flex-col items-center justify-center gap-4 overflow-hidden rounded-lg border border-dashed py-14 text-center">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-repwell-sage-100/40 dark:to-repwell-teal-300/10" aria-hidden="true" />
              <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Sparkle className="h-6 w-6 text-primary" />
              </div>
              <div className="relative space-y-1">
                <p className="text-base font-semibold">
                  {campaigns.length === 0
                    ? "Create your first automated workflow"
                    : "No campaigns match your filters"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {campaigns.length === 0
                    ? "Start from a proven template or launch with a blank canvas."
                    : "Try a different status, search term, or create a new campaign."}
                </p>
              </div>
              {campaigns.length === 0 && (
                <Button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="gap-2"
                  disabled={isPending}
                >
                  <Plus className="h-4 w-4" />
                  New Campaign
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Trigger Type</TableHead>
                  <TableHead>Last Modified</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead className="w-[60px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCampaigns.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell className="font-medium">{campaign.name}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANTS[campaign.status]}>
                        {formatStatus(campaign.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatTriggerType(campaign.triggerType)}</TableCell>
                    <TableCell>{formatRelativeTimestamp(campaign.updatedAt)}</TableCell>
                    <TableCell>{campaign.createdByName || "-"}</TableCell>
                    <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={isPending}
                              aria-label={`Actions for ${campaign.name}`}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Campaign actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem onClick={() => router.push(`/dashboard/campaigns/${campaign.id}`)}>
                            <PencilSimple className="h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicate(campaign.id)}>
                            <Copy className="h-4 w-4" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleToggleActivation(campaign)}
                            disabled={campaign.status === "archived" || campaign.status === "completed"}
                          >
                            {campaign.status === "active" ? (
                              <>
                                <Pause className="h-4 w-4" />
                                Pause
                              </>
                            ) : (
                              <>
                                <Play className="h-4 w-4" />
                                Activate
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              setPendingDelete({
                                id: campaign.id,
                                name: campaign.name,
                                isDraft: campaign.status === "draft",
                              })
                            }
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash className="h-4 w-4" />
                            {campaign.status === "draft" ? "Delete" : "Archive"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {isCreateModalOpen && (
        <NewCampaignModal
          templates={templates}
          open={isCreateModalOpen}
          onOpenChange={setIsCreateModalOpen}
        />
      )}

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingDelete?.isDraft ? "Delete campaign?" : "Archive campaign?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete?.isDraft
                ? "This draft campaign will be permanently removed."
                : "Archived campaigns are hidden from active workflows and can be restored later."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteOrArchive}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {pendingDelete?.isDraft ? "Delete" : "Archive"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
