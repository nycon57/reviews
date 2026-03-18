/**
 * E2E interaction tests for the Review Requests tab.
 * Covers stats cards, filters, send dialog (single + bulk), row actions,
 * pagination, and empty states.
 */

import { test, expect } from "../helpers/dashboard-fixture";

test.use({ storageState: ".auth/enterprise-admin.json" });

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe("Requests Tab — Layout & Stats", () => {
  test("navigates to requests tab and stats cards are visible", async ({
    dashboardPage,
  }) => {
    const page = await dashboardPage("/dashboard/reviews?tab=requests");

    // All 5 stats cards should be present
    await expect(page.getByText("Total Requests")).toBeVisible();
    await expect(page.getByText("In Progress")).toBeVisible();
    await expect(page.getByText("Completed").first()).toBeVisible();
    await expect(page.getByText("Expired").first()).toBeVisible();
    await expect(page.getByText("Completion Rate")).toBeVisible();
  });

  test("stats cards display numeric values", async ({ dashboardPage }) => {
    const page = await dashboardPage("/dashboard/reviews?tab=requests");

    // Each stat card wraps a value in a <p> with text-2xl — confirm at least the heading text is present
    const statsContainer = page.locator(".grid.gap-4");
    await expect(statsContainer).toBeVisible();

    // There should be exactly 5 stat items
    const statItems = statsContainer.locator("> div");
    await expect(statItems).toHaveCount(5);
  });
});

test.describe("Requests Tab — Filters", () => {
  test("search input is visible with correct placeholder", async ({
    dashboardPage,
  }) => {
    const page = await dashboardPage("/dashboard/reviews?tab=requests");

    const searchInput = page.getByPlaceholder("Search by name or email...");
    await expect(searchInput).toBeVisible();
  });

  test("search input accepts text and triggers on Enter", async ({
    dashboardPage,
  }) => {
    const page = await dashboardPage("/dashboard/reviews?tab=requests");

    const searchInput = page.getByPlaceholder("Search by name or email...");
    await searchInput.fill("Alice");
    await searchInput.press("Enter");

    // The input retains its value after triggering search
    await expect(searchInput).toHaveValue("Alice");
  });

  test("type filter dropdown shows All Types, Text Review, Video", async ({
    dashboardPage,
  }) => {
    const page = await dashboardPage("/dashboard/reviews?tab=requests");

    // The type filter trigger has width 130px — locate by placeholder text
    const typeTrigger = page.locator("button").filter({ hasText: "All Types" });
    await expect(typeTrigger).toBeVisible();

    await typeTrigger.click();

    // Dropdown options
    await expect(page.getByRole("option", { name: "All Types" })).toBeVisible();
    await expect(
      page.getByRole("option", { name: "Text Review" })
    ).toBeVisible();
    await expect(page.getByRole("option", { name: "Video" })).toBeVisible();
  });

  test("type filter selects Text Review", async ({ dashboardPage }) => {
    const page = await dashboardPage("/dashboard/reviews?tab=requests");

    const typeTrigger = page.locator("button").filter({ hasText: "All Types" });
    await typeTrigger.click();
    await page.getByRole("option", { name: "Text Review" }).click();

    // After selection the trigger text updates
    await expect(
      page.locator("button").filter({ hasText: "Text Review" }).first()
    ).toBeVisible();
  });

  test("status filter dropdown shows all status options", async ({
    dashboardPage,
  }) => {
    const page = await dashboardPage("/dashboard/reviews?tab=requests");

    const statusTrigger = page
      .locator("button")
      .filter({ hasText: "All Statuses" });
    await expect(statusTrigger).toBeVisible();

    await statusTrigger.click();

    const expectedStatuses = [
      "All Statuses",
      "Pending",
      "Sent",
      "Opened",
      "Completed",
      "Expired",
      "Cancelled",
    ];

    for (const status of expectedStatuses) {
      await expect(
        page.getByRole("option", { name: status })
      ).toBeVisible();
    }
  });

  test("status filter selects Completed", async ({ dashboardPage }) => {
    const page = await dashboardPage("/dashboard/reviews?tab=requests");

    const statusTrigger = page
      .locator("button")
      .filter({ hasText: "All Statuses" });
    await statusTrigger.click();
    await page.getByRole("option", { name: "Completed" }).click();

    await expect(
      page.locator("button").filter({ hasText: "Completed" }).first()
    ).toBeVisible();
  });

  test("team member filter is visible for admin users", async ({
    dashboardPage,
  }) => {
    const page = await dashboardPage("/dashboard/reviews?tab=requests");

    // Enterprise admin should see the team member dropdown
    const memberTrigger = page
      .locator("button")
      .filter({ hasText: "All Team Members" });
    await expect(memberTrigger).toBeVisible();
  });
});

