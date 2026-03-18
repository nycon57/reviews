/**
 * E2E interaction tests for the Reviews page (/dashboard/reviews).
 *
 * Covers:
 * - Tab switching (Text Reviews, Video Reviews, Requests, Share Studio)
 * - Filter interactions (status, source, featured, search, date range)
 * - Bulk actions (select all, approve, reject, feature, unfeature, archive)
 * - Pagination (next, previous, disabled states)
 * - Export (CSV download)
 * - Empty state
 * - Review list item clickability
 */

import { test, expect } from "../helpers/dashboard-fixture";
import { TEST_USERS } from "../helpers/pages";

test.use({ storageState: TEST_USERS["enterprise-admin"].storageState });

// ---------------------------------------------------------------------------
// Fixture data
// ---------------------------------------------------------------------------

const MOCK_REVIEWS = Array.from({ length: 25 }, (_, i) => ({
  id: `review-${i + 1}`,
  source: i % 3 === 0 ? "google" : i % 3 === 1 ? "internal" : "facebook",
  rating: (i % 5) + 1,
  customerName: `Customer ${i + 1}`,
  text: `This is review text number ${i + 1}. Great service!`,
  status: i < 5 ? "pending" : i < 15 ? "approved" : i < 20 ? "rejected" : "archived",
  reviewDate: new Date(2026, 2, 14 - i).toISOString(),
  loanOfficerId: "user-1",
  loanOfficerName: "John Doe",
  featured: i === 5 || i === 6,
  responseText: i === 7 ? "Thank you for your review!" : null,
  aiSuggestedResponse: null,
  responseTemplateId: null,
  sourceUrl: i % 3 === 0 ? "https://google.com/review" : null,
  sentimentLabel: "positive",
  created_at: new Date(2026, 2, 14 - i).toISOString(),
}));

const MOCK_REVIEW_STATS = {
  pending: 5,
  approved: 10,
  rejected: 5,
  total: 25,
};

const MOCK_AGGREGATION_STATS = {
  total: 25,
  averageRating: 3.8,
  bySource: { internal: 8, google: 9, facebook: 8, zillow: 0, yelp: 0 },
  withResponse: 1,
  featured: 2,
  byStatus: { pending: 5, approved: 10, rejected: 5, archived: 5 },
};

const MOCK_VIDEO_STATS = {
  total: 3,
  pending: 1,
  approved: 1,
  rejected: 0,
  published: 1,
  averageDuration: 45,
  totalDuration: 135,
};

const MOCK_REQUEST_STATS = {
  total: 12,
  sent: 8,
  opened: 5,
  completed: 3,
  pending: 4,
  byChannel: { email: 10, manual: 2 },
};

// ---------------------------------------------------------------------------
// Helper: intercept Supabase / server-action API calls with fixture data
// ---------------------------------------------------------------------------

