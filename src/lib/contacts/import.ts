"use server";

/**
 * Bulk contact import (ADR 0004). A thin, authorization-aware wrapper over B1's
 * {@link findOrCreateContact} that turns a pasted/uploaded CSV into Contacts.
 *
 * This module deliberately owns NO write logic of its own — every row funnels
 * through the canonical resolve path so dedup, tombstone absorption, and owner
 * attribution behave exactly as they do for a live acquisition request. It adds
 * only: CSV parsing, per-row validation, suppression-skip, and the created /
 * merged / skipped accounting the import UI reports back to the user.
 */
import { getAccessContext } from "@/lib/access";
import { createUntypedAdminClient } from "@/lib/supabase/admin";
import { normalizeEmail } from "@/lib/contacts/identity";
import { findOrCreateContact, isSuppressed } from "@/lib/contacts/actions";

/** Hard cap so a pasted spreadsheet can't fan out into an unbounded job. */
const MAX_IMPORT_ROWS = 5000;

export interface ContactImportSummary {
  /** Rows that produced a brand-new Contact. */
  created: number;
  /** Rows whose email already had a live Contact (name/phone refreshed). */
  merged: number;
  /** Rows skipped because the email is suppressed org-wide (do-not-contact). */
  suppressedSkipped: number;
  /** Rows dropped before any write: missing/garbage email. */
  invalid: number;
  /** Total data rows parsed (excludes the header). */
  total: number;
  /** Human-readable, row-scoped problems (capped) for the summary UI. */
  errors: string[];
}

interface ParsedRow {
  line: number;
  name: string | null;
  email: string;
  phone: string | null;
}

const ERROR_LIMIT = 25;

/**
 * Import contacts from CSV text with a `name,email,phone` shape (header
 * required, columns matched by name so order is flexible). Org and acting user
 * are resolved server-side from the session — never trusted from the client.
 *
 * Authorization: admins/managers may assign imported Contacts to any owner via
 * `ownerUserId`; a regular user can only import Contacts owned by themselves
 * (any supplied `ownerUserId` is ignored). Import is refused during the billing
 * grace period, consistent with other acquisition writes.
 */
export async function bulkImportContacts(
  csvText: string,
  ownerUserId?: string | null
): Promise<ContactImportSummary> {
  const ctx = await getAccessContext();
  if (!ctx) {
    throw new Error("bulkImportContacts: not authenticated");
  }
  if (ctx.isGracePeriod) {
    throw new Error(
      "bulkImportContacts: importing is unavailable during the billing grace period"
    );
  }

  const isManager = ctx.role === "admin" || ctx.role === "manager";
  // Regular users can only import their own Contacts; managers/admins choose.
  const resolvedOwner = isManager ? ownerUserId ?? ctx.userId : ctx.userId;

  const { rows, invalid, errors } = parseContactCsv(csvText);

  const summary: ContactImportSummary = {
    created: 0,
    merged: 0,
    suppressedSkipped: 0,
    invalid,
    total: rows.length + invalid,
    errors,
  };

  if (rows.length === 0) return summary;

  const supabase = createUntypedAdminClient();

  for (const row of rows) {
    try {
      // Skip anyone already suppressed org-wide — importing must never silently
      // re-add an unsubscribed / do-not-contact person to a send list.
      if (await isSuppressed(ctx.organizationId, row.email, "email")) {
        summary.suppressedSkipped += 1;
        continue;
      }

      // Classify created-vs-merged BEFORE the write: findOrCreateContact upserts
      // and can't tell us which happened, so we probe for a pre-existing live
      // Contact on the same (org, email).
      const { data: existing } = await supabase
        .from("contacts")
        .select("id")
        .eq("organization_id", ctx.organizationId)
        .eq("email", row.email)
        .is("erased_at", null)
        .maybeSingle();

      await findOrCreateContact(
        ctx.organizationId,
        { email: row.email, name: row.name, phone: row.phone },
        resolvedOwner,
        "import"
      );

      if (existing) summary.merged += 1;
      else summary.created += 1;
    } catch (err) {
      if (summary.errors.length < ERROR_LIMIT) {
        const message = err instanceof Error ? err.message : "unknown error";
        summary.errors.push(`Row ${row.line}: ${message}`);
      }
    }
  }

  return summary;
}

// ---------------------------------------------------------------------------
// CSV parsing
// ---------------------------------------------------------------------------

/**
 * Parse `name,email,phone` CSV into normalized rows. Requires a header line and
 * matches columns by name (case-insensitive) so column order doesn't matter.
 * Emails are normalized here via the same primitive the send path uses; a row
 * whose email won't normalize is counted invalid and never written.
 */
function parseContactCsv(csvText: string): {
  rows: ParsedRow[];
  invalid: number;
  errors: string[];
} {
  const errors: string[] = [];
  const lines = csvText
    .split(/\r\n|\r|\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    return { rows: [], invalid: 0, errors: ["The file is empty."] };
  }

  const header = splitCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
  const emailIdx = header.indexOf("email");
  const nameIdx = header.indexOf("name");
  const phoneIdx = header.indexOf("phone");

  if (emailIdx === -1) {
    return {
      rows: [],
      invalid: 0,
      errors: ['Missing required "email" column in the CSV header.'],
    };
  }

  const dataLines = lines.slice(1, 1 + MAX_IMPORT_ROWS);
  if (lines.length - 1 > MAX_IMPORT_ROWS) {
    errors.push(
      `Only the first ${MAX_IMPORT_ROWS} rows were imported; the rest were ignored.`
    );
  }

  const rows: ParsedRow[] = [];
  const seen = new Set<string>();
  let invalid = 0;

  dataLines.forEach((line, i) => {
    const cols = splitCsvLine(line);
    const email = normalizeEmail(cols[emailIdx]);
    if (!email) {
      invalid += 1;
      if (errors.length < ERROR_LIMIT) {
        errors.push(`Row ${i + 2}: invalid or missing email.`);
      }
      return;
    }
    // Collapse duplicate emails within the same file to a single row; the send
    // path already dedups, but this keeps the counts honest.
    if (seen.has(email)) return;
    seen.add(email);

    rows.push({
      line: i + 2,
      email,
      name: nameIdx !== -1 ? cols[nameIdx]?.trim() || null : null,
      phone: phoneIdx !== -1 ? cols[phoneIdx]?.trim() || null : null,
    });
  });

  return { rows, invalid, errors };
}

/**
 * Minimal RFC-4180-ish splitter: handles double-quoted fields (so a name with a
 * comma survives) and escaped quotes (""). Not a full CSV engine — enough for
 * the three-column contact shape.
 */
function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      out.push(field);
      field = "";
    } else {
      field += ch;
    }
  }
  out.push(field);
  return out;
}