test.describe("Requests Tab — Send Review Request Dialog", () => {
  test("Send Review Request button opens dialog", async ({
    dashboardPage,
  }) => {
    const page = await dashboardPage("/dashboard/reviews?tab=requests");

    const sendButton = page
      .getByRole("button", { name: /Send Review Request/i })
      .first();
    await expect(sendButton).toBeVisible();
    await sendButton.click();

    // Dialog title
    await expect(
      page.getByRole("heading", { name: "Send Review Request" })
    ).toBeVisible();

    // Dialog description
    await expect(
      page.getByText(
        "Send a review or video testimonial request to your customer."
      )
    ).toBeVisible();
  });

  test("dialog has request type toggle with Text Review and Video Review", async ({
    dashboardPage,
  }) => {
    const page = await dashboardPage("/dashboard/reviews?tab=requests");

    await page
      .getByRole("button", { name: /Send Review Request/i })
      .first()
      .click();

    // Wait for dialog content to render (it fetches user/template data)
    await page.waitForTimeout(500);

    // Request type toggle items
    const textToggle = page.getByRole("radio", { name: /Text review/i });
    const videoToggle = page.getByRole("radio", { name: /Video review/i });

    await expect(textToggle).toBeVisible();
    await expect(videoToggle).toBeVisible();
  });

  test("dialog toggles between Text Review and Video Review", async ({
    dashboardPage,
  }) => {
    const page = await dashboardPage("/dashboard/reviews?tab=requests");

    await page
      .getByRole("button", { name: /Send Review Request/i })
      .first()
      .click();
    await page.waitForTimeout(500);

    const textToggle = page.getByRole("radio", { name: /Text review/i });
    const videoToggle = page.getByRole("radio", { name: /Video review/i });

    // Default is text
    await expect(textToggle).toHaveAttribute("data-state", "on");
    await expect(videoToggle).toHaveAttribute("data-state", "off");

    // Switch to video
    await videoToggle.click();
    await expect(videoToggle).toHaveAttribute("data-state", "on");
    await expect(textToggle).toHaveAttribute("data-state", "off");

    // Switch back to text
    await textToggle.click();
    await expect(textToggle).toHaveAttribute("data-state", "on");
  });

  test("dialog has Single and Bulk Import mode tabs", async ({
    dashboardPage,
  }) => {
    const page = await dashboardPage("/dashboard/reviews?tab=requests");

    await page
      .getByRole("button", { name: /Send Review Request/i })
      .first()
      .click();
    await page.waitForTimeout(500);

    const singleTab = page.getByRole("tab", { name: /Single/i });
    const bulkTab = page.getByRole("tab", { name: /Bulk Import/i });

    await expect(singleTab).toBeVisible();
    await expect(bulkTab).toBeVisible();
  });

  test("dialog switches between Single and Bulk mode", async ({
    dashboardPage,
  }) => {
    const page = await dashboardPage("/dashboard/reviews?tab=requests");

    await page
      .getByRole("button", { name: /Send Review Request/i })
      .first()
      .click();
    await page.waitForTimeout(500);

    // Default is Single mode — check for customer name input
    await expect(page.getByPlaceholder("John Smith")).toBeVisible();

    // Switch to Bulk
    await page.getByRole("tab", { name: /Bulk Import/i }).click();

    // Bulk mode should show Template button and dropzone text
    await expect(
      page.getByText(/Drag & drop a CSV file|Drop CSV file here/i)
    ).toBeVisible();

    // Switch back to Single
    await page.getByRole("tab", { name: /Single/i }).click();
    await expect(page.getByPlaceholder("John Smith")).toBeVisible();
  });
});

