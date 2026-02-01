import { createUntypedAdminClient } from "@/lib/supabase/admin";
import type { UntypedSupabaseClient } from "@/lib/supabase/admin";
import { getAreaCode } from "../phone-utils";

// ── Types ───────────────────────────────────────────────────────────────

export interface StateQuietHoursRule {
  stateCode: string;
  stateName: string;
  quietStart: string; // HH:MM
  quietEnd: string; // HH:MM
  notes: string | null;
}

export interface StateQuietHoursCheckResult {
  stateCode: string | null;
  stateRule: StateQuietHoursRule | null;
  /** The effective quiet start time (state override or federal default) */
  effectiveStart: string;
  /** The effective quiet end time (state override or federal default) */
  effectiveEnd: string;
  /** Whether state rules are stricter than federal defaults */
  isStateOverride: boolean;
}

// ── Constants ───────────────────────────────────────────────────────────

const FEDERAL_QUIET_START = "21:00"; // 9 PM
const FEDERAL_QUIET_END = "08:00"; // 8 AM

// ── Service ─────────────────────────────────────────────────────────────

/**
 * Resolves state-specific quiet hours from a recipient phone number.
 *
 * Uses area code → state mapping to determine the recipient's state,
 * then checks for state-specific quiet hours that are more restrictive
 * than the federal TCPA default (9 PM - 8 AM).
 *
 * State overrides are only applied when they are MORE restrictive than
 * the federal default — meaning the quiet window starts earlier or ends later.
 */
export class StateQuietHoursService {
  private supabase: UntypedSupabaseClient;
  private stateRulesCache: Map<string, StateQuietHoursRule> | null = null;
  private areaCodeStateCache: Map<string, string> | null = null;

  constructor(supabase?: UntypedSupabaseClient) {
    this.supabase = supabase ?? createUntypedAdminClient();
  }

  /**
   * Resolve the effective quiet hours for a recipient phone number.
   *
   * Returns the most restrictive quiet window between federal defaults
   * and state-specific rules.
   */
  async resolveQuietHours(
    recipientPhone: string
  ): Promise<StateQuietHoursCheckResult> {
    const areaCode = getAreaCode(recipientPhone);
    if (!areaCode) {
      return {
        stateCode: null,
        stateRule: null,
        effectiveStart: FEDERAL_QUIET_START,
        effectiveEnd: FEDERAL_QUIET_END,
        isStateOverride: false,
      };
    }

    const stateCode = await this.lookupState(areaCode);
    if (!stateCode) {
      return {
        stateCode: null,
        stateRule: null,
        effectiveStart: FEDERAL_QUIET_START,
        effectiveEnd: FEDERAL_QUIET_END,
        isStateOverride: false,
      };
    }

    const stateRule = await this.getStateRule(stateCode);
    if (!stateRule) {
      return {
        stateCode,
        stateRule: null,
        effectiveStart: FEDERAL_QUIET_START,
        effectiveEnd: FEDERAL_QUIET_END,
        isStateOverride: false,
      };
    }

    // Determine the most restrictive window
    const effective = getMostRestrictive(
      { start: FEDERAL_QUIET_START, end: FEDERAL_QUIET_END },
      { start: stateRule.quietStart, end: stateRule.quietEnd }
    );

    return {
      stateCode,
      stateRule,
      effectiveStart: effective.start,
      effectiveEnd: effective.end,
      isStateOverride:
        effective.start !== FEDERAL_QUIET_START ||
        effective.end !== FEDERAL_QUIET_END,
    };
  }

  /**
   * Get all state quiet hours rules (for admin UI display).
   */
  async getAllStateRules(): Promise<StateQuietHoursRule[]> {
    const rules = await this.loadStateRules();
    return Array.from(rules.values());
  }

  // ── Private ───────────────────────────────────────────────────────────

  private async lookupState(areaCode: string): Promise<string | null> {
    if (!this.areaCodeStateCache) {
      const { data } = await this.supabase
        .from("area_code_states")
        .select("area_code, state_code");

      this.areaCodeStateCache = new Map<string, string>();
      for (const row of data ?? []) {
        this.areaCodeStateCache.set(
          row.area_code as string,
          row.state_code as string
        );
      }
    }

    return this.areaCodeStateCache.get(areaCode) ?? null;
  }

  private async getStateRule(
    stateCode: string
  ): Promise<StateQuietHoursRule | null> {
    const rules = await this.loadStateRules();
    return rules.get(stateCode) ?? null;
  }

  private async loadStateRules(): Promise<Map<string, StateQuietHoursRule>> {
    if (this.stateRulesCache) return this.stateRulesCache;

    const { data } = await this.supabase
      .from("sms_state_quiet_hours")
      .select("state_code, state_name, quiet_start, quiet_end, notes");

    this.stateRulesCache = new Map<string, StateQuietHoursRule>();
    for (const row of data ?? []) {
      const rule: StateQuietHoursRule = {
        stateCode: row.state_code as string,
        stateName: row.state_name as string,
        quietStart: formatTime(row.quiet_start as string),
        quietEnd: formatTime(row.quiet_end as string),
        notes: (row.notes as string) ?? null,
      };
      this.stateRulesCache.set(rule.stateCode, rule);
    }

    return this.stateRulesCache;
  }
}

// ── Pure helpers ────────────────────────────────────────────────────────

/**
 * Format a TIME value (from DB) to HH:MM. Handles "HH:MM:SS" format.
 */
function formatTime(time: string): string {
  const parts = time.split(":");
  return `${parts[0]}:${parts[1]}`;
}

/**
 * Parse "HH:MM" to minutes since midnight.
 */
function parseMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/**
 * Get the most restrictive quiet hours window.
 *
 * For overnight windows (start > end), "more restrictive" means:
 * - Earlier start (quiet hours begin sooner in the evening)
 * - Later end (quiet hours end later in the morning)
 */
function getMostRestrictive(
  federal: { start: string; end: string },
  state: { start: string; end: string }
): { start: string; end: string } {
  const fStart = parseMinutes(federal.start);
  const fEnd = parseMinutes(federal.end);
  const sStart = parseMinutes(state.start);
  const sEnd = parseMinutes(state.end);

  // For overnight windows, earlier start = more restrictive
  const effectiveStart = sStart <= fStart ? state.start : federal.start;

  // For overnight windows, later end = more restrictive
  const effectiveEnd = sEnd >= fEnd ? state.end : federal.end;

  return { start: effectiveStart, end: effectiveEnd };
}