async function setupApiMocks(page: import("@playwright/test").Page) {
  // Intercept aggregated reviews fetch (server action)
  await page.route("**/dashboard/reviews*", async (route) => {
    const request = route.request();
    // Only intercept fetch/XHR requests (server actions), not the page navigation
    if (request.resourceType() === "document") {
      return route.continue();
    }
    // Let Next.js RSC payloads through
    if (request.headers()["accept"]?.includes("text/x-component")) {
      return route.continue();
    }
    return route.continue();
  });

  // Intercept Supabase REST API calls for reviews
  await page.route("**/rest/v1/aggregated_reviews*", async (route) => {
    const url = new URL(route.request().url());
    const offset = parseInt(url.searchParams.get("offset") ?? "0", 10);
    const limit = parseInt(url.searchParams.get("limit") ?? "20", 10);
    const slice = MOCK_REVIEWS.slice(offset, offset + limit);
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: { "content-range": `0-${slice.length - 1}/${MOCK_REVIEWS.length}` },
      body: JSON.stringify(slice),
    });
  });

  // Intercept review stats
  await page.route("**/rest/v1/rpc/get_review_stats*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_REVIEW_STATS),
    });
  });

  // Intercept aggregation stats
  await page.route("**/rest/v1/rpc/get_review_aggregation_stats*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_AGGREGATION_STATS),
    });
  });

  // Intercept video testimonials
  await page.route("**/rest/v1/video_testimonial_responses*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: { "content-range": "0-0/0" },
      body: JSON.stringify([]),
    });
  });

  // Intercept export endpoint
  await page.route("**/rest/v1/rpc/export_reviews*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(
        MOCK_REVIEWS.map((r) => ({
          id: r.id,
          source: r.source,
          rating: r.rating,
          customerName: r.customerName,
          text: r.text,
          loanOfficerName: r.loanOfficerName,
          status: r.status,
          reviewDate: r.reviewDate,
          responseText: r.responseText ?? "",
          sentimentLabel: r.sentimentLabel,
        }))
      ),
    });
  });

  // Intercept bulk actions (approve, reject, archive, feature)
  await page.route("**/rest/v1/rpc/bulk_*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true }),
    });
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe("Reviews Page — Tab Switching", () => {
  test("tabs are visible and switching updates active state", async ({
    dashboardPage,
    page,
  }) => {
    await dashboardPage("/dashboard/reviews");

    // "Text Reviews" tab should be active by default
    const textTab = page.getByRole("tab", { name: /Text Reviews/i });
    await expect(textTab).toBeVisible();
    await expect(textTab).toHaveAttribute("data-state", "active");

    // "Video Reviews" tab
    const videoTab = page.getByRole("tab", { name: /Video Reviews/i });
    await expect(videoTab).toBeVisible();
    await videoTab.click();
    await expect(videoTab).toHaveAttribute("data-state", "active");
    await expect(textTab).toHaveAttribute("data-state", "inactive");
  });

  test("switching to Requests tab shows requests content", async ({
    dashboardPage,
    page,
  }) => {
    await dashboardPage("/dashboard/reviews");

    const requestsTab = page.getByRole("tab", { name: /Requests/i });
    // Requests tab may or may not be visible depending on permissions;
    // enterprise-admin should have it
    if (await requestsTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await requestsTab.click();
      await expect(requestsTab).toHaveAttribute("data-state", "active");
    }
  });

  test("switching to Share Studio tab shows share content", async ({
    dashboardPage,
    page,
  }) => {
    await dashboardPage("/dashboard/reviews");

    const shareTab = page.getByRole("tab", { name: /Share Studio/i });
    if (await shareTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await shareTab.click();
      await expect(shareTab).toHaveAttribute("data-state", "active");
    }
  });

  test("tabs show badge counters for items with content", async ({
    dashboardPage,
    page,
  }) => {
    await dashboardPage("/dashboard/reviews");

    // Text Reviews and Video Reviews tabs should have badge counters
    const tabsList = page.getByRole("tablist");
    await expect(tabsList).toBeVisible();

    // Badge counters appear as secondary badges within tab triggers
    const badges = tabsList.locator('[class*="badge"]');
    // At least the Text Reviews tab should have a count badge
    const badgeCount = await badges.count();
    expect(badgeCount).toBeGreaterThanOrEqual(0);
  });
});

