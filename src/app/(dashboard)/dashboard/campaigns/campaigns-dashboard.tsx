"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Envelope, Clock, Play } from "@phosphor-icons/react";

interface CampaignsDashboardProps {
  userRole: string;
}

export function CampaignsDashboard({ userRole: _userRole }: CampaignsDashboardProps) {
  return (
    <div className="space-y-6">
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Envelope className="h-7 w-7 text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Campaigns Coming Soon</h2>
            <p className="text-sm text-muted-foreground max-w-md">
              Automate your review collection with one-time blasts, recurring schedules,
              and event-triggered campaigns. This feature is currently in development.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4 text-sm text-muted-foreground max-w-lg">
            <div className="flex flex-col items-center gap-1 p-3 rounded-lg border">
              <Envelope className="h-5 w-5 mb-1" />
              <span className="font-medium text-foreground">One-time</span>
              <span className="text-xs">Send once to a segment</span>
            </div>
            <div className="flex flex-col items-center gap-1 p-3 rounded-lg border">
              <Clock className="h-5 w-5 mb-1" />
              <span className="font-medium text-foreground">Recurring</span>
              <span className="text-xs">Automatic on a schedule</span>
            </div>
            <div className="flex flex-col items-center gap-1 p-3 rounded-lg border">
              <Play className="h-5 w-5 mb-1" />
              <span className="font-medium text-foreground">Triggered</span>
              <span className="text-xs">Fire on loan events</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
