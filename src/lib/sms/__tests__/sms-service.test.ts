import { describe, it, expect } from "vitest";
import {
  ConsentRequiredError,
  QuietHoursError,
  InsufficientCreditsError,
  RateLimitError,
} from "../sms-service";
import { mapTwilioError } from "../twilio-client";

describe("Custom error classes", () => {
  it("ConsentRequiredError has correct name and masked phone", () => {
    const err = new ConsentRequiredError("+12125551234");
    expect(err.name).toBe("ConsentRequiredError");
    expect(err.message).toContain("Consent not recorded");
    // Phone should be masked - last 2 digits hidden
    expect(err.message).not.toContain("1234");
    expect(err).toBeInstanceOf(Error);
  });

  it("QuietHoursError has correct name and nextValidTime", () => {
    const time = "2026-01-31T08:00:00.000Z";
    const err = new QuietHoursError(time);
    expect(err.name).toBe("QuietHoursError");
    expect(err.nextValidTime).toBe(time);
    expect(err.message).toContain("Quiet hours active");
  });

  it("InsufficientCreditsError has correct name", () => {
    const err = new InsufficientCreditsError("org-123");
    expect(err.name).toBe("InsufficientCreditsError");
    expect(err.message).toContain("Insufficient SMS credits");
  });

  it("RateLimitError has correct name and retryAfter", () => {
    const after = "2026-01-31T12:05:00.000Z";
    const err = new RateLimitError("Too many requests", after);
    expect(err.name).toBe("RateLimitError");
    expect(err.retryAfter).toBe(after);
  });

  it("RateLimitError works without retryAfter", () => {
    const err = new RateLimitError("Too many requests");
    expect(err.retryAfter).toBeUndefined();
  });
});

describe("mapTwilioError", () => {
  it("maps known error codes to user-friendly messages", () => {
    expect(mapTwilioError(21211, "fallback")).toBe("The phone number is invalid.");
    expect(mapTwilioError(21610, "fallback")).toBe(
      "The recipient has opted out of messages from this number."
    );
    expect(mapTwilioError(30003, "fallback")).toBe("The phone is unreachable.");
  });

  it("returns fallback for unknown error codes", () => {
    expect(mapTwilioError(99999, "Something went wrong")).toBe("Something went wrong");
  });

  it("returns fallback for undefined error code", () => {
    expect(mapTwilioError(undefined, "Unknown error")).toBe("Unknown error");
  });
});
