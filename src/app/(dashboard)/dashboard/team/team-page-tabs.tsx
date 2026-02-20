"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, type ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SquaresFour, Users } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

type TeamTab = "overview" | "members";

const VALID_TABS: TeamTab[] = ["overview", "members"];

function isTeamTab(value: string | null): value is TeamTab {
  return value !== null && VALID_TABS.includes(value as TeamTab);
}

const tabs: { value: TeamTab; label: string; icon: React.ElementType }[] = [
  { value: "overview", label: "Overview", icon: SquaresFour },
  { value: "members", label: "Members", icon: Users },
];

interface TeamPageTabsProps {
  overviewContent: ReactNode;
  membersContent: ReactNode;
}

export function TeamPageTabs({
  overviewContent,
  membersContent,
}: TeamPageTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tabParam = searchParams.get("tab");
  const currentTab = isTeamTab(tabParam) ? tabParam : "overview";

  const handleTabChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", value);
      router.push(`/dashboard/team?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  return (
    <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="w-full justify-start border-b border-border bg-transparent p-0 h-auto gap-0 overflow-x-auto flex-nowrap">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className={cn(
                "relative px-4 py-3 text-sm font-medium",
                "text-muted-foreground hover:text-repwell-teal-400",
                "data-[state=active]:text-repwell-teal-300",
                "border-b-2 border-transparent",
                "data-[state=active]:border-repwell-teal-300",
                "rounded-none bg-transparent shadow-none",
                "transition-colors duration-200",
                "flex items-center gap-2 whitespace-nowrap"
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </TabsTrigger>
          );
        })}
      </TabsList>

      <div className="mt-6">
        <TabsContent value="overview" className="m-0 animate-fade-in">
          {overviewContent}
        </TabsContent>

        <TabsContent value="members" className="m-0 animate-fade-in">
          {membersContent}
        </TabsContent>
      </div>
    </Tabs>
  );
}
