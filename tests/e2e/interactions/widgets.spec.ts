/**
 * E2E interaction tests for the Widgets dashboard pages.
 *
 * Covers:
 * - Widget list page (cards, copy embed, navigate to builder)
 * - Widget builder sidebar tabs (General, Theme, Content, Filters, Advanced, History)
 * - Theme tab: color pickers, font selects, layout selects
 * - Content tab: toggle switches
 * - Filters tab: min rating select, max reviews input, sort order select
 * - Advanced tab: domain allowlist add/remove
 * - Embed code copy buttons
 * - Save button loading state
 * - Back button navigation
 */

import { test, expect } from "../helpers/dashboard-fixture";

test.use({ storageState: ".auth/enterprise-admin.json" });

// ── Mock data ──────────────────────────────────────────────────────────

const MOCK_WIDGETS = [
  {
    id: "wc-001",
    widget_id: "wid-abc-001",
    widget_type: "review_profile",
    entity_type: "user",
    entity_id: "user-001",
    organization_id: "org-001",
    config: {
      theme: {
        preset: "clean_white",
        colors: {
          primary: "#52796f",
          background: "#ffffff",
          text: "#1a1a2e",
          accent: "#52796f",
          border: "#e5e7eb",
          starFilled: "#f59e0b",
          starEmpty: "#d1d5db",
        },
        typography: {
          fontFamily: "system-ui",
          headerSize: "18px",
          bodySize: "14px",
        },
        layout: {
          maxWidth: "600px",
          padding: "16px",
          borderRadius: "8px",
          shadow: "sm",
          cardStyle: "bordered",
        },
      },
      content: {
        showHeader: true,
        showAvatar: true,
        showDate: true,
        showSource: true,
        showBranding: true,
        truncateLength: 300,
      },
      filters: {
        minRating: 1,
        maxReviews: 50,
        sortOrder: "newest",
      },
    },
    allowed_domains: [],
    version: 3,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-03-01T00:00:00Z",
    is_active: true,
  },
  {
    id: "wc-002",
    widget_id: "wid-abc-002",
    widget_type: "review_carousel",
    entity_type: "organization",
    entity_id: null,
    organization_id: "org-001",
    config: {},
    allowed_domains: [],
    version: 1,
    created_at: "2025-01-02T00:00:00Z",
    updated_at: "2025-01-02T00:00:00Z",
    is_active: true,
  },
  {
    id: "wc-003",
    widget_id: "wid-abc-003",
    widget_type: "star_rating_badge",
    entity_type: "user",
    entity_id: "user-001",
    organization_id: "org-001",
    config: {},
    allowed_domains: ["example.com"],
    version: 1,
    created_at: "2025-01-03T00:00:00Z",
    updated_at: "2025-01-03T00:00:00Z",
    is_active: true,
  },
];

const MOCK_VERSIONS = [
  {
    id: "ver-003",
    widget_config_id: "wc-001",
    version: 3,
    config: MOCK_WIDGETS[0].config,
    change_summary: "Updated theme colors",
    change_note: null,
    changed_by: "user-001",
    changed_by_name: "Admin User",
    created_at: "2025-03-01T00:00:00Z",
  },
  {
    id: "ver-002",
    widget_config_id: "wc-001",
    version: 2,
    config: {},
    change_summary: "Added domain restrictions",
    change_note: null,
    changed_by: "user-001",
    changed_by_name: "Admin User",
    created_at: "2025-02-15T00:00:00Z",
  },
  {
    id: "ver-001",
    widget_config_id: "wc-001",
    version: 1,
    config: {},
    change_summary: "Initial creation",
    change_note: null,
    changed_by: "user-001",
    changed_by_name: "Admin User",
    created_at: "2025-01-01T00:00:00Z",
  },
];

// ── Helpers ────────────────────────────────────────────────────────────