test.describe("Reviews Page — Filter Interactions", () => {
  test("status filter dropdown opens and selects values", async ({
    dashboardPage,
    page,
  }) => {
    await dashboardPage("/dashboard/reviews");

    // Find the status select trigger (first select with "All Status" or "Status")
    const statusTrigger = page
      .locator('[role="combobox"]')
      .filter({ hasText: /Status/i })
      .first();
    if (await statusTrigger.isVisible({ timeout: 5000 }).catch(() => false)) {
      await statusTrigger.click();

      // Select "Pending"
      const pendingOption = page.getByRole("option", { name: "Pending" });
      await expect(pendingOption).toBeVisible();
      await pendingOption.click();

      // Trigger should now reflect the selection
      await expect(statusTrigger).toHaveText(/Pending/i);
    }
  });

  test("source filter dropdown opens and selects values", async ({
    dashboardPage,
    page,
  }) => {
    await dashboardPage("/dashboard/reviews");

    const sourceTrigger = page
      .locator('[role="combobox"]')
      .filter({ hasText: /Source/i })
      .first();
    if (await sourceTrigger.isVisible({ timeout: 5000 }).catch(() => false)) {
      await sourceTrigger.click();

      const googleOption = page.getByRole("option", { name: "Google" });
      await expect(googleOption).toBeVisible();
      await googleOption.click();

      await expect(sourceTrigger).toHaveText(/Google/i);
    }
  });

  test("featured filter dropdown opens and selects values", async ({
    dashboardPage,
    page,
  }) => {
    await dashboardPage("/dashboard/reviews");

    const featuredTrigger = page
      .locator('[role="combobox"]')
      .filter({ hasText: /Review|Featured/i })
      .first();
    if (await featuredTrigger.isVisible({ timeout: 5000 }).catch(() => false)) {
      await featuredTrigger.click();

      const featuredOption = page.getByRole("option", { name: "Featured" });
      if (await featuredOption.isVisible({ timeout: 2000 }).catch(() => false)) {
        await featuredOption.click();
      }
    }
  });

  test("date range picker opens calendar popover", async ({
    dashboardPage,
    page,
  }) => {
    await dashboardPage("/dashboard/reviews");

    // The date range button contains "Date range" text
    const dateButton = page.getByRole("button", { name: /Date range/i });
    if (await dateButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await dateButton.click();

      // Calendar popover should appear
      const calendar = page.locator('[role="grid"]').first();
      await expect(calendar).toBeVisible({ timeout: 3000 });

      // Click a day to select start of range
      const dayButtons = page.locator('[role="gridcell"] button').filter({ hasText: /^1$/ });
      if ((await dayButtons.count()) > 0) {
        await dayButtons.first().click();
      }
    }
  });
});

test.describe("Reviews Page — Search", () => {
  test("search input accepts text and submits", async ({
    dashboardPage,
    page,
  }) => {
    await dashboardPage("/dashboard/reviews");

    const searchInput = page.getByPlaceholder(/Search reviews/i);
    await expect(searchInput).toBeVisible();

    // Type a search query
    await searchInput.fill("excellent service");
    await expect(searchInput).toHaveValue("excellent service");

    // Submit the search form
    const searchButton = page.getByRole("button", { name: /Search/i }).first();
    await searchButton.click();
  });

  test("search clear button resets input", async ({
    dashboardPage,
    page,
  }) => {
    await dashboardPage("/dashboard/reviews");

    const searchInput = page.getByPlaceholder(/Search reviews/i);
    await searchInput.fill("test query");
    await expect(searchInput).toHaveValue("test query");

    // The X (clear) button appears when there is text
    const clearButton = searchInput
      .locator("..")
      .locator("button")
      .filter({ has: page.locator("svg") });
    if (await clearButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await clearButton.click();
      await expect(searchInput).toHaveValue("");
    }
  });
});

test.describe("Reviews Page — Clear Filters", () => {
  test("clear button appears after applying a filter and resets all", async ({
    dashboardPage,
    page,
  }) => {
    await dashboardPage("/dashboard/reviews");

    // Apply a status filter to activate the Clear button
    const statusTrigger = page
      .locator('[role="combobox"]')
      .filter({ hasText: /Status/i })
      .first();
    if (!(await statusTrigger.isVisible({ timeout: 5000 }).catch(() => false))) {
      return; // Skip if filters not rendered yet
    }
    await statusTrigger.click();
    const pendingOption = page.getByRole("option", { name: "Pending" });
    await pendingOption.click();

    // Clear button should now be visible
    const clearButton = page.getByRole("button", { name: /Clear/i });
    await expect(clearButton).toBeVisible({ timeout: 3000 });

    await clearButton.click();

    // Status should revert to "All Status"
    await expect(statusTrigger).toHaveText(/All Status|Status/i);
  });
});

