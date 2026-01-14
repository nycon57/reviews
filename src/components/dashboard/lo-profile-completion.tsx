"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, ChevronRight } from "lucide-react";
import type { ProfileCompletionItem } from "@/lib/dashboard";

interface ProfileCompletionProps {
  percentage: number;
  items: ProfileCompletionItem[];
}

export function LOProfileCompletion({
  percentage,
  items,
}: ProfileCompletionProps) {
  const incompleteItems = items.filter((item) => !item.completed);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Profile Completion</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Progress indicator */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {items.filter((i) => i.completed).length} of {items.length} items complete
              </span>
              <span className="font-medium">{percentage}%</span>
            </div>
            <Progress value={percentage} className="h-2" />
          </div>

          {/* Completion status */}
          {percentage === 100 ? (
            <div className="flex items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/10 p-3 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              <span className="text-sm font-medium">
                Your profile is complete!
              </span>
            </div>
          ) : (
            <>
              {/* Incomplete items */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Complete your profile:</p>
                <div className="space-y-1">
                  {incompleteItems.slice(0, 3).map((item) => (
                    <div
                      key={item.field}
                      className="flex items-center gap-2 rounded-md p-2 text-sm hover:bg-muted/50"
                    >
                      <Circle className="h-4 w-4 text-muted-foreground" />
                      <span className="flex-1 text-muted-foreground">
                        {item.label}
                      </span>
                    </div>
                  ))}
                  {incompleteItems.length > 3 && (
                    <p className="pl-6 text-xs text-muted-foreground">
                      +{incompleteItems.length - 3} more items
                    </p>
                  )}
                </div>
              </div>

              {/* CTA */}
              <Button variant="outline" className="w-full" asChild>
                <a href="/dashboard/profile">
                  Complete Profile
                  <ChevronRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
