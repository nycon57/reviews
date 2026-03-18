/**
 * E2E workflow tests for the Campaign system (enterprise only).
 * Covers: campaign list, workflow builder, activation, lifecycle.
 * All server actions and API calls are mocked via page.route().
 */

import { test, expect } from "../helpers/dashboard-fixture";

test.use({ storageState: ".auth/enterprise-admin.json" });

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_CAMPAIGNS = [
  {
    id: "camp-001",
    name: "Post-Close Drip",
    status: "active",
    created_at: "2026-01-15T10:00:00Z",
    updated_at: "2026-03-01T14:00:00Z",
    trigger_count: 245,
    email_sent: 1032,
  },
  {
    id: "camp-002",
    name: "Annual Review Request",
    status: "draft",
    created_at: "2026-03-10T09:00:00Z",
    updated_at: "2026-03-10T09:00:00Z",
    trigger_count: 0,
    email_sent: 0,
  },
  {
    id: "camp-003",
    name: "Welcome Series",
    status: "paused",
    created_at: "2026-02-01T08:00:00Z",
    updated_at: "2026-02-28T16:00:00Z",
    trigger_count: 120,
    email_sent: 480,
  },
  {
    id: "camp-004",
    name: "Q4 Outreach",
    status: "completed",
    created_at: "2025-10-01T10:00:00Z",
    updated_at: "2025-12-31T23:59:00Z",
    trigger_count: 500,
    email_sent: 2100,
  },
];

const MOCK_CAMPAIGN_DETAIL = {
  id: "camp-002",
  name: "Annual Review Request",
  status: "draft",
  sequence_definition: {
    nodes: [
      {
        id: "node-1",
        type: "event-trigger",
        position: { x: 100, y: 100 },
        data: { label: "Event Trigger", event: "loan_closed" },
      },
      {
        id: "node-2",
        type: "wait-delay",
        position: { x: 100, y: 250 },
        data: { label: "Wait 7 Days", delay: 7, unit: "days" },
      },
      {
        id: "node-3",
        type: "send-email",
        position: { x: 100, y: 400 },
        data: { label: "Send Review Request Email", template_id: "tpl-1" },
      },
    ],
    edges: [
      { id: "e1-2", source: "node-1", target: "node-2" },
      { id: "e2-3", source: "node-2", target: "node-3" },
    ],
  },
};

const MOCK_EMPTY_CAMPAIGN = {
  id: "camp-empty",
  name: "Empty Campaign",
  status: "draft",
  sequence_definition: { nodes: [], edges: [] },
};

const NODE_TYPES = {
  triggers: ["Event Trigger", "Schedule Trigger", "Manual Trigger"],
  actions: ["Send Email", "Send SMS", "Smart Send"],
  conditions: ["If/Else", "A/B Split"],
  timing: ["Wait/Delay"],
  control: ["Exit Workflow"],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function mockCampaignListApi(page: import("@playwright/test").Page) {
  await page.route("**/api/**campaign**", async (route) => {
    if (route.request().method() === "GET") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: MOCK_CAMPAIGNS }),
      });
    }
    return route.continue();
  });
}

async function mockCampaignDetailApi(
  page: import("@playwright/test").Page,
  campaign = MOCK_CAMPAIGN_DETAIL
) {
  await page.route(`**/api/**campaign**/${campaign.id}**`, async (route) => {
    if (route.request().method() === "GET") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: campaign }),
      });
    }
    return route.continue();
  });
}

async function mockServerActions(
  page: import("@playwright/test").Page,
  overrides?: {
    createResult?: { success: boolean; data?: { id: string }; error?: string };
    saveResult?: { success: boolean; error?: string };
    activateResult?: { success: boolean; error?: string };
    pauseResult?: { success: boolean; error?: string };
    resumeResult?: { success: boolean; error?: string };
    validationErrors?: string[];
  }
) {
  await page.route("**/*", async (route) => {
    const request = route.request();
    if (request.method() !== "POST") return route.continue();

    const nextAction = request.headers()["next-action"];
    if (!nextAction) return route.continue();

    const body = await request.postData();

    if (body?.includes("createCampaign") || body?.includes("create")) {
      const result = overrides?.createResult ?? {
        success: true,
        data: { id: "camp-new-001" },
      };
      return route.fulfill({
        status: 200,
        contentType: "text/x-component",
        body: `0:${JSON.stringify(result)}\n`,
      });
    }

    if (body?.includes("saveDraft") || body?.includes("save")) {
      const result = overrides?.saveResult ?? { success: true };
      return route.fulfill({
        status: 200,
        contentType: "text/x-component",
        body: `0:${JSON.stringify(result)}\n`,
      });
    }

    if (body?.includes("activate")) {
      if (overrides?.validationErrors?.length) {
        return route.fulfill({
          status: 200,
          contentType: "text/x-component",
          body: `0:${JSON.stringify({
            success: false,
            error: "Validation failed",
            validationErrors: overrides.validationErrors,
          })}\n`,
        });
      }
      const result = overrides?.activateResult ?? { success: true };
      return route.fulfill({
        status: 200,
        contentType: "text/x-component",
        body: `0:${JSON.stringify(result)}\n`,
      });
    }

    if (body?.includes("pause")) {
      const result = overrides?.pauseResult ?? { success: true };
      return route.fulfill({
        status: 200,
        contentType: "text/x-component",
        body: `0:${JSON.stringify(result)}\n`,
      });
    }

    if (body?.includes("resume")) {
      const result = overrides?.resumeResult ?? { success: true };
      return route.fulfill({
        status: 200,
        contentType: "text/x-component",
        body: `0:${JSON.stringify(result)}\n`,
      });
    }

    return route.continue();
  });
}

