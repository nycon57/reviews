import { test, expect } from "@playwright/test";
import { TEST_USERS } from "../helpers/pages";
import { loginAs, openReviewRequestDialog } from "../helpers/golden-auth";
import {
  closeGoldenDb,
  findReviewForSurvey,
  findSurveyByCustomerEmail,
  GOLDEN_IDS,
  type ReviewRow,
  type SurveyRow,
} from "../helpers/golden-data";

test.setTimeout(60_000);

test.afterAll(async () => {
  await closeGoldenDb();
});

test("enterprise manager creates a real review request and anonymous customer completes it", async ({
  page,
  browser,
}, testInfo) => {
  const runId = `${Date.now()}-${testInfo.workerIndex}`;
  const customerName = `Golden Survey Customer ${runId}`;
  const customerEmail = `golden-survey-${runId}@example.com`;
  const testimonialText =
    `The golden acquisition path stayed personal and precise for ${customerName}. ` +
    "Every update was clear, the closing steps were easy to follow, and I would happily recommend this team.";

  await loginAs(page, TEST_USERS["enterprise-manager"]);
  const dialog = await openReviewRequestDialog(page);
  await dialog.getByLabel("Text review").click();
  await dialog.locator("#req-customer-name").fill(customerName);
  await dialog.locator("#req-customer-email").fill(customerEmail);
  await dialog.locator("#req-customer-phone").fill("(555) 011-0001");
  await dialog.getByRole("button", { name: /send request/i }).click();
  await expect(dialog).toBeHidden({ timeout: 20_000 });

  let survey: SurveyRow | null = null;
  await expect
    .poll(
      async () => {
        survey = await findSurveyByCustomerEmail(customerEmail);
        return survey?.token ?? null;
      },
      { timeout: 20_000, message: "created survey token should land in dev DB" }
    )
    .not.toBeNull();

  const anonContext = await browser.newContext();
  const surveyPage = await anonContext.newPage();
  await surveyPage.goto(`/survey/${survey!.token}`);

  await expect(surveyPage.getByText("Golden Flow Review Survey", { exact: true })).toBeVisible();
  await surveyPage.getByRole("button", { name: "Rate 5 out of 5" }).click();
  await surveyPage.getByRole("button", { name: /^Next$/ }).click();
  await surveyPage.getByPlaceholder("Share a few specifics about what went well...").fill(testimonialText);
  await surveyPage.getByRole("button", { name: /^Next$/ }).click();
  await surveyPage.getByRole("button", { name: "Score 10" }).click();
  await surveyPage.getByRole("button", { name: "Submit" }).click();

  await expect(
    surveyPage.getByRole("heading", { name: "Thank you for your feedback!" })
  ).toBeVisible({ timeout: 20_000 });
  const googleReviewLink = surveyPage.getByRole("link", { name: /leave a google review/i });
  await expect(googleReviewLink).toHaveAttribute(
    "href",
    `https://search.google.com/local/writereview?placeid=${GOLDEN_IDS.googlePlaceId}`
  );
  expect(surveyPage.url()).toContain(`/survey/${survey!.token}`);

  await anonContext.close();

  await expect
    .poll(
      async () => {
        survey = await findSurveyByCustomerEmail(customerEmail);
        return survey?.status ?? null;
      },
      { timeout: 20_000, message: "survey should complete after public submission" }
    )
    .toBe("completed");
  expect(survey!.completed_at).toBeTruthy();

  let review: ReviewRow | null = null;
  await expect
    .poll(
      async () => {
        review = await findReviewForSurvey(survey!.id);
        return review?.text ?? null;
      },
      { timeout: 20_000, message: "survey response should create a review row" }
    )
    .toContain("golden acquisition path");

  expect(review).toMatchObject({
    rating: 5,
    customer_name: customerName,
  });
});