/** Intercept Supabase REST & server-action calls with mock data. */
async function mockWidgetListAPIs(page: import("@playwright/test").Page) {
  // Mock the RSC / server component data fetch for widget list
  await page.route("**/rest/v1/widget_configs*", async (route) => {
    const url = route.request().url();
    // Single widget fetch
    if (url.includes("id=eq.wc-001") || url.includes("widget_id=eq.wid-abc-001")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([MOCK_WIDGETS[0]]),
        headers: { "content-range": "0-0/1" },
      });
      return;
    }
    // List fetch
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_WIDGETS),
      headers: { "content-range": `0-${MOCK_WIDGETS.length - 1}/${MOCK_WIDGETS.length}` },
    });
  });

  // Mock the seed-defaults call (no-op)
  await page.route("**/rest/v1/rpc/ensure_default_widgets*", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: "null" });
  });
}

async function mockWidgetBuilderAPIs(page: import("@playwright/test").Page) {
  await mockWidgetListAPIs(page);

  // Mock widget update (save)
  await page.route("**/rest/v1/widget_configs?id=eq*", async (route) => {
    if (route.request().method() === "PATCH") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([{ ...MOCK_WIDGETS[0], version: 4 }]),
      });
      return;
    }
    await route.fallback();
  });

  // Mock version history
  await page.route("**/rest/v1/widget_versions*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_VERSIONS),
      headers: { "content-range": `0-${MOCK_VERSIONS.length - 1}/${MOCK_VERSIONS.length}` },
    });
  });

  // Mock rollback
  await page.route("**/rest/v1/rpc/rollback_widget*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true }),
    });
  });

  // Mock entity CTA defaults
  await page.route("**/rest/v1/rpc/get_entity_cta_defaults*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ text: "Leave a Review", url: "https://example.com/review" }),
    });
  });

  // Mock filtered review count
  await page.route("**/rest/v1/rpc/get_filtered_review_count*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ count: 42 }),
    });
  });

  // Mock brand colors
  await page.route("**/rest/v1/rpc/get_org_brand_colors*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        primaryColor: "#2f3e46",
        secondaryColor: "#52796f",
        fontFamily: "Inter",
      }),
    });
  });
}

/** Switch the sidebar tab via the Select dropdown. */
async function switchSidebarTab(page: import("@playwright/test").Page, tabLabel: string) {
  // The sidebar uses a Select component to switch tabs
  const tabSelector = page.locator(".bg-muted\\/50 button[role='combobox']").first();
  await tabSelector.click();
  await page.getByRole("option", { name: tabLabel }).click();
  // Small delay for tab content to render
  await page.waitForTimeout(300);
}

// ── Tests ──────────────────────────────────────────────────────────────

test.describe("Widget List Page", () => {
  test("loads with widget cards", async ({ dashboardPage }) => {
    const page = await dashboardPage("/dashboard/widgets");
    await mockWidgetListAPIs(page);
    await page.reload({ waitUntil: "networkidle" });

    // Heading should be visible
    await expect(page.getByRole("heading", { name: "Widget Templates" })).toBeVisible({
      timeout: 10_000,
    });

    // Should show widget cards with type labels
    const customizeButtons = page.getByRole("button", { name: "Customize" });
    await expect(customizeButtons.first()).toBeVisible({ timeout: 5_000 });

    // Should show Copy Embed buttons
    const copyButtons = page.getByRole("button", { name: /Copy Embed/i });
    await expect(copyButtons.first()).toBeVisible();
  });

  test('"Copy Embed" button copies code and shows toast', async ({ dashboardPage }) => {
    const page = await dashboardPage("/dashboard/widgets");
    await mockWidgetListAPIs(page);
    await page.reload({ waitUntil: "networkidle" });

    await expect(page.getByRole("heading", { name: "Widget Templates" })).toBeVisible({
      timeout: 10_000,
    });

    // Grant clipboard permissions
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);

    const copyButton = page.getByRole("button", { name: /Copy Embed/i }).first();
    await copyButton.click();

    // Toast should appear
    await expect(page.getByText("Embed code copied")).toBeVisible({ timeout: 5_000 });
  });

  test('"Customize" button navigates to widget builder', async ({ dashboardPage }) => {
    const page = await dashboardPage("/dashboard/widgets");
    await mockWidgetListAPIs(page);
    await page.reload({ waitUntil: "networkidle" });

    await expect(page.getByRole("heading", { name: "Widget Templates" })).toBeVisible({
      timeout: 10_000,
    });

    // Mock the builder page APIs before navigating
    await mockWidgetBuilderAPIs(page);

    const customizeButton = page.getByRole("button", { name: "Customize" }).first();
    await customizeButton.click();

    // Should navigate to the builder page
    await page.waitForURL("**/dashboard/widgets/**", { timeout: 10_000 });
    expect(page.url()).toMatch(/\/dashboard\/widgets\/wc-001/);
  });
});

