"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Star,
  MapPin,
  Phone,
  Map,
} from "lucide-react";
import type { DirectoryLoanOfficer } from "@/lib/directory/actions";

interface DirectoryMapViewProps {
  loanOfficers: DirectoryLoanOfficer[];
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function DirectoryMapView({ loanOfficers }: DirectoryMapViewProps) {
  // Group loan officers by state/region for the map view
  const groupedByState = loanOfficers.reduce((acc, lo) => {
    const state = lo.address?.state || lo.region || "Other";
    if (!acc[state]) {
      acc[state] = [];
    }
    acc[state].push(lo);
    return acc;
  }, {} as Record<string, DirectoryLoanOfficer[]>);

  const stateGroups = Object.entries(groupedByState).sort((a, b) =>
    a[0].localeCompare(b[0])
  );

  return (
    <div className="space-y-6">
      {/* Map Placeholder */}
      <Card className="overflow-hidden">
        <div className="relative h-64 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20">
          {/* Stylized map background */}
          <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full" viewBox="0 0 800 400" preserveAspectRatio="xMidYMid slice">
              {/* Simplified US map outline */}
              <path
                fill="currentColor"
                d="M100,200 L150,150 L200,180 L250,140 L300,160 L350,120 L400,150 L450,130 L500,160 L550,140 L600,170 L650,150 L700,180 L700,280 L100,280 Z"
                className="text-primary"
              />
            </svg>
          </div>

          {/* Map pins representing loan officers */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Map className="h-12 w-12 mx-auto text-primary/60" />
              <h3 className="mt-4 text-lg font-semibold">
                {loanOfficers.length} Loan Officers
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                in {stateGroups.length} {stateGroups.length === 1 ? "state" : "states"}
              </p>
            </div>
          </div>

          {/* Floating badges showing states */}
          <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-2 justify-center">
            {stateGroups.slice(0, 8).map(([state, los]) => (
              <Badge
                key={state}
                variant="secondary"
                className="bg-background/90 backdrop-blur-sm"
              >
                <MapPin className="mr-1 h-3 w-3" />
                {state}: {los.length}
              </Badge>
            ))}
            {stateGroups.length > 8 && (
              <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm">
                +{stateGroups.length - 8} more
              </Badge>
            )}
          </div>
        </div>
      </Card>

      {/* List by State/Region */}
      <div className="space-y-8">
        {stateGroups.map(([state, los]) => (
          <div key={state}>
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">{state}</h3>
              <Badge variant="outline" className="ml-2">
                {los.length} {los.length === 1 ? "professional" : "professionals"}
              </Badge>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {los.map((lo) => (
                <Card key={lo.id} className="group hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Link href={`/lo/${lo.id}`}>
                        <Avatar className="h-12 w-12 border-2 border-muted">
                          <AvatarImage
                            src={lo.photo_url || undefined}
                            alt={lo.full_name}
                          />
                          <AvatarFallback className="bg-primary/10 text-primary font-medium">
                            {getInitials(lo.full_name)}
                          </AvatarFallback>
                        </Avatar>
                      </Link>

                      <div className="flex-1 min-w-0">
                        <Link href={`/lo/${lo.id}`}>
                          <h4 className="font-medium truncate group-hover:text-primary transition-colors">
                            {lo.full_name}
                          </h4>
                        </Link>
                        {lo.address?.city && (
                          <p className="text-sm text-muted-foreground truncate">
                            {lo.address.city}
                            {lo.address.state ? `, ${lo.address.state}` : ""}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          {lo.average_rating ? (
                            <div className="flex items-center gap-1 text-sm">
                              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                              <span className="font-medium">
                                {Number(lo.average_rating).toFixed(1)}
                              </span>
                              {lo.total_reviews && (
                                <span className="text-muted-foreground text-xs">
                                  ({lo.total_reviews})
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              No reviews
                            </span>
                          )}
                        </div>
                      </div>

                      {lo.phone && (
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-9 w-9 shrink-0"
                          asChild
                        >
                          <a href={`tel:${lo.phone}`} title={`Call ${lo.full_name}`}>
                            <Phone className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