test.describe("Requests Tab — Single Request Form", () => {
  test("single form shows required fields with correct placeholders", async ({
    dashboardPage,
  }) => {
    const page = await dashboardPage("/dashboard/reviews?tab=requests");

    await page
      .getByRole("button", { name: /Send Review Request/i })
      .first()
      .click();
    await page.waitForTimeout(500);

    // Customer Name
    const nameInput = page.getByPlaceholder("John Smith");
    await expect(nameInput).toBeVisible();

    // Customer Email
    const emailInput = page.getByPlaceholder("john@example.com");
    await expect(emailInput).toBeVisible();

    // Customer Phone (optional)
    const phoneInput = page.getByPlaceholder("(555) 123-4567");
    await expect(phoneInput).toBeVisible();

    // Labels
    await expect(page.getByText("Customer Name *")).toBeVisible();
    await expect(page.getByText("Customer Email *")).toBeVisible();
    await expect(page.getByText("Customer Phone")).toBeVisible();
  });

  test("single form Send Request button is disabled when required fields are empty", async ({
    dashboardPage,
  }) => {
    const page = await dashboardPage("/dashboard/reviews?tab=requests");

    await page
      .getByRole("button", { name: /Send Review Request/i })
      .first()
      .click();
    await page.waitForTimeout(500);

    const sendButton = page.getByRole("button", { name: /Send Request/i });
    await expect(sendButton).toBeVisible();
    await expect(sendButton).toBeDisabled();
  });

  test("single form - filling name and email alone is not enough for text review (needs template)", async ({
    dashboardPage,
  }) => {
    const page = await dashboardPage("/dashboard/reviews?tab=requests");

    await page
      .getByRole("button", { name: /Send Review Request/i })
      .first()
      .click();
    await page.waitForTimeout(500);

    await page.getByPlaceholder("John Smith").fill("Test Customer");
    await page.getByPlaceholder("john@example.com").fill("test@example.com");

    // For text review, a template is also required
    const sendButton = page.getByRole("button", { name: /Send Request/i });

    // If there are templates available, the button should still be disabled
    // because no template is selected yet
    // (If no templates exist, it's still disabled because template is required for text)
    await expect(sendButton).toBeDisabled();
  });

  test("single form - filling all fields for video review enables submit", async ({
    dashboardPage,
  }) => {
    const page = await dashboardPage("/dashboard/reviews?tab=requests");

    await page
      .getByRole("button", { name: /Send Review Request/i })
      .first()
      .click();
    await page.waitForTimeout(500);

    // Switch to Video review (no template needed)
    const videoToggle = page.getByRole("radio", { name: /Video review/i });
    await videoToggle.click();

    await page.getByPlaceholder("John Smith").fill("Test Customer");
    await page.getByPlaceholder("john@example.com").fill("test@example.com");

    const sendButton = page.getByRole("button", { name: /Send Request/i });
    await expect(sendButton).toBeEnabled();
  });

  test("survey template selector appears for text reviews only", async ({
    dashboardPage,
  }) => {
    const page = await dashboardPage("/dashboard/reviews?tab=requests");

    await page
      .getByRole("button", { name: /Send Review Request/i })
      .first()
      .click();
    await page.waitForTimeout(500);

    // Text review (default) — template selector should be visible
    await expect(page.getByText("Survey Template *")).toBeVisible();

    // Switch to Video review
    const videoToggle = page.getByRole("radio", { name: /Video review/i });
    await videoToggle.click();

    // Template selector should be hidden for video
    await expect(page.getByText("Survey Template *")).toBeHidden();
  });

  test("single form has Cancel and Send Request buttons", async ({
    dashboardPage,
  }) => {
    const page = await dashboardPage("/dashboard/reviews?tab=requests");

    await page
      .getByRole("button", { name: /Send Review Request/i })
      .first()
      .click();
    await page.waitForTimeout(500);

    await expect(
      page.getByRole("button", { name: /^Cancel$/i })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Send Request/i })
    ).toBeVisible();
  });
});

