"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  UserCheck,
  Star,
  FileText,
  Clock,
  CheckCircle as CheckCircle2,
  BuildingOffice as Building2,
} from "@phosphor-icons/react";
import {
  getCurrentOrganization,
  getOrganizationStats,
  type Organization,
  type OrganizationStats,
  TIER_FEATURES,
  TIER_LIMITS,
} from "@/lib/organization";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: number | string;
  description: string;
  icon: React.ReactNode;
  trend?: { value: number; positive: boolean };
}

function StatCard({ title, value, description, icon }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function StatCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-16 mb-1" />
        <Skeleton className="h-3 w-32" />
      </CardContent>
    </Card>
  );
}

export function OrganizationOverview() {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [stats, setStats] = useState<OrganizationStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const [orgResult, statsResult] = await Promise.all([
        getCurrentOrganization(),
        getOrganizationStats(),
      ]);

      if (orgResult.organization) {
        setOrganization(orgResult.organization);
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

  const tier = organization.subscription_tier || "free";
  const features = TIER_FEATURES[tier];
  const limits = TIER_LIMITS[tier];

  const tierColors: Record<string, string> = {
    free: "bg-gray-100 text-gray-800",
    starter: "bg-blue-100 text-blue-800",
    professional: "bg-purple-100 text-purple-800",
    enterprise: "bg-amber-100 text-amber-800",
  };

  return (
    <div className="space-y-6">
      {/* Organization info card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              {organization.logo_url ? (
                <img
                  src={organization.logo_url}
                  alt={organization.name}
                  className="h-16 w-16 rounded-lg object-cover"
                />
              ) : (
                <div
                  className="h-16 w-16 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: organization.primary_color || "#3B82F6" }}
                >
                  <Building2 className="h-8 w-8 text-white" />
                </div>
              )}
              <div>
                <CardTitle className="text-xl">{organization.name}</CardTitle>
                <CardDescription className="mt-1">
                  {organization.domain || organization.slug}
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
              <p className="text-sm text-muted-foreground">Status</p>
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
              <p className="text-sm text-muted-foreground">Timezone</p>
              <p className="font-medium mt-1">{organization.timezone || "America/New_York"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Member Since</p>
              <p className="font-medium mt-1">
                {new Date(organization.created_at).toLocaleDateString()}
              </p>
            </div>
            {organization.trial_ends_at && new Date(organization.trial_ends_at) > new Date() && (
              <div>
                <p className="text-sm text-muted-foreground">Trial Ends</p>
                <p className="font-medium mt-1">
                  {new Date(organization.trial_ends_at).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Team Members"
          value={stats?.total_users || 0}
          description={limits.max_users === -1 ? "Unlimited" : `of ${limits.max_users} allowed`}
          icon={<Users className="h-4 w-4 text-primary" />}
        />
        <StatCard
          title="Loan Officers"
          value={stats?.total_loan_officers || 0}
          description={limits.max_loan_officers === -1 ? "Unlimited" : `of ${limits.max_loan_officers} allowed`}
          icon={<UserCheck className="h-4 w-4 text-primary" />}
        />
        <StatCard
          title="Total Reviews"
          value={stats?.total_reviews || 0}
          description="All time reviews collected"
          icon={<Star className="h-4 w-4 text-primary" />}
        />
        <StatCard
          title="Total Surveys"
          value={stats?.total_surveys || 0}
          description="Surveys sent all time"
          icon={<FileText className="h-4 w-4 text-primary" />}
        />
        <StatCard
          title="Active Surveys"
          value={stats?.active_surveys || 0}
          description="Surveys awaiting response"
          icon={<Clock className="h-4 w-4 text-primary" />}
        />
        <StatCard
          title="Pending Reviews"
          value={stats?.pending_reviews || 0}
          description="Reviews awaiting approval"
          icon={<CheckCircle2 className="h-4 w-4 text-primary" />}
        />
      </div>

      {/* Features */}
      <Card>
        <CardHeader>
          <CardTitle>Available Features</CardTitle>
          <CardDescription>
            Features included in your {tier} plan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(features).map(([feature, enabled]) => (
              <div
                key={feature}
                className={cn(
                  "flex items-center gap-2 rounded-lg border p-3",
                  enabled ? "border-green-200 bg-green-50" : "border-gray-200 bg-gray-50 opacity-60"
                )}
              >
                <div className={cn(
                  "h-2 w-2 rounded-full",
                  enabled ? "bg-green-500" : "bg-gray-400"
                )} />
                <span className={cn(
                  "text-sm capitalize",
                  enabled ? "text-green-800" : "text-gray-600"
                )}>
                  {feature.replace(/_/g, " ")}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Usage Limits */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Limits</CardTitle>
          <CardDescription>
            Current usage against your plan limits
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <UsageBar
              label="Team Members"
              current={stats?.total_users || 0}
              max={limits.max_users}
            />
            <UsageBar
              label="Loan Officers"
              current={stats?.total_loan_officers || 0}
              max={limits.max_loan_officers}
            />
            <UsageBar
              label="Surveys/Month"
              current={0}
              max={limits.max_surveys_per_month}
              description="Resets monthly"
            />
            <UsageBar
              label="API Calls/Day"
              current={0}
              max={limits.max_api_calls_per_day}
              description="Resets daily"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface UsageBarProps {
  label: string;
  current: number;
  max: number;
  description?: string;
}

function UsageBar({ label, current, max, description }: UsageBarProps) {
  const isUnlimited = max === -1;
  const percentage = isUnlimited ? 0 : Math.min((current / max) * 100, 100);
  const isNearLimit = !isUnlimited && percentage >= 80;
  const isAtLimit = !isUnlimited && percentage >= 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm text-muted-foreground">
          {current.toLocaleString()} / {isUnlimited ? "∞" : max.toLocaleString()}
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            isAtLimit ? "bg-red-500" : isNearLimit ? "bg-yellow-500" : "bg-primary"
          )}
          style={{ width: isUnlimited ? "0%" : `${percentage}%` }}
        />
      </div>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
