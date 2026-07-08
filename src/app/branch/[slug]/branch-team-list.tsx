"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CaretRight as ChevronRight, Users } from "@phosphor-icons/react";

import { RatingStars } from "@/components/reviews/rating-stars";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TierBadge } from "@/components/shared/tier-badge";
import type { PublicBranchProfessional } from "@/lib/seo/actions";
import { cn, getInitials } from "@/lib/utils";

interface BranchTeamListProps {
  managerId: string | null;
  professionals: PublicBranchProfessional[];
}

export function BranchTeamList({
  managerId,
  professionals,
}: BranchTeamListProps) {
  const [teamDisplayCount, setTeamDisplayCount] = useState(12);

  const sortedProfessionals = useMemo(
    () =>
      [...professionals].sort((a, b) => {
        if (a.id === managerId) return -1;
        if (b.id === managerId) return 1;
        return 0;
      }),
    [managerId, professionals]
  );

  const displayedProfessionals = sortedProfessionals.slice(0, teamDisplayCount);

  return (
    <Card className="border-t-4 border-t-repwell-sage-200">
      <CardHeader variant="plain" className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-xl font-display text-repwell-teal-500">
          <Users className="h-5 w-5 text-repwell-teal-300" />
          Our Team
        </CardTitle>
      </CardHeader>
      <CardContent>
        {professionals.length === 0 ? (
          <p className="py-8 text-center text-repwell-teal-300">
            No team members listed at this branch.
          </p>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              {displayedProfessionals.map((member) => {
                const isManager = member.id === managerId;
                const content = (
                  <>
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={member.photo_url || undefined}
                        alt={member.full_name}
                      />
                      <AvatarFallback className="bg-repwell-sage-100 text-sm text-repwell-teal-400">
                        {getInitials(member.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h4 className="truncate text-sm font-medium text-repwell-teal-500 transition-colors group-hover:text-repwell-teal-400">
                          {member.full_name}
                        </h4>
                        <TierBadge
                          isEnterprise={member.is_enterprise}
                          isPro={member.is_pro}
                          size="sm"
                        />
                        {isManager && (
                          <span className="inline-flex shrink-0 items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-repwell-sage-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-repwell-sage-200" />
                            Mgr
                          </span>
                        )}
                      </div>
                      <p className="truncate text-xs text-repwell-teal-300">
                        {member.title || "Professional"}
                      </p>
                      {member.average_rating && member.total_reviews ? (
                        <div className="mt-0.5 flex items-center gap-1">
                          <RatingStars
                            rating={Number(member.average_rating)}
                            size="sm"
                          />
                          <span className="text-xs font-medium text-repwell-teal-500">
                            {Number(member.average_rating).toFixed(1)}
                          </span>
                          <span className="text-xs text-repwell-teal-300">
                            ({member.total_reviews})
                          </span>
                        </div>
                      ) : null}
                    </div>
                    {member.slug && (
                      <ChevronRight className="h-4 w-4 text-repwell-teal-300 transition-colors group-hover:text-repwell-teal-400" />
                    )}
                  </>
                );

                if (member.slug) {
                  return (
                    <Link
                      key={member.id}
                      href={`/pro/${member.slug}`}
                      className="group flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-repwell-sage-100/50"
                    >
                      {content}
                    </Link>
                  );
                }

                return (
                  <div
                    key={member.id}
                    aria-disabled="true"
                    className={cn(
                      "group flex items-center gap-3 rounded-lg border p-3 transition-colors",
                      "cursor-default opacity-70"
                    )}
                  >
                    {content}
                  </div>
                );
              })}
            </div>
            {sortedProfessionals.length > teamDisplayCount && (
              <Button
                variant="outline"
                className="mt-4 w-full"
                onClick={() => setTeamDisplayCount((previous) => previous + 12)}
              >
                Show More Team Members (
                {sortedProfessionals.length - teamDisplayCount} remaining)
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
