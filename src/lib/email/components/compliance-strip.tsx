import * as React from "react";
import { Section, Text, Link } from "@react-email/components";
import { colors, typography, spacing } from "@/lib/email/theme";

export interface ComplianceStripProps {
  unsubscribeUrl?: string;
  physicalAddress?: string;
  copyrightHolder?: string;
}

const FALLBACK_ADDRESS =
  "Repwell Inc., 123 Main Street, Suite 100, San Francisco, CA 94105";

export function ComplianceStrip({
  unsubscribeUrl = "#",
  physicalAddress,
  copyrightHolder,
}: ComplianceStripProps) {
  const year = new Date().getFullYear();
  const address = physicalAddress || FALLBACK_ADDRESS;
  const holder = copyrightHolder || "Repwell";

  const textStyle: React.CSSProperties = {
    margin: 0,
    fontFamily: typography.fontFamily.body,
    fontSize: "11px",
    lineHeight: "16px",
    color: colors.text.muted,
    textAlign: "center" as const,
  };

  return (
    <Section
      style={{
        paddingTop: spacing[6],
        paddingBottom: spacing[6],
        paddingLeft: spacing[8],
        paddingRight: spacing[8],
        backgroundColor: colors.background.subtle,
        borderTop: `1px solid ${colors.border.default}`,
      }}
    >
      <Text style={textStyle}>
        <Link
          href={unsubscribeUrl}
          style={{
            color: colors.text.muted,
            textDecoration: "underline",
            fontSize: "11px",
          }}
        >
          Unsubscribe
        </Link>
      </Text>
      <Text style={{ ...textStyle, marginTop: "4px" }}>{address}</Text>
      <Text style={{ ...textStyle, marginTop: "4px" }}>
        &copy; {year} {holder} &middot; Powered by RepWell
      </Text>
    </Section>
  );
}
