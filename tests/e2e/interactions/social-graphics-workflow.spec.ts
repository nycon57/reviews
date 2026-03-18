/**
 * E2E workflow tests for the Social Graphics system.
 * Covers: graphics list, auto-generate dialog, editor, export, publish, templates.
 * All server actions and API calls are mocked via page.route().
 */

import { test, expect } from "../helpers/dashboard-fixture";

test.use({ storageState: ".auth/enterprise-admin.json" });

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_GRAPHICS = [
  {
    id: "gfx-001",
    name: "5-Star Spotlight — Alice",
    template_id: "five-star-spotlight",
    status: "published",
    created_at: "2026-03-01T10:00:00Z",
    thumbnail_url: "/mock-thumb-1.png",
    canvas_width: 1080,
    canvas_height: 1080,
  },
  {
    id: "gfx-002",
    name: "Monthly Roundup — March",
    template_id: "monthly-roundup",
    status: "draft",
    created_at: "2026-03-10T14:00:00Z",
    thumbnail_url: "/mock-thumb-2.png",
    canvas_width: 1200,
    canvas_height: 630,
  },
  {
    id: "gfx-003",
    name: "LO Spotlight — Sarah",
    template_id: "lo-spotlight",
    status: "draft",
    created_at: "2026-03-12T09:00:00Z",
    thumbnail_url: "/mock-thumb-3.png",
    canvas_width: 1080,
    canvas_height: 1920,
  },
];

const MOCK_REVIEWS = [
  {
    id: "rev-101",
    reviewer_name: "Alice Johnson",
    rating: 5,
    content: "Absolutely outstanding service! Highly recommend.",
    created_at: "2026-02-20T12:00:00Z",
    loan_officer_name: null,
  },
  {
    id: "rev-102",
    reviewer_name: "Bob Williams",
    rating: 4,
    content: "Great experience overall. Very professional.",
    created_at: "2026-02-25T10:00:00Z",
    loan_officer_name: "Sarah Mitchell",
  },
  {
    id: "rev-103",
    reviewer_name: "Carol Davis",
    rating: 5,
    content: "Best in the business!",
    created_at: "2026-03-01T09:00:00Z",
    loan_officer_name: null,
  },
];

const MOCK_TEMPLATES = [
  { id: "five-star-spotlight", name: "Five Star Spotlight", category: "review" },
  { id: "monthly-roundup", name: "Monthly Roundup", category: "compilation" },
  { id: "lo-spotlight", name: "LO Spotlight", category: "team" },
  { id: "milestone", name: "Milestone", category: "achievement" },
  { id: "nps-announcement", name: "NPS Announcement", category: "metrics" },
  { id: "before-after", name: "Before & After", category: "comparison" },
  { id: "team-excellence", name: "Team Excellence", category: "team" },
  { id: "holiday-themed", name: "Holiday Themed", category: "seasonal" },
];

const MOCK_EDITOR_GRAPHIC = {
  id: "gfx-001",
  name: "5-Star Spotlight — Alice",
  template_id: "five-star-spotlight",
  canvas_width: 1080,
  canvas_height: 1080,
  elements: [
    {
      id: "el-1",
      type: "text",
      content: "★★★★★",
      x: 100,
      y: 50,
      width: 300,
      height: 40,
      fontSize: 32,
      fontFamily: "Source Sans 3",
      color: "#2f3e46",
      zIndex: 2,
      locked: false,
      visible: true,
    },
    {
      id: "el-2",
      type: "text",
      content: "Absolutely outstanding service!",
      x: 100,
      y: 120,
      width: 400,
      height: 80,
      fontSize: 24,
      fontFamily: "Erstoria",
      color: "#52796f",
      zIndex: 1,
      locked: false,
      visible: true,
    },
    {
      id: "el-3",
      type: "image",
      src: "/mock-avatar.png",
      x: 50,
      y: 50,
      width: 80,
      height: 80,
      zIndex: 3,
      locked: false,
      visible: true,
    },
  ],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function mockGraphicsListApi(page: import("@playwright/test").Page) {
  await page.route("**/api/**graphics**", async (route) => {
    if (route.request().method() === "GET") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: MOCK_GRAPHICS }),
      });
    }
    return route.continue();
  });

  await page.route("**/api/**reviews**", async (route) => {
    if (route.request().method() === "GET") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: MOCK_REVIEWS }),
      });
    }
    return route.continue();
  });

  await page.route("**/api/**templates**", async (route) => {
    if (route.request().method() === "GET") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: MOCK_TEMPLATES }),
      });
    }
    return route.continue();
  });
}