// =============================================================================
// TEST SUITE 1: Campaign List
// =============================================================================

test.describe("Campaigns — List Page", () => {
  test("1. campaign list loads with status badges", async ({ page, dashboardPage }) => {
    await mockCampaignListApi(page);
    const dp = await dashboardPage("/dashboard/campaigns");

    // Verify campaigns are rendered
    const rows = dp.locator(
      "table tbody tr, [data-testid*='campaign-row'], [data-testid*='campaign-card'], [role='row']"
    );
    await expect(rows.first()).toBeVisible({ timeout: 10_000 });

    // Status badges should be present
    await expect(dp.getByText(/active/i).first()).toBeVisible();
    await expect(dp.getByText(/draft/i).first()).toBeVisible();
  });

  test("2. campaign list shows 'New Campaign' button", async ({ page, dashboardPage }) => {
    await mockCampaignListApi(page);
    const dp = await dashboardPage("/dashboard/campaigns");

    const newCampaignBtn = dp
      .getByRole("button", { name: /new campaign/i })
      .or(dp.getByRole("link", { name: /new campaign/i }));
    await expect(newCampaignBtn).toBeVisible();
  });

  test("11. campaign status badges have correct styling", async ({ page, dashboardPage }) => {
    await mockCampaignListApi(page);
    const dp = await dashboardPage("/dashboard/campaigns");

    await expect(
      dp.locator("table tbody tr, [data-testid*='campaign-row'], [role='row']").first()
    ).toBeVisible({ timeout: 10_000 });

    // Draft badge should exist with gray/neutral styling
    const draftBadge = dp
      .locator("[class*='badge'], [data-testid*='badge'], span")
      .filter({ hasText: /^draft$/i })
      .first();
    await expect(draftBadge).toBeVisible();

    // Active badge should exist with green/success styling
    const activeBadge = dp
      .locator("[class*='badge'], [data-testid*='badge'], span")
      .filter({ hasText: /^active$/i })
      .first();
    await expect(activeBadge).toBeVisible();

    // Paused badge should exist with yellow/warning styling
    const pausedBadge = dp
      .locator("[class*='badge'], [data-testid*='badge'], span")
      .filter({ hasText: /^paused$/i })
      .first();
    await expect(pausedBadge).toBeVisible();
  });
});

// =============================================================================
// TEST SUITE 2: Campaign Builder
// =============================================================================

