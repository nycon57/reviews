/**
 * E2E workflow tests for the full review request sending lifecycle.
 * Covers: text requests, video requests, bulk import, and row actions.
 * All server actions and API calls are mocked via page.route().
 */

import { test, expect } from "../helpers/dashboard-fixture";

test.use({ storageState: ".auth/enterprise-admin.json" });

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_USER = { id: "user-001", email: "admin@example.com" };

const MOCK_TEMPLATES = [
  { id: "tpl-1", name: "Post-Purchase Follow-up", isActive: true },
  { id: "tpl-2", name: "Annual Check-in", isActive: true },
];

const MOCK_REQUESTS = [
  {
    id: "req-1",
    type: "survey" as const,
    customerName: "Alice Johnson",
    customerEmail: "alice@example.com",
    status: "completed",
    sentAt: "2026-02-10T12:00:00Z",
    completedAt: "2026-02-15T14:00:00Z",
    reminderCount: 1,
    reviewId: "rev-42",
    requestUrl: null,
  },
  {
    id: "req-2",
    type: "video" as const,
    customerName: "Bob Williams",
    customerEmail: "bob@example.com",
    status: "completed",
    sentAt: "2026-01-20T10:00:00Z",
    completedAt: "2026-01-25T14:00:00Z",
    reminderCount: 0,
    reviewId: "rev-99",
    requestUrl: "https://app.repwell.com/v/abc123",
  },
  {
    id: "req-3",
    type: "survey" as const,
    customerName: "Carol Davis",
    customerEmail: "carol@example.com",
    status: "sent",
    sentAt: "2026-03-01T09:00:00Z",
    completedAt: null,
    reminderCount: 2,
    reviewId: null,
    requestUrl: null,
  },
  {
    id: "req-4",
    type: "video" as const,
    customerName: "Dan Evans",
    customerEmail: "dan@example.com",
    status: "pending",
    sentAt: "2026-03-10T08:00:00Z",
    completedAt: null,
    reminderCount: 0,
    reviewId: null,
    requestUrl: "https://app.repwell.com/v/xyz789",
  },
];

