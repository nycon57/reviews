"use client";

import { useCallback, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface UrlSyncedTabDef {
  value: string;
  label: string;
  /** Pass a rendered icon element (e.g. `<Users className="h-4 w-4" />`) so
   *  server pages can define tabs without crossing the client boundary with
   *  component references. */
  icon?: ReactNode;
  badge?: ReactNode;
}

interface UrlSyncedTabsProps {
  /** Route the tabs live on; tab changes push `basePath?tab=...`. */
  basePath: string;
  defaultTab: string;
  tabs: UrlSyncedTabDef[];
  /** TabsContent slots (server-rendered children pass straight through). */
  children: ReactNode;
  className?: string;
}

/**
 * Controlled Tabs addressed by the `?tab=` search param, so back/forward,
 * refresh, and copied links all land on the tab the user was looking at.
 * The shared mechanism for every tab-addressed dashboard page (Workspace,
 * People, Campaigns).
 */
export function UrlSyncedTabs({
  basePath,
  defaultTab,
  tabs,
  children,
  className,
}: UrlSyncedTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tabParam = searchParams.get("tab");
  const currentTab = tabs.some((t) => t.value === tabParam)
    ? (tabParam as string)
    : defaultTab;

  const handleTabChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === defaultTab) {
        params.delete("tab");
      } else {
        params.set("tab", value);
      }
      const query = params.toString();
      router.push(query ? `${basePath}?${query}` : basePath, {
        scroll: false,
      });
    },
    [router, searchParams, basePath, defaultTab]
  );

  return (
    <Tabs
      value={currentTab}
      onValueChange={handleTabChange}
      className={className ?? "space-y-6"}
    >
      <TabsList
        variant="underline"
        className="w-full justify-start overflow-x-auto flex-nowrap"
      >
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            variant="underline"
            className="flex items-center gap-2 whitespace-nowrap"
          >
            {tab.icon}
            {tab.label}
            {tab.badge}
          </TabsTrigger>
        ))}
      </TabsList>
      {children}
    </Tabs>
  );
}
