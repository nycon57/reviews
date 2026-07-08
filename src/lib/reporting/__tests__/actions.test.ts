import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

vi.mock("@/lib/auth/actions", () => ({
  unifiedGetUser: vi.fn(),
}));

vi.mock("../engine", () => ({
  generateReport: vi.fn(),
}));

import { createAdminClient } from "@/lib/supabase/admin";
import { unifiedGetUser } from "@/lib/auth/actions";
import { generateReport } from "../engine";
import { exportAndRecordReport } from "../actions";
import type { GeneratedReport, ReportDateRange } from "../types";

function createUserQuery() {
  const chain = {
    select: vi.fn(),
    eq: vi.fn(),
    single: vi.fn(),
  };
  chain.select.mockReturnValue(chain);
  chain.eq.mockReturnValue(chain);
  chain.single.mockResolvedValue({
    data: {
      id: "user-1",
      organization_id: "org-1",
      role: "manager",
    },
    error: null,
  });
  return chain;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(unifiedGetUser).mockResolvedValue({ id: "auth-1" } as never);
});

describe("exportAndRecordReport", () => {
  it("records an export from a pre-generated report without generating again", async () => {
    const userQuery = createUserQuery();
    const insert = vi.fn().mockResolvedValue({ data: null, error: null });
    const from = vi.fn((table: string) => {
      if (table === "users") return userQuery;
      if (table === "report_exports") return { insert };
      throw new Error(`Unexpected table: ${table}`);
    });

    vi.mocked(createAdminClient).mockReturnValue({ from } as never);

    const dateRange: ReportDateRange = {
      start: new Date("2026-06-01T00:00:00.000Z"),
      end: new Date("2026-06-30T23:59:59.000Z"),
      preset: "custom",
    };

    const report: GeneratedReport = {
      templateId: "template-1",
      templateName: "Monthly Report",
      templateType: "monthly_performance",
      dateRange,
      filters: {},
      generatedAt: new Date("2026-07-01T12:00:00.000Z"),
      executiveSummary: {
        periodLabel: "Jun 1, 2026 - Jun 30, 2026",
        totalReviews: 12,
        averageRating: 4.8,
        npsScore: 50,
        csatScore: 92,
        responseRate: 80,
        reviewVelocity: 12,
      },
    };

    const result = await exportAndRecordReport(
      "template-1",
      dateRange,
      "json",
      {},
      { report, organizationName: "RepWell" }
    );

    expect(result.success).toBe(true);
    expect(result.data?.mimeType).toBe("application/json");
    expect(result.data?.encoding).toBeUndefined();
    expect(JSON.parse(result.data?.data || "{}").templateName).toBe("Monthly Report");
    expect(generateReport).not.toHaveBeenCalled();
    expect(insert).toHaveBeenCalledTimes(1);
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({
      organization_id: "org-1",
      template_id: "template-1",
      export_format: "json",
      created_by: "user-1",
    }));
  });
});