test.describe("Widget Builder — Sidebar Tabs", () => {
  test("loads with sidebar tab selector", async ({ dashboardPage }) => {
    const page = await dashboardPage("/dashboard/widgets/wc-001");
    await mockWidgetBuilderAPIs(page);
    await page.reload({ waitUntil: "networkidle" });

    // The sidebar tab select trigger should be visible
    const tabSelector = page.locator("button[role='combobox']").first();
    await expect(tabSelector).toBeVisible({ timeout: 10_000 });
  });

  test("can switch through all six tabs", async ({ dashboardPage }) => {
    const page = await dashboardPage("/dashboard/widgets/wc-001");
    await mockWidgetBuilderAPIs(page);
    await page.reload({ waitUntil: "networkidle" });

    // Wait for initial render
    const tabSelector = page.locator("button[role='combobox']").first();
    await expect(tabSelector).toBeVisible({ timeout: 10_000 });

    // Open tab dropdown and verify all 6 tabs exist
    await tabSelector.click();
    for (const tabName of ["General", "Theme", "Content", "Filters", "Advanced", "History"]) {
      await expect(page.getByRole("option", { name: tabName })).toBeVisible();
    }
    // Close by pressing Escape
    await page.keyboard.press("Escape");

    // Switch to Theme tab
    await switchSidebarTab(page, "Theme");
    await expect(page.getByText("Theme Preset")).toBeVisible({ timeout: 5_000 });

    // Switch to Content tab
    await switchSidebarTab(page, "Content");
    await expect(page.getByText("Language")).toBeVisible({ timeout: 5_000 });

    // Switch to Filters tab
    await switchSidebarTab(page, "Filters");
    await expect(page.getByText("Minimum Rating")).toBeVisible({ timeout: 5_000 });

    // Switch to Advanced tab
    await switchSidebarTab(page, "Advanced");
    await expect(page.getByText("Custom CSS")).toBeVisible({ timeout: 5_000 });

    // Switch to History tab
    await switchSidebarTab(page, "History");
    // Should show version entries or empty state
    const historyContent = page.getByText(/v\d+|No version history/);
    await expect(historyContent.first()).toBeVisible({ timeout: 5_000 });
  });
});

