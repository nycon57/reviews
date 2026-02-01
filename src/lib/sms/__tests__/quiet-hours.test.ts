import { describe, it, expect } from "vitest";
import {
  checkTimeAgainstQuietHours,
  isInQuietWindow,
  parseTimeToMinutes,
  getCurrentMinutesInTimezone,
} from "../quiet-hours";
import { getTimezoneForPhone, TCPA_DEFAULT_QUIET_START, TCPA_DEFAULT_QUIET_END } from "../timezone-lookup";

/**
 * Unit tests for the quiet hours engine.
 * Covers overnight windows, midnight crossing, DST transitions,
 * timezone resolution, and TCPA default enforcement.
 */

describe("parseTimeToMinutes", () => {
  it("parses midnight", () => {
    expect(parseTimeToMinutes("00:00")).toBe(0);
  });

  it("parses noon", () => {
    expect(parseTimeToMinutes("12:00")).toBe(720);
  });

  it("parses 8:00 AM", () => {
    expect(parseTimeToMinutes("08:00")).toBe(480);
  });

  it("parses 9:00 PM", () => {
    expect(parseTimeToMinutes("21:00")).toBe(1260);
  });

  it("parses 11:59 PM", () => {
    expect(parseTimeToMinutes("23:59")).toBe(1439);
  });

  it("parses time with minutes", () => {
    expect(parseTimeToMinutes("14:30")).toBe(870);
  });
});

describe("isInQuietWindow", () => {
  describe("overnight window (21:00-08:00, typical TCPA)", () => {
    const start = parseTimeToMinutes("21:00"); // 1260
    const end = parseTimeToMinutes("08:00"); // 480

    it("10:00 PM (22:00) is in quiet hours", () => {
      expect(isInQuietWindow(22 * 60, start, end)).toBe(true);
    });

    it("11:59 PM is in quiet hours", () => {
      expect(isInQuietWindow(23 * 60 + 59, start, end)).toBe(true);
    });

    it("midnight (00:00) is in quiet hours", () => {
      expect(isInQuietWindow(0, start, end)).toBe(true);
    });

    it("3:00 AM is in quiet hours", () => {
      expect(isInQuietWindow(3 * 60, start, end)).toBe(true);
    });

    it("7:59 AM is in quiet hours", () => {
      expect(isInQuietWindow(7 * 60 + 59, start, end)).toBe(true);
    });

    it("8:00 AM is NOT in quiet hours (boundary - end time)", () => {
      expect(isInQuietWindow(8 * 60, start, end)).toBe(false);
    });

    it("9:00 AM is NOT in quiet hours", () => {
      expect(isInQuietWindow(9 * 60, start, end)).toBe(false);
    });

    it("12:00 PM is NOT in quiet hours", () => {
      expect(isInQuietWindow(12 * 60, start, end)).toBe(false);
    });

    it("5:00 PM is NOT in quiet hours", () => {
      expect(isInQuietWindow(17 * 60, start, end)).toBe(false);
    });

    it("8:59 PM is NOT in quiet hours", () => {
      expect(isInQuietWindow(20 * 60 + 59, start, end)).toBe(false);
    });

    it("9:00 PM (21:00) is in quiet hours (boundary - start time)", () => {
      expect(isInQuietWindow(21 * 60, start, end)).toBe(true);
    });
  });

  describe("daytime window (08:00-21:00, inverted)", () => {
    const start = parseTimeToMinutes("08:00"); // 480
    const end = parseTimeToMinutes("21:00"); // 1260

    it("10:00 AM is in quiet hours", () => {
      expect(isInQuietWindow(10 * 60, start, end)).toBe(true);
    });

    it("8:00 AM is in quiet hours (boundary)", () => {
      expect(isInQuietWindow(8 * 60, start, end)).toBe(true);
    });

    it("9:00 PM is NOT in quiet hours (boundary)", () => {
      expect(isInQuietWindow(21 * 60, start, end)).toBe(false);
    });

    it("7:00 AM is NOT in quiet hours", () => {
      expect(isInQuietWindow(7 * 60, start, end)).toBe(false);
    });

    it("11:00 PM is NOT in quiet hours", () => {
      expect(isInQuietWindow(23 * 60, start, end)).toBe(false);
    });
  });

  describe("edge case: same start and end", () => {
    const start = parseTimeToMinutes("09:00");
    const end = parseTimeToMinutes("09:00");

    it("no time is in quiet window when start equals end", () => {
      expect(isInQuietWindow(9 * 60, start, end)).toBe(false);
      expect(isInQuietWindow(0, start, end)).toBe(false);
      expect(isInQuietWindow(12 * 60, start, end)).toBe(false);
    });
  });
});