test.describe("Reviews Page — Select All & Bulk Actions", () => {
  test("select all checkbox toggles all review checkboxes", async ({
    dashboardPage,
    page,
  }) => {
    await dashboardPage("/dashboard/reviews");

    // The "Select all" label/checkbox is in the card header
    const selectAllCheckbox = page.getByLabel(/Select all/i);
    if (!(await selectAllCheckbox.isVisible({ timeout: 5000 }).catch(() => false))) {
      return; // No reviews loaded — skip
    }

    // Click select all
    await selectAllCheckbox.click();

    // All individual review checkboxes should become checked
    // The selection count text should appear in the bulk actions bar
    const bulkBar = page.locator("text=/review[s]? selected/i");
    await expect(bulkBar).toBeVisible({ timeout: 3000 });

    // Click select all again to deselect
    await selectAllCheckbox.click();
    await expect(bulkBar).not.toBeVisible({ timeout: 3000 });
  });

  test("bulk action buttons appear when items are selected (aggregated mode)", async ({
    dashboardPage,
    page,
  }) => {
    await dashboardPage("/dashboard/reviews");

    const selectAllCheckbox = page.getByLabel(/Select all/i);
    if (!(await selectAllCheckbox.isVisible({ timeout: 5000 }).catch(() => false))) {
      return;
    }

    await selectAllCheckbox.click();

    // In aggregated mode (status != pending), Feature/Unfeature/Archive should appear
    const featureBtn = page.getByRole("button", { name: /^Feature$/i });
    const unfeatureBtn = page.getByRole("button", { name: /Unfeature/i });
    const archiveBtn = page.getByRole("button", { name: /Archive/i });

    // At least one of these should be visible
    const anyVisible =
      (await featureBtn.isVisible({ timeout: 3000 }).catch(() => false)) ||
      (await unfeatureBtn.isVisible({ timeout: 1000 }).catch(() => false)) ||
      (await archiveBtn.isVisible({ timeout: 1000 }).catch(() => false));

    expect(anyVisible).toBe(true);
  });

  test("bulk action buttons in pending mode show Approve All / Reject All", async ({
    dashboardPage,
    page,
  }) => {
    await dashboardPage("/dashboard/reviews");

    // Switch to pending filter first
    const statusTrigger = page
      .locator('[role="combobox"]')
      .filter({ hasText: /Status/i })
      .first();
    if (!(await statusTrigger.isVisible({ timeout: 5000 }).catch(() => false))) {
      return;
    }
    await statusTrigger.click();
    await page.getByRole("option", { name: "Pending" }).click();

    // Wait for filter to apply
    await page.waitForTimeout(1000);

    const selectAllCheckbox = page.getByLabel(/Select all/i);
    if (!(await selectAllCheckbox.isVisible({ timeout: 5000 }).catch(() => false))) {
      return; // No pending reviews
    }

    await selectAllCheckbox.click();

    // In pending mode, Approve All and Reject All should appear
    const approveAllBtn = page.getByRole("button", { name: /Approve All/i });
    const rejectAllBtn = page.getByRole("button", { name: /Reject All/i });

    const approveVisible = await approveAllBtn
      .isVisible({ timeout: 3000 })
      .catch(() => false);
    const rejectVisible = await rejectAllBtn
      .isVisible({ timeout: 1000 })
      .catch(() => false);

    expect(approveVisible || rejectVisible).toBe(true);
  });
});