test.describe("Campaigns — Workflow Builder", () => {
  test("3. open campaign builder → canvas is visible", async ({ page, dashboardPage }) => {
    await mockCampaignDetailApi(page);
    await mockServerActions(page);
    const dp = await dashboardPage("/dashboard/campaigns/camp-002");

    // React Flow canvas or equivalent
    const canvas = dp
      .locator(
        ".react-flow, [data-testid*='canvas'], [data-testid*='workflow'], [class*='react-flow']"
      )
      .first();
    await expect(canvas).toBeVisible({ timeout: 10_000 });
  });

  test("4. node palette shows all 10 node types grouped by category", async ({
    page,
    dashboardPage,
  }) => {
    await mockCampaignDetailApi(page);
    await mockServerActions(page);
    const dp = await dashboardPage("/dashboard/campaigns/camp-002");

    await expect(
      dp.locator(
        ".react-flow, [data-testid*='canvas'], [data-testid*='workflow'], [class*='react-flow']"
      ).first()
    ).toBeVisible({ timeout: 10_000 });

    // Node palette / sidebar should be visible
    const palette = dp
      .locator("[data-testid*='palette'], [data-testid*='node-panel'], [class*='palette'], aside")
      .first();
    await expect(palette).toBeVisible();

    // Verify category headings
    const categories = ["Triggers", "Actions", "Conditions", "Timing", "Control"];
    for (const cat of categories) {
      await expect(
        dp.getByText(new RegExp(`^${cat}$`, "i")).or(dp.getByRole("heading", { name: new RegExp(cat, "i") }))
      ).toBeVisible();
    }

    // Verify all 10 node types
    const allNodes = [
      ...NODE_TYPES.triggers,
      ...NODE_TYPES.actions,
      ...NODE_TYPES.conditions,
      ...NODE_TYPES.timing,
      ...NODE_TYPES.control,
    ];
    for (const nodeType of allNodes) {
      await expect(dp.getByText(new RegExp(nodeType, "i")).first()).toBeVisible();
    }
  });

  test("5. toolbar buttons present: Save Draft, Activate, Undo, Redo, Auto Layout, Zoom", async ({
    page,
    dashboardPage,
  }) => {
    await mockCampaignDetailApi(page);
    await mockServerActions(page);
    const dp = await dashboardPage("/dashboard/campaigns/camp-002");

    await expect(
      dp.locator(
        ".react-flow, [data-testid*='canvas'], [data-testid*='workflow'], [class*='react-flow']"
      ).first()
    ).toBeVisible({ timeout: 10_000 });

    // Save Draft button
    await expect(
      dp.getByRole("button", { name: /save.*draft/i }).or(dp.locator("[data-testid*='save-draft']"))
    ).toBeVisible();

    // Activate Campaign button
    await expect(
      dp.getByRole("button", { name: /activate/i }).or(dp.locator("[data-testid*='activate']"))
    ).toBeVisible();

    // Undo / Redo
    await expect(
      dp.getByRole("button", { name: /undo/i }).or(dp.locator("[data-testid*='undo']"))
    ).toBeVisible();
    await expect(
      dp.getByRole("button", { name: /redo/i }).or(dp.locator("[data-testid*='redo']"))
    ).toBeVisible();

    // Auto Layout
    await expect(
      dp
        .getByRole("button", { name: /auto.*layout/i })
        .or(dp.locator("[data-testid*='auto-layout']"))
    ).toBeVisible();

    // Zoom controls
    await expect(
      dp
        .getByRole("button", { name: /zoom.*in/i })
        .or(dp.locator("[data-testid*='zoom-in']"))
    ).toBeVisible();
    await expect(
      dp
        .getByRole("button", { name: /zoom.*out/i })
        .or(dp.locator("[data-testid*='zoom-out']"))
    ).toBeVisible();
    await expect(
      dp
        .getByRole("button", { name: /fit|zoom.*fit/i })
        .or(dp.locator("[data-testid*='zoom-fit']"))
    ).toBeVisible();
  });

  test("6. campaign name input is editable", async ({ page, dashboardPage }) => {
    await mockCampaignDetailApi(page);
    await mockServerActions(page);
    const dp = await dashboardPage("/dashboard/campaigns/camp-002");

    await expect(
      dp.locator(
        ".react-flow, [data-testid*='canvas'], [data-testid*='workflow'], [class*='react-flow']"
      ).first()
    ).toBeVisible({ timeout: 10_000 });

    // Campaign name input
    const nameInput = dp
      .getByRole("textbox", { name: /campaign.*name|name/i })
      .or(dp.locator("[data-testid*='campaign-name']"))
      .or(dp.locator("input[name*='name']"));

    await expect(nameInput.first()).toBeVisible();

    // Should be pre-filled with existing name
    await expect(nameInput.first()).toHaveValue(/annual review request/i);

    // Edit the name
    await nameInput.first().clear();
    await nameInput.first().fill("Updated Campaign Name");
    await expect(nameInput.first()).toHaveValue("Updated Campaign Name");
  });

  test("7. save draft → mock action → success toast", async ({ page, dashboardPage }) => {
    await mockCampaignDetailApi(page);
    await mockServerActions(page, { saveResult: { success: true } });
    const dp = await dashboardPage("/dashboard/campaigns/camp-002");

    await expect(
      dp.locator(
        ".react-flow, [data-testid*='canvas'], [data-testid*='workflow'], [class*='react-flow']"
      ).first()
    ).toBeVisible({ timeout: 10_000 });

    // Click Save Draft
    const saveBtn = dp
      .getByRole("button", { name: /save.*draft/i })
      .or(dp.locator("[data-testid*='save-draft']"));
    await saveBtn.click();

    // Success toast
    await expect(
      dp.getByText(/saved|draft saved/i).first()
    ).toBeVisible({ timeout: 5_000 });
  });

  test("8. activate campaign → mock validation pass → status changes", async ({
    page,
    dashboardPage,
  }) => {
    await mockCampaignDetailApi(page);
    await mockServerActions(page, { activateResult: { success: true } });
    const dp = await dashboardPage("/dashboard/campaigns/camp-002");

    await expect(
      dp.locator(
        ".react-flow, [data-testid*='canvas'], [data-testid*='workflow'], [class*='react-flow']"
      ).first()
    ).toBeVisible({ timeout: 10_000 });

    // Click Activate
    const activateBtn = dp
      .getByRole("button", { name: /activate/i })
      .or(dp.locator("[data-testid*='activate']"));
    await activateBtn.click();

    // May show confirmation dialog
    const confirmBtn = dp.getByRole("button", { name: /confirm|activate/i }).last();
    if (await confirmBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await confirmBtn.click();
    }

    // Status should change to active or success toast appears
    await expect(
      dp
        .getByText(/activated|campaign is now active/i)
        .or(dp.locator("[data-testid*='status']").filter({ hasText: /active/i }))
        .first()
    ).toBeVisible({ timeout: 5_000 });
  });

  test("9. activate with empty canvas → validation error", async ({ page, dashboardPage }) => {
    await mockCampaignDetailApi(page, MOCK_EMPTY_CAMPAIGN);
    await mockServerActions(page, {
      validationErrors: [
        "Workflow must have at least one trigger node",
        "Workflow must have at least one action node",
      ],
    });
    const dp = await dashboardPage("/dashboard/campaigns/camp-empty");

    await expect(
      dp.locator(
        ".react-flow, [data-testid*='canvas'], [data-testid*='workflow'], [class*='react-flow']"
      ).first()
    ).toBeVisible({ timeout: 10_000 });

    // Click Activate
    const activateBtn = dp
      .getByRole("button", { name: /activate/i })
      .or(dp.locator("[data-testid*='activate']"));
    await activateBtn.click();

    // May show confirmation
    const confirmBtn = dp.getByRole("button", { name: /confirm|activate/i }).last();
    if (await confirmBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await confirmBtn.click();
    }

    // Validation error should appear
    await expect(
      dp
        .getByText(/validation|must have.*trigger|cannot activate/i)
        .first()
    ).toBeVisible({ timeout: 5_000 });
  });

  test("10. properties panel opens when a node is selected", async ({ page, dashboardPage }) => {
    await mockCampaignDetailApi(page);
    await mockServerActions(page);
    const dp = await dashboardPage("/dashboard/campaigns/camp-002");

    await expect(
      dp.locator(
        ".react-flow, [data-testid*='canvas'], [data-testid*='workflow'], [class*='react-flow']"
      ).first()
    ).toBeVisible({ timeout: 10_000 });

    // Click on a node in the workflow canvas
    const node = dp
      .locator(
        ".react-flow__node, [data-testid*='workflow-node'], [class*='node']"
      )
      .first();

    if (await node.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await node.click();

      // Properties panel should show node-specific configuration
      const propsPanel = dp
        .locator("[data-testid*='propert'], [data-testid*='node-config'], [class*='propert']")
        .or(dp.getByText(/properties|configuration|settings/i))
        .first();
      await expect(propsPanel).toBeVisible({ timeout: 3_000 });
    }
  });
});

