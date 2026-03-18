/**
 * E2E interaction tests for the Settings section (/dashboard/settings).
 *
 * Covers main tab navigation, account sub-tabs, profile form editing,
 * password visibility toggles, timezone selection, API key tabs,
 * webhook sub-tab navigation, and form validation.
 */

import { test, expect } from "../helpers/dashboard-fixture";

test.use({ storageState: ".auth/enterprise-admin.json" });

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_PROFILE = {
  id: "user-001",
  email: "enterprise-admin@test.com",
  fullName: "Jane Admin",
  avatarUrl: null,
  bannerUrl: null,
  title: "VP of Operations",
  nmlsId: "123456",
  bio: "Experienced leader in customer experience.",
  phone: "(555) 987-6543",
  personalWebsiteUrl: "https://janeadmin.com",
  linkedinUrl: "https://linkedin.com/in/janeadmin",
  zillowProfileUrl: "",
  facebookUrl: "",
  instagramUrl: "",
  twitterUrl: "",
  timezone: "America/New_York",
  slug: "jane-admin",
  role: "admin",
  accountType: "enterprise",
  ctaButtonText: null,
  ctaButtonUrl: null,
  hireDate: null,
  industry: null,
};

const MOCK_API_KEYS = [
  {
    id: "key-1",
    name: "Production Key",
    prefix: "rw_live_abc",
    environment: "live",
    createdAt: "2025-12-01T00:00:00Z",
    lastUsedAt: "2026-03-10T12:00:00Z",
    expiresAt: null,
  },
  {
    id: "key-2",
    name: "Staging Key",
    prefix: "rw_test_xyz",
    environment: "test",
    createdAt: "2025-11-15T00:00:00Z",
    lastUsedAt: null,
    expiresAt: null,
  },
];

const MOCK_WEBHOOK_CONFIGS = [
  {
    id: "wh-1",
    url: "https://example.com/webhook",
    events: ["review.created"],
    active: true,
    createdAt: "2025-10-01T00:00:00Z",
  },
];

// ---------------------------------------------------------------------------
// Route interceptors applied before every test
// ---------------------------------------------------------------------------

async function setupMockRoutes(page: import("@playwright/test").Page) {
  // Profile / auth data
  await page.route("**/api/auth/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ user: MOCK_PROFILE, session: { id: "sess-1" } }),
    })
  );

  // Profile update
  await page.route("**/api/profile**", (route) => {
    if (route.request().method() === "GET") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_PROFILE),
      });
    }
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true }),
    });
  });

  // Password change
  await page.route("**/api/auth/change-password**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true }),
    })
  );

  // API keys
  await page.route("**/api/api-keys**", (route) => {
    if (route.request().method() === "GET") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: MOCK_API_KEYS }),
      });
    }
    // POST – create key
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          id: "key-new",
          name: "New Key",
          key: "rw_live_newkeyvalue",
          prefix: "rw_live_new",
          environment: "live",
        },
      }),
    });
  });

  // Webhook configs
  await page.route("**/api/webhooks**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, data: MOCK_WEBHOOK_CONFIGS }),
    })
  );

  // Webhook logs
  await page.route("**/api/webhook-logs**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, data: [] }),
    })
  );

  // Slug update
  await page.route("**/api/profile/slug**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true }),
    })
  );

  // Avatar / cover uploads
  await page.route("**/api/profile/avatar**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, url: "https://cdn.example.com/avatar.jpg" }),
    })
  );

  // Catch-all for Supabase RPC / server actions that go through Next.js
  await page.route("**/dashboard/settings**", (route) => {
    // Let page navigations through; only intercept fetch calls
    if (route.request().resourceType() === "document") {
      return route.continue();
    }
    return route.continue();
  });
}

// ---------------------------------------------------------------------------
// 1. Main tab switching
// ---------------------------------------------------------------------------

