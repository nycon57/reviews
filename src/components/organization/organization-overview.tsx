"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  UserCheck,
  Star,
  FileText,
  Clock,
  CheckCircle as CheckCircle2,
  BuildingOffice as Building2,
  Link as LinkIcon,
  PencilSimple,
} from "@phosphor-icons/react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  getCurrentOrganization,
  getOrganizationStats,
  updateOrganizationSlug,
  type Organization,
  type OrganizationStats,
} from "@/lib/organization";
import { EditSlugDialog } from "@/components/shared/edit-slug-dialog";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: number | string;
  description: string;
  icon: React.ReactNode;
  trend?: { value: number; positive: boolean };
}

function StatCard({ title, value, icon }: StatCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-card p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-repwell-teal-300/10">
        {icon}
      </div>
      <div>
        <p className="text-2xl font-semibold tracking-tight text-heading-accent">{value}</p>
        <p className="text-xs text-muted-foreground">{title}</p>
      </div>
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-card p-4">
      <Skeleton className="h-10 w-10 rounded-lg" />
      <div className="space-y-1">
        <Skeleton className="h-7 w-16" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}

interface OrganizationOverviewProps {
  isAdmin?: boolean;
}

export function OrganizationOverview({ isAdmin = false }: OrganizationOverviewProps) {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [stats, setStats] = useState<OrganizationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [slugDialogOpen, setSlugDialogOpen] = useState(false);
  const [currentSlug, setCurrentSlug] = useState("");

  useEffect(() => {
    async function loadData() {
      const [orgResult, statsResult] = await Promise.all([
        getCurrentOrganization(),
        getOrganizationStats(),
      ]);

      if (orgResult.organization) {
        setOrganization(orgResult.organization);
        setCurrentSlug(orgResult.organization.slug || "");
      }
      if (statsResult.stats) {
        setStats(statsResult.stats);
      }
      setLoading(false);
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (!organization) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Organization not found</p>
        </CardContent>
      </Card>
    );
  }

  const tier = organization.subscription_tier || "basic";
  const tierColors: Record<string, string> = {
    basic: "bg-blue-100 text-blue-800",
    pro: "bg-purple-100 text-purple-800",
    enterprise: "bg-amber-100 text-amber-800",
  };

  return (
    <div className="space-y-6">
      {/* Organization info card */}
      <Card className="border border-border shadow-soft">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 rounded-lg">
                <AvatarImage src={organization.avatar_url || organization.logo_url || undefined} alt={organization.name} />
                <AvatarFallback
                  className="rounded-lg"
                  style={{ backgroundColor: organization.primary_color || "#3B82F6" }}
                >
                  <Building2 className="h-8 w-8 text-white" />
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-xl">{organization.name}</CardTitle>
                <CardDescription className="mt-1">
                  {organization.domain || currentSlug}
                </CardDescription>
              </div>
            </div>
            <Badge className={cn("capitalize", tierColors[tier])}>
              {tier}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</p>
              <div className="flex items-center gap-2 mt-1">
                <div className={cn(
                  "h-2 w-2 rounded-full",
                  organization.subscription_status === "active" ? "bg-green-500" : "bg-yellow-500"
                )} />
                <p className="font-medium capitalize">
                  {organization.subscription_status || "active"}
                </p>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Timezone</p>
              <p className="font-medium mt-1">{organization.timezone || "America/New_York"}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Member Since</p>
              <p className="font-medium mt-1">
                {new Date(organization.created_at).toLocaleDateString()}
              </p>
            </div>
            {organization.trial_ends_at && new Date(organization.trial_ends_at) > new Date() && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Trial Ends</p>
                <p className="font-medium mt-1">
                  {new Date(organization.trial_ends_at).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>

          {/* Public URL Section */}
          {currentSlug && (
            <div className="mt-6 pt-6 border-t">
              <div className="flex items-center gap-2 mb-3">
                <LinkIcon className="h-4 w-4 text-repwell-teal-300" weight="duotone" />
                <h4 className="text-sm font-medium">Public Organization Page</h4>
              </div>
              <div className="rounded-lg border bg-muted/50 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground mb-1">Your organization page can be accessed at:</p>
                    <p className="text-sm font-mono break-all text-primary">
                      {typeof window !== 'undefined' ? window.location.origin : ''}/org/{currentSlug}
                    </p>
                  </div>
                  {isAdmin && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSlugDialogOpen(true)}
                      className="shrink-0"
                    >
                      <PencilSimple className="h-4 w-4 mr-2" />
                      Edit URL
                    </Button>
                  )}
                </div>
                {!isAdmin && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Contact your admin to change the organization URL.
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Slug Edit Dialog */}
      {isAdmin && (
        <EditSlugDialog
          open={slugDialogOpen}
          onOpenChange={setSlugDialogOpen}
          currentSlug={currentSlug}
          entityName={organization.name}
          entityType="organization"
          baseUrl={typeof window !== 'undefined' ? window.location.origin : ''}
          pathPrefix="/org"
          onSave={async (newSlug) => {
            const result = await updateOrganizationSlug(newSlug);
            if (result.success) {
              setCurrentSlug(newSlug);
              setOrganization(prev => prev ? { ...prev, slug: newSlug } : null);
            }
            return { success: result.success, error: result.error };
          }}
        />
      )}

      {/* Stats grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Team Members"
          value={stats?.total_users || 0}
          description="Active team members"
          icon={<Users className="h-5 w-5 text-repwell-teal-300" weight="duotone" />}
        />
        <StatCard
          title="Professionals"
          value={stats?.total_members || 0}
          description="Registered professionals"
          icon={<UserCheck className="h-5 w-5 text-repwell-teal-300" weight="duotone" />}
        />
        <StatCard
          title="Total Reviews"
          value={stats?.total_reviews || 0}
          description="All time reviews collected"
          icon={<Star className="h-5 w-5 text-repwell-teal-300" weight="duotone" />}
        />
        <StatCard
          title="Total Surveys"
          value={stats?.total_surveys || 0}
          description="Surveys sent all time"
          icon={<FileText className="h-5 w-5 text-repwell-teal-300" weight="duotone" />}
        />
        <StatCard
          title="Active Surveys"
          value={stats?.active_surveys || 0}
          description="Surveys awaiting response"
          icon={<Clock className="h-5 w-5 text-repwell-teal-300" weight="duotone" />}
        />
        <StatCard
          title="Pending Reviews"
          value={stats?.pending_reviews || 0}
          description="Reviews awaiting approval"
          icon={<CheckCircle2 className="h-5 w-5 text-repwell-teal-300" weight="duotone" />}
        />
      </div>

    </div>
  );
}