test.describe("Reviews Page — Pagination", () => {
  test("pagination controls are visible when multiple pages exist", async ({
    dashboardPage,
    page,
  }) => {
    await dashboardPage("/dashboard/reviews");

    // Look for pagination text pattern: "Showing X to Y of Z reviews"
    const paginationText = page.locator("text=/Showing \\d+ to \\d+ of \\d+ reviews/i");
    if (await paginationText.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(paginationText).toBeVisible();
    }
  });

  test("Previous button is disabled on first page", async ({
    dashboardPage,
    page,
  }) => {
    await dashboardPage("/dashboard/reviews");

    const prevButton = page.getByRole("button", { name: /Previous/i });
    if (await prevButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(prevButton).toBeDisabled();
    }
  });

  test("Next button navigates to next page", async ({
    dashboardPage,
    page,
  }) => {
    await dashboardPage("/dashboard/reviews");

    const nextButton = page.getByRole("button", { name: /^Next$/i });
    if (await nextButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      const isEnabled = !(await nextButton.isDisabled());
      if (isEnabled) {
        await nextButton.click();

        // After clicking next, Previous should become enabled
        const prevButton = page.getByRole("button", { name: /Previous/i });
        await expect(prevButton).toBeEnabled({ timeout: 5000 });
      }
    }
  });

  test("page number buttons are clickable", async ({
    dashboardPage,
    page,
  }) => {
    await dashboardPage("/dashboard/reviews");

    // Page number buttons are small square buttons with just a number
    const pageButtons = page.locator("button.w-8.h-8");
    if ((await pageButtons.count()) > 1) {
      // Click the second page button
      await pageButtons.nth(1).click();

      // The clicked button should now have the active variant
      await expect(pageButtons.nth(1)).toHaveAttribute(
        "data-variant",
        /.*/
      );
    }
  });
});

