"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChartBar,
  ChatCircleDots,
} from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { SmsAnalyticsTab } from "./sms-analytics-tab";

interface TeamMember {
  id: string;
  fullName: string;
  email: string;
}

interface Props {
  children: ReactNode;
  teamMembers: TeamMember[];
  userRole: "admin" | "manager" | "user";
}

export function AnalyticsTabsWrapper({ children, teamMembers, userRole }: Props) {
  return (
    <Tabs defaultValue="overview" className="space-y-6">
      <TabsList className="w-full justify-start border-b border-border bg-transparent p-0 h-auto gap-0">
        <TabsTrigger value="overview" className="gap-1.5 border-b-2 border-transparent data-[state=active]:border-repwell-teal-300 data-[state=active]:text-repwell-teal-300 rounded-none bg-transparent shadow-none px-4 pb-3">
          <ChartBar className="h-4 w-4" aria-hidden="true" />
          Overview
        </TabsTrigger>
        <TabsTrigger value="sms" className="gap-1.5 border-b-2 border-transparent data-[state=active]:border-repwell-teal-300 data-[state=active]:text-repwell-teal-300 rounded-none bg-transparent shadow-none px-4 pb-3">
          <ChatCircleDots className="h-4 w-4" aria-hidden="true" />
          SMS
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="mt-0">
        {children}
      </TabsContent>

      <TabsContent value="sms" className="mt-0">
        <SmsAnalyticsTab teamMembers={teamMembers} userRole={userRole} />
      </TabsContent>
    </Tabs>
  );
}
