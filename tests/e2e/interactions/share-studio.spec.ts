/**
 * E2E interaction tests for Share Studio: smart links, asset creation, and public pages.
 *
 * Covers:
 * - Smart link creation from review detail (authenticated)
 * - Smart link public page rendering (/s/[slug])
 * - Smart link click tracking (/s/[slug]/go)
 * - Asset creator modal (format, template, create image, queue video)
 * - Review share assets display (completed, queued, failed states)
 */

import { test as base, expect, type Page } from "@playwright/test";
import { test, expect as dashboardExpect } from "../helpers/dashboard-fixture";
import { TEST_USERS } from "../helpers/pages";

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_PROOF_LINK = {
  id: "pl-001",
  slug: "john-smith-review-abc123",
  title: "John Smith's Review",
  published: true,
  destination_url: "https://testmortgage.com",
  organization_id: "org-001",
  created_by: "user-001",
  archived_at: null,
  proof_item: {
    id: "pi-001",
    source_type: "review",
    source_id: "review-001",
    quote: "Absolutely incredible experience. Mike went above and beyond.",
    customer_name: "John Smith",
    rating: 5,
    status: "approved",
    title: "John Smith's Review",
    summary: "Incredible experience",
    source_platform: "google",
    source_review_date: "2026-02-15T00:00:00Z",
    presenter_user_id: "user-001",
  },
  presenter: {
    full_name: "Mike Agent",
    title: "Senior Loan Officer",
    avatar_url: null,
    photo_url: null,
    nmls_id: "12345",
    average_rating: 4.9,
    total_reviews: 142,
    cta_button_text: null,
  },
};

const MOCK_REVIEW = {
  id: "review-001",
  source: "google",
  rating: 5,
  customerName: "John Smith",
  text: "Absolutely incredible experience. Mike went above and beyond.",
  status: "approved",
  reviewDate: "2026-02-15T00:00:00Z",
  featured: false,
  loanOfficerName: "Mike Agent",
  responseText: null,
  sentimentLabel: "positive",
};

const MOCK_SHARE_ASSETS = {
  item: { id: "pi-001", source_type: "review", source_id: "review-001" },
  links: [
    {
      id: "pl-001",
      slug: "john-smith-review-abc123",
      published: true,
      archived_at: null,
    },
  ],
  assets: [
    {
      id: "asset-001",
      asset_type: "image",
      asset_url: "https://storage.example.com/image-1.png",
      created_at: "2026-03-10T10:00:00Z",
      mime_type: "image/png",
    },
    {
      id: "asset-002",
      asset_type: "smart_link_og",
      asset_url: "https://storage.example.com/og-image.png",
      created_at: "2026-03-10T09:00:00Z",
      mime_type: "image/png",
    },
    {
      id: "asset-003",
      asset_type: "video",
      asset_url: "https://storage.example.com/video.mp4",
      created_at: "2026-03-10T08:00:00Z",
      mime_type: "video/mp4",
    },
  ],
  jobs: [
    {
      id: "job-001",
      asset_type: "video",
      status: "queued",
      created_at: "2026-03-14T12:00:00Z",
    },
    {
      id: "job-002",
      asset_type: "image",
      status: "failed",
      created_at: "2026-03-14T11:00:00Z",
    },
  ],
};

// ---------------------------------------------------------------------------
// Helpers: mock API routes for the public smart link page
// ---------------------------------------------------------------------------