test.describe("Main tab navigation", () => {
  test("switches between Account, Integrations, API, and Webhooks tabs with URL params", async ({
    dashboardPage,
    page,
  }) => {
    await setupMockRoutes(page);
    await dashboardPage("/dashboard/settings");

    // Default tab should be Account
    const accountTab = page.getByRole("tab", { name: /Account/i });
    await expect(accountTab).toHaveAttribute("data-state", "active");

    // Switch to Integrations
    const integrationsTab = page.getByRole("tab", { name: /Integrations/i });
    await integrationsTab.click();
    await expect(integrationsTab).toHaveAttribute("data-state", "active");
    await expect(page).toHaveURL(/tab=integrations/);

    // Switch to API
    const apiTab = page.getByRole("tab", { name: /API/i });
    await apiTab.click();
    await expect(apiTab).toHaveAttribute("data-state", "active");
    await expect(page).toHaveURL(/tab=api/);

    // Switch to Webhooks
    const webhooksTab = page.getByRole("tab", { name: /Webhooks/i });
    await webhooksTab.click();
    await expect(webhooksTab).toHaveAttribute("data-state", "active");
    await expect(page).toHaveURL(/tab=webhooks/);
  });

  test("navigating directly to ?tab=api opens the API tab", async ({
    dashboardPage,
    page,
  }) => {
    await setupMockRoutes(page);
    await dashboardPage("/dashboard/settings?tab=api");

    const apiTab = page.getByRole("tab", { name: /API/i });
    await expect(apiTab).toHaveAttribute("data-state", "active");
  });

  test("navigating directly to ?tab=webhooks opens the Webhooks tab", async ({
    dashboardPage,
    page,
  }) => {
    await setupMockRoutes(page);
    await dashboardPage("/dashboard/settings?tab=webhooks");

    const webhooksTab = page.getByRole("tab", { name: /Webhooks/i });
    await expect(webhooksTab).toHaveAttribute("data-state", "active");
  });

  test("invalid tab param defaults to Account", async ({
    dashboardPage,
    page,
  }) => {
    await setupMockRoutes(page);
    await dashboardPage("/dashboard/settings?tab=nonexistent");

    const accountTab = page.getByRole("tab", { name: /Account/i });
    await expect(accountTab).toHaveAttribute("data-state", "active");
  });
});

// ---------------------------------------------------------------------------
// 2. Account sub-tab switching
// ---------------------------------------------------------------------------

