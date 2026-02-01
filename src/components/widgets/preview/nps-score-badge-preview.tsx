"use client";

import { useState } from "react";

/**
 * Dashboard preview component for the NPS Score Badge Widget.
 * Shows both gauge and numeric display modes with a toggle.
 * Mirrors the embed.js renderer output using React for WYSIWYG editing.
 */

// ── Types ───────────────────────────────────────────────────────────

interface WidgetThemeColors {
  primary?: string;
  background?: string;
  text?: string;
  border?: string;
}

interface NpsConfig {
  displayMode?: "gauge" | "numeric";
  showBreakdown?: boolean;
  showCount?: boolean;
  showPeriod?: boolean;
  labelText?: string;
  periodText?: string;
}

interface NpsScoreBadgePreviewProps {
  nps?: NpsConfig;
  colors?: WidgetThemeColors;
  borderRadius?: string;
}

// ── NPS Zone Helpers ────────────────────────────────────────────────

type NpsZone = "red" | "yellow" | "light-green" | "dark-green";

function getNpsZone(score: number): NpsZone {
  if (score < 0) return "red";
  if (score <= 30) return "yellow";
  if (score <= 70) return "light-green";
  return "dark-green";
}

const ZONE_COLORS: Record<NpsZone, string> = {
  red: "#ef4444",
  yellow: "#eab308",
  "light-green": "#22c55e",
  "dark-green": "#16a34a",
};

function formatNpsScore(score: number): string {
  if (score > 0) return `+${Math.round(score)}`;
  return String(Math.round(score));
}

// ── SVG Arc Helper ──────────────────────────────────────────────────