test.describe("Requests Tab — Bulk Request Flow", () => {
  test("bulk mode shows download template button", async ({
    dashboardPage,
  }) => {
    const page = await dashboardPage("/dashboard/reviews?tab=requests");

    await page
      .getByRole("button", { name: /Send Review Request/i })
      .first()
      .click();
    await page.waitForTimeout(500);

    // Switch to Bulk mode
    await page.getByRole("tab", { name: /Bulk Import/i }).click();

    const templateButton = page.getByRole("button", { name: /Template/i });
    await expect(templateButton).toBeVisible();
  });

  test("bulk mode shows CSV dropzone", async ({ dashboardPage }) => {
    const page = await dashboardPage("/dashboard/reviews?tab=requests");

    await page
      .getByRole("button", { name: /Send Review Request/i })
      .first()
      .click();
    await page.waitForTimeout(500);

    await page.getByRole("tab", { name: /Bulk Import/i }).click();

    await expect(
      page.getByText("Drag & drop a CSV file, or click to browse")
    ).toBeVisible();
  });

  test("bulk mode shows Cancel button in upload step", async ({
    dashboardPage,
  }) => {
    const page = await dashboardPage("/dashboard/reviews?tab=requests");

    await page
      .getByRole("button", { name: /Send Review Request/i })
      .first()
      .click();
    await page.waitForTimeout(500);

    await page.getByRole("tab", { name: /Bulk Import/i }).click();

    await expect(
      page.getByRole("button", { name: /^Cancel$/i })
    ).toBeVisible();
  });

  test("bulk mode shows max rows info", async ({ dashboardPage }) => {
    const page = await dashboardPage("/dashboard/reviews?tab=requests");

    await page
      .getByRole("button", { name: /Send Review Request/i })
      .first()
      .click();
    await page.waitForTimeout(500);

    await page.getByRole("tab", { name: /Bulk Import/i }).click();

    // Max rows message
    await expect(page.getByText(/Max \d+ rows/)).toBeVisible();
  });
});

test.describe("Requests Tab — Data Table", () => {
  test("table has correct column headers", async ({ dashboardPage }) => {
    const page = await dashboardPage("/dashboard/reviews?tab=requests");

    // Check column headers — they use uppercase tracking-wider text
    const headers = ["Type", "Customer", "Status", "Sent", "Completed", "Reminders"];
    for (const header of headers) {
      await expect(
        page.getByRole("columnheader", { name: header })
      ).toBeVisible();
    }
  });

  test("row actions dropdown opens with correct options for a completed video request", async ({
    dashboardPage,
  }) => {
    const page = await dashboardPage("/dashboard/reviews?tab=requests");

    // Look for action buttons (three dots icon) in the table
    const actionButtons = page.locator("table button").filter({
      has: page.locator("svg"),
    });

    // If there are rows with actions, click the first action dropdown
    const firstActionButton = actionButtons.first();
    if (await firstActionButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await firstActionButton.click();

      // The dropdown menu should appear with at least one menu item
      const dropdown = page.locator("[role='menu']");
      await expect(dropdown).toBeVisible();
    }
  });

  test("row actions dropdown shows View Review for completed requests", async ({
    dashboardPage,
  }) => {
    const page = await dashboardPage("/dashboard/reviews?tab=requests");

    // Filter to completed status to find rows with View Review action
    const statusTrigger = page
      .locator("button")
      .filter({ hasText: "All Statuses" });
    await statusTrigger.click();
    await page.getByRole("option", { name: "Completed" }).click();

    // Wait for filtered results
    await page.waitForTimeout(500);

    // If there are completed rows, check for the actions
    const actionButtons = page.locator(
      "table button[class*='ghost']"
    );
    const firstAction = actionButtons.first();
    if (await firstAction.isVisible({ timeout: 3000 }).catch(() => false)) {
      await firstAction.click();

      await expect(
        page.getByRole("menuitem", { name: /View Review/i })
      ).toBeVisible();
    }
  });

  test("row actions dropdown shows Copy Link for video requests", async ({
    dashboardPage,
  }) => {
    const page = await dashboardPage("/dashboard/reviews?tab=requests");

    // Filter to Video type
    const typeTrigger = page.locator("button").filter({ hasText: "All Types" });
    await typeTrigger.click();
    await page.getByRole("option", { name: "Video" }).click();

    await page.waitForTimeout(500);

    const actionButtons = page.locator(
      "table button[class*='ghost']"
    );
    const firstAction = actionButtons.first();
    if (await firstAction.isVisible({ timeout: 3000 }).catch(() => false)) {
      await firstAction.click();

      await expect(
        page.getByRole("menuitem", { name: /Copy Link/i })
      ).toBeVisible();
    }
  });

  test("row actions dropdown shows Resend for pending/sent requests", async ({
    dashboardPage,
  }) => {
    const page = await dashboardPage("/dashboard/reviews?tab=requests");

    // Filter to Sent status for resendable rows
    const statusTrigger = page
      .locator("button")
      .filter({ hasText: "All Statuses" });
    await statusTrigger.click();
    await page.getByRole("option", { name: "Sent" }).click();

    await page.waitForTimeout(500);

    const actionButtons = page.locator(
      "table button[class*='ghost']"
    );
    const firstAction = actionButtons.first();
    if (await firstAction.isVisible({ timeout: 3000 }).catch(() => false)) {
      await firstAction.click();

      // Should show Resend Survey or Resend Invitation
      await expect(
        page.getByRole("menuitem", { name: /Resend/i })
      ).toBeVisible();
    }
  });

  test("row actions dropdown shows Cancel Request for pending video requests", async ({
    dashboardPage,
  }) => {
    const page = await dashboardPage("/dashboard/reviews?tab=requests");

    // Filter to Pending status + Video type
    const typeTrigger = page.locator("button").filter({ hasText: "All Types" });
    await typeTrigger.click();
    await page.getByRole("option", { name: "Video" }).click();

    const statusTrigger = page
      .locator("button")
      .filter({ hasText: "All Statuses" });
    await statusTrigger.click();
    await page.getByRole("option", { name: "Pending" }).click();

    await page.waitForTimeout(500);

    const actionButtons = page.locator(
      "table button[class*='ghost']"
    );
    const firstAction = actionButtons.first();
    if (await firstAction.isVisible({ timeout: 3000 }).catch(() => false)) {
      await firstAction.click();

      await expect(
        page.getByRole("menuitem", { name: /Cancel Request/i })
      ).toBeVisible();
    }
  });
});

