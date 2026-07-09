import { test, expect } from "@playwright/test";
import {
  closeGoldenDb,
  findUserByEmail,
  getOnboardingStatusForEmail,
  type UserRow,
} from "../helpers/golden-data";

test.setTimeout(60_000);

test.afterAll(async () => {
  await closeGoldenDb();
});

test("fresh signup creates an account, completes non-Stripe onboarding, and reaches dashboard", async ({
  page,
}, testInfo) => {
  // INCIDENT GUARD (2026-07-08): driving the real signup form makes Supabase's
  // shared mailer send confirmation emails to synthetic addresses; the bounces
  // got the project's email sending RESTRICTED. This spec only runs where a
  // dedicated test project / custom SMTP absorbs that (CI sets the flag).
  // Locally it is OFF by default.
  test.skip(
    process.env.GOLDEN_ALLOW_SIGNUP !== "1",
    "Signup flow sends real confirmation emails — set GOLDEN_ALLOW_SIGNUP=1 only against a test project with custom SMTP"
  );

  const runId = `${Date.now()}-${testInfo.workerIndex}`;
  // RFC 2606 reserved domain: guaranteed-undeliverable by design, and mail to
  // .invalid is dropped rather than bounced back at the sender's reputation.
  const email = `golden-signup-${runId}@golden.invalid`;
  const fullName = `Golden Signup ${runId}`;
  const organizationName = `Golden Signup Org ${runId}`;

  await page.goto("/signup");
  await page.getByPlaceholder("John Doe").fill(fullName);
  await page.getByPlaceholder("Acme Mortgage Co.").fill(organizationName);
  await page.getByPlaceholder("you@example.com").fill(email);
  await page.getByPlaceholder("Create a strong password").fill("TestPassword123!");
  await page.getByRole("button", { name: "Create account" }).click();

  // Hosted Supabase's built-in mailer allows only a handful of confirmation
  // emails per hour; when that budget is spent the signup itself is throttled.
  // That is an environment limit, not a product regression — skip loudly.
  const rateLimited = page.getByText(/email rate limit exceeded/i);
  const outcome = await Promise.race([
    page
      .waitForURL(/\/(verify-email|onboarding|dashboard)/, { timeout: 20_000 })
      .then(() => "navigated" as const),
    rateLimited.waitFor({ timeout: 20_000 }).then(() => "rate-limited" as const),
  ]).catch(() => "timeout" as const);

  test.skip(
    outcome === "rate-limited",
    "Supabase confirmation-email rate limit exhausted (environmental, not product)"
  );
  expect(outcome).toBe("navigated");

  let createdUser: UserRow | null = null;
  await expect
    .poll(
      async () => {
        createdUser = await findUserByEmail(email);
        return createdUser?.email ?? null;
      },
      { timeout: 20_000, message: "signup should create a user row" }
    )
    .toBe(email);
  expect(createdUser!.organization_id).toBeTruthy();

  await page.goto("/onboarding");
  await expect(page).toHaveURL(/\/onboarding\/profile/);
  await expect(page.getByRole("heading", { name: "Set up your organization" })).toBeVisible();

  await page.locator("#organizationName").fill(organizationName);
  await page.locator("#street").fill("101 Golden Flow Way");
  await page.locator("#city").fill("New York");
  await page.locator("#state").fill("NY");
  await page.locator("#zip").fill("10001");
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page).toHaveURL(/\/onboarding\/complete/, { timeout: 20_000 });
  await expect(page.getByRole("heading", { name: "You're all set!" })).toBeVisible();

  await expect
    .poll(
      async () => getOnboardingStatusForEmail(email),
      { timeout: 20_000, message: "profile setup should mark onboarding profile complete" }
    )
    .toMatch(/profile_complete|completed/);

  await page.getByRole("button", { name: /go to dashboard/i }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });
  await expect
    .poll(
      async () => getOnboardingStatusForEmail(email),
      { timeout: 20_000, message: "completion page should mark onboarding completed" }
    )
    .toBe("completed");
  await expect(page.getByRole("heading", { name: /dashboard|good/i })).toBeVisible({
    timeout: 20_000,
  });
});
