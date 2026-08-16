import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

vi.mock("@/lib/auth/actions", () => ({
  unifiedGetUser: vi.fn(),
}));

vi.mock("@/lib/analytics/engine", () => ({
  getNPSMetrics: vi.fn(),
  getCSATMetrics: vi.fn(),
  getResponseRateMetrics: vi.fn(),
  getReviewVelocityMetrics: vi.fn(),
  getUserAnalytics: vi.fn(),
  getOrganizationAnalytics: vi.fn(),
  getNPSTrendData: vi.fn(),
  getCSATTrendData: vi.fn(),
  getReviewVelocityTrendData: vi.fn(),
}));

import { createAdminClient } from "@/lib/supabase/admin";
import { unifiedGetUser } from "@/lib/auth/actions";
import {
  getNPSMetrics,
  getCSATMetrics,
  getResponseRateMetrics,
  getReviewVelocityMetrics,
} from "@/lib/analytics/engine";
import { generateReportForOrg } from "../engine";
import type { ReportTemplateConfig } from "../types";

function createSingleRowQuery(data: unknown) {
  const chain = {
    select: vi.fn(),
    eq: vi.fn(),
    single: vi.fn(),
  };
  chain.select.mockReturnValue(chain);
  chain.eq.mockReturnValue(chain);
  chain.single.mockResolvedValue({ data, error: null });
  return chain;
}

beforeEach(() => {
  vi.clearAllMocks();

  vi.mocked(getNPSMetrics).mockResolvedValue({
    success: true,
    data: {
      score: 42,
      promoters: 8,
      passives: 1,
      detractors: 1,
      totalResponses: 10,
      promoterPercentage: 80,
      passivePercentage: 10,
      detractorPercentage: 10,
    },
  });
  vi.mocked(getCSATMetrics).mockResolvedValue({
    success: true,
    data: {
      score: 90,
      averageRating: 4.6,
      totalResponses: 10,
      satisfiedCount: 9,
      neutralCount: 1,
      dissatisfiedCount: 0,
      satisfiedPercentage: 90,
      neutralPercentage: 10,
      dissatisfiedPercentage: 0,
    },
  });
  vi.mocked(getResponseRateMetrics).mockResolvedValue({
    success: true,
    data: {
      rate: 75,
      totalSent: 20,
      totalCompleted: 15,
      totalPending: 4,
      totalExpired: 1,
      averageCompletionTime: 12,
    },
  });
  vi.mocked(getReviewVelocityMetrics).mockResolvedValue({
    success: true,
    data: {
      reviewsPerDay: 0.5,
      reviewsPerWeek: 3.5,
      reviewsPerMonth: 15,
      totalReviews: 15,
      averageReviewsPerPeriod: 15,
      trend: "stable",
      changePercentage: 0,
    },
  });
});

describe("generateReportForOrg", () => {
  it("threads explicit organization context through metric calls without resolving a session", async () => {
    const templateConfig: ReportTemplateConfig = {
      sections: ["executive_summary", "nps_breakdown"],
      metrics: ["nps_score", "total_reviews"],
      charts: [],
      showTrends: false,
    };

    const templateQuery = createSingleRowQuery({
      id: "template-1",
      organization_id: "org-1",
      name: "Monthly Report",
      description: null,
      template_type: "monthly_performance",
      config: templateConfig,
      is_default: false,
      created_by: "user-1",
      created_at: "2026-07-01T00:00:00.000Z",
      updated_at: "2026-07-01T00:00:00.000Z",
    });

    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn((table: string) => {
        if (table !== "report_templates") {
          throw new Error(`Unexpected table: ${table}`);
        }
        return templateQuery;
      }),
    } as never);

    const result = await generateReportForOrg({
      organizationId: "org-1",
      templateId: "template-1",
      dateRange: {
        start: new Date("2026-06-01T00:00:00.000Z"),
        end: new Date("2026-06-30T23:59:59.000Z"),
        preset: "custom",
      },
      filters: {},
    });

    expect(result.success).toBe(true);
    expect(result.data?.executiveSummary.totalReviews).toBe(15);
    expect(unifiedGetUser).not.toHaveBeenCalled();

    for (const metricMock of [
      getNPSMetrics,
      getCSATMetrics,
      getResponseRateMetrics,
      getReviewVelocityMetrics,
    ]) {
      for (const call of vi.mocked(metricMock).mock.calls) {
        expect(call[2]).toEqual({ organizationId: "org-1" });
      }
    }
  });
});
