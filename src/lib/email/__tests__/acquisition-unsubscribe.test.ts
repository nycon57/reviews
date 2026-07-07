import { describe, expect, it } from "vitest";
import {
  getSurveyInvitationEmail,
  getSurveyReminder3DayEmail,
  getVideoTestimonialInvitationEmail,
} from "../templates";

const CONTACT_URL = "https://app.example.com/u/c/tok123";

describe("acquisition email unsubscribe footer injection (ADR 0004)", () => {
  it("survey invitation uses the injected Contact unsubscribe URL when provided", () => {
    const { html } = getSurveyInvitationEmail({
      toEmail: "jane@example.com",
      customerName: "Jane",
      loanOfficerName: "Bob",
      organizationName: "Acme",
      surveyUrl: "https://app.example.com/survey/abc",
      unsubscribeUrl: CONTACT_URL,
    });
    expect(html).toContain(CONTACT_URL);
    expect(html).not.toContain("/api/email/unsubscribe");
  });

  it("survey invitation falls back to the legacy email link when no Contact URL is given", () => {
    const { html } = getSurveyInvitationEmail({
      toEmail: "jane@example.com",
      customerName: "Jane",
      loanOfficerName: "Bob",
      organizationName: "Acme",
      surveyUrl: "https://app.example.com/survey/abc",
    });
    expect(html).toContain("/api/email/unsubscribe");
    expect(html).not.toContain("/u/c/");
  });

  it("survey reminder honors the injected Contact unsubscribe URL", () => {
    const { html } = getSurveyReminder3DayEmail({
      toEmail: "jane@example.com",
      customerName: "Jane",
      loanOfficerName: "Bob",
      organizationName: "Acme",
      surveyUrl: "https://app.example.com/survey/abc",
      reminderNumber: 1,
      unsubscribeUrl: CONTACT_URL,
    });
    expect(html).toContain(CONTACT_URL);
    expect(html).not.toContain("/api/email/unsubscribe");
  });

  it("video invitation honors the injected Contact unsubscribe URL", () => {
    const { html } = getVideoTestimonialInvitationEmail({
      toEmail: "jane@example.com",
      customerName: "Jane",
      loanOfficerName: "Bob",
      organizationName: "Acme",
      requestUrl: "https://app.example.com/video-testimonial/abc",
      maxDurationSeconds: 120,
      unsubscribeUrl: CONTACT_URL,
    });
    expect(html).toContain(CONTACT_URL);
    expect(html).not.toContain("/api/email/unsubscribe");
  });
});
