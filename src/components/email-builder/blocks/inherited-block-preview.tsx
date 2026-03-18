"use client";

import type { EmailBrandingConfig } from "@/lib/organization/types";

const containerStyle: React.CSSProperties = {
  opacity: 0.5,
  pointerEvents: "none",
  border: "2px dashed #d1d5db",
  borderRadius: "4px",
  position: "relative",
};

const labelStyle: React.CSSProperties = {
  position: "absolute",
  top: "4px",
  right: "8px",
  fontSize: "10px",
  color: "#9ca3af",
  fontFamily: "sans-serif",
  zIndex: 1,
};

export function InheritedHeaderPreview({
  branding,
}: {
  branding: EmailBrandingConfig;
}) {
  const h = branding.header;
  if (!h.logoSrc) return null;

  return (
    <div style={containerStyle}>
      <span style={labelStyle}>Org Default &mdash; Drag a block to override</span>
      <div
        style={{
          padding: "16px 24px",
          backgroundColor: h.backgroundColor || "#ffffff",
          textAlign: "center",
        }}
      >
        <img
          src={h.logoSrc}
          alt={h.logoAlt || "Logo"}
          height={h.logoHeight || 42}
          style={{ display: "inline-block" }}
        />
      </div>
    </div>
  );
}

export function InheritedFooterPreview({
  branding,
}: {
  branding: EmailBrandingConfig;
}) {
  const f = branding.footer;
  if (!f.companyName) return null;

  return (
    <div style={containerStyle}>
      <span style={labelStyle}>Org Default &mdash; Drag a block to override</span>
      <div
        style={{
          padding: "16px 24px",
          backgroundColor: f.backgroundColor || "#f9fafb",
          textAlign: "center",
        }}
      >
        {f.logoSrc && (
          <img
            src={f.logoSrc}
            alt={f.logoAlt || "Logo"}
            height={36}
            style={{ display: "inline-block", marginBottom: "8px" }}
          />
        )}
        {f.companyName && (
          <p
            style={{
              margin: 0,
              fontSize: "14px",
              fontWeight: 600,
              color: "#374151",
            }}
          >
            {f.companyName}
          </p>
        )}
        {f.tagline && (
          <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#6b7280" }}>
            {f.tagline}
          </p>
        )}
        {f.address && (
          <p style={{ margin: "4px 0 0", fontSize: "11px", color: "#9ca3af" }}>
            {f.address}
          </p>
        )}
      </div>
    </div>
  );
}