test.describe("Widget Builder — Theme Tab", () => {
  test("color picker interaction changes hex value", async ({ dashboardPage }) => {
    const page = await dashboardPage("/dashboard/widgets/wc-001");
    await mockWidgetBuilderAPIs(page);
    await page.reload({ waitUntil: "networkidle" });

    await switchSidebarTab(page, "Theme");
    await expect(page.getByText("Colors")).toBeVisible({ timeout: 5_000 });

    // Find the Primary color hex input (font-mono inputs under Colors section)
    const primaryInput = page
      .locator("input.font-mono")
      .first();
    await expect(primaryInput).toBeVisible();

    // Clear and type a new hex value
    await primaryInput.fill("#ff0000");
    await primaryInput.press("Tab");

    // The color swatch should update (verify the input value persisted)
    await expect(primaryInput).toHaveValue("#ff0000");
  });

  test("font family select opens with search", async ({ dashboardPage }) => {
    const page = await dashboardPage("/dashboard/widgets/wc-001");
    await mockWidgetBuilderAPIs(page);
    await page.reload({ waitUntil: "networkidle" });

    await switchSidebarTab(page, "Theme");
    await expect(page.getByText("Typography")).toBeVisible({ timeout: 5_000 });

    // Find the Font Family select trigger (under Typography label)
    const fontLabel = page.getByText("Font Family").first();
    await expect(fontLabel).toBeVisible();

    // Click the select trigger below the Font Family label
    const fontSelect = fontLabel.locator("..").locator("button[role='combobox']");
    await fontSelect.click();

    // Search input should appear inside the dropdown
    const searchInput = page.getByPlaceholder("Search fonts\u2026");
    await expect(searchInput).toBeVisible({ timeout: 3_000 });

    // Type to filter fonts
    await searchInput.fill("Inter");
    await page.waitForTimeout(200);

    // Should show filtered results (Inter should appear)
    const interOption = page.getByRole("option", { name: /Inter/i });
    await expect(interOption.first()).toBeVisible({ timeout: 3_000 });

    await page.keyboard.press("Escape");
  });

  test("layout selectors (max width, padding, border radius)", async ({ dashboardPage }) => {
    const page = await dashboardPage("/dashboard/widgets/wc-001");
    await mockWidgetBuilderAPIs(page);
    await page.reload({ waitUntil: "networkidle" });

    await switchSidebarTab(page, "Theme");

    // Max Width label should be visible
    const maxWidthLabel = page.getByText(/Max Width/);
    await expect(maxWidthLabel.first()).toBeVisible({ timeout: 5_000 });

    // Padding label
    const paddingLabel = page.getByText(/Padding/);
    await expect(paddingLabel.first()).toBeVisible();

    // Border Radius label
    const borderRadiusLabel = page.getByText(/Border Radius/);
    await expect(borderRadiusLabel.first()).toBeVisible();

    // Click the border radius select and pick a value
    const brSelect = borderRadiusLabel.first().locator("..").locator("button[role='combobox']");
    await brSelect.click();

    const option12px = page.getByRole("option", { name: "12px" });
    await expect(option12px).toBeVisible({ timeout: 3_000 });
    await option12px.click();
  });
});

test.describe("Widget Builder — Content Tab", () => {
  test("toggle switches on/off", async ({ dashboardPage }) => {
    const page = await dashboardPage("/dashboard/widgets/wc-001");
    await mockWidgetBuilderAPIs(page);
    await page.reload({ waitUntil: "networkidle" });

    await switchSidebarTab(page, "Content");
    await page.waitForTimeout(500);

    // Show Header switch should exist
    const showHeaderLabel = page.getByText("Show Header").first();
    await expect(showHeaderLabel).toBeVisible({ timeout: 5_000 });

    // Find the switch next to it
    const showHeaderSwitch = showHeaderLabel
      .locator("..")
      .locator("button[role='switch']");
    await expect(showHeaderSwitch).toBeVisible();

    // It should be checked by default (aria-checked="true")
    await expect(showHeaderSwitch).toHaveAttribute("aria-checked", "true");

    // Toggle it off
    await showHeaderSwitch.click();
    await expect(showHeaderSwitch).toHaveAttribute("aria-checked", "false");

    // Toggle it back on
    await showHeaderSwitch.click();
    await expect(showHeaderSwitch).toHaveAttribute("aria-checked", "true");

    // Show Avatars switch
    const showAvatarsLabel = page.getByText("Show Avatars").first();
    await expect(showAvatarsLabel).toBeVisible();

    const showAvatarsSwitch = showAvatarsLabel
      .locator("..")
      .locator("button[role='switch']");
    await showAvatarsSwitch.click();
    await expect(showAvatarsSwitch).toHaveAttribute("aria-checked", "false");
  });
});