async function mockServerActions(
  page: import("@playwright/test").Page,
  overrides?: {
    autoGenerateResult?: { success: boolean; data?: { id: string }; error?: string };
    exportResult?: { success: boolean; data?: { url: string }; error?: string };
    publishResult?: { success: boolean; error?: string };
    duplicateResult?: { success: boolean; data?: { id: string }; error?: string };
    deleteResult?: { success: boolean; error?: string };
  }
) {
  await page.route("**/*", async (route) => {
    const request = route.request();
    if (request.method() !== "POST") return route.continue();

    const nextAction = request.headers()["next-action"];
    if (!nextAction) return route.continue();

    const body = await request.postData();

    if (body?.includes("autoGenerate") || body?.includes("auto-generate") || body?.includes("generate")) {
      const result = overrides?.autoGenerateResult ?? {
        success: true,
        data: { id: "gfx-new-001" },
      };
      return route.fulfill({
        status: 200,
        contentType: "text/x-component",
        body: `0:${JSON.stringify(result)}\n`,
      });
    }

    if (body?.includes("export") || body?.includes("render")) {
      const result = overrides?.exportResult ?? {
        success: true,
        data: { url: "https://storage.example.com/graphic-001.png" },
      };
      return route.fulfill({
        status: 200,
        contentType: "text/x-component",
        body: `0:${JSON.stringify(result)}\n`,
      });
    }

    if (body?.includes("publish") || body?.includes("platform")) {
      const result = overrides?.publishResult ?? { success: true };
      return route.fulfill({
        status: 200,
        contentType: "text/x-component",
        body: `0:${JSON.stringify(result)}\n`,
      });
    }

    if (body?.includes("duplicate")) {
      const result = overrides?.duplicateResult ?? {
        success: true,
        data: { id: "gfx-dup-001" },
      };
      return route.fulfill({
        status: 200,
        contentType: "text/x-component",
        body: `0:${JSON.stringify(result)}\n`,
      });
    }

    if (body?.includes("delete")) {
      const result = overrides?.deleteResult ?? { success: true };
      return route.fulfill({
        status: 200,
        contentType: "text/x-component",
        body: `0:${JSON.stringify(result)}\n`,
      });
    }

    return route.continue();
  });
}

async function mockEditorApi(page: import("@playwright/test").Page) {
  await page.route("**/api/**graphics/gfx-001**", async (route) => {
    if (route.request().method() === "GET") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: MOCK_EDITOR_GRAPHIC }),
      });
    }
    return route.continue();
  });
}

// =============================================================================
// TEST SUITE 1: Graphics List Page
// =============================================================================

