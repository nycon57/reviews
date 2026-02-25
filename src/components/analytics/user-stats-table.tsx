"use client";

import { memo } from "react";
import { Users } from "@phosphor-icons/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { UserVideoStats } from "@/lib/video-testimonials/analytics-actions";

export const TeamPerformanceTable = memo(function TeamPerformanceTable({
  stats,
}: {
  stats: UserVideoStats[];
}) {
  if (stats.length === 0) {
    return (
      <Card className="border border-border shadow-soft">
        <CardHeader className="bg-gradient-to-r from-repwell-sage-100/30 to-transparent border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-repwell-teal-300/10">
              <Users className="h-5 w-5 text-repwell-teal-300" aria-hidden="true" />
            </div>
            <div>
              <CardTitle className="text-lg">Team Performance</CardTitle>
              <CardDescription>Video testimonial stats by team member</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center text-muted-foreground">
            <div className="text-center">
              <p className="text-sm">No team data available</p>
              <p className="text-xs">Team members will appear here once they have video requests</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-border shadow-soft">
      <CardHeader className="bg-gradient-to-r from-repwell-sage-100/30 to-transparent border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-repwell-teal-300/10">
            <Users className="h-5 w-5 text-repwell-teal-300" aria-hidden="true" />
          </div>
          <div>
            <CardTitle className="text-lg">Team Performance</CardTitle>
            <CardDescription>Video testimonial stats by team member</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table aria-label="Team performance statistics by team member">
          <caption className="sr-only">Video testimonial statistics by team member</caption>
          <TableHeader>
            <TableRow>
              <TableHead>Team Member</TableHead>
              <TableHead className="text-center">Sent</TableHead>
              <TableHead className="text-center">Opened</TableHead>
              <TableHead className="text-center">Completed</TableHead>
              <TableHead className="text-center">Published</TableHead>
              <TableHead className="text-right">Conversion</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stats.slice(0, 10).map((member, index) => (
              <TableRow key={member.userId}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium" aria-hidden="true">
                      {index + 1}
                    </span>
                    <span className="font-medium">{member.userName}</span>
                  </div>
                </TableCell>
                <TableCell className="text-center">{member.sent}</TableCell>
                <TableCell className="text-center">{member.opened}</TableCell>
                <TableCell className="text-center">{member.completed}</TableCell>
                <TableCell className="text-center">{member.published}</TableCell>
                <TableCell className="text-right">
                  <Badge variant={member.conversionRate >= 30 ? "default" : "secondary"}>
                    {member.conversionRate}%
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
});
