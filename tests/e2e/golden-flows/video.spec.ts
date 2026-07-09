import { test, expect } from "@playwright/test";
import { TEST_USERS } from "../helpers/pages";
import { loginAs, openReviewRequestDialog } from "../helpers/golden-auth";
import {
  closeGoldenDb,
  countGrantedVideoConsentEvents,
  findVideoRequestByCustomerEmail,
  type VideoRequestRow,
} from "../helpers/golden-data";

test.setTimeout(60_000);

test.afterAll(async () => {
  await closeGoldenDb();
});

test("video testimonial request reaches public consent and ready-to-upload state without device upload", async ({
  page,
  browser,
}, testInfo) => {
  const runId = `${Date.now()}-${testInfo.workerIndex}`;
  const customerName = `Golden Video Customer ${runId}`;
  const customerEmail = `delivered+golden-video-${runId}@resend.dev`; // Resend test inbox: accepts mail, never bounces

  await loginAs(page, TEST_USERS["enterprise-manager"]);
  const dialog = await openReviewRequestDialog(page);
  await dialog.getByLabel("Video review").click();
  await dialog.locator("#req-customer-name").fill(customerName);
  await dialog.locator("#req-customer-email").fill(customerEmail);
  await dialog.locator("#req-customer-phone").fill("(555) 011-0002");
  await dialog.getByRole("button", { name: /send request/i }).click();
  await expect(dialog).toBeHidden({ timeout: 20_000 });

  let request: VideoRequestRow | null = null;
  await expect
    .poll(
      async () => {
        request = await findVideoRequestByCustomerEmail(customerEmail);
        return request?.token ?? null;
      },
      { timeout: 20_000, message: "created video testimonial token should land in dev DB" }
    )
    .not.toBeNull();

  const anonContext = await browser.newContext();
  const publicPage = await anonContext.newPage();
  await publicPage.goto(`/video-testimonial/${request!.token}`);

  await expect(
    publicPage.getByRole("heading", { name: /will you share your story/i })
  ).toBeVisible();
  await publicPage.getByRole("button", { name: /let's do it/i }).click();

  await expect(publicPage.getByRole("heading", { name: "First, a little about you" })).toBeVisible();
  await expect(publicPage.getByRole("button", { name: "Continue" })).toBeDisabled();
  await expect(publicPage.getByText(/tap a star rating/i)).toBeVisible();

  await publicPage.getByRole("radio", { name: "5 stars" }).click();
  await publicPage.getByLabel("Your name").fill(customerName);
  await publicPage.getByRole("combobox", { name: /how did you work together/i }).click();
  await publicPage.getByRole("option", { name: "Home Buyer", exact: true }).click();
  await publicPage.getByLabel(/name, image, likeness, and voice/i).click();
  await publicPage.getByLabel(/where it can appear/i).click();
  await publicPage.getByLabel(/a written version of your video/i).click();

  await expect(publicPage.getByRole("button", { name: "Continue" })).toBeEnabled();
  await publicPage.getByRole("button", { name: "Continue" }).click();

  await expect(publicPage.getByRole("heading", { name: "Checking your setup" })).toBeVisible({
    timeout: 20_000,
  });

  await expect
    .poll(
      async () => {
        request = await findVideoRequestByCustomerEmail(customerEmail);
        return request?.status ?? null;
      },
      { timeout: 20_000, message: "video request should move to recording after consent" }
    )
    .toBe("recording");
  await expect
    .poll(
      async () => countGrantedVideoConsentEvents(request!.id),
      { timeout: 20_000, message: "required video consent events should be recorded" }
    )
    .toBe(3);

  await publicPage.getByRole("button", { name: /start recording|continue anyway/i }).click();
  await expect(publicPage.getByRole("heading", { name: /you're on/i })).toBeVisible();
  await expect(
    publicPage.getByRole("button", { name: /camera trouble\? upload a video file instead/i })
  ).toBeVisible();
  await expect(publicPage.getByText("MP4, MOV, or WebM up to 100MB")).toBeVisible();

  await anonContext.close();
});
