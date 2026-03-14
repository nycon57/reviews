"use client";

import { ExternalLink, Home } from "lucide-react";
import { previewT } from "./shared";

/**
 * Shared compliance-related React components for widget dashboard previews.
 * Mirrors the embed.js compliance components for WYSIWYG consistency.
 */

// ── Loan Type Color Map ─────────────────────────────────────────────

const LOAN_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  purchase: { bg: "#dbeafe", text: "#1e40af" },
  refinance: { bg: "#fef3c7", text: "#92400e" },
  va: { bg: "#d1fae5", text: "#065f46" },
  fha: { bg: "#ede9fe", text: "#5b21b6" },
  jumbo: { bg: "#fce7f3", text: "#9d174d" },
  usda: { bg: "#fef9c3", text: "#854d0e" },
  conventional: { bg: "#f0f9ff", text: "#075985" },
};

function getLoanTypeColor(loanType: string): { bg: string; text: string } {
  return (
    LOAN_TYPE_COLORS[loanType.toLowerCase().trim()] ?? {
      bg: "var(--rw-surface-muted, #f3f4f6)",
      text: "var(--rw-text-muted, #6b7280)",
    }
  );
}

// ── NMLS Badge ──────────────────────────────────────────────────────

const NMLS_BASE_INDIVIDUAL =
  "https://www.nmlsconsumeraccess.org/EntityDetails.aspx/INDIVIDUAL/";
const NMLS_BASE_COMPANY =
  "https://www.nmlsconsumeraccess.org/EntityDetails.aspx/COMPANY/";

interface NmlsBadgeProps {
  nmlsId: string | null | undefined;
  entityType: "individual" | "company";
  className?: string;
}

export function NmlsBadge({ nmlsId, entityType, className }: NmlsBadgeProps) {
  if (!nmlsId) return null;

  const base =
    entityType === "individual" ? NMLS_BASE_INDIVIDUAL : NMLS_BASE_COMPANY;

  return (
    <a
      href={`${base}${encodeURIComponent(nmlsId)}`}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1 text-xs transition-colors no-underline hover:underline ${className ?? ""}`}
      style={{ color: "var(--rw-text-muted, #6b7280)" }}
      aria-label={`NMLS ID ${nmlsId} - view on NMLS Consumer Access`}
    >
      NMLS# {nmlsId}
      <ExternalLink size={10} />
    </a>
  );
}

// ── Licensing States ────────────────────────────────────────────────

interface LicensingStatesProps {
  states: string[] | null | undefined;
  className?: string;
  language?: string;
}

export function LicensingStates({ states, className, language }: LicensingStatesProps) {
  if (!states || states.length === 0) return null;

  return (
    <div
      className={`text-xs mt-1 ${className ?? ""}`}
      style={{ color: "var(--rw-text-muted, #6b7280)" }}
    >
      {previewT(language, "licensedIn")} {states.join(", ")}
    </div>
  );
}

// ── Loan Type Tag ────────────────────────────────────────────────────

interface LoanTypeTagProps {
  loanType: string;
  className?: string;
}

export function LoanTypeTag({ loanType, className }: LoanTypeTagProps) {
  const colors = getLoanTypeColor(loanType);
  return (
    <span
      className={`inline-block px-2 py-0.5 text-[11px] font-medium rounded-full ${className ?? ""}`}
      style={{ background: colors.bg, color: colors.text }}
    >
      {loanType}
    </span>
  );
}

// ── First-Time Homebuyer Badge ──────────────────────────────────────

interface FirstTimeBuyerBadgeProps {
  className?: string;
  language?: string;
}

export function FirstTimeBuyerBadge({ className, language }: FirstTimeBuyerBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-green-800 bg-green-100 rounded-full ${className ?? ""}`}
    >
      <Home size={10} />
      {previewT(language, "firstTimeBuyer")}
    </span>
  );
}

// ── Equal Housing Lender SVG ────────────────────────────────────────

function EqualHousingLenderIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      width={size}
      height={size}
      className="flex-shrink-0"
      style={{ color: "var(--rw-text-muted, #6b7280)" }}
    >
      <path d="M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3zm0 2.84L19 12.5V19h-4v-6H9v6H5v-6.5L12 5.84z" />
      <rect x="9" y="10" width="6" height="1.2" rx="0.3" />
      <rect x="9" y="12.5" width="6" height="1.2" rx="0.3" />
    </svg>
  );
}

// ── Compliance Footer ───────────────────────────────────────────────

interface ComplianceFooterProps {
  disclaimerText?: string;
  primaryColor?: string;
  className?: string;
  language?: string;
}

export function ComplianceFooter({
  disclaimerText,
  primaryColor,
  className,
  language,
}: ComplianceFooterProps) {
  return (
    <div
      className={`mt-3 p-2.5 rounded border ${className ?? ""}`}
      style={{
        background: "var(--rw-surface-muted, #f9fafb)",
        borderColor: "var(--rw-border-soft, var(--rw-border, #e5e7eb))",
      }}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <EqualHousingLenderIcon size={16} />
        <span
          className="text-[11px] font-semibold"
          style={{ color: "var(--rw-text, #1a1a2e)" }}
        >
          {previewT(language, "equalHousingLender")}
        </span>
      </div>
      <p
        className="text-[10px] leading-snug mb-1"
        style={{ color: "var(--rw-text-muted, #6b7280)" }}
      >
        {disclaimerText || previewT(language, "defaultDisclaimer")}
      </p>
      <a
        href="https://www.nmlsconsumeraccess.org"
        target="_blank"
        rel="noopener noreferrer"
        className="text-[10px] no-underline hover:underline"
        style={{ color: primaryColor ?? "var(--rw-primary, #52796f)" }}
      >
        {previewT(language, "nmlsConsumerAccess")}
      </a>
    </div>
  );
}

// ── Re-export color map for external use ────────────────────────────

export { LOAN_TYPE_COLORS, getLoanTypeColor };