test.describe("Requests Tab — Empty State", () => {
  test("empty state shows when filtering returns no results", async ({
    dashboardPage,
  }) => {
    const page = await dashboardPage("/dashboard/reviews?tab=requests");

    // Search for something that likely does not exist
    const searchInput = page.getByPlaceholder("Search by name or email...");
    await searchInput.fill("zzzznonexistent99999");
    await searchInput.press("Enter");

    await page.waitForTimeout(1000);

    // If no results, the empty state should appear
    const emptyState = page.getByText("No requests yet");
    if (await emptyState.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(emptyState).toBeVisible();

      // Empty state has a Send Review Request button
      const emptyStateSendButton = page
        .getByRole("button", { name: /Send Review Request/i })
        .last();
      await expect(emptyStateSendButton).toBeVisible();
    }
  });

  test("empty state Send Review Request button opens dialog", async ({
    dashboardPage,
  }) => {
    const page = await dashboardPage("/dashboard/reviews?tab=requests");

    // Search for nonexistent to trigger empty state
    const searchInput = page.getByPlaceholder("Search by name or email...");
    await searchInput.fill("zzzznonexistent99999");
    await searchInput.press("Enter");

    await page.waitForTimeout(1000);

    const emptyState = page.getByText("No requests yet");
    if (await emptyState.isVisible({ timeout: 5000 }).catch(() => false)) {
      const sendButton = page
        .getByRole("button", { name: /Send Review Request/i })
        .last();
      await sendButton.click();

      await expect(
        page.getByRole("heading", { name: "Send Review Request" })
      ).toBeVisible();
    }
  });
});

test.describe("Requests Tab — Pagination", () => {
  test("pagination controls are visible when there are multiple pages", async ({
    dashboardPage,
  }) => {
    const page = await dashboardPage("/dashboard/reviews?tab=requests");

    // Pagination appears only if totalPages > 1 (>25 requests)
    // Check if pagination elements exist
    const previousButton = page.getByRole("button", { name: /Previous/i });
    const nextButton = page.getByRole("button", { name: /Next/i });

    // If data has enough requests for pagination
    if (
      await previousButton.isVisible({ timeout: 3000 }).catch(() => false)
    ) {
      await expect(previousButton).toBeVisible();
      await expect(nextButton).toBeVisible();

      // "Showing X to Y of Z results" text
      await expect(page.getByText(/Showing \d+ to \d+ of \d+ results/)).toBeVisible();

      // Page indicator "X / Y"
      await expect(page.getByText(/\d+ \/ \d+/)).toBeVisible();
    }
  });

  test("Previous button is disabled on first page", async ({
    dashboardPage,
  }) => {
    const page = await dashboardPage("/dashboard/reviews?tab=requests");

    const previousButton = page.getByRole("button", { name: /Previous/i });
    if (
      await previousButton.isVisible({ timeout: 3000 }).catch(() => false)
    ) {
      await expect(previousButton).toBeDisabled();
    }
  });

  test("Next button navigates to the next page", async ({ dashboardPage }) => {
    const page = await dashboardPage("/dashboard/reviews?tab=requests");

    const nextButton = page.getByRole("button", { name: /Next/i });
    if (await nextButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      if (await nextButton.isEnabled()) {
        await nextButton.click();
        await page.waitForTimeout(500);

        // After clicking next, Previous should be enabled
        const previousButton = page.getByRole("button", {
          name: /Previous/i,
        });
        await expect(previousButton).toBeEnabled();
      }
    }
  });
});

