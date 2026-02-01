import { createUntypedAdminClient } from "@/lib/supabase/admin";
import type { UntypedSupabaseClient } from "@/lib/supabase/admin";
import {
  getTimezoneForPhone,
  TCPA_DEFAULT_QUIET_START,
  TCPA_DEFAULT_QUIET_END,
} from "./timezone-lookup";

// ── Types ───────────────────────────────────────────────────────────────

export interface QuietHoursConfig {
  enabled: boolean;
  start: string; // HH:MM (24h)
  end: string; // HH:MM (24h)
  timezone: string; // IANA timezone
  useRecipientTimezone: boolean;
}

export interface QuietHoursCheckResult {
  blocked: boolean;
  /** ISO-8601 timestamp of the next valid send window. Null if not blocked. */
  nextValidTime: string | null;
  /** The timezone used for the check. */
  resolvedTimezone: string;
}

// ── Errors ──────────────────────────────────────────────────────────────

export class QuietHoursError extends Error {
  public nextValidTime: string;
  public scheduledAt: string;
  constructor(nextValidTime: string) {
    super(`Quiet hours active. Next valid send time: ${nextValidTime}`);
    this.name = "QuietHoursError";
    this.nextValidTime = nextValidTime;
    this.scheduledAt = nextValidTime;
  }
}

// ── QuietHoursEngine ────────────────────────────────────────────────────

/**
 * Enforces TCPA quiet hours for outbound SMS messages.
 *
 * Federal TCPA default: no messages before 8:00 AM or after 9:00 PM
 * in the recipient's local time. Organizations can configure custom
 * quiet hours and choose between org timezone or recipient timezone.
 *
 * When `useRecipientTimezone` is enabled, the engine resolves the
 * recipient's timezone from their phone number's area code.
 */
export class QuietHoursEngine {
  private supabase: UntypedSupabaseClient;

  constructor(supabase?: UntypedSupabaseClient) {
    this.supabase = supabase ?? createUntypedAdminClient();
  }

  /**
   * Check whether a message to the given phone number falls within
   * quiet hours for the specified organization.
   */
  async check(
    organizationId: string,
    recipientPhone: string,
    now?: Date
  ): Promise<QuietHoursCheckResult> {
    const config = await this.getConfig(organizationId);

    if (!config.enabled) {
      return { blocked: false, nextValidTime: null, resolvedTimezone: config.timezone };
    }

    // Resolve timezone: use recipient's area code timezone if enabled
    const resolvedTimezone = config.useRecipientTimezone
      ? getTimezoneForPhone(recipientPhone) ?? config.timezone
      : config.timezone;

    return checkTimeAgainstQuietHours(
      config.start,
      config.end,
      resolvedTimezone,
      now ?? new Date()
    );
  }

  /**
   * Enforce quiet hours. If blocked, throws QuietHoursError with the
   * next valid send time (for use as `scheduled_at`).
   */
  async enforce(
    organizationId: string,
    recipientPhone: string,
    now?: Date
  ): Promise<void> {
    const result = await this.check(organizationId, recipientPhone, now);
    if (result.blocked && result.nextValidTime) {
      throw new QuietHoursError(result.nextValidTime);
    }
  }

  /**
   * Load quiet hours configuration for an organization.
   * Falls back to federal TCPA defaults if not configured.
   */
  private async getConfig(organizationId: string): Promise<QuietHoursConfig> {
    const { data } = await this.supabase
      .from("sms_settings")
      .select(
        "quiet_hours_enabled, quiet_hours_start, quiet_hours_end, quiet_hours_timezone, use_recipient_timezone"
      )
      .eq("organization_id", organizationId)
      .maybeSingle();

    if (!data) {
      // No settings row: enforce federal TCPA defaults
      return {
        enabled: true,
        start: TCPA_DEFAULT_QUIET_START,
        end: TCPA_DEFAULT_QUIET_END,
        timezone: "America/New_York",
        useRecipientTimezone: true,
      };
    }

    return {
      enabled: data.quiet_hours_enabled ?? true,
      start: data.quiet_hours_start ?? TCPA_DEFAULT_QUIET_START,
      end: data.quiet_hours_end ?? TCPA_DEFAULT_QUIET_END,
      timezone: data.quiet_hours_timezone ?? "America/New_York",
      useRecipientTimezone: data.use_recipient_timezone ?? false,
    };
  }
}