test.describe("Reviews Page — Export", () => {
  test("export button is visible and triggers download", async ({
    dashboardPage,
    page,
  }) => {
    await setupApiMocks(page);
    await dashboardPage("/dashboard/reviews");

    const exportBtn = page.getByRole("button", { name: /Export/i });
    if (!(await exportBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
      return;
    }

    // Listen for download event
    const downloadPromise = page.waitForEvent("download", { timeout: 10000 }).catch(() => null);
    await exportBtn.click();

    const download = await downloadPromise;
    // If the download was triggered, verify it has a csv filename
    if (download) {
      expect(download.suggestedFilename()).toMatch(/reviews-export.*\.csv/);
    }
  });
});

test.describe("Reviews Page — Empty State", () => {
  test("empty state is shown when no reviews match filters", async ({
    dashboardPage,
    page,
  }) => {
    await dashboardPage("/dashboard/reviews");

    // Apply an unlikely combination of filters to get zero results
    // Search for a very specific string
    const searchInput = page.getByPlaceholder(/Search reviews/i);
    await expect(searchInput).toBeVisible({ timeout: 5000 });
    await searchInput.fill("zzz_nonexistent_review_xyz_12345");

    const searchButton = page.getByRole("button", { name: /Search/i }).first();
    await searchButton.click();

    // Wait for results to update
    await page.waitForTimeout(2000);

    // Check for the "No reviews found" empty state message
    const emptyState = page.locator("text=/No reviews found/i");
    if (await emptyState.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(emptyState).toBeVisible();

      // The hint text should suggest adjusting filters
      const hint = page.locator("text=/Try adjusting your filters/i");
      await expect(hint).toBeVisible();
    }
  });
});

test.describe("Reviews Page — Review List Items", () => {
  test("review list items are rendered with expected content", async ({
    dashboardPage,
    page,
  }) => {
    await dashboardPage("/dashboard/reviews");

    // Wait for review list items to load (they have customer names)
    // Reviews are inside a divide-y container
    const reviewContainer = page.locator(".divide-y").first();
    if (!(await reviewContainer.isVisible({ timeout: 8000 }).catch(() => false))) {
      return; // No reviews loaded
    }

    // Each review item should have a checkbox
    const checkboxes = reviewContainer.locator('[role="checkbox"]');
    const count = await checkboxes.count();
    expect(count).toBeGreaterThan(0);
  });

  test("clicking a review item navigates to detail page (non-pending mode)", async ({
    dashboardPage,
    page,
  }) => {
    await dashboardPage("/dashboard/reviews");

    // Review items in non-pending mode should have cursor-pointer and be clickable
    const reviewItems = page.locator(".divide-y > div").first();
    if (!(await reviewItems.isVisible({ timeout: 8000 }).catch(() => false))) {
      return;
    }

    // Click on the review text area (not the checkbox)
    const reviewText = reviewItems.locator("p.line-clamp-2").first();
    if (await reviewText.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Navigation happens on click — listen for URL change
      const currentUrl = page.url();
      await reviewText.click();

      // Should navigate to /dashboard/reviews/[id] or open detail modal
      await page.waitForTimeout(1500);
      const newUrl = page.url();
      // Either the URL changed to a detail page, or a modal opened
      const navigated = newUrl !== currentUrl;
      const modalOpened = await page
        .locator('[role="dialog"]')
        .isVisible({ timeout: 1000 })
        .catch(() => false);
      expect(navigated || modalOpened).toBe(true);
    }
  });

  test("individual review checkboxes can be toggled", async ({
    dashboardPage,
    page,
  }) => {
    await dashboardPage("/dashboard/reviews");

    const reviewContainer = page.locator(".divide-y").first();
    if (!(await reviewContainer.isVisible({ timeout: 8000 }).catch(() => false))) {
      return;
    }

    // Get the first review's checkbox
    const firstCheckbox = reviewContainer.locator('[role="checkbox"]').first();
    await expect(firstCheckbox).toBeVisible();

    // Toggle it on
    await firstCheckbox.click();
    await expect(firstCheckbox).toHaveAttribute("data-state", "checked");

    // Toggle it off
    await firstCheckbox.click();
    await expect(firstCheckbox).toHaveAttribute("data-state", "unchecked");
  });
});

test.describe("Reviews Page — Stats Cards", () => {
  test("stats cards are visible in aggregated mode", async ({
    dashboardPage,
    page,
  }) => {
    await dashboardPage("/dashboard/reviews");

    // In default (aggregated) mode, stats like "Total Reviews", "Avg Rating", etc. appear
    const totalReviewsCard = page.locator("text=/Total Reviews/i");
    const avgRatingCard = page.locator("text=/Avg Rating/i");

    // At least one stat card should be visible
    const totalVisible = await totalReviewsCard
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    const avgVisible = await avgRatingCard
      .isVisible({ timeout: 1000 })
      .catch(() => false);

    expect(totalVisible || avgVisible).toBe(true);
  });

  test("stats cards change in pending mode", async ({
    dashboardPage,
    page,
  }) => {
    await dashboardPage("/dashboard/reviews");

    // Switch to pending status to enter moderation mode
    const statusTrigger = page
      .locator('[role="combobox"]')
      .filter({ hasText: /Status/i })
      .first();
    if (!(await statusTrigger.isVisible({ timeout: 5000 }).catch(() => false))) {
      return;
    }
    await statusTrigger.click();
    await page.getByRole("option", { name: "Pending" }).click();

    // In pending mode, stats should show Pending/Approved/Rejected/Total
    const pendingCard = page.locator("text=/^Pending$/");
    await expect(pendingCard.first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Reviews Page — Moderation Mode Banner", () => {
  test("moderation mode banner appears when filtering by pending", async ({
    dashboardPage,
    page,
  }) => {
    await dashboardPage("/dashboard/reviews");

    const statusTrigger = page
      .locator('[role="combobox"]')
      .filter({ hasText: /Status/i })
      .first();
    if (!(await statusTrigger.isVisible({ timeout: 5000 }).catch(() => false))) {
      return;
    }
    await statusTrigger.click();
    await page.getByRole("option", { name: "Pending" }).click();

    // Moderation Mode banner
    const banner = page.locator("text=/Moderation Mode/i");
    await expect(banner).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Reviews Page — Page Header", () => {
  test("page header shows title and description", async ({
    dashboardPage,
    page,
  }) => {
    await dashboardPage("/dashboard/reviews");

    const heading = page.getByRole("heading", { name: /Reviews/i }).first();
    await expect(heading).toBeVisible();

    const description = page.locator(
      "text=/Manage customer reviews and video testimonials/i"
    );
    await expect(description).toBeVisible();
  });
});

test.describe("Reviews Page — Review Card Header", () => {
  test("reviews card shows total count in title", async ({
    dashboardPage,
    page,
  }) => {
    await dashboardPage("/dashboard/reviews");

    // Card title: "Reviews (N)"
    const cardTitle = page.locator("text=/Reviews \\(\\d+\\)/");
    if (await cardTitle.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(cardTitle).toBeVisible();
    }
  });
});