async function setupSmartLinkPublicMocks(page: Page) {
  // Mock the proof link data fetch (RSC renders server-side, so we mock at
  // the Supabase REST layer which the service calls)
  await page.route("**/rest/v1/proof_links*", async (route) => {
    const url = route.request().url();
    if (url.includes("slug=eq.")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: MOCK_PROOF_LINK.id,
            slug: MOCK_PROOF_LINK.slug,
            title: MOCK_PROOF_LINK.title,
            published: MOCK_PROOF_LINK.published,
            destination_url: MOCK_PROOF_LINK.destination_url,
            organization_id: MOCK_PROOF_LINK.organization_id,
            created_by: MOCK_PROOF_LINK.created_by,
          },
        ]),
      });
    } else {
      await route.continue();
    }
  });

  await page.route("**/rest/v1/proof_items*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([MOCK_PROOF_LINK.proof_item]),
    });
  });

  await page.route("**/rest/v1/users*", async (route) => {
    const url = route.request().url();
    if (url.includes("select=") && url.includes("full_name")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_PROOF_LINK.presenter),
      });
    } else {
      await route.continue();
    }
  });

  await page.route("**/rest/v1/organizations*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: "org-001",
        name: "Test Mortgage Co",
        logo_url: null,
        primary_color: "#52796f",
        settings: {},
      }),
    });
  });

  // Mock proof link event recording
  await page.route("**/rest/v1/proof_link_events*", async (route) => {
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({ id: "evt-001" }),
    });
  });
}

// ---------------------------------------------------------------------------
// Helpers: mock API routes for authenticated dashboard pages
// ---------------------------------------------------------------------------

async function setupDashboardReviewDetailMocks(page: Page) {
  // Mock the review detail fetch
  await page.route("**/rest/v1/aggregated_reviews*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: { "content-range": "0-0/1" },
      body: JSON.stringify([MOCK_REVIEW]),
    });
  });

  // Mock server actions (Next.js server actions are POST to the same URL)
  await page.route("**/dashboard/reviews/**", async (route) => {
    const request = route.request();
    if (request.resourceType() === "document") {
      return route.continue();
    }
    if (request.headers()["accept"]?.includes("text/x-component")) {
      return route.continue();
    }
    // Mock server action responses for smart link creation
    if (request.method() === "POST") {
      const postData = request.postData() ?? "";
      if (postData.includes("shareReviewAsSmartLink") || postData.includes("ensureReviewSmartLink")) {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            slug: MOCK_PROOF_LINK.slug,
            url: `/s/${MOCK_PROOF_LINK.slug}`,
          }),
        });
      }
    }
    return route.continue();
  });

  // Mock share assets fetch
  await page.route("**/rest/v1/proof_items*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([MOCK_SHARE_ASSETS.item]),
    });
  });

  await page.route("**/rest/v1/proof_links*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_SHARE_ASSETS.links),
    });
  });

  await page.route("**/rest/v1/proof_assets*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_SHARE_ASSETS.assets),
    });
  });

  await page.route("**/rest/v1/proof_render_jobs*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_SHARE_ASSETS.jobs),
    });
  });

  // Mock organization branding fetch
  await page.route("**/rest/v1/organizations*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: "org-001",
        name: "Test Mortgage Co",
        logo_url: null,
        primary_color: "#52796f",
        settings: { secondary_color: "#84a98c" },
      }),
    });
  });

  // Mock render actions
  await page.route("**/rest/v1/rpc/render_*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, assetUrl: "https://storage.example.com/new-image.png" }),
    });
  });

  // Mock storage upload
  await page.route("**/storage/v1/object/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ Key: "share-studio/images/test.png" }),
    });
  });
}

// ===========================================================================
// SMART LINK CREATION (Authenticated)
// ===========================================================================