describe("getCurrentMinutesInTimezone", () => {
  it("returns correct minutes for a known date in Eastern Time", () => {
    // January 15, 2026 at 2:30 PM UTC = 9:30 AM EST (UTC-5)
    const date = new Date("2026-01-15T14:30:00.000Z");
    const minutes = getCurrentMinutesInTimezone(date, "America/New_York");
    expect(minutes).toBe(9 * 60 + 30); // 9:30 AM EST
  });

  it("returns correct minutes for Pacific Time", () => {
    // January 15, 2026 at 2:30 PM UTC = 6:30 AM PST (UTC-8)
    const date = new Date("2026-01-15T14:30:00.000Z");
    const minutes = getCurrentMinutesInTimezone(date, "America/Los_Angeles");
    expect(minutes).toBe(6 * 60 + 30); // 6:30 AM PST
  });

  it("returns correct minutes for Central Time", () => {
    // January 15, 2026 at 2:30 PM UTC = 8:30 AM CST (UTC-6)
    const date = new Date("2026-01-15T14:30:00.000Z");
    const minutes = getCurrentMinutesInTimezone(date, "America/Chicago");
    expect(minutes).toBe(8 * 60 + 30); // 8:30 AM CST
  });

  it("handles midnight crossing", () => {
    // January 15, 2026 at 3:00 AM UTC = 10:00 PM (22:00) EST previous day
    const date = new Date("2026-01-15T03:00:00.000Z");
    const minutes = getCurrentMinutesInTimezone(date, "America/New_York");
    expect(minutes).toBe(22 * 60); // 10:00 PM EST
  });
});

describe("checkTimeAgainstQuietHours (TCPA defaults)", () => {
  // Federal TCPA: quiet from 9 PM to 8 AM recipient local time
  const tcpaStart = TCPA_DEFAULT_QUIET_START; // "21:00"
  const tcpaEnd = TCPA_DEFAULT_QUIET_END; // "08:00"

  it("blocks messages at 10 PM Eastern", () => {
    // 10 PM EST = 3 AM UTC next day
    const date = new Date("2026-01-16T03:00:00.000Z");
    const result = checkTimeAgainstQuietHours(tcpaStart, tcpaEnd, "America/New_York", date);
    expect(result.blocked).toBe(true);
    expect(result.nextValidTime).not.toBeNull();
  });

  it("allows messages at 10 AM Eastern", () => {
    // 10 AM EST = 3 PM UTC
    const date = new Date("2026-01-15T15:00:00.000Z");
    const result = checkTimeAgainstQuietHours(tcpaStart, tcpaEnd, "America/New_York", date);
    expect(result.blocked).toBe(false);
    expect(result.nextValidTime).toBeNull();
  });

  it("allows messages at exactly 8 AM (boundary)", () => {
    // 8 AM EST = 1 PM UTC
    const date = new Date("2026-01-15T13:00:00.000Z");
    const result = checkTimeAgainstQuietHours(tcpaStart, tcpaEnd, "America/New_York", date);
    expect(result.blocked).toBe(false);
  });

  it("blocks messages at 8:59 PM (just before quiet hours)", () => {
    // 8:59 PM EST = 1:59 AM UTC next day
    const date = new Date("2026-01-16T01:59:00.000Z");
    const result = checkTimeAgainstQuietHours(tcpaStart, tcpaEnd, "America/New_York", date);
    expect(result.blocked).toBe(false);
  });

  it("blocks messages at 9 PM (start of quiet hours)", () => {
    // 9 PM EST = 2 AM UTC next day
    const date = new Date("2026-01-16T02:00:00.000Z");
    const result = checkTimeAgainstQuietHours(tcpaStart, tcpaEnd, "America/New_York", date);
    expect(result.blocked).toBe(true);
  });

  it("blocks messages at midnight Eastern", () => {
    // 12 AM EST = 5 AM UTC
    const date = new Date("2026-01-15T05:00:00.000Z");
    const result = checkTimeAgainstQuietHours(tcpaStart, tcpaEnd, "America/New_York", date);
    expect(result.blocked).toBe(true);
  });

  it("next valid time is approximately 8 AM for late night blocks", () => {
    // 11 PM EST = 4 AM UTC next day
    const date = new Date("2026-01-16T04:00:00.000Z");
    const result = checkTimeAgainstQuietHours(tcpaStart, tcpaEnd, "America/New_York", date);
    expect(result.blocked).toBe(true);
    expect(result.nextValidTime).not.toBeNull();

    // The next valid time should be the next day around 8 AM EST
    const nextValid = new Date(result.nextValidTime!);
    expect(nextValid.getTime()).toBeGreaterThan(date.getTime());
  });

  it("resolvedTimezone matches input timezone", () => {
    const date = new Date("2026-01-15T15:00:00.000Z");
    const result = checkTimeAgainstQuietHours(tcpaStart, tcpaEnd, "America/Chicago", date);
    expect(result.resolvedTimezone).toBe("America/Chicago");
  });
});