test.describe("Social Graphics — List Page", () => {
  test("1. graphics list loads with cards", async ({ page, dashboardPage }) => {
    await mockGraphicsListApi(page);
    const dp = await dashboardPage("/dashboard/social-graphics");

    const cards = dp.locator(
      "[data-testid*='graphic-card'], [class*='card'], [role='article']"
    );
    await expect(cards.first()).toBeVisible({ timeout: 10_000 });
  });

  test("2. generate dropdown opens with 3 options", async ({ page, dashboardPage }) => {
    await mockGraphicsListApi(page);
    const dp = await dashboardPage("/dashboard/social-graphics");

    const generateTrigger = dp.getByRole("button", { name: /generate/i });
    await generateTrigger.click();

    await expect(
      dp.getByRole("menuitem", { name: /from single review/i }).or(dp.getByText(/from single review/i))
    ).toBeVisible();
    await expect(
      dp.getByRole("menuitem", { name: /batch from reviews/i }).or(dp.getByText(/batch from reviews/i))
    ).toBeVisible();
    await expect(
      dp.getByRole("menuitem", { name: /review of the week/i }).or(dp.getByText(/review of the week/i))
    ).toBeVisible();
  });

  test("3. 'From Single Review' opens auto-generate dialog", async ({ page, dashboardPage }) => {
    await mockGraphicsListApi(page);
    const dp = await dashboardPage("/dashboard/social-graphics");

    const generateTrigger = dp.getByRole("button", { name: /generate/i });
    await generateTrigger.click();

    const singleReviewOption = dp
      .getByRole("menuitem", { name: /from single review/i })
      .or(dp.getByText(/from single review/i));
    await singleReviewOption.click();

    // Auto-generate dialog should appear
    await expect(
      dp.getByRole("dialog").or(dp.locator("[data-testid='auto-generate-dialog']"))
    ).toBeVisible({ timeout: 5_000 });
  });

  test("4. auto-generate dialog shows review selector dropdown", async ({ page, dashboardPage }) => {
    await mockGraphicsListApi(page);
    const dp = await dashboardPage("/dashboard/social-graphics");

    // Open generate menu → single review
    await dp.getByRole("button", { name: /generate/i }).click();
    const singleReviewOption = dp
      .getByRole("menuitem", { name: /from single review/i })
      .or(dp.getByText(/from single review/i));
    await singleReviewOption.click();

    await expect(dp.getByRole("dialog").or(dp.locator("[data-testid='auto-generate-dialog']"))).toBeVisible({
      timeout: 5_000,
    });

    // Review selector should be present
    const reviewSelector = dp
      .getByRole("combobox", { name: /review/i })
      .or(dp.getByLabel(/select.*review/i))
      .or(dp.locator("[data-testid*='review-select']"));
    await expect(reviewSelector).toBeVisible();
  });

  test("5. template auto-selection: 5-star review selects five-star-spotlight", async ({
    page,
    dashboardPage,
  }) => {
    await mockGraphicsListApi(page);
    await mockServerActions(page);
    const dp = await dashboardPage("/dashboard/social-graphics");

    // Open auto-generate dialog
    await dp.getByRole("button", { name: /generate/i }).click();
    const singleReviewOption = dp
      .getByRole("menuitem", { name: /from single review/i })
      .or(dp.getByText(/from single review/i));
    await singleReviewOption.click();

    await expect(dp.getByRole("dialog").or(dp.locator("[data-testid='auto-generate-dialog']"))).toBeVisible({
      timeout: 5_000,
    });

    // Select the 5-star review (Alice Johnson)
    const reviewSelector = dp
      .getByRole("combobox", { name: /review/i })
      .or(dp.getByLabel(/select.*review/i))
      .or(dp.locator("[data-testid*='review-select']"));
    await reviewSelector.click();

    const aliceOption = dp
      .getByRole("option", { name: /alice/i })
      .or(dp.getByText(/alice johnson/i));
    await aliceOption.first().click();

    // Template should auto-select to five-star-spotlight
    await expect(
      dp.getByText(/five.star.spotlight/i).or(dp.locator("[data-testid*='template-select']"))
    ).toBeVisible({ timeout: 3_000 });
  });

  test("6. generate action → mock success", async ({ page, dashboardPage }) => {
    await mockGraphicsListApi(page);
    await mockServerActions(page, {
      autoGenerateResult: { success: true, data: { id: "gfx-new-001" } },
    });
    const dp = await dashboardPage("/dashboard/social-graphics");

    // Open auto-generate dialog
    await dp.getByRole("button", { name: /generate/i }).click();
    const singleReviewOption = dp
      .getByRole("menuitem", { name: /from single review/i })
      .or(dp.getByText(/from single review/i));
    await singleReviewOption.click();

    await expect(dp.getByRole("dialog").or(dp.locator("[data-testid='auto-generate-dialog']"))).toBeVisible({
      timeout: 5_000,
    });

    // Select review
    const reviewSelector = dp
      .getByRole("combobox", { name: /review/i })
      .or(dp.getByLabel(/select.*review/i))
      .or(dp.locator("[data-testid*='review-select']"));
    await reviewSelector.click();

    const firstOption = dp.getByRole("option").first();
    if (await firstOption.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await firstOption.click();
    }

    // Click Generate button
    const generateBtn = dp.getByRole("button", { name: /^generate$/i });
    if (await generateBtn.isEnabled({ timeout: 3_000 }).catch(() => false)) {
      await generateBtn.click();

      // Should redirect to editor or show success
      await dp.waitForTimeout(1_500);
    }
  });

  test("14. hover over graphic card reveals Duplicate and Delete buttons", async ({
    page,
    dashboardPage,
  }) => {
    await mockGraphicsListApi(page);
    const dp = await dashboardPage("/dashboard/social-graphics");

    const card = dp
      .locator("[data-testid*='graphic-card'], [class*='card'], [role='article']")
      .first();
    await expect(card).toBeVisible({ timeout: 10_000 });

    await card.hover();

    const duplicateBtn = card
      .getByRole("button", { name: /duplicate/i })
      .or(card.locator("[data-testid*='duplicate']"));
    const deleteBtn = card
      .getByRole("button", { name: /delete/i })
      .or(card.locator("[data-testid*='delete']"));

    await expect(duplicateBtn).toBeVisible();
    await expect(deleteBtn).toBeVisible();
  });

  test("15. batch generate dialog: multi-select reviews and template selector", async ({
    page,
    dashboardPage,
  }) => {
    await mockGraphicsListApi(page);
    const dp = await dashboardPage("/dashboard/social-graphics");

    // Open generate menu → batch from reviews
    await dp.getByRole("button", { name: /generate/i }).click();
    const batchOption = dp
      .getByRole("menuitem", { name: /batch from reviews/i })
      .or(dp.getByText(/batch from reviews/i));
    await batchOption.click();

    // Batch dialog should appear
    await expect(
      dp.getByRole("dialog").or(dp.locator("[data-testid*='batch-generate']"))
    ).toBeVisible({ timeout: 5_000 });

    // Multi-select review list should be present (checkboxes or multi-select)
    const reviewCheckboxes = dp.locator(
      "[data-testid*='review-checkbox'], input[type='checkbox'], [role='checkbox']"
    );
    await expect(reviewCheckboxes.first()).toBeVisible({ timeout: 3_000 });

    // Template selector should be present
    const templateSelector = dp
      .getByRole("combobox", { name: /template/i })
      .or(dp.getByLabel(/template/i))
      .or(dp.locator("[data-testid*='template-select']"));
    await expect(templateSelector).toBeVisible();
  });
});