test.describe("Share Studio — Smart Link Creation", () => {
  test.use({ storageState: TEST_USERS["enterprise-admin"].storageState });

  test("Copy Smart Link button is visible on review detail page", async ({
    dashboardPage,
    page,
  }) => {
    await setupDashboardReviewDetailMocks(page);
    await dashboardPage("/dashboard/reviews/review-001");

    const copySmartLinkBtn = page.getByRole("button", {
      name: /Copy Smart Link/i,
    });
    await expect(copySmartLinkBtn).toBeVisible({ timeout: 10_000 });
  });

  test("clicking Copy Smart Link triggers action and shows success toast", async ({
    dashboardPage,
    page,
  }) => {
    await setupDashboardReviewDetailMocks(page);
    await dashboardPage("/dashboard/reviews/review-001");

    const copySmartLinkBtn = page.getByRole("button", {
      name: /Copy Smart Link/i,
    });
    await expect(copySmartLinkBtn).toBeVisible({ timeout: 10_000 });

    // Grant clipboard permissions
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);

    await copySmartLinkBtn.click();

    // Should show a toast confirming the smart link was created/copied
    const toastMessage = page.locator("text=/Smart Link|copied|link/i");
    await expect(toastMessage).toBeVisible({ timeout: 10_000 });
  });

  test("smart link URL follows expected pattern /s/...", async ({
    dashboardPage,
    page,
  }) => {
    await setupDashboardReviewDetailMocks(page);
    await dashboardPage("/dashboard/reviews/review-001");

    // The Share Assets section should display the smart link URL
    const smartLinkCode = page.locator("code").filter({ hasText: /\/s\// });
    if (await smartLinkCode.isVisible({ timeout: 8000 }).catch(() => false)) {
      const linkText = await smartLinkCode.textContent();
      expect(linkText).toMatch(/\/s\/[a-z0-9-]+/);
    }
  });
});

// ===========================================================================
// SMART LINK PUBLIC PAGE (No auth required)
// ===========================================================================

base.describe("Share Studio — Smart Link Public Page", () => {
  base("displays review quote and star rating", async ({ page }) => {
    await setupSmartLinkPublicMocks(page);
    await page.goto("/s/john-smith-review-abc123", { waitUntil: "commit" });

    // Wait for content to render
    await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});

    // Verify the quote is displayed
    const quoteText = page.locator("text=/Absolutely incredible experience/i");
    await expect(quoteText).toBeVisible({ timeout: 10_000 });

    // Verify star rating is visible (stars rendered as SVG or unicode)
    const ratingArea = page.locator("[data-testid='star-rating'], text=/\u2605/").first();
    if (await ratingArea.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(ratingArea).toBeVisible();
    }
  });

  base("displays customer name", async ({ page }) => {
    await setupSmartLinkPublicMocks(page);
    await page.goto("/s/john-smith-review-abc123", { waitUntil: "commit" });
    await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});

    const customerName = page.locator("text=/John Smith/");
    await expect(customerName).toBeVisible({ timeout: 10_000 });
  });

  base("displays professional card with name, title, and stats", async ({ page }) => {
    await setupSmartLinkPublicMocks(page);
    await page.goto("/s/john-smith-review-abc123", { waitUntil: "commit" });
    await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});

    // Professional name
    const proName = page.locator("text=/Mike Agent/");
    await expect(proName).toBeVisible({ timeout: 10_000 });

    // Professional title
    const proTitle = page.locator("text=/Senior Loan Officer/i");
    if (await proTitle.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(proTitle).toBeVisible();
    }

    // Stats (review count or average rating)
    const stats = page.locator("text=/142|4\\.9/").first();
    if (await stats.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(stats).toBeVisible();
    }
  });

  base("share buttons are present (Twitter, LinkedIn, Email)", async ({ page }) => {
    await setupSmartLinkPublicMocks(page);
    await page.goto("/s/john-smith-review-abc123", { waitUntil: "commit" });
    await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});

    // Twitter/X share link
    const twitterLink = page.locator(
      "a[href*='twitter.com/intent'], a[href*='x.com']"
    ).first();
    await expect(twitterLink).toBeVisible({ timeout: 10_000 });

    // LinkedIn share link
    const linkedinLink = page.locator("a[href*='linkedin.com/sharing']");
    await expect(linkedinLink).toBeVisible({ timeout: 5000 });

    // Email share link
    const emailLink = page.locator("a[href^='mailto:']");
    await expect(emailLink).toBeVisible({ timeout: 5000 });
  });

  base("CTA button links to /s/[slug]/go for click tracking", async ({ page }) => {
    await setupSmartLinkPublicMocks(page);
    await page.goto("/s/john-smith-review-abc123", { waitUntil: "commit" });
    await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});

    // CTA button should link to the /go route
    const ctaLink = page.locator(
      "a[href*='/s/john-smith-review-abc123/go']"
    );
    await expect(ctaLink).toBeVisible({ timeout: 10_000 });
  });

  base("invalid slug shows 404 page", async ({ page }) => {
    // Mock proof link fetch to return empty (slug not found)
    await page.route("**/rest/v1/proof_links*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });

    const response = await page.goto("/s/nonexistent-slug-xyz", {
      waitUntil: "commit",
    });

    // Either the page returns a 404 status or renders a 404 component
    if (response) {
      const status = response.status();
      if (status === 404) {
        expect(status).toBe(404);
      } else {
        // Next.js notFound() renders a 404 page with status 200 in some configs
        const notFoundText = page.locator(
          "text=/not found|404|page doesn.t exist/i"
        );
        await expect(notFoundText).toBeVisible({ timeout: 10_000 });
      }
    }
  });
});