function arcPoint(cx: number, cy: number, r: number, angleDeg: number): [number, number] {
  const rad = ((angleDeg - 180) * Math.PI) / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const [sx, sy] = arcPoint(cx, cy, r, startAngle);
  const [ex, ey] = arcPoint(cx, cy, r, endAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${sx} ${sy} A ${r} ${r} 0 ${largeArc} 1 ${ex} ${ey}`;
}

// ── Sample Data ─────────────────────────────────────────────────────

const SAMPLE_NPS = {
  score: 42,
  totalResponses: 456,
  promoterPct: 58,
  passivePct: 26,
  detractorPct: 16,
};

// ── Gauge Component ─────────────────────────────────────────────────

function GaugeDisplay({ score }: { score: number }) {
  const cx = 90;
  const cy = 90;
  const r = 70;

  const zones = [
    { start: 0, end: 108, color: "#ef4444" },
    { start: 108, end: 144, color: "#eab308" },
    { start: 144, end: 180, color: "#22c55e" },
  ];

  const clampedScore = Math.max(-100, Math.min(100, score));
  const scoreAngle = ((clampedScore + 100) / 200) * 180;
  const zone = getNpsZone(score);

  return (
    <div style={{ width: 180, height: 100, position: "relative" }}>
      <svg viewBox="0 0 180 100" style={{ width: "100%", height: "100%", overflow: "visible" }} aria-hidden="true">
        {zones.map((z, i) => (
          <path
            key={i}
            d={describeArc(cx, cy, r, z.start, z.end)}
            fill="none"
            stroke={z.color}
            strokeWidth={14}
            strokeLinecap="round"
            opacity={0.25}
          />
        ))}

        {scoreAngle > 0.5 && (
          <path
            d={describeArc(cx, cy, r, 0, scoreAngle)}
            fill="none"
            stroke={ZONE_COLORS[zone]}
            strokeWidth={14}
            strokeLinecap="round"
          />
        )}

        {/* Needle */}
        {(() => {
          const [tipX, tipY] = arcPoint(cx, cy, r - 16, scoreAngle);
          const baseOffset = 3;
          const baseRad1 = ((scoreAngle - 180 + 90) * Math.PI) / 180;
          const baseRad2 = ((scoreAngle - 180 - 90) * Math.PI) / 180;
          const b1x = cx + baseOffset * Math.cos(baseRad1);
          const b1y = cy + baseOffset * Math.sin(baseRad1);
          const b2x = cx + baseOffset * Math.cos(baseRad2);
          const b2y = cy + baseOffset * Math.sin(baseRad2);
          return (
            <polygon
              points={`${tipX},${tipY} ${b1x},${b1y} ${b2x},${b2y}`}
              fill="currentColor"
              style={{ color: "#1a1a2e" }}
            />
          );
        })()}

        {/* Center dot */}
        <circle cx={cx} cy={cy} r={6} fill="white" stroke="#e5e7eb" strokeWidth={2} />

        {/* Score text */}
        <text
          x={cx}
          y={cy - 20}
          textAnchor="middle"
          dominantBaseline="middle"
          style={{ fontSize: 28, fontWeight: 700, fill: "#1a1a2e" }}
        >
          {formatNpsScore(score)}
        </text>
      </svg>
    </div>
  );
}

// ── Numeric Component ───────────────────────────────────────────────

function NumericDisplay({ score }: { score: number }) {
  const zone = getNpsZone(score);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <span
        style={{
          fontSize: 48,
          fontWeight: 700,
          lineHeight: 1,
          letterSpacing: "-0.02em",
          color: ZONE_COLORS[zone],
        }}
      >
        {formatNpsScore(score)}
      </span>
    </div>
  );
}

// ── Breakdown Bar ───────────────────────────────────────────────────

function BreakdownBar({ promoterPct, passivePct, detractorPct }: { promoterPct: number; passivePct: number; detractorPct: number }) {
  return (
    <div style={{ width: "100%", maxWidth: 240, display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", width: "100%", height: 8, borderRadius: 4, overflow: "hidden", background: "#e5e7eb" }}>
        <div style={{ height: "100%", width: `${promoterPct}%`, background: "#22c55e" }} />
        <div style={{ height: "100%", width: `${passivePct}%`, background: "#eab308" }} />
        <div style={{ height: "100%", width: `${detractorPct}%`, background: "#ef4444" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
        {[
          { label: "Promoters", pct: promoterPct, color: "#22c55e" },
          { label: "Passives", pct: passivePct, color: "#eab308" },
          { label: "Detractors", pct: detractorPct, color: "#ef4444" },
        ].map((item) => (
          <span key={item.label} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "#6b7280", whiteSpace: "nowrap" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: item.color, flexShrink: 0 }} />
            {item.label} {Math.round(item.pct)}%
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Main Preview ────────────────────────────────────────────────────

export function NpsScoreBadgePreview({
  nps = {},
  colors = {},
  borderRadius,
}: NpsScoreBadgePreviewProps) {
  const [displayMode, setDisplayMode] = useState<"gauge" | "numeric">(nps.displayMode ?? "gauge");
  const showBreakdown = nps.showBreakdown !== false;
  const showCount = nps.showCount !== false;
  const showPeriod = nps.showPeriod !== false;
  const labelText = nps.labelText ?? "Net Promoter Score";
  const periodText = nps.periodText ?? "Last 12 months";

  const data = SAMPLE_NPS;

  const ariaLabel = `Net Promoter Score is ${formatNpsScore(data.score)} based on ${data.totalResponses} responses`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "center", padding: 16 }}>
      {/* Mode Toggle */}
      <div style={{ display: "flex", gap: 4, background: "#f3f4f6", borderRadius: 6, padding: 2 }}>
        {(["gauge", "numeric"] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => setDisplayMode(mode)}
            style={{
              padding: "4px 12px",
              fontSize: 11,
              fontWeight: 500,
              borderRadius: 4,
              border: "none",
              cursor: "pointer",
              background: displayMode === mode ? "#fff" : "transparent",
              color: displayMode === mode ? "#1a1a2e" : "#6b7280",
              boxShadow: displayMode === mode ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
              transition: "all 0.15s ease",
            }}
          >
            {mode === "gauge" ? "Gauge" : "Numeric"}
          </button>
        ))}
      </div>

      {/* Badge */}
      <div
        role="img"
        aria-label={ariaLabel}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
          padding: 24,
          background: colors.background ?? "#fff",
          border: `1px solid ${colors.border ?? "#e5e7eb"}`,
          borderRadius: borderRadius ?? "12px",
          fontFamily: "system-ui, -apple-system, sans-serif",
          lineHeight: 1,
          maxWidth: "100%",
          boxSizing: "border-box",
        }}
      >
        {displayMode === "gauge" ? (
          <GaugeDisplay score={data.score} />
        ) : (
          <NumericDisplay score={data.score} />
        )}

        {/* Label */}
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: colors.text ?? "#1a1a2e",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            textAlign: "center",
          }}
        >
          {labelText}
        </div>

        {/* Response count */}
        {showCount && data.totalResponses > 0 && (
          <div style={{ fontSize: 12, color: "#6b7280", textAlign: "center" }}>
            Based on {data.totalResponses} responses
          </div>
        )}

        {/* Period */}
        {showPeriod && periodText && (
          <div style={{ fontSize: 11, color: "#6b7280", textAlign: "center" }}>
            {periodText}
          </div>
        )}

        {/* Breakdown */}
        {showBreakdown && (
          <BreakdownBar
            promoterPct={data.promoterPct}
            passivePct={data.passivePct}
            detractorPct={data.detractorPct}
          />
        )}
      </div>
    </div>
  );
}