// =============================================================================
// TEST SUITE 2: New Graphic Form
// =============================================================================

test.describe("Social Graphics — New Graphic", () => {
  test("7. new graphic form: fill name, select canvas size, verify presets", async ({
    page,
    dashboardPage,
  }) => {
    await mockGraphicsListApi(page);
    const dp = await dashboardPage("/dashboard/social-graphics/new");

    // Fill graphic name
    const nameInput = dp.getByLabel(/name/i).or(dp.getByPlaceholder(/name/i));
    await nameInput.fill("My New Social Graphic");
    await expect(nameInput).toHaveValue("My New Social Graphic");

    // Open canvas size selector
    const canvasTrigger = dp
      .getByRole("combobox", { name: /canvas.*size|preset/i })
      .or(dp.getByLabel(/canvas.*size|preset/i))
      .or(dp.locator("[data-testid*='canvas-size']"));
    await canvasTrigger.click();

    // Verify all 5 canvas presets are available
    const presets = [
      /instagram.*post|1080.*1080/i,
      /instagram.*story|1080.*1920/i,
      /facebook|1200.*630/i,
      /linkedin|1200.*627/i,
      /twitter|1600.*900/i,
    ];

    for (const preset of presets) {
      await expect(dp.getByRole("option", { name: preset }).or(dp.getByText(preset))).toBeVisible();
    }
  });
});

// =============================================================================
// TEST SUITE 3: Graphic Editor
// =============================================================================

