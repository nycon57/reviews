"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  WarningCircle as AlertCircle,
  SpinnerGap as Loader2,
} from "@phosphor-icons/react";
import { getResponseAnalytics, type ResponseAnalytics } from "@/lib/reviews/response-actions";
import { ResponseAnalyticsSection } from "@/components/analytics/response-analytics-section";

interface ResponseAnalyticsDashboardProps {
  startDate?: string;
  endDate?: string;
}

export function ResponseAnalyticsDashboard({
  startDate,
  endDate,
}: ResponseAnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<ResponseAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const result = await getResponseAnalytics(startDate, endDate);
    if (result.success && result.data) {
      setAnalytics(result.data);
    } else {
      setError(result.error || "Failed to load analytics");
    }

    setIsLoading(false);
  }, [startDate, endDate]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAnalytics();
  }, [loadAnalytics]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8 text-red-600">
          <AlertCircle className="h-5 w-5 mr-2" />
          {error}
        </CardContent>
      </Card>
    );
  }

  return <ResponseAnalyticsSection analytics={analytics} />;
}
