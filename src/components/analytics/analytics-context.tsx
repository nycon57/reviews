"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
  type ReactNode,
} from "react";
import { subDays, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { useDebounce } from "@/hooks/use-debounce";
import { toast } from "@/hooks/use-toast";
import type {
  VideoTestimonialFunnelMetrics,
  VideoTestimonialTrendDataPoint,
  UserVideoStats,
} from "@/lib/video-testimonials/analytics-actions";
import {
  getVideoTestimonialFunnelMetrics,
  getVideoTestimonialTrends,
  getVideoTestimonialStatsByUser,
} from "@/lib/video-testimonials/analytics-actions";
import {
  getResponseAnalytics,
  type ResponseAnalytics,
} from "@/lib/reviews/response-actions";
import { getReviewSummary } from "@/lib/reviews/actions";

// ============================================================================
// Types
// ============================================================================

interface TeamMember {
  id: string;
  fullName: string;
  email: string;
}

interface ReviewSummary {
  totalReviews: number;
  averageRating: number;
  responseRate: number;
  npsScore: number;
}

export type DateRange = "7d" | "30d" | "90d" | "this_month" | "last_month" | "all";
export type TrendPeriod = "daily" | "weekly" | "monthly";

interface AnalyticsState {
  videoMetrics: VideoTestimonialFunnelMetrics | null;
  videoTrends: VideoTestimonialTrendDataPoint[];
  loStats: UserVideoStats[];
  reviewSummary: ReviewSummary;
  responseAnalytics: ResponseAnalytics | null;
  isLoading: boolean;
  dateRange: DateRange;
  trendPeriod: TrendPeriod;
  selectedMember: string;
  canViewTeamStats: boolean;
  teamMembers: TeamMember[];
}

interface AnalyticsActions {
  setDateRange: (range: DateRange) => void;
  setTrendPeriod: (period: TrendPeriod) => void;
  setSelectedMember: (member: string) => void;
  fetchData: () => void;
}

interface AnalyticsContextValue {
  state: AnalyticsState;
  actions: AnalyticsActions;
}

// ============================================================================
// Context
// ============================================================================

const AnalyticsContext = createContext<AnalyticsContextValue | null>(null);

export function useAnalytics(): AnalyticsContextValue {
  const ctx = useContext(AnalyticsContext);
  if (!ctx) {
    throw new Error("useAnalytics must be used within an AnalyticsProvider");
  }
  return ctx;
}

// ============================================================================
// Provider
// ============================================================================

interface AnalyticsProviderProps {
  children: ReactNode;
  initialVideoMetrics: VideoTestimonialFunnelMetrics | null;
  initialVideoTrends: VideoTestimonialTrendDataPoint[];
  initialLoStats: UserVideoStats[];
  initialReviewSummary: ReviewSummary;
  initialResponseAnalytics: ResponseAnalytics | null;
  teamMembers: TeamMember[];
  userRole: "admin" | "manager" | "user";
}

export function AnalyticsProvider({
  children,
  initialVideoMetrics,
  initialVideoTrends,
  initialLoStats,
  initialReviewSummary,
  initialResponseAnalytics,
  teamMembers,
  userRole,
}: AnalyticsProviderProps) {
  const [videoMetrics, setVideoMetrics] = useState<VideoTestimonialFunnelMetrics | null>(initialVideoMetrics);
  const [videoTrends, setVideoTrends] = useState<VideoTestimonialTrendDataPoint[]>(initialVideoTrends);
  const [loStats, setLoStats] = useState<UserVideoStats[]>(initialLoStats);
  const [reviewSummary, setReviewSummary] = useState<ReviewSummary>(initialReviewSummary);
  const [responseAnalytics, setResponseAnalytics] = useState<ResponseAnalytics | null>(initialResponseAnalytics);
  const [isLoading, setIsLoading] = useState(false);

  const [dateRange, setDateRange] = useState<DateRange>("30d");
  const [trendPeriod, setTrendPeriod] = useState<TrendPeriod>("daily");
  const [selectedMember, setSelectedMember] = useState<string>("all");

  const canViewTeamStats = userRole === "admin" || userRole === "manager";

  const debouncedDateRange = useDebounce(dateRange, 300);
  const debouncedTrendPeriod = useDebounce(trendPeriod, 300);
  const debouncedSelectedMember = useDebounce(selectedMember, 300);

  const getDateRangeValues = useCallback((range: DateRange) => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    switch (range) {
      case "7d": startDate = subDays(now, 7); break;
      case "30d": startDate = subDays(now, 30); break;
      case "90d": startDate = subDays(now, 90); break;
      case "this_month": startDate = startOfMonth(now); endDate = endOfMonth(now); break;
      case "last_month": {
        const lastMonth = subMonths(now, 1);
        startDate = startOfMonth(lastMonth);
        endDate = endOfMonth(lastMonth);
        break;
      }
      case "all":
      default:
        return { startDate: undefined, endDate: undefined };
    }

    return { startDate: startDate.toISOString(), endDate: endDate.toISOString() };
  }, []);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { startDate, endDate } = getDateRangeValues(debouncedDateRange);
      const loFilter = debouncedSelectedMember !== "all" ? debouncedSelectedMember : undefined;

      const [videoMetricsResult, videoTrendsResult, loStatsResult, responseAnalyticsResult, reviewSummaryResult] = await Promise.all([
        getVideoTestimonialFunnelMetrics({ startDate, endDate, userId: loFilter }),
        getVideoTestimonialTrends({ startDate, endDate, period: debouncedTrendPeriod, userId: loFilter }),
        canViewTeamStats && !loFilter
          ? getVideoTestimonialStatsByUser({ startDate, endDate })
          : Promise.resolve({ success: true, data: [] }),
        getResponseAnalytics({ startDate, endDate, userId: loFilter }),
        getReviewSummary({ startDate, endDate }),
      ]);

      if (videoMetricsResult.success && videoMetricsResult.data) setVideoMetrics(videoMetricsResult.data);
      if (videoTrendsResult.success && videoTrendsResult.data) setVideoTrends(videoTrendsResult.data);
      if (loStatsResult.success && loStatsResult.data) setLoStats(loStatsResult.data);
      if (responseAnalyticsResult.success && responseAnalyticsResult.data) setResponseAnalytics(responseAnalyticsResult.data);
      if (reviewSummaryResult.success && reviewSummaryResult.data) setReviewSummary(reviewSummaryResult.data);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast({ title: "Error", description: "Failed to fetch analytics data", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [debouncedDateRange, debouncedTrendPeriod, debouncedSelectedMember, canViewTeamStats, getDateRangeValues]);

  const isInitialRender = useRef(true);
  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }
    fetchData();
  }, [fetchData]);

  const value = useMemo<AnalyticsContextValue>(
    () => ({
      state: {
        videoMetrics, videoTrends, loStats, reviewSummary, responseAnalytics,
        isLoading, dateRange, trendPeriod, selectedMember, canViewTeamStats, teamMembers,
      },
      actions: { setDateRange, setTrendPeriod, setSelectedMember, fetchData },
    }),
    [videoMetrics, videoTrends, loStats, reviewSummary, responseAnalytics,
     isLoading, dateRange, trendPeriod, selectedMember, canViewTeamStats, teamMembers, fetchData]
  );

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
}
