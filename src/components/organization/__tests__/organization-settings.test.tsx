// @vitest-environment jsdom

import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { OrganizationSettings } from "../organization-settings";

const {
  mockGetCurrentOrganization,
  mockUpdateOrganizationSettings,
  mockGetBranches,
  mockToast,
} = vi.hoisted(() => ({
  mockGetCurrentOrganization: vi.fn(),
  mockUpdateOrganizationSettings: vi.fn(),
  mockGetBranches: vi.fn(),
  mockToast: vi.fn(),
}));

vi.mock("@/lib/organization", () => ({
  getCurrentOrganization: mockGetCurrentOrganization,
  updateOrganizationSettings: mockUpdateOrganizationSettings,
  updateOrganizationSettingsSchema: z
    .object({
      name: z.string().min(1, "Organization name is required"),
      date_format: z.string().optional(),
    })
    .passthrough(),
}));

vi.mock("@/lib/branches", () => ({
  getBranches: mockGetBranches,
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

describe("OrganizationSettings", () => {
  let container: HTMLDivElement;
  let root: Root;
  const reactActEnvironment = globalThis as typeof globalThis & {
    IS_REACT_ACT_ENVIRONMENT?: boolean;
  };

  beforeEach(() => {
    reactActEnvironment.IS_REACT_ACT_ENVIRONMENT = true;
    mockGetCurrentOrganization.mockReset();
    mockUpdateOrganizationSettings.mockReset();
    mockGetBranches.mockReset();
    mockToast.mockReset();

    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    mockGetCurrentOrganization.mockResolvedValue({
      organization: {
        id: "org-1",
        name: "Acme Corp",
        slug: "acme",
        timezone: "America/New_York",
        date_format: "DD/MM/YYYY",
        company_address: null,
        company_email: null,
        company_phone: null,
        email: null,
        phone: null,
        website_url: null,
        linkedin_url: null,
        facebook_url: null,
        instagram_url: null,
        twitter_url: null,
        headquarters_branch_id: null,
      },
      error: null,
    });

    mockGetBranches.mockResolvedValue({
      success: true,
      data: [],
    });

    mockUpdateOrganizationSettings.mockResolvedValue({
      success: true,
      error: null,
    });
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it("hides the date format control and always submits MM/DD/YYYY", async () => {
    await act(async () => {
      root.render(<OrganizationSettings />);
    });

    await act(async () => {
      await Promise.resolve();
    });

    const saveButton = Array.from(container.querySelectorAll("button")).find((button) =>
      button.textContent?.match(/save settings/i)
    );
    expect(saveButton).toBeTruthy();
    expect(container.textContent).not.toContain("Date Format");

    const form = container.querySelector("form");
    expect(form).toBeTruthy();

    await act(async () => {
      form?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockUpdateOrganizationSettings).toHaveBeenCalledTimes(1);
    expect(mockUpdateOrganizationSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        date_format: "MM/DD/YYYY",
      })
    );
  });
});