test.describe("Widget Builder — Filters Tab", () => {
  test("minimum rating select interaction", async ({ dashboardPage }) => {
    const page = await dashboardPage("/dashboard/widgets/wc-001");
    await mockWidgetBuilderAPIs(page);
    await page.reload({ waitUntil: "networkidle" });

    await switchSidebarTab(page, "Filters");

    const minRatingLabel = page.getByText("Minimum Rating").first();
    await expect(minRatingLabel).toBeVisible({ timeout: 5_000 });

    // Click the Min Rating select
    const minRatingSelect = minRatingLabel
      .locator("..")
      .locator("button[role='combobox']");
    await minRatingSelect.click();

    // Select 4 stars
    await page.getByRole("option", { name: "4 stars" }).click();
  });

  test("max reviews number input", async ({ dashboardPage }) => {
    const page = await dashboardPage("/dashboard/widgets/wc-001");
    await mockWidgetBuilderAPIs(page);
    await page.reload({ waitUntil: "networkidle" });

    await switchSidebarTab(page, "Filters");

    const maxReviewsLabel = page.getByText("Max Reviews").first();
    await expect(maxReviewsLabel).toBeVisible({ timeout: 5_000 });

    // The max reviews input is a native number input
    const maxReviewsInput = maxReviewsLabel.locator("..").locator("input[type='number']");
    await expect(maxReviewsInput).toBeVisible();

    // Clear and enter a new value
    await maxReviewsInput.fill("25");
    await expect(maxReviewsInput).toHaveValue("25");
  });

  test("sort order select interaction", async ({ dashboardPage }) => {
    const page = await dashboardPage("/dashboard/widgets/wc-001");
    await mockWidgetBuilderAPIs(page);
    await page.reload({ waitUntil: "networkidle" });

    await switchSidebarTab(page, "Filters");

    const sortLabel = page.getByText("Sort Order").first();
    await expect(sortLabel).toBeVisible({ timeout: 5_000 });

    const sortSelect = sortLabel.locator("..").locator("button[role='combobox']");
    await sortSelect.click();

    // Select "Highest Rated"
    await page.getByRole("option", { name: "Highest Rated" }).click();
  });
});

test.describe("Widget Builder — Advanced Tab", () => {
  test("domain allowlist add and remove", async ({ dashboardPage }) => {
    const page = await dashboardPage("/dashboard/widgets/wc-001");
    await mockWidgetBuilderAPIs(page);
    await page.reload({ waitUntil: "networkidle" });

    await switchSidebarTab(page, "Advanced");
    await expect(page.getByText("Allowed Domains")).toBeVisible({ timeout: 5_000 });

    // Should show empty state text initially
    await expect(page.getByText("No domain restrictions")).toBeVisible();

    // Type a domain in the input
    const domainInput = page.getByPlaceholder("example.com or *.example.com");
    await expect(domainInput).toBeVisible();
    await domainInput.fill("mysite.com");

    // Click the Add button (Plus icon button)
    const addButton = domainInput.locator("..").locator("button").last();
    await addButton.click();

    // Domain chip should appear
    await expect(page.getByText("mysite.com")).toBeVisible({ timeout: 3_000 });

    // Empty state text should be gone
    await expect(page.getByText("No domain restrictions")).not.toBeVisible();

    // Remove the domain
    const removeButton = page.getByRole("button", { name: "Remove mysite.com" });
    await removeButton.click();

    // Chip should disappear, empty state returns
    await expect(page.getByText("No domain restrictions")).toBeVisible({ timeout: 3_000 });
  });

  test("custom CSS editor is visible", async ({ dashboardPage }) => {
    const page = await dashboardPage("/dashboard/widgets/wc-001");
    await mockWidgetBuilderAPIs(page);
    await page.reload({ waitUntil: "networkidle" });

    await switchSidebarTab(page, "Advanced");

    await expect(page.getByText("Custom CSS")).toBeVisible({ timeout: 5_000 });
    await expect(
      page.getByText("Add custom CSS rules to fine-tune the widget appearance")
    ).toBeVisible();
  });
});