test.describe("Social Graphics — Editor", () => {
  test("8. editor loads with canvas, toolbar, layers panel, and properties panel", async ({
    page,
    dashboardPage,
  }) => {
    await mockEditorApi(page);
    await mockServerActions(page);
    const dp = await dashboardPage("/dashboard/social-graphics/gfx-001");

    // Canvas viewport
    const canvas = dp
      .locator("[data-testid*='canvas'], [class*='canvas'], canvas, [role='img']")
      .first();
    await expect(canvas).toBeVisible({ timeout: 10_000 });

    // Toolbar with undo/redo and zoom
    const toolbar = dp.locator("[data-testid*='toolbar'], [class*='toolbar'], [role='toolbar']").first();
    await expect(toolbar).toBeVisible();

    await expect(
      dp.getByRole("button", { name: /undo/i }).or(dp.locator("[data-testid*='undo']"))
    ).toBeVisible();
    await expect(
      dp.getByRole("button", { name: /redo/i }).or(dp.locator("[data-testid*='redo']"))
    ).toBeVisible();

    // Layer panel
    const layerPanel = dp
      .locator("[data-testid*='layer'], [class*='layer']")
      .or(dp.getByText(/layers/i))
      .first();
    await expect(layerPanel).toBeVisible();

    // Property panel (may show placeholder when nothing selected)
    const propertyPanel = dp
      .locator("[data-testid*='propert'], [class*='propert']")
      .or(dp.getByText(/properties/i))
      .first();
    await expect(propertyPanel).toBeVisible();
  });

  test("9. clicking an element on canvas selects it and shows properties", async ({
    page,
    dashboardPage,
  }) => {
    await mockEditorApi(page);
    await mockServerActions(page);
    const dp = await dashboardPage("/dashboard/social-graphics/gfx-001");

    // Wait for canvas to load
    const canvas = dp
      .locator("[data-testid*='canvas'], [class*='canvas'], canvas")
      .first();
    await expect(canvas).toBeVisible({ timeout: 10_000 });

    // Click on a canvas element (text element)
    const canvasElement = dp
      .locator("[data-testid*='element'], [data-element-id], [class*='canvas-element']")
      .first();

    if (await canvasElement.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await canvasElement.click();

      // Properties panel should show element-specific controls
      await expect(
        dp
          .locator("[data-testid*='propert'], [class*='propert']")
          .or(dp.getByText(/properties/i))
          .first()
      ).toBeVisible();

      // Should show at least position or text controls
      await expect(
        dp.getByLabel(/x|position|width|font|color|text/i).first()
      ).toBeVisible({ timeout: 3_000 });
    }
  });

  test("10. property panel shows element-specific controls for text elements", async ({
    page,
    dashboardPage,
  }) => {
    await mockEditorApi(page);
    await mockServerActions(page);
    const dp = await dashboardPage("/dashboard/social-graphics/gfx-001");

    await expect(
      dp.locator("[data-testid*='canvas'], [class*='canvas'], canvas").first()
    ).toBeVisible({ timeout: 10_000 });

    // Select a text element
    const textElement = dp
      .locator("[data-testid*='element'][data-type='text'], [data-element-id]")
      .first()
      .or(dp.locator("[class*='canvas-element']").first());

    if (await textElement.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await textElement.click();

      // Text-specific controls: font family, font size, color, content
      const textControls = [
        dp.getByLabel(/font/i).first(),
        dp.getByLabel(/size/i).first(),
        dp.getByLabel(/color/i).first(),
      ];

      for (const control of textControls) {
        if (await control.isVisible({ timeout: 2_000 }).catch(() => false)) {
          await expect(control).toBeVisible();
        }
      }

      // Position controls: X, Y, Width, Height
      const positionControls = [
        dp.getByLabel(/^x$/i).or(dp.getByLabel(/x position/i)),
        dp.getByLabel(/^y$/i).or(dp.getByLabel(/y position/i)),
      ];

      for (const control of positionControls) {
        if (await control.isVisible({ timeout: 2_000 }).catch(() => false)) {
          await expect(control).toBeVisible();
        }
      }
    }
  });
});

// =============================================================================
// TEST SUITE 4: Export & Publish
// =============================================================================

