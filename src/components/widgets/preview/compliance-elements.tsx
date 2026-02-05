"use client";

import { ExternalLink, Home } from "lucide-react";

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
      bg: "#f3f4f6",
      text: "#6b7280",
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
      className={`inline-flex items-center gap-1 text-xs text-gray-500 hover:text-[var(--rw-primary,#52796f)] transition-colors no-underline hover:underline ${className ?? ""}`}
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
}

export function LicensingStates({ states, className }: LicensingStatesProps) {
  if (!states || states.length === 0) return null;

  return (
    <div className={`text-xs text-gray-500 mt-1 ${className ?? ""}`}>
      Licensed in {states.join(", ")}
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
}

export function FirstTimeBuyerBadge({ className }: FirstTimeBuyerBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-green-800 bg-green-100 rounded-full ${className ?? ""}`}
    >
      <Home size={10} />
      First-Time Buyer
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
      className="flex-shrink-0 text-gray-500"
    >
      <path d="M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3zm0 2.84L19 12.5V19h-4v-6H9v6H5v-6.5L12 5.84z" />
      <rect x="9" y="10" width="6" height="1.2" rx="0.3" />
      <rect x="9" y="12.5" width="6" height="1.2" rx="0.3" />
    </svg>
  );
}

// ── Compliance Footer ───────────────────────────────────────────────

const DEFAULT_DISCLAIMER =
  "This is not a commitment to lend. Programs, rates, terms, and conditions are subject to change without notice.";

interface ComplianceFooterProps {
  disclaimerText?: string;
  primaryColor?: string;
  className?: string;
}

export function ComplianceFooter({
  disclaimerText,
  primaryColor,
  className,
}: ComplianceFooterProps) {
  return (
    <div
      className={`mt-3 p-2.5 bg-gray-50 rounded border border-gray-100 ${className ?? ""}`}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <EqualHousingLenderIcon size={16} />
        <span className="text-[11px] font-semibold text-gray-600">
          Equal Housing Lender
        </span>
      </div>
      <p className="text-[10px] leading-snug text-gray-500 mb-1">
        {disclaimerText || DEFAULT_DISCLAIMER}
      </p>
      <a
        href="https://www.nmlsconsumeraccess.org"
        target="_blank"
        rel="noopener noreferrer"
        className="text-[10px] no-underline hover:underline"
        style={{ color: primaryColor ?? "var(--rw-primary, #52796f)" }}
      >
        NMLS Consumer Access
      </a>
    </div>
  );
}

// ── Re-export color map for external use ────────────────────────────

export { LOAN_TYPE_COLORS, getLoanTypeColor };