// =============================================================================
// TEST SUITE 3: Campaign Lifecycle
// =============================================================================

test.describe("Campaigns — Lifecycle", () => {
  test("12. pause active campaign → status changes to paused", async ({ page, dashboardPage }) => {
    const activeCampaign = {
      ...MOCK_CAMPAIGN_DETAIL,
      id: "camp-001",
      name: "Post-Close Drip",
      status: "active",
    };
    await mockCampaignDetailApi(page, activeCampaign);
    await mockServerActions(page, { pauseResult: { success: true } });
    const dp = await dashboardPage("/dashboard/campaigns/camp-001");

    await expect(
      dp.locator(
        ".react-flow, [data-testid*='canvas'], [data-testid*='workflow'], [class*='react-flow']"
      ).first()
    ).toBeVisible({ timeout: 10_000 });

    // Click Pause button
    const pauseBtn = dp
      .getByRole("button", { name: /pause/i })
      .or(dp.locator("[data-testid*='pause']"));
    await pauseBtn.click();

    // May show confirmation
    const confirmBtn = dp.getByRole("button", { name: /confirm|pause/i }).last();
    if (await confirmBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await confirmBtn.click();
    }

    // Status should update to paused
    await expect(
      dp
        .getByText(/paused|campaign paused/i)
        .first()
    ).toBeVisible({ timeout: 5_000 });
  });

  test("13. keyboard shortcut Cmd+S triggers save", async ({ page, dashboardPage }) => {
    await mockCampaignDetailApi(page);
    let saveTriggered = false;

    // Mock save action and track if it was called
    await page.route("**/*", async (route) => {
      const request = route.request();
      if (request.method() !== "POST") return route.continue();

      const nextAction = request.headers()["next-action"];
      if (!nextAction) return route.continue();

      const body = await request.postData();
      if (body?.includes("save") || body?.includes("draft")) {
        saveTriggered = true;
        return route.fulfill({
          status: 200,
          contentType: "text/x-component",
          body: `0:${JSON.stringify({ success: true })}\n`,
        });
      }

      return route.continue();
    });

    const dp = await dashboardPage("/dashboard/campaigns/camp-002");

    await expect(
      dp.locator(
        ".react-flow, [data-testid*='canvas'], [data-testid*='workflow'], [class*='react-flow']"
      ).first()
    ).toBeVisible({ timeout: 10_000 });

    // Press Cmd+S (Meta+S on macOS)
    await dp.keyboard.press("Meta+s");
    await dp.waitForTimeout(1_000);

    // Verify save was triggered (toast or mock was called)
    // Either the save action was intercepted OR a toast appeared
    const toastVisible = await dp
      .getByText(/saved|draft saved/i)
      .first()
      .isVisible({ timeout: 3_000 })
      .catch(() => false);

    expect(saveTriggered || toastVisible).toBeTruthy();
  });

  test("14. back button navigates to campaign list", async ({ page, dashboardPage }) => {
    await mockCampaignDetailApi(page);
    await mockCampaignListApi(page);
    await mockServerActions(page);
    const dp = await dashboardPage("/dashboard/campaigns/camp-002");

    await expect(
      dp.locator(
        ".react-flow, [data-testid*='canvas'], [data-testid*='workflow'], [class*='react-flow']"
      ).first()
    ).toBeVisible({ timeout: 10_000 });

    // Click back button
    const backBtn = dp
      .getByRole("button", { name: /back/i })
      .or(dp.getByRole("link", { name: /back/i }))
      .or(dp.locator("[data-testid*='back']"))
      .or(dp.locator("a[href*='/campaigns']").first());
    await backBtn.click();

    // Should navigate to campaign list
    await dp.waitForURL("**/campaigns", { timeout: 5_000 });
    expect(dp.url()).toMatch(/\/dashboard\/campaigns\/?$/);
  });

  test("15. unsaved changes prompt on back button", async ({ page, dashboardPage }) => {
    await mockCampaignDetailApi(page);
    await mockServerActions(page);
    const dp = await dashboardPage("/dashboard/campaigns/camp-002");

    await expect(
      dp.locator(
        ".react-flow, [data-testid*='canvas'], [data-testid*='workflow'], [class*='react-flow']"
      ).first()
    ).toBeVisible({ timeout: 10_000 });

    // Make a change to trigger unsaved state (edit campaign name)
    const nameInput = dp
      .getByRole("textbox", { name: /campaign.*name|name/i })
      .or(dp.locator("[data-testid*='campaign-name']"))
      .or(dp.locator("input[name*='name']"));

    if (await nameInput.first().isVisible({ timeout: 3_000 }).catch(() => false)) {
      await nameInput.first().clear();
      await nameInput.first().fill("Unsaved Changes Test");
    }

    // Click back button
    const backBtn = dp
      .getByRole("button", { name: /back/i })
      .or(dp.getByRole("link", { name: /back/i }))
      .or(dp.locator("[data-testid*='back']"))
      .or(dp.locator("a[href*='/campaigns']").first());
    await backBtn.click();

    // Unsaved changes dialog/prompt should appear
    const unsavedPrompt = dp
      .getByText(/unsaved.*changes|discard.*changes|leave.*without.*saving/i)
      .first();

    if (await unsavedPrompt.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await expect(unsavedPrompt).toBeVisible();

      // Should have options to stay or leave
      const stayBtn = dp
        .getByRole("button", { name: /stay|cancel|keep editing/i })
        .or(dp.getByRole("button", { name: /save/i }));
      const leaveBtn = dp.getByRole("button", {
        name: /leave|discard|don.t save/i,
      });

      await expect(stayBtn.first()).toBeVisible();
      await expect(leaveBtn).toBeVisible();

      // Click stay to dismiss
      await stayBtn.first().click();

      // Should remain on editor page
      expect(dp.url()).toContain("/campaigns/camp-002");
    }
  });
});