test.describe("Account sub-tab navigation", () => {
  test("switches between Profile, Billing, Notifications, and Smart Links sub-tabs", async ({
    dashboardPage,
    page,
  }) => {
    await setupMockRoutes(page);
    await dashboardPage("/dashboard/settings");

    // Profile sub-tab should be active by default
    const profileBtn = page.getByRole("button", { name: /Profile/i }).first();
    await expect(profileBtn).toBeVisible();

    // Verify Profile content is shown
    await expect(page.getByText("Profile & Account")).toBeVisible();

    // Switch to Billing
    const billingBtn = page.getByRole("button", { name: /Billing/i });
    await billingBtn.click();
    await expect(page.getByText(/Billing/i).first()).toBeVisible();

    // Switch to Notifications
    const notificationsBtn = page.getByRole("button", { name: /Notifications/i });
    await notificationsBtn.click();
    await expect(notificationsBtn).toBeVisible();

    // Switch to Smart Links
    const smartLinksBtn = page.getByRole("button", { name: /Smart Links/i });
    await smartLinksBtn.click();
    await expect(smartLinksBtn).toBeVisible();

    // Switch back to Profile
    await profileBtn.click();
    await expect(page.getByText("Profile & Account")).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 3. Profile form — fill fields, unsaved changes indicator, Save button
// ---------------------------------------------------------------------------

test.describe("Profile form interactions", () => {
  test("editing a field shows unsaved changes indicator and enables Save button", async ({
    dashboardPage,
    page,
  }) => {
    await setupMockRoutes(page);
    await dashboardPage("/dashboard/settings");

    // Save button should be disabled initially (no changes)
    const saveBtn = page.getByRole("button", { name: /Save Changes/i });
    await expect(saveBtn).toBeDisabled();

    // "All changes saved" text should be visible
    await expect(page.getByText("All changes saved")).toBeVisible();

    // Edit the Full Name field
    const fullNameInput = page.locator("#fullName");
    await fullNameInput.clear();
    await fullNameInput.fill("Jane Updated Admin");

    // Now "unsaved changes" indicator should appear
    await expect(page.getByText("You have unsaved changes")).toBeVisible();

    // Save button should be enabled
    await expect(saveBtn).toBeEnabled();
  });

  test("can fill in Job Title, License Number, Phone, Website, and social fields", async ({
    dashboardPage,
    page,
  }) => {
    await setupMockRoutes(page);
    await dashboardPage("/dashboard/settings");

    // Job Title
    const titleInput = page.locator("#title");
    await titleInput.clear();
    await titleInput.fill("Senior Director");
    await expect(titleInput).toHaveValue("Senior Director");

    // License Number
    const nmlsInput = page.locator("#nmlsId");
    await nmlsInput.clear();
    await nmlsInput.fill("654321");
    await expect(nmlsInput).toHaveValue("654321");

    // Phone
    const phoneInput = page.locator("#phone");
    await phoneInput.clear();
    await phoneInput.fill("(555) 111-2222");
    await expect(phoneInput).toHaveValue("(555) 111-2222");

    // Website
    const websiteInput = page.locator("#personalWebsiteUrl");
    await websiteInput.clear();
    await websiteInput.fill("https://newsite.com");
    await expect(websiteInput).toHaveValue("https://newsite.com");

    // LinkedIn
    const linkedinInput = page.locator("#linkedinUrl");
    await linkedinInput.clear();
    await linkedinInput.fill("https://linkedin.com/in/newprofile");
    await expect(linkedinInput).toHaveValue("https://linkedin.com/in/newprofile");

    // Facebook
    const facebookInput = page.locator("#facebookUrl");
    await facebookInput.fill("https://facebook.com/janeadmin");
    await expect(facebookInput).toHaveValue("https://facebook.com/janeadmin");

    // Instagram
    const instagramInput = page.locator("#instagramUrl");
    await instagramInput.fill("https://instagram.com/janeadmin");
    await expect(instagramInput).toHaveValue("https://instagram.com/janeadmin");

    // X (Twitter)
    const twitterInput = page.locator("#twitterUrl");
    await twitterInput.fill("https://x.com/janeadmin");
    await expect(twitterInput).toHaveValue("https://x.com/janeadmin");

    // Save button should now be enabled
    await expect(page.getByRole("button", { name: /Save Changes/i })).toBeEnabled();
  });
});

// ---------------------------------------------------------------------------
// 4. Bio textarea character counter
// ---------------------------------------------------------------------------

test.describe("Bio character counter", () => {
  test("displays character count that updates as text is typed", async ({
    dashboardPage,
    page,
  }) => {
    await setupMockRoutes(page);
    await dashboardPage("/dashboard/settings");

    const bioTextarea = page.locator("#bio");

    // Clear and verify counter resets
    await bioTextarea.clear();
    await expect(page.getByText("0/500")).toBeVisible();

    // Type some text
    await bioTextarea.fill("Hello world");
    await expect(page.getByText("11/500")).toBeVisible();

    // Type a longer string
    const longText = "A".repeat(100);
    await bioTextarea.clear();
    await bioTextarea.fill(longText);
    await expect(page.getByText("100/500")).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 5. Password show/hide toggles
// ---------------------------------------------------------------------------

test.describe("Password visibility toggles", () => {
  test("current password toggle switches between password and text input types", async ({
    dashboardPage,
    page,
  }) => {
    await setupMockRoutes(page);
    await dashboardPage("/dashboard/settings");

    // Scroll to the password form
    const currentPwInput = page.locator("#currentPassword");
    await currentPwInput.scrollIntoViewIfNeeded();

    // Initially should be password type
    await expect(currentPwInput).toHaveAttribute("type", "password");

    // Click the eye toggle (the button next to the input)
    const currentPwToggle = currentPwInput
      .locator("..")
      .getByRole("button");
    await currentPwToggle.click();

    // Should now be text type
    await expect(currentPwInput).toHaveAttribute("type", "text");

    // Click again to hide
    await currentPwToggle.click();
    await expect(currentPwInput).toHaveAttribute("type", "password");
  });

  test("new password toggle works independently", async ({
    dashboardPage,
    page,
  }) => {
    await setupMockRoutes(page);
    await dashboardPage("/dashboard/settings");

    const newPwInput = page.locator("#newPassword");
    await newPwInput.scrollIntoViewIfNeeded();

    await expect(newPwInput).toHaveAttribute("type", "password");

    const newPwToggle = newPwInput.locator("..").getByRole("button");
    await newPwToggle.click();
    await expect(newPwInput).toHaveAttribute("type", "text");

    await newPwToggle.click();
    await expect(newPwInput).toHaveAttribute("type", "password");
  });

  test("confirm password toggle works independently", async ({
    dashboardPage,
    page,
  }) => {
    await setupMockRoutes(page);
    await dashboardPage("/dashboard/settings");

    const confirmPwInput = page.locator("#confirmPassword");
    await confirmPwInput.scrollIntoViewIfNeeded();

    await expect(confirmPwInput).toHaveAttribute("type", "password");

    const confirmPwToggle = confirmPwInput.locator("..").getByRole("button");
    await confirmPwToggle.click();
    await expect(confirmPwInput).toHaveAttribute("type", "text");

    await confirmPwToggle.click();
    await expect(confirmPwInput).toHaveAttribute("type", "password");
  });
});

// ---------------------------------------------------------------------------
// 6. Change password form validation
// ---------------------------------------------------------------------------

test.describe("Change password form validation", () => {
  test("shows error when submitting with empty fields", async ({
    dashboardPage,
    page,
  }) => {
    await setupMockRoutes(page);
    await dashboardPage("/dashboard/settings");

    const updatePwBtn = page.getByRole("button", { name: /Update Password/i });
    await updatePwBtn.scrollIntoViewIfNeeded();
    await updatePwBtn.click();

    // Should show validation error for current password
    await expect(page.getByText("Current password is required")).toBeVisible();
  });

  test("shows error when new password is too short", async ({
    dashboardPage,
    page,
  }) => {
    await setupMockRoutes(page);
    await dashboardPage("/dashboard/settings");

    await page.locator("#currentPassword").fill("OldPassword1");
    await page.locator("#newPassword").fill("short");
    await page.locator("#confirmPassword").fill("short");

    await page.getByRole("button", { name: /Update Password/i }).click();

    await expect(
      page.getByText("Password must be at least 8 characters")
    ).toBeVisible();
  });

  test("shows error when new password lacks complexity requirements", async ({
    dashboardPage,
    page,
  }) => {
    await setupMockRoutes(page);
    await dashboardPage("/dashboard/settings");

    await page.locator("#currentPassword").fill("OldPassword1");
    await page.locator("#newPassword").fill("alllowercase1234");
    await page.locator("#confirmPassword").fill("alllowercase1234");

    await page.getByRole("button", { name: /Update Password/i }).click();

    await expect(
      page.getByText(/must contain at least one uppercase/i)
    ).toBeVisible();
  });

  test("shows error when passwords do not match", async ({
    dashboardPage,
    page,
  }) => {
    await setupMockRoutes(page);
    await dashboardPage("/dashboard/settings");

    await page.locator("#currentPassword").fill("OldPassword1");
    await page.locator("#newPassword").fill("NewPassword1");
    await page.locator("#confirmPassword").fill("DifferentPassword1");

    await page.getByRole("button", { name: /Update Password/i }).click();

    await expect(page.getByText("Passwords do not match")).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 7. Timezone selector
// ---------------------------------------------------------------------------

test.describe("Timezone selector", () => {
  test("opens dropdown and allows selecting a timezone option", async ({
    dashboardPage,
    page,
  }) => {
    await setupMockRoutes(page);
    await dashboardPage("/dashboard/settings");

    // Find and click the timezone select trigger
    const timezoneTrigger = page.locator("#timezone");
    await timezoneTrigger.scrollIntoViewIfNeeded();
    await timezoneTrigger.click();

    // Dropdown should show timezone options
    await expect(page.getByRole("option", { name: /Eastern Time/i })).toBeVisible();
    await expect(page.getByRole("option", { name: /Central Time/i })).toBeVisible();
    await expect(page.getByRole("option", { name: /Mountain Time/i })).toBeVisible();
    await expect(page.getByRole("option", { name: /Pacific Time/i })).toBeVisible();
    await expect(page.getByRole("option", { name: /Arizona/i })).toBeVisible();
    await expect(page.getByRole("option", { name: /Alaska Time/i })).toBeVisible();
    await expect(page.getByRole("option", { name: /Hawaii Time/i })).toBeVisible();

    // Select Pacific Time
    await page.getByRole("option", { name: /Pacific Time/i }).click();

    // Trigger should now show Pacific Time
    await expect(timezoneTrigger).toContainText("Pacific Time");

    // Form should reflect unsaved changes
    await expect(page.getByText("You have unsaved changes")).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 8. API tab — Live/Test key tabs
// ---------------------------------------------------------------------------

test.describe("API tab interactions", () => {
  test("switches between Live Keys and Test Keys tabs", async ({
    dashboardPage,
    page,
  }) => {
    await setupMockRoutes(page);
    await dashboardPage("/dashboard/settings?tab=api");

    // Wait for API tab content to load
    await expect(page.getByText("API Keys")).toBeVisible();

    // Live Keys tab should be active by default
    const liveTab = page.getByRole("tab", { name: /Live Keys/i });
    const testTab = page.getByRole("tab", { name: /Test Keys/i });

    await expect(liveTab).toHaveAttribute("data-state", "active");

    // Switch to Test Keys
    await testTab.click();
    await expect(testTab).toHaveAttribute("data-state", "active");
    await expect(liveTab).toHaveAttribute("data-state", "inactive");

    // Switch back to Live Keys
    await liveTab.click();
    await expect(liveTab).toHaveAttribute("data-state", "active");
  });

  test("displays the API overview hero card with key count", async ({
    dashboardPage,
    page,
  }) => {
    await setupMockRoutes(page);
    await dashboardPage("/dashboard/settings?tab=api");

    await expect(page.getByText("API Access")).toBeVisible();
    await expect(page.getByText(/Active Key/i)).toBeVisible();
  });

  test("Create API Key button is visible", async ({
    dashboardPage,
    page,
  }) => {
    await setupMockRoutes(page);
    await dashboardPage("/dashboard/settings?tab=api");

    // The CreateApiKeyDialog trigger should be visible
    await expect(
      page.getByRole("button", { name: /Create API Key/i }).first()
    ).toBeVisible();
  });

  test("quick actions sidebar contains expected items", async ({
    dashboardPage,
    page,
  }) => {
    await setupMockRoutes(page);
    await dashboardPage("/dashboard/settings?tab=api");

    await expect(page.getByText("Quick Actions")).toBeVisible();
    await expect(page.getByText("View Documentation")).toBeVisible();
    await expect(page.getByText("API Status")).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 9. Webhooks sub-tab navigation
// ---------------------------------------------------------------------------

test.describe("Webhooks sub-tab navigation", () => {
  test("switches between Configurations, Encompass, Test, Logs, and Docs sub-tabs", async ({
    dashboardPage,
    page,
  }) => {
    await setupMockRoutes(page);
    await dashboardPage("/dashboard/settings?tab=webhooks");

    // Wait for webhooks content
    await expect(page.getByText("Webhooks").first()).toBeVisible();

    // Configurations should be active by default
    const configBtn = page.getByRole("tab", { name: /Configurations/i });
    await expect(configBtn).toHaveAttribute("aria-selected", "true");

    // Switch to Encompass
    const encompassBtn = page.getByRole("tab", { name: /Encompass/i });
    await encompassBtn.click();
    await expect(encompassBtn).toHaveAttribute("aria-selected", "true");

    // Switch to Test
    const testBtn = page.getByRole("tab", { name: /Test/i });
    await testBtn.click();
    await expect(testBtn).toHaveAttribute("aria-selected", "true");

    // Switch to Logs
    const logsBtn = page.getByRole("tab", { name: /Logs/i });
    await logsBtn.click();
    await expect(logsBtn).toHaveAttribute("aria-selected", "true");

    // Switch to Docs
    const docsBtn = page.getByRole("tab", { name: /Docs/i });
    await docsBtn.click();
    await expect(docsBtn).toHaveAttribute("aria-selected", "true");
  });
});

// ---------------------------------------------------------------------------
// 10. Profile form fields are pre-populated with existing data
// ---------------------------------------------------------------------------

test.describe("Profile form pre-population", () => {
  test("form fields are populated with the user profile data", async ({
    dashboardPage,
    page,
  }) => {
    await setupMockRoutes(page);
    await dashboardPage("/dashboard/settings");

    // Full Name
    await expect(page.locator("#fullName")).toHaveValue("Jane Admin");

    // Email (disabled)
    await expect(page.locator("#email")).toHaveValue("enterprise-admin@test.com");

    // Job Title
    await expect(page.locator("#title")).toHaveValue("VP of Operations");

    // License Number
    await expect(page.locator("#nmlsId")).toHaveValue("123456");

    // Bio
    await expect(page.locator("#bio")).toHaveValue(
      "Experienced leader in customer experience."
    );

    // Phone
    await expect(page.locator("#phone")).toHaveValue("(555) 987-6543");

    // Website
    await expect(page.locator("#personalWebsiteUrl")).toHaveValue(
      "https://janeadmin.com"
    );

    // LinkedIn
    await expect(page.locator("#linkedinUrl")).toHaveValue(
      "https://linkedin.com/in/janeadmin"
    );
  });
});

// ---------------------------------------------------------------------------
// 11. Disabled email field cannot be edited
// ---------------------------------------------------------------------------

test.describe("Disabled email field", () => {
  test("email input is disabled and cannot be edited", async ({
    dashboardPage,
    page,
  }) => {
    await setupMockRoutes(page);
    await dashboardPage("/dashboard/settings");

    const emailInput = page.locator("#email");

    // Verify it is disabled
    await expect(emailInput).toBeDisabled();

    // Verify it has the correct value
    await expect(emailInput).toHaveValue("enterprise-admin@test.com");

    // Verify helper text
    await expect(
      page.getByText("Contact support to change your email")
    ).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 12. Main tab returns to Account when switching back
// ---------------------------------------------------------------------------

test.describe("Tab persistence", () => {
  test("switching away from Account and back preserves the tab state", async ({
    dashboardPage,
    page,
  }) => {
    await setupMockRoutes(page);
    await dashboardPage("/dashboard/settings");

    // Go to API tab
    await page.getByRole("tab", { name: /API/i }).click();
    await expect(page).toHaveURL(/tab=api/);

    // Come back to Account
    await page.getByRole("tab", { name: /Account/i }).click();
    await expect(page).toHaveURL(/tab=account/);

    // Profile content should be visible again
    await expect(page.getByText("Profile & Account")).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 13. Organization-managed fields card for enterprise users
// ---------------------------------------------------------------------------

test.describe("Organization-managed fields", () => {
  test("enterprise users see admin-managed badge on organization fields", async ({
    dashboardPage,
    page,
  }) => {
    await setupMockRoutes(page);
    await dashboardPage("/dashboard/settings");

    // Enterprise admin should see the Organization-Managed Fields card
    await expect(
      page.getByText("Organization-Managed Fields")
    ).toBeVisible();
    await expect(page.getByText("Admin-managed")).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 14. Profile form — Full Name is required
// ---------------------------------------------------------------------------

test.describe("Profile form required fields", () => {
  test("clearing Full Name and submitting shows validation error", async ({
    dashboardPage,
    page,
  }) => {
    await setupMockRoutes(page);
    await dashboardPage("/dashboard/settings");

    const fullNameInput = page.locator("#fullName");
    await fullNameInput.clear();

    // Submit the form
    await page.getByRole("button", { name: /Save Changes/i }).click();

    // Should show a validation error (exact text depends on zod schema message)
    const errorMessages = page.locator(".text-destructive");
    await expect(errorMessages.first()).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 15. Security tip and quick actions in profile sidebar
// ---------------------------------------------------------------------------

test.describe("Profile sidebar", () => {
  test("quick actions and security tip are visible", async ({
    dashboardPage,
    page,
  }) => {
    await setupMockRoutes(page);
    await dashboardPage("/dashboard/settings");

    await expect(page.getByText("Quick Actions")).toBeVisible();
    await expect(page.getByText("Edit Profile")).toBeVisible();
    await expect(page.getByText("Change Password")).toBeVisible();
    await expect(page.getByText("Security Tip")).toBeVisible();
  });
});
