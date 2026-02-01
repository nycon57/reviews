"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChartBarIcon as BarChart3,
  ChatCircleDotsIcon as MessageCircle,
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
      <TabsList>
        <TabsTrigger value="overview" className="gap-1.5">
          <BarChart3 className="h-4 w-4" aria-hidden="true" />
          Overview
        </TabsTrigger>
        <TabsTrigger value="sms" className="gap-1.5">
          <MessageCircle className="h-4 w-4" aria-hidden="true" />
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