// ── Pure functions (exported for testing) ────────────────────────────────

/**
 * Check if the current time falls within quiet hours.
 *
 * Quiet hours window is defined as "no sends between `start` and `end`".
 * Example: start=21:00, end=08:00 means quiet from 9 PM to 8 AM (overnight).
 * Example: start=08:00, end=21:00 would mean quiet during the day (unusual
 * but supported).
 */
export function checkTimeAgainstQuietHours(
  start: string,
  end: string,
  timezone: string,
  now: Date
): QuietHoursCheckResult {
  const currentMinutes = getCurrentMinutesInTimezone(now, timezone);
  const startMinutes = parseTimeToMinutes(start);
  const endMinutes = parseTimeToMinutes(end);

  const isBlocked = isInQuietWindow(currentMinutes, startMinutes, endMinutes);

  if (!isBlocked) {
    return { blocked: false, nextValidTime: null, resolvedTimezone: timezone };
  }

  const nextValidTime = calculateNextValidTime(
    now,
    endMinutes,
    currentMinutes,
    startMinutes,
    timezone
  );

  return { blocked: true, nextValidTime, resolvedTimezone: timezone };
}

/**
 * Determine if `current` falls within the quiet window from `start` to `end`.
 * Handles overnight windows (start > end, e.g. 21:00 to 08:00).
 */
export function isInQuietWindow(
  currentMinutes: number,
  startMinutes: number,
  endMinutes: number
): boolean {
  if (startMinutes > endMinutes) {
    // Overnight window: 21:00 → 08:00
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }
  // Daytime window: 08:00 → 21:00
  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
}

/**
 * Parse "HH:MM" to minutes since midnight.
 */
export function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * Get the current time as minutes since midnight in a given IANA timezone.
 */
export function getCurrentMinutesInTimezone(
  now: Date,
  timezone: string
): number {
  const timeStr = now.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone,
  });
  return parseTimeToMinutes(timeStr);
}

/**
 * Calculate the next valid send time as an ISO-8601 string.
 * The next valid time is when quiet hours end.
 */
function calculateNextValidTime(
  now: Date,
  endMinutes: number,
  currentMinutes: number,
  startMinutes: number,
  timezone: string
): string {
  // Create a date for the end of quiet hours
  const dateStr = now.toLocaleDateString("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  // Parse the local date parts
  const [month, day, year] = dateStr.split("/").map(Number);
  const endHour = Math.floor(endMinutes / 60);
  const endMinute = endMinutes % 60;

  // Build a date string in the timezone
  const targetDateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(endHour).padStart(2, "0")}:${String(endMinute).padStart(2, "0")}:00`;

  // For overnight windows, if current time is after start, the end time is tomorrow
  const isOvernight = startMinutes > endMinutes;
  const needsNextDay = isOvernight && currentMinutes >= startMinutes;

  // Use a simple approach: calculate offset from now
  let minutesUntilEnd: number;
  if (needsNextDay) {
    // Minutes until midnight + minutes from midnight to end
    minutesUntilEnd = (24 * 60 - currentMinutes) + endMinutes;
  } else {
    minutesUntilEnd = endMinutes - currentMinutes;
    if (minutesUntilEnd <= 0) {
      minutesUntilEnd += 24 * 60;
    }
  }

  const nextValid = new Date(now.getTime() + minutesUntilEnd * 60 * 1000);
  // Round to the nearest minute
  nextValid.setSeconds(0, 0);

  return nextValid.toISOString();
}