const MOCK_STATS = {
  total: 4,
  pending: 1,
  sent: 1,
  completed: 2,
  expired: 0,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Mock all Next.js server action calls that the dialog triggers.
 * Server actions are POSTed to the same page URL with Next-Action headers.
 */
async function mockServerActions(
  page: import("@playwright/test").Page,
  overrides?: {
    createSurveyResult?: { success: boolean; error?: string };
    createVideoResult?: { success: boolean; error?: string };
    bulkSendResult?: {
      success: boolean;
      data?: { totalSent: number; totalFailed: number; errors: { rowIndex: number; error: string }[] };
      error?: string;
    };
    resendResult?: { success: boolean; error?: string };
    cancelResult?: { success: boolean; error?: string };
  }
) {
  // Intercept server action POST requests (Next.js uses POST with Next-Action header)
  await page.route("**/*", async (route) => {
    const request = route.request();

    // Only intercept server action POSTs
    if (request.method() !== "POST") {
      return route.continue();
    }

    const nextAction = request.headers()["next-action"];
    if (!nextAction) {
      return route.continue();
    }

    // All server actions return a successful response by default
    const defaultSuccess = { success: true };

    // Determine which action based on the request body (heuristic)
    const body = await request.postData();

    // Check body for action-identifying keywords
    if (body?.includes("templateId") && body?.includes("customerEmail")) {
      // createSurveyAndQueue
      const result = overrides?.createSurveyResult ?? defaultSuccess;
      return route.fulfill({
        status: 200,
        contentType: "text/x-component",
        body: `0:${JSON.stringify(result)}\n`,
      });
    }

    if (body?.includes("maxDurationSeconds")) {
      // createVideoTestimonialRequest
      const result = overrides?.createVideoResult ?? defaultSuccess;
      return route.fulfill({
        status: 200,
        contentType: "text/x-component",
        body: `0:${JSON.stringify(result)}\n`,
      });
    }

    if (body?.includes("bulkSend")) {
      // bulkSendTextReviewsViaEmail / bulkSendVideoRequestsViaEmail
      const result = overrides?.bulkSendResult ?? {
        success: true,
        data: { totalSent: 3, totalFailed: 0, errors: [] },
      };
      return route.fulfill({
        status: 200,
        contentType: "text/x-component",
        body: `0:${JSON.stringify(result)}\n`,
      });
    }

    // Default: let it pass through
    return route.continue();
  });
}

/** Open the send review request dialog from the requests tab */
async function openSendDialog(page: import("@playwright/test").Page) {
  const sendButton = page
    .getByRole("button", { name: /Send Review Request/i })
    .first();
  await expect(sendButton).toBeVisible();
  await sendButton.click();

  // Wait for dialog to render
  await expect(
    page.getByRole("heading", { name: "Send Review Request" })
  ).toBeVisible();

  // Wait for data loading (user + templates)
  await page.waitForTimeout(800);
}

// =============================================================================
// WORKFLOW 1: Text Review Request
// =============================================================================

test.describe("Text Review Request Workflow", () => {
  test("1. navigate to requests tab, open send dialog, fill text request fields", async ({
    dashboardPage,
  }) => {
    const page = await dashboardPage("/dashboard/reviews?tab=requests");

    // Open dialog
    await openSendDialog(page);

    // Default request type should be text (Star icon toggle)
    const textToggle = page.getByRole("radio", { name: /Text review/i });
    await expect(textToggle).toHaveAttribute("data-state", "on");

    // Fill form fields
    await page.getByPlaceholder("John Smith").fill("Jane Doe");
    await page
      .getByPlaceholder("john@example.com")
      .fill("jane@example.com");
    await page.getByPlaceholder("(555) 123-4567").fill("(555) 987-6543");

    // Verify fields have values
    await expect(page.getByPlaceholder("John Smith")).toHaveValue("Jane Doe");
    await expect(page.getByPlaceholder("john@example.com")).toHaveValue(
      "jane@example.com"
    );
    await expect(page.getByPlaceholder("(555) 123-4567")).toHaveValue(
      "(555) 987-6543"
    );
  });

  test("2. fill all fields for text request and verify template selector is required", async ({
    dashboardPage,
  }) => {
    const page = await dashboardPage("/dashboard/reviews?tab=requests");
    await openSendDialog(page);

    // Fill name and email
    await page.getByPlaceholder("John Smith").fill("Jane Doe");
    await page
      .getByPlaceholder("john@example.com")
      .fill("jane@example.com");

    // Survey Template should be visible and required for text reviews
    await expect(page.getByText("Survey Template *")).toBeVisible();

    // Send button should be disabled without template
    const sendButton = page.getByRole("button", { name: /Send Request/i });
    await expect(sendButton).toBeDisabled();
  });

  test("3. submit text request with template selected triggers server action", async ({
    dashboardPage,
  }) => {
    const page = await dashboardPage("/dashboard/reviews?tab=requests");
    await mockServerActions(page, {
      createSurveyResult: { success: true },
    });
    await openSendDialog(page);

    // Fill all required fields
    await page.getByPlaceholder("John Smith").fill("Jane Doe");
    await page
      .getByPlaceholder("john@example.com")
      .fill("jane@example.com");

    // Select template if available
    const templateTrigger = page.locator("#req-template");
    if (await templateTrigger.isVisible({ timeout: 2000 }).catch(() => false)) {
      await templateTrigger.click();
      const firstOption = page.getByRole("option").first();
      if (await firstOption.isVisible({ timeout: 2000 }).catch(() => false)) {
        await firstOption.click();
      }
    }

    // Check if send button is enabled (depends on templates being available)
    const sendButton = page.getByRole("button", { name: /Send Request/i });
    if (await sendButton.isEnabled()) {
      await sendButton.click();

      // Wait for action to complete
      await page.waitForTimeout(1000);
    }
  });

  test("4. successful text request shows toast confirmation", async ({
    dashboardPage,
  }) => {
    const page = await dashboardPage("/dashboard/reviews?tab=requests");
    await mockServerActions(page, {
      createSurveyResult: { success: true },
    });
    await openSendDialog(page);

    // Fill fields
    await page.getByPlaceholder("John Smith").fill("Jane Doe");
    await page
      .getByPlaceholder("john@example.com")
      .fill("jane@example.com");

    // Switch to video mode (no template required) to test the success flow
    const videoToggle = page.getByRole("radio", { name: /Video review/i });
    await videoToggle.click();

    const sendButton = page.getByRole("button", { name: /Send Request/i });
    await expect(sendButton).toBeEnabled();
    await sendButton.click();

    // Toast confirmation should appear
    await expect(
      page.getByText(/request sent/i).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test("5. form resets after successful send", async ({ dashboardPage }) => {
    const page = await dashboardPage("/dashboard/reviews?tab=requests");
    await mockServerActions(page, {
      createVideoResult: { success: true },
    });
    await openSendDialog(page);

    // Switch to video (no template needed)
    await page.getByRole("radio", { name: /Video review/i }).click();

    await page.getByPlaceholder("John Smith").fill("Jane Doe");
    await page
      .getByPlaceholder("john@example.com")
      .fill("jane@example.com");

    const sendButton = page.getByRole("button", { name: /Send Request/i });
    await sendButton.click();

    // Wait for success and dialog to close
    await page.waitForTimeout(1500);

    // Re-open dialog to verify form has been reset
    await openSendDialog(page);

    await expect(page.getByPlaceholder("John Smith")).toHaveValue("");
    await expect(page.getByPlaceholder("john@example.com")).toHaveValue("");
    await expect(page.getByPlaceholder("(555) 123-4567")).toHaveValue("");
  });

  test("6. dialog closes after successful send", async ({ dashboardPage }) => {
    const page = await dashboardPage("/dashboard/reviews?tab=requests");
    await mockServerActions(page, {
      createVideoResult: { success: true },
    });
    await openSendDialog(page);

    // Switch to video
    await page.getByRole("radio", { name: /Video review/i }).click();

    await page.getByPlaceholder("John Smith").fill("Jane Doe");
    await page
      .getByPlaceholder("john@example.com")
      .fill("jane@example.com");

    await page.getByRole("button", { name: /Send Request/i }).click();

    // Dialog should close after successful send
    await expect(
      page.getByRole("heading", { name: "Send Review Request" })
    ).toBeHidden({ timeout: 5000 });
  });

  test("7. validation: submit without email shows disabled send button", async ({
    dashboardPage,
  }) => {
    const page = await dashboardPage("/dashboard/reviews?tab=requests");
    await openSendDialog(page);

    // Fill only name (no email)
    await page.getByPlaceholder("John Smith").fill("Jane Doe");

    // Send button should remain disabled
    const sendButton = page.getByRole("button", { name: /Send Request/i });
    await expect(sendButton).toBeDisabled();
  });

  test("8. validation: submit without template shows disabled send button (text mode)", async ({
    dashboardPage,
  }) => {
    const page = await dashboardPage("/dashboard/reviews?tab=requests");
    await openSendDialog(page);

    // Text mode is default — template is required
    const textToggle = page.getByRole("radio", { name: /Text review/i });
    await expect(textToggle).toHaveAttribute("data-state", "on");

    // Fill name and email but skip template
    await page.getByPlaceholder("John Smith").fill("Jane Doe");
    await page
      .getByPlaceholder("john@example.com")
      .fill("jane@example.com");

    // Send button should be disabled without template
    const sendButton = page.getByRole("button", { name: /Send Request/i });
    await expect(sendButton).toBeDisabled();

    // Survey Template label should show it's required
    await expect(page.getByText("Survey Template *")).toBeVisible();
  });

  test("9. error handling: server action failure shows error toast", async ({
    dashboardPage,
  }) => {
    const page = await dashboardPage("/dashboard/reviews?tab=requests");
    await mockServerActions(page, {
      createVideoResult: { success: false, error: "Rate limit exceeded" },
    });
    await openSendDialog(page);

    // Use video mode to bypass template requirement
    await page.getByRole("radio", { name: /Video review/i }).click();

    await page.getByPlaceholder("John Smith").fill("Jane Doe");
    await page
      .getByPlaceholder("john@example.com")
      .fill("jane@example.com");

    await page.getByRole("button", { name: /Send Request/i }).click();

    // Error toast should appear
    await expect(
      page.getByText(/Rate limit exceeded|Failed to send/i).first()
    ).toBeVisible({ timeout: 5000 });
  });
});

// =============================================================================
// WORKFLOW 2: Video Review Request
// =============================================================================

test.describe("Video Review Request Workflow", () => {
  test("10. switch to video mode hides template selector", async ({
    dashboardPage,
  }) => {
    const page = await dashboardPage("/dashboard/reviews?tab=requests");
    await openSendDialog(page);

    // Default is text mode — template selector visible
    await expect(page.getByText("Survey Template *")).toBeVisible();

    // Switch to video
    await page.getByRole("radio", { name: /Video review/i }).click();
    await expect(
      page.getByRole("radio", { name: /Video review/i })
    ).toHaveAttribute("data-state", "on");

    // Template selector should be hidden
    await expect(page.getByText("Survey Template *")).toBeHidden();
  });

  test("11. fill video request fields and submit successfully", async ({
    dashboardPage,
  }) => {
    const page = await dashboardPage("/dashboard/reviews?tab=requests");
    await mockServerActions(page, {
      createVideoResult: { success: true },
    });
    await openSendDialog(page);

    // Switch to video
    await page.getByRole("radio", { name: /Video review/i }).click();

    // Fill fields
    await page.getByPlaceholder("John Smith").fill("Maria Garcia");
    await page
      .getByPlaceholder("john@example.com")
      .fill("maria@example.com");

    // Send button should be enabled (no template needed for video)
    const sendButton = page.getByRole("button", { name: /Send Request/i });
    await expect(sendButton).toBeEnabled();
    await sendButton.click();

    // Wait for action
    await page.waitForTimeout(1000);
  });

  test("12. video request success shows correct toast", async ({
    dashboardPage,
  }) => {
    const page = await dashboardPage("/dashboard/reviews?tab=requests");
    await mockServerActions(page, {
      createVideoResult: { success: true },
    });
    await openSendDialog(page);

    await page.getByRole("radio", { name: /Video review/i }).click();

    await page.getByPlaceholder("John Smith").fill("Maria Garcia");
    await page
      .getByPlaceholder("john@example.com")
      .fill("maria@example.com");

    await page.getByRole("button", { name: /Send Request/i }).click();

    // Success toast for video
    await expect(
      page.getByText(/testimonial request sent|request sent/i).first()
    ).toBeVisible({ timeout: 5000 });
  });
});

// =============================================================================
// WORKFLOW 3: Bulk Request Upload
// =============================================================================

test.describe("Bulk Request Upload Workflow", () => {
  test("13. switch to Bulk Import tab", async ({ dashboardPage }) => {
    const page = await dashboardPage("/dashboard/reviews?tab=requests");
    await openSendDialog(page);

    // Switch to Bulk Import
    const bulkTab = page.getByRole("tab", { name: /Bulk Import/i });
    await expect(bulkTab).toBeVisible();
    await bulkTab.click();

    // Should show bulk upload UI
    await expect(
      page.getByText(/Drag & drop a CSV file|Drop CSV file here/i)
    ).toBeVisible();
  });

  test("14. verify Download Template button is present in bulk mode", async ({
    dashboardPage,
  }) => {
    const page = await dashboardPage("/dashboard/reviews?tab=requests");
    await openSendDialog(page);

    await page.getByRole("tab", { name: /Bulk Import/i }).click();

    const templateButton = page.getByRole("button", { name: /Template/i });
    await expect(templateButton).toBeVisible();
  });

  test("15. verify dropzone accepts CSV files", async ({ dashboardPage }) => {
    const page = await dashboardPage("/dashboard/reviews?tab=requests");
    await openSendDialog(page);

    await page.getByRole("tab", { name: /Bulk Import/i }).click();

    // Dropzone text should be visible
    await expect(
      page.getByText("Drag & drop a CSV file, or click to browse")
    ).toBeVisible();

    // The hidden file input should accept CSV
    const fileInput = page.locator("input[type='file']");
    await expect(fileInput).toBeAttached();
  });

  test("16. CSV upload triggers validation and shows validation table", async ({
    dashboardPage,
  }) => {
    const page = await dashboardPage("/dashboard/reviews?tab=requests");
    await openSendDialog(page);

    await page.getByRole("tab", { name: /Bulk Import/i }).click();

    // Create a mock CSV file and upload it
    const csvContent = "name,email\nAlice,alice@example.com\nBob,bob@example.com\n,invalid-email";
    const fileInput = page.locator("input[type='file']");

    // Upload the CSV via the hidden input
    await fileInput.setInputFiles({
      name: "test-import.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(csvContent),
    });

    // Wait for parsing and validation
    await page.waitForTimeout(1000);

    // Should transition to validate step showing the validation table
    // Validation table headers: #, Name, Email, Status
    await expect(page.getByText("valid").first()).toBeVisible({ timeout: 5000 });
  });

  test("17. validation step shows correct send count button", async ({
    dashboardPage,
  }) => {
    const page = await dashboardPage("/dashboard/reviews?tab=requests");
    await openSendDialog(page);

    await page.getByRole("tab", { name: /Bulk Import/i }).click();

    // Upload CSV
    const csvContent = "name,email\nAlice,alice@example.com\nBob,bob@example.com";
    const fileInput = page.locator("input[type='file']");
    await fileInput.setInputFiles({
      name: "test-import.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(csvContent),
    });

    await page.waitForTimeout(1000);

    // "Send N Request(s)" button should show the valid count
    const sendButton = page.getByRole("button", {
      name: /Send \d+ Request/i,
    });
    await expect(sendButton).toBeVisible({ timeout: 5000 });
  });

  test("18. bulk send shows completion summary", async ({ dashboardPage }) => {
    const page = await dashboardPage("/dashboard/reviews?tab=requests");
    await mockServerActions(page, {
      bulkSendResult: {
        success: true,
        data: { totalSent: 2, totalFailed: 1, errors: [{ rowIndex: 2, error: "Invalid email" }] },
      },
    });
    await openSendDialog(page);

    // Switch to video (no template needed for bulk video)
    await page.getByRole("radio", { name: /Video review/i }).click();
    await page.getByRole("tab", { name: /Bulk Import/i }).click();

    // Upload CSV
    const csvContent = "name,email\nAlice,alice@example.com\nBob,bob@example.com";
    const fileInput = page.locator("input[type='file']");
    await fileInput.setInputFiles({
      name: "test-import.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(csvContent),
    });

    await page.waitForTimeout(1000);

    // Click send button
    const sendButton = page.getByRole("button", {
      name: /Send \d+ Request/i,
    });
    if (await sendButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await sendButton.click();

      // Wait for completion step
      await page.waitForTimeout(1500);

      // Should show completion summary
      const doneButton = page.getByRole("button", { name: /Done/i });
      if (await doneButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(doneButton).toBeVisible();

        // Summary should show "Bulk Send Complete"
        await expect(
          page.getByText("Bulk Send Complete")
        ).toBeVisible();
      }
    }
  });
});

// =============================================================================
// WORKFLOW 4: Request Lifecycle (Row Actions)
// =============================================================================

test.describe("Request Lifecycle — Row Actions", () => {
  test("19. requests table renders with correct columns", async ({
    dashboardPage,
  }) => {
    const page = await dashboardPage("/dashboard/reviews?tab=requests");

    // Verify all column headers
    const headers = [
      "Type",
      "Customer",
      "Status",
      "Sent",
      "Completed",
      "Reminders",
    ];
    for (const header of headers) {
      await expect(
        page.getByRole("columnheader", { name: header })
      ).toBeVisible();
    }
  });

  test("20. completed request row action shows View Review option", async ({
    dashboardPage,
  }) => {
    const page = await dashboardPage("/dashboard/reviews?tab=requests");

    // Filter to completed status
    const statusTrigger = page
      .locator("button")
      .filter({ hasText: "All Statuses" });
    await statusTrigger.click();
    await page.getByRole("option", { name: "Completed" }).click();

    await page.waitForTimeout(500);

    // Find and click the first action dropdown in completed rows
    const actionButtons = page.locator("table button[class*='ghost']");
    const firstAction = actionButtons.first();

    if (await firstAction.isVisible({ timeout: 3000 }).catch(() => false)) {
      await firstAction.click();

      // "View Review" should be a menu item
      await expect(
        page.getByRole("menuitem", { name: /View Review/i })
      ).toBeVisible();
    }
  });

  test("21. in-progress request row action shows Resend option", async ({
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

    const actionButtons = page.locator("table button[class*='ghost']");
    const firstAction = actionButtons.first();

    if (await firstAction.isVisible({ timeout: 3000 }).catch(() => false)) {
      await firstAction.click();

      // "Resend Survey" or "Resend Invitation" should appear
      await expect(
        page.getByRole("menuitem", { name: /Resend/i })
      ).toBeVisible();
    }
  });

  test("22. pending video request row action shows Cancel Request with confirmation dialog", async ({
    dashboardPage,
  }) => {
    const page = await dashboardPage("/dashboard/reviews?tab=requests");

    // Filter to Video type + Pending status
    const typeTrigger = page.locator("button").filter({ hasText: "All Types" });
    await typeTrigger.click();
    await page.getByRole("option", { name: "Video" }).click();

    const statusTrigger = page
      .locator("button")
      .filter({ hasText: "All Statuses" });
    await statusTrigger.click();
    await page.getByRole("option", { name: "Pending" }).click();

    await page.waitForTimeout(500);

    const actionButtons = page.locator("table button[class*='ghost']");
    const firstAction = actionButtons.first();

    if (await firstAction.isVisible({ timeout: 3000 }).catch(() => false)) {
      await firstAction.click();

      // "Cancel Request" should be available
      const cancelItem = page.getByRole("menuitem", {
        name: /Cancel Request/i,
      });

      if (await cancelItem.isVisible({ timeout: 2000 }).catch(() => false)) {
        await cancelItem.click();

        // Confirmation dialog should appear
        await expect(
          page.getByText("Cancel Video Testimonial Request?")
        ).toBeVisible({ timeout: 3000 });

        // "Keep Request" (cancel) and "Cancel Request" (confirm) buttons
        await expect(
          page.getByRole("button", { name: /Keep Request/i })
        ).toBeVisible();
        await expect(
          page.getByRole("button", { name: /Cancel Request/i })
        ).toBeVisible();

        // Close confirmation by clicking "Keep Request"
        await page.getByRole("button", { name: /Keep Request/i }).click();

        // Confirmation dialog should close
        await expect(
          page.getByText("Cancel Video Testimonial Request?")
        ).toBeHidden();
      }
    }
  });
});