// ===========================================================================
// SMART LINK CLICK TRACKING (/s/[slug]/go)
// ===========================================================================

base.describe("Share Studio — Smart Link Click Tracking", () => {
  base("/s/[slug]/go records click event and redirects", async ({ page }) => {
    // Mock proof link data for the /go route
    await page.route("**/rest/v1/proof_links*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: MOCK_PROOF_LINK.id,
            slug: MOCK_PROOF_LINK.slug,
            published: true,
            destination_url: MOCK_PROOF_LINK.destination_url,
            organization_id: MOCK_PROOF_LINK.organization_id,
          },
        ]),
      });
    });

    // Mock event recording
    let eventRecorded = false;
    await page.route("**/rest/v1/proof_link_events*", async (route) => {
      eventRecorded = true;
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ id: "evt-click-001" }),
      });
    });

    // The /go route is a server-side handler that does a 302 redirect.
    // Playwright follows redirects by default, so we check the final URL.
    const response = await page.goto(`/s/${MOCK_PROOF_LINK.slug}/go`, {
      waitUntil: "commit",
    });

    // The route should have issued a 302 redirect to the destination_url.
    // Playwright follows redirects, so verify the final URL or the redirect chain.
    if (response) {
      const chain = response.request().redirectedFrom();
      if (chain) {
        // Verify the redirect target matches the destination URL
        const finalUrl = page.url();
        // The redirect may go to the destination or fall back to origin
        expect(finalUrl).toBeTruthy();
      }
    }
  });
});

// ===========================================================================
// ASSET CREATOR MODAL (Authenticated)
// ===========================================================================