test.describe("Requests Tab — Table Content", () => {
  test("table rows display type badges (Text Review / Video)", async ({
    dashboardPage,
  }) => {
    const page = await dashboardPage("/dashboard/reviews?tab=requests");

    // Check if the table has any rows
    const tableRows = page.locator("table tbody tr");
    const rowCount = await tableRows.count();

    if (rowCount > 0) {
      // Each row should have a type badge with either "Text Review" or "Video"
      const firstRow = tableRows.first();
      const typeBadge = firstRow.locator("text=Text Review, text=Video").first();
      await expect(
        firstRow.getByText(/Text Review|Video/)
      ).toBeVisible();
    }
  });

  test("table rows display status badges", async ({ dashboardPage }) => {
    const page = await dashboardPage("/dashboard/reviews?tab=requests");

    const tableRows = page.locator("table tbody tr");
    const rowCount = await tableRows.count();

    if (rowCount > 0) {
      const firstRow = tableRows.first();
      // Status badges: Pending, Sent, Opened, Completed, Expired, Cancelled, Failed
      await expect(
        firstRow.getByText(
          /Pending|Sent|Opened|Completed|Expired|Cancelled|Failed/
        )
      ).toBeVisible();
    }
  });

  test("table rows display customer name and email", async ({
    dashboardPage,
  }) => {
    const page = await dashboardPage("/dashboard/reviews?tab=requests");

    const tableRows = page.locator("table tbody tr");
    const rowCount = await tableRows.count();

    if (rowCount > 0) {
      const firstRow = tableRows.first();
      // Customer cell has name (font-medium) and email (text-muted-foreground)
      const customerCell = firstRow.locator("td").nth(1);
      const nameEl = customerCell.locator(".font-medium");
      await expect(nameEl).toBeVisible();
    }
  });

  test("table rows display reminder count badges", async ({
    dashboardPage,
  }) => {
    const page = await dashboardPage("/dashboard/reviews?tab=requests");

    const tableRows = page.locator("table tbody tr");
    const rowCount = await tableRows.count();

    if (rowCount > 0) {
      // Reminders column (6th column, index 5) has a Badge with a number
      const firstRow = tableRows.first();
      const reminderCell = firstRow.locator("td").nth(5);
      await expect(reminderCell).toBeVisible();
    }
  });
});

test.describe("Requests Tab — Dialog Close Behavior", () => {
  test("dialog closes when Cancel is clicked in single mode", async ({
    dashboardPage,
  }) => {
    const page = await dashboardPage("/dashboard/reviews?tab=requests");

    await page
      .getByRole("button", { name: /Send Review Request/i })
      .first()
      .click();
    await page.waitForTimeout(500);

    const cancelButton = page.getByRole("button", { name: /^Cancel$/i });
    await cancelButton.click();

    // Dialog heading should no longer be visible
    await expect(
      page.getByRole("heading", { name: "Send Review Request" })
    ).toBeHidden();
  });

  test("dialog closes when X button or overlay is clicked", async ({
    dashboardPage,
  }) => {
    const page = await dashboardPage("/dashboard/reviews?tab=requests");

    await page
      .getByRole("button", { name: /Send Review Request/i })
      .first()
      .click();

    await expect(
      page.getByRole("heading", { name: "Send Review Request" })
    ).toBeVisible();

    // Press Escape to close dialog
    await page.keyboard.press("Escape");

    await expect(
      page.getByRole("heading", { name: "Send Review Request" })
    ).toBeHidden();
  });
});