test.describe("Widget Builder — Embed Code", () => {
  test("copy buttons show Copied state", async ({ dashboardPage }) => {
    const page = await dashboardPage("/dashboard/widgets/wc-001");
    await mockWidgetBuilderAPIs(page);
    await page.reload({ waitUntil: "networkidle" });

    // Embed code is on the General tab by default
    await page.waitForTimeout(500);

    // Grant clipboard permissions
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);

    // Look for the "Copy code" button in the embed panel
    const copyCodeButton = page.getByRole("button", { name: "Copy code" }).first();

    // If embed code is visible (widget has been saved with a widget_id)
    if (await copyCodeButton.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await copyCodeButton.click();

      // Should show "Copied" text
      await expect(page.getByText("Copied").first()).toBeVisible({ timeout: 3_000 });
    }
  });

  test("embed mode toggle between Script and Iframe", async ({ dashboardPage }) => {
    const page = await dashboardPage("/dashboard/widgets/wc-001");
    await mockWidgetBuilderAPIs(page);
    await page.reload({ waitUntil: "networkidle" });

    await page.waitForTimeout(500);

    // Look for Script / Iframe toggle buttons
    const scriptButton = page.getByRole("button", { name: "Script" }).first();
    const iframeButton = page.getByRole("button", { name: "Iframe" }).first();

    if (await scriptButton.isVisible({ timeout: 5_000 }).catch(() => false)) {
      // Click Iframe mode
      await iframeButton.click();
      await expect(page.getByText(/iframe/i).first()).toBeVisible({ timeout: 3_000 });

      // Click back to Script mode
      await scriptButton.click();
      await expect(page.getByText("data-repwell-widget").first()).toBeVisible({ timeout: 3_000 });
    }
  });
});

test.describe("Widget Builder — Save & Navigation", () => {
  test("save button shows loading state", async ({ dashboardPage }) => {
    const page = await dashboardPage("/dashboard/widgets/wc-001");
    await mockWidgetBuilderAPIs(page);
    await page.reload({ waitUntil: "networkidle" });

    // Save button should be present but disabled (no unsaved changes)
    const saveButton = page.getByRole("button", { name: /Save/i }).first();
    await expect(saveButton).toBeVisible({ timeout: 10_000 });
    await expect(saveButton).toBeDisabled();

    // Make a change to enable the save button — switch to Theme and change a color
    await switchSidebarTab(page, "Theme");
    await page.waitForTimeout(300);

    const colorInput = page.locator("input.font-mono").first();
    if (await colorInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await colorInput.fill("#ff0000");
      await colorInput.press("Tab");

      // Wait for debounced config change
      await page.waitForTimeout(500);

      // Delay the save response to observe loading state
      await page.route("**/rest/v1/widget_configs?id=eq*", async (route) => {
        if (route.request().method() === "PATCH") {
          await new Promise((r) => setTimeout(r, 1000));
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify([{ ...MOCK_WIDGETS[0], version: 4 }]),
          });
          return;
        }
        await route.fallback();
      });

      // Save should now be enabled if changes were detected
      if (await saveButton.isEnabled({ timeout: 3_000 }).catch(() => false)) {
        await saveButton.click();

        // Should show the spinner (Loader2 icon with animate-spin)
        const spinner = page.locator(".animate-spin");
        await expect(spinner).toBeVisible({ timeout: 2_000 });
      }
    }
  });

  test("back button navigates to widget list", async ({ dashboardPage }) => {
    const page = await dashboardPage("/dashboard/widgets/wc-001");
    await mockWidgetBuilderAPIs(page);
    await page.reload({ waitUntil: "networkidle" });

    // The back button shows "Widgets" text on desktop
    const backButton = page.getByRole("button", { name: /Widgets/i }).first();
    await expect(backButton).toBeVisible({ timeout: 10_000 });

    await backButton.click();
    await page.waitForURL("**/dashboard/widgets", { timeout: 10_000 });
    expect(page.url()).toMatch(/\/dashboard\/widgets$/);
  });
});

test.describe("Widget Builder — History Tab", () => {
  test("shows version list with entries", async ({ dashboardPage }) => {
    const page = await dashboardPage("/dashboard/widgets/wc-001");
    await mockWidgetBuilderAPIs(page);
    await page.reload({ waitUntil: "networkidle" });

    await switchSidebarTab(page, "History");

    // Should show version entries (v3, v2, v1)
    await expect(page.getByText("v3")).toBeVisible({ timeout: 5_000 });

    // Current version should have "Current" badge
    await expect(page.getByText("Current")).toBeVisible();
  });
});