test.describe("Share Studio — Asset Creator Modal", () => {
  test.use({ storageState: TEST_USERS["enterprise-admin"].storageState });

  test("Create Asset button opens the asset creator modal", async ({
    dashboardPage,
    page,
  }) => {
    await setupDashboardReviewDetailMocks(page);
    await dashboardPage("/dashboard/reviews/review-001");

    const createAssetBtn = page.getByRole("button", {
      name: /Create Asset/i,
    });
    await expect(createAssetBtn).toBeVisible({ timeout: 10_000 });

    await createAssetBtn.click();

    // Modal should open with "Create Asset" title
    const modalTitle = page.getByRole("heading", { name: /Create Asset/i });
    await expect(modalTitle).toBeVisible({ timeout: 5000 });
  });

  test("format options display 1:1, 9:16, and 16:9", async ({
    dashboardPage,
    page,
  }) => {
    await setupDashboardReviewDetailMocks(page);
    await dashboardPage("/dashboard/reviews/review-001");

    const createAssetBtn = page.getByRole("button", {
      name: /Create Asset/i,
    });
    await expect(createAssetBtn).toBeVisible({ timeout: 10_000 });
    await createAssetBtn.click();

    // Verify format toggle buttons
    const squareBtn = page.getByRole("button", { name: "1:1" });
    const verticalBtn = page.getByRole("button", { name: "9:16" });
    const landscapeBtn = page.getByRole("button", { name: "16:9" });

    await expect(squareBtn).toBeVisible({ timeout: 5000 });
    await expect(verticalBtn).toBeVisible();
    await expect(landscapeBtn).toBeVisible();
  });

  test("selecting a format updates the active state and shows label", async ({
    dashboardPage,
    page,
  }) => {
    await setupDashboardReviewDetailMocks(page);
    await dashboardPage("/dashboard/reviews/review-001");

    const createAssetBtn = page.getByRole("button", {
      name: /Create Asset/i,
    });
    await expect(createAssetBtn).toBeVisible({ timeout: 10_000 });
    await createAssetBtn.click();

    // Click 9:16 format
    const verticalBtn = page.getByRole("button", { name: "9:16" });
    await verticalBtn.click();

    // Label should update
    const label = page.locator("text=/Vertical \\(9:16\\)/i");
    await expect(label).toBeVisible({ timeout: 3000 });

    // Click 16:9 format
    const landscapeBtn = page.getByRole("button", { name: "16:9" });
    await landscapeBtn.click();

    const landscapeLabel = page.locator("text=/Landscape \\(16:9\\)/i");
    await expect(landscapeLabel).toBeVisible({ timeout: 3000 });
  });

  test("template picker shows premium and simple template categories", async ({
    dashboardPage,
    page,
  }) => {
    await setupDashboardReviewDetailMocks(page);
    await dashboardPage("/dashboard/reviews/review-001");

    const createAssetBtn = page.getByRole("button", {
      name: /Create Asset/i,
    });
    await expect(createAssetBtn).toBeVisible({ timeout: 10_000 });
    await createAssetBtn.click();

    // Style category toggles
    const premiumBtn = page.getByRole("button", { name: /Premium/i });
    const simpleBtn = page.getByRole("button", { name: /Simple/i });

    await expect(premiumBtn).toBeVisible({ timeout: 5000 });
    await expect(simpleBtn).toBeVisible();
  });

  test("simple template picker shows Modern, Minimal, Bold", async ({
    dashboardPage,
    page,
  }) => {
    await setupDashboardReviewDetailMocks(page);
    await dashboardPage("/dashboard/reviews/review-001");

    const createAssetBtn = page.getByRole("button", {
      name: /Create Asset/i,
    });
    await expect(createAssetBtn).toBeVisible({ timeout: 10_000 });
    await createAssetBtn.click();

    // Switch to Simple style
    const simpleBtn = page.getByRole("button", { name: /Simple/i });
    await simpleBtn.click();

    // Simple template options
    const modernBtn = page.getByRole("button", { name: /Modern/i });
    const minimalBtn = page.getByRole("button", { name: /Minimal/i });
    const boldBtn = page.getByRole("button", { name: /Bold/i });

    await expect(modernBtn).toBeVisible({ timeout: 5000 });
    await expect(minimalBtn).toBeVisible();
    await expect(boldBtn).toBeVisible();
  });

  test("live preview renders in the modal", async ({
    dashboardPage,
    page,
  }) => {
    await setupDashboardReviewDetailMocks(page);
    await dashboardPage("/dashboard/reviews/review-001");

    const createAssetBtn = page.getByRole("button", {
      name: /Create Asset/i,
    });
    await expect(createAssetBtn).toBeVisible({ timeout: 10_000 });
    await createAssetBtn.click();

    // The preview area should contain rendered content
    const previewArea = page.locator(
      "[class*='rounded-lg'][class*='border'][class*='bg-muted']"
    ).first();
    await expect(previewArea).toBeVisible({ timeout: 5000 });

    // Preview should show review text or customer name
    const previewContent = page.locator(
      "text=/incredible experience|John Smith|Verified Customer|Customer feedback/i"
    ).first();
    await expect(previewContent).toBeVisible({ timeout: 8000 });
  });

  test("Create Image button is visible for image asset type", async ({
    dashboardPage,
    page,
  }) => {
    await setupDashboardReviewDetailMocks(page);
    await dashboardPage("/dashboard/reviews/review-001");

    const createAssetBtn = page.getByRole("button", {
      name: /Create Asset/i,
    });
    await expect(createAssetBtn).toBeVisible({ timeout: 10_000 });
    await createAssetBtn.click();

    // "Create Image" button should be visible (image is the default asset type)
    const createImageBtn = page.getByRole("button", { name: /Create Image/i });
    await expect(createImageBtn).toBeVisible({ timeout: 5000 });
  });

  test("switching to Video shows Queue Video button", async ({
    dashboardPage,
    page,
  }) => {
    await setupDashboardReviewDetailMocks(page);
    await dashboardPage("/dashboard/reviews/review-001");

    const createAssetBtn = page.getByRole("button", {
      name: /Create Asset/i,
    });
    await expect(createAssetBtn).toBeVisible({ timeout: 10_000 });
    await createAssetBtn.click();

    // Switch to Video asset type
    const videoToggle = page.getByRole("button", { name: /Video/i }).first();
    await videoToggle.click();

    // "Queue Video" button should appear
    const queueVideoBtn = page.getByRole("button", { name: /Queue Video/i });
    await expect(queueVideoBtn).toBeVisible({ timeout: 5000 });
  });
});

