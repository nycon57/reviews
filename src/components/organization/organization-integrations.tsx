"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  PlugsConnected,
  GoogleLogo,
  ShareNetwork,
  SlackLogo,
} from "@phosphor-icons/react";
import {
  getOrgIntegrationSettings,
  updateOrgIntegrationSettings,
  type OrgIntegrations,
  type IntegrationKey,
} from "@/lib/organization";

const INTEGRATIONS: {
  key: IntegrationKey;
  name: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    key: "google",
    name: "Google Business",
    description: "Sync and manage Google Business reviews automatically",
    icon: <GoogleLogo weight="duotone" className="h-5 w-5" />,
  },
  {
    key: "social",
    name: "Social Media",
    description: "Publish testimonials to social media platforms",
    icon: <ShareNetwork weight="duotone" className="h-5 w-5" />,
  },
  {
    key: "slack",
    name: "Slack",
    description: "Get real-time review notifications in Slack channels",
    icon: <SlackLogo weight="duotone" className="h-5 w-5" />,
  },
];

export function OrganizationIntegrations() {
  const [integrations, setIntegrations] = useState<OrgIntegrations | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    getOrgIntegrationSettings().then(({ integrations: data, error }) => {
      if (error) {
        toast({ title: "Error", description: error, variant: "destructive" });
      } else {
        setIntegrations(data);
      }
      setLoading(false);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleToggle = useCallback(
    async (key: IntegrationKey, enabled: boolean) => {
      if (!integrations) return;

      const previous = { ...integrations };
      const updated: OrgIntegrations = {
        ...integrations,
        [key]: { enabled },
      };

      // Optimistic update
      setIntegrations(updated);

      const { success, error } = await updateOrgIntegrationSettings(updated);
      if (!success) {
        setIntegrations(previous);
        toast({
          title: "Error",
          description: error ?? "Failed to update integration settings",
          variant: "destructive",
        });
      } else {
        const integration = INTEGRATIONS.find((i) => i.key === key);
        toast({
          title: enabled ? "Integration Enabled" : "Integration Disabled",
          description: `${integration?.name ?? key} has been ${enabled ? "enabled" : "disabled"} for your organization.`,
        });
      }
    },
    [integrations, toast]
  );

  if (loading) {
    return (
      <Card className="border border-border shadow-soft">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-border shadow-soft">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-repwell-teal-300/10">
            <PlugsConnected weight="duotone" className="h-5 w-5 text-repwell-teal-300" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold text-heading-accent">
              Integration Management
            </CardTitle>
            <CardDescription className="text-repwell-teal-300">
              Control which integrations are available to your team members
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-6">
        {INTEGRATIONS.map(({ key, name, description, icon }) => {
          const enabled = integrations?.[key]?.enabled !== false;
          return (
            <div
              key={key}
              className="flex items-center justify-between rounded-lg border border-border/50 p-4 transition-colors hover:bg-repwell-sage-100/20 dark:hover:bg-repwell-teal-300/10"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-repwell-sage-100/50 dark:bg-repwell-teal-300/15 text-repwell-teal-300">
                  {icon}
                </div>
                <div>
                  <p className="text-sm font-medium text-heading-accent">{name}</p>
                  <p className="text-xs text-repwell-teal-300">{description}</p>
                </div>
              </div>
              <Switch
                checked={enabled}
                onCheckedChange={(checked) => handleToggle(key, checked)}
              />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