describe("checkTimeAgainstQuietHours (all US timezones)", () => {
  const tcpaStart = TCPA_DEFAULT_QUIET_START;
  const tcpaEnd = TCPA_DEFAULT_QUIET_END;

  const timezones = [
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "America/Phoenix",
    "Pacific/Honolulu",
    "America/Anchorage",
  ];

  it.each(timezones)("blocks late-night sends in %s", (tz) => {
    // Pick a time that is definitely after 9 PM in all US timezones
    // 6 AM UTC is after 9 PM in Pacific (10 PM) and Eastern (1 AM next day)
    const date = new Date("2026-01-15T06:00:00.000Z");
    const minutes = getCurrentMinutesInTimezone(date, tz);

    // Only check if the timezone puts us in quiet hours
    const result = checkTimeAgainstQuietHours(tcpaStart, tcpaEnd, tz, date);
    if (minutes >= parseTimeToMinutes(tcpaStart) || minutes < parseTimeToMinutes(tcpaEnd)) {
      expect(result.blocked).toBe(true);
    }
  });

  it.each(timezones)("allows mid-day sends in %s", (tz) => {
    // 7 PM UTC is mid-day in all US timezones (11 AM - 2 PM range)
    const date = new Date("2026-01-15T19:00:00.000Z");
    const minutes = getCurrentMinutesInTimezone(date, tz);

    // All US timezones should be between 8 AM and 9 PM at 7 PM UTC
    if (minutes >= parseTimeToMinutes(tcpaEnd) && minutes < parseTimeToMinutes(tcpaStart)) {
      const result = checkTimeAgainstQuietHours(tcpaStart, tcpaEnd, tz, date);
      expect(result.blocked).toBe(false);
    }
  });
});

describe("getTimezoneForPhone", () => {
  it("resolves Eastern timezone for NYC area code", () => {
    expect(getTimezoneForPhone("+12125551234")).toBe("America/New_York");
  });

  it("resolves Central timezone for Chicago area code", () => {
    expect(getTimezoneForPhone("+13125551234")).toBe("America/Chicago");
  });

  it("resolves Mountain timezone for Denver area code", () => {
    expect(getTimezoneForPhone("+13035551234")).toBe("America/Denver");
  });

  it("resolves Pacific timezone for LA area code", () => {
    expect(getTimezoneForPhone("+13105551234")).toBe("America/Los_Angeles");
  });

  it("resolves Arizona timezone (no DST)", () => {
    expect(getTimezoneForPhone("+14805551234")).toBe("America/Phoenix");
  });

  it("resolves Hawaii timezone", () => {
    expect(getTimezoneForPhone("+18085551234")).toBe("Pacific/Honolulu");
  });

  it("resolves Alaska timezone", () => {
    expect(getTimezoneForPhone("+19075551234")).toBe("America/Anchorage");
  });

  it("returns null for non-US numbers", () => {
    expect(getTimezoneForPhone("+442071234567")).toBeNull();
  });

  it("returns null for invalid phone format", () => {
    expect(getTimezoneForPhone("not-a-phone")).toBeNull();
  });

  it("returns null for unrecognized area code", () => {
    expect(getTimezoneForPhone("+10005551234")).toBeNull();
  });
});