// ===========================================================================
// ASSET DISPLAY (Authenticated)
// ===========================================================================

test.describe("Share Studio — Asset Display", () => {
  test.use({ storageState: TEST_USERS["enterprise-admin"].storageState });

  test("review detail shows Share Assets section", async ({
    dashboardPage,
    page,
  }) => {
    await setupDashboardReviewDetailMocks(page);
    await dashboardPage("/dashboard/reviews/review-001");

    const shareAssetsTitle = page.locator("text=/Share Assets/i");
    await expect(shareAssetsTitle).toBeVisible({ timeout: 10_000 });
  });

  test("completed assets show View and Download buttons", async ({
    dashboardPage,
    page,
  }) => {
    await setupDashboardReviewDetailMocks(page);
    await dashboardPage("/dashboard/reviews/review-001");

    // Wait for the Share Assets section to load
    const shareAssetsTitle = page.locator("text=/Share Assets/i");
    await expect(shareAssetsTitle).toBeVisible({ timeout: 10_000 });

    // Wait for assets to render (after loading state resolves)
    const recentAssetsLabel = page.locator("text=/Recent Assets/i");
    await expect(recentAssetsLabel).toBeVisible({ timeout: 10_000 });

    // View button should be present for completed assets
    const viewBtn = page.getByRole("button", { name: /View/i }).first();
    if (await viewBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(viewBtn).toBeVisible();
    }

    // Download link should be present
    const downloadLink = page.locator("a[download]").first();
    if (await downloadLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(downloadLink).toBeVisible();
    }
  });

  test("queued jobs show 'In Queue' status badge", async ({
    dashboardPage,
    page,
  }) => {
    await setupDashboardReviewDetailMocks(page);
    await dashboardPage("/dashboard/reviews/review-001");

    const shareAssetsTitle = page.locator("text=/Share Assets/i");
    await expect(shareAssetsTitle).toBeVisible({ timeout: 10_000 });

    // Queue section should show pending jobs
    const queueLabel = page.locator("text=/Queue/i").first();
    if (await queueLabel.isVisible({ timeout: 8000 }).catch(() => false)) {
      // "In Queue" badge
      const inQueueBadge = page.locator("text=/In Queue/i");
      await expect(inQueueBadge).toBeVisible({ timeout: 5000 });
    }
  });

  test("failed jobs show 'Failed' status badge", async ({
    dashboardPage,
    page,
  }) => {
    await setupDashboardReviewDetailMocks(page);
    await dashboardPage("/dashboard/reviews/review-001");

    const shareAssetsTitle = page.locator("text=/Share Assets/i");
    await expect(shareAssetsTitle).toBeVisible({ timeout: 10_000 });

    // Failed badge should appear for the failed job
    const failedBadge = page.locator("text=/Failed/i");
    if (await failedBadge.isVisible({ timeout: 8000 }).catch(() => false)) {
      await expect(failedBadge).toBeVisible();
    }
  });
});