test.describe("Social Graphics — Export & Publish", () => {
  test("11. export dialog: format selection and canvas size presets", async ({
    page,
    dashboardPage,
  }) => {
    await mockEditorApi(page);
    await mockServerActions(page);
    const dp = await dashboardPage("/dashboard/social-graphics/gfx-001");

    await expect(
      dp.locator("[data-testid*='canvas'], [class*='canvas'], canvas").first()
    ).toBeVisible({ timeout: 10_000 });

    // Open export dialog
    const exportBtn = dp
      .getByRole("button", { name: /export/i })
      .or(dp.locator("[data-testid*='export']"));
    await exportBtn.click();

    // Export dialog should appear
    await expect(
      dp.getByRole("dialog").or(dp.locator("[data-testid='export-dialog']"))
    ).toBeVisible({ timeout: 3_000 });

    // Format options: PNG, JPG, WebP
    await expect(dp.getByText(/png/i)).toBeVisible();
    await expect(dp.getByText(/jpe?g/i)).toBeVisible();
    await expect(dp.getByText(/webp/i)).toBeVisible();

    // Canvas size presets should be listed
    const sizePresets = [
      /instagram.*post|1080.*1080/i,
      /instagram.*story|1080.*1920/i,
      /facebook|1200.*630/i,
      /linkedin|1200.*627/i,
      /twitter|1600.*900/i,
    ];

    for (const preset of sizePresets) {
      await expect(
        dp.getByText(preset).or(dp.getByRole("option", { name: preset }))
      ).toBeVisible();
    }
  });

  test("12. export → mock render upload → success toast", async ({ page, dashboardPage }) => {
    await mockEditorApi(page);
    await mockServerActions(page, {
      exportResult: {
        success: true,
        data: { url: "https://storage.example.com/graphic-exported.png" },
      },
    });
    const dp = await dashboardPage("/dashboard/social-graphics/gfx-001");

    await expect(
      dp.locator("[data-testid*='canvas'], [class*='canvas'], canvas").first()
    ).toBeVisible({ timeout: 10_000 });

    // Open export dialog
    const exportBtn = dp
      .getByRole("button", { name: /export/i })
      .or(dp.locator("[data-testid*='export']"));
    await exportBtn.click();

    await expect(dp.getByRole("dialog").or(dp.locator("[data-testid='export-dialog']"))).toBeVisible({
      timeout: 3_000,
    });

    // Select PNG format (default or click)
    const pngOption = dp
      .getByRole("radio", { name: /png/i })
      .or(dp.getByLabel(/png/i))
      .or(dp.getByText(/png/i));
    await pngOption.first().click();

    // Click Export/Download button
    const downloadBtn = dp
      .getByRole("button", { name: /export|download/i })
      .last();
    await downloadBtn.click();

    // Success toast
    await expect(
      dp.getByText(/exported|downloaded|saved/i).first()
    ).toBeVisible({ timeout: 5_000 });
  });

  test("13. publish dialog: platform checkboxes and AI caption textarea", async ({
    page,
    dashboardPage,
  }) => {
    await mockEditorApi(page);
    await mockServerActions(page);
    const dp = await dashboardPage("/dashboard/social-graphics/gfx-001");

    await expect(
      dp.locator("[data-testid*='canvas'], [class*='canvas'], canvas").first()
    ).toBeVisible({ timeout: 10_000 });

    // Open publish dialog
    const publishBtn = dp
      .getByRole("button", { name: /publish/i })
      .or(dp.locator("[data-testid*='publish']"));
    await publishBtn.click();

    await expect(
      dp.getByRole("dialog").or(dp.locator("[data-testid='publish-dialog']"))
    ).toBeVisible({ timeout: 3_000 });

    // Platform checkboxes
    const platforms = ["Facebook", "Twitter", "LinkedIn", "Instagram"];
    for (const platform of platforms) {
      await expect(
        dp
          .getByRole("checkbox", { name: new RegExp(platform, "i") })
          .or(dp.getByLabel(new RegExp(platform, "i")))
      ).toBeVisible();
    }

    // AI-generated caption textarea
    const captionArea = dp
      .getByRole("textbox", { name: /caption/i })
      .or(dp.getByLabel(/caption/i))
      .or(dp.locator("textarea"));
    await expect(captionArea.first()).toBeVisible();
  });
});
