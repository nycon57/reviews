import type { BaseWidgetProps, NpsData } from "../types";
import { useWidgetConfig } from "../hooks/useWidgetConfig";
import { useWidgetEvents } from "../hooks/useWidgetEvents";
import { WidgetShell } from "../utils/WidgetShell";
import { formatNpsScore, getNpsZone, pluralize, sanitizeUrl } from "../utils/helpers";

const DEFAULT_API_BASE = "https://app.repwell.com";

function NpsGauge({ score }: { score: number }) {
  const clamped = Math.max(-100, Math.min(100, score));
  const angle = ((clamped + 100) / 200) * 180;
  const { color } = getNpsZone(score);

  // SVG semicircular gauge
  const cx = 90, cy = 90, r = 70;

  function arcPoint(a: number): [number, number] {
    const rad = ((a - 180) * Math.PI) / 180;
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
  }

  function describeArc(start: number, end: number): string {
    const [sx, sy] = arcPoint(start);
    const [ex, ey] = arcPoint(end);
    const large = end - start > 180 ? 1 : 0;
    return `M ${sx} ${sy} A ${r} ${r} 0 ${large} 1 ${ex} ${ey}`;
  }

  const zones = [
    { start: 0, end: 108, color: "#ef4444", opacity: 0.25 },
    { start: 108, end: 144, color: "#eab308", opacity: 0.25 },
    { start: 144, end: 180, color: "#22c55e", opacity: 0.25 },
  ];

  return (
    <div className="rw-nps__gauge">
      <svg viewBox="0 0 180 100" aria-hidden="true">
        {zones.map((z, i) => (
          <path
            key={i}
            d={describeArc(z.start, z.end)}
            fill="none"
            stroke={z.color}
            strokeWidth="8"
            strokeLinecap="round"
            opacity={z.opacity}
          />
        ))}
        {angle > 0.5 && (
          <path
            d={describeArc(0, angle)}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
          />
        )}
        <circle cx={cx} cy={cy} r="6" fill="currentColor" />
        <text
          x={cx}
          y={cy - 20}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="20"
          fontWeight="bold"
          fill="currentColor"
        >
          {formatNpsScore(score)}
        </text>
      </svg>
    </div>
  );
}

function NpsNumeric({ score }: { score: number }) {
  const { zone, color } = getNpsZone(score);
  return (
    <div className="rw-nps__numeric">
      <span className={`rw-nps__score rw-nps-zone--${zone}`} style={{ color }}>
        {formatNpsScore(score)}
      </span>
    </div>
  );
}

function BreakdownBar({ npsData }: { npsData: NpsData }) {
  const items = [
    { label: "Promoters", pct: npsData.promoterPct, color: "#22c55e" },
    { label: "Passives", pct: npsData.passivePct, color: "#eab308" },
    { label: "Detractors", pct: npsData.detractorPct, color: "#ef4444" },
  ];

  return (
    <div className="rw-nps__breakdown">
      <div className="rw-nps__breakdown-bar" style={{ display: "flex", borderRadius: 4, overflow: "hidden", height: 8 }}>
        {items.map((item) => (
          <div
            key={item.label}
            style={{ width: `${item.pct}%`, background: item.color }}
          />
        ))}
      </div>
      <div className="rw-nps__breakdown-labels" style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
        {items.map((item) => (
          <span key={item.label} className="rw-nps__breakdown-item">
            <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: item.color, marginRight: 4 }} />
            {item.label} {Math.round(item.pct)}%
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * NPS Score Badge Widget.
 * Displays Net Promoter Score in gauge or numeric mode with optional breakdown.
 */
export function NPSScoreBadge({
  widgetId,
  config: inlineConfig,
  reviews: inlineReviews,
  apiBaseUrl = DEFAULT_API_BASE,
  className,
  style,
  onEvent,
  fallback,
}: BaseWidgetProps) {
  const { config, loading, error } = useWidgetConfig({
    widgetId,
    config: inlineConfig,
    reviews: inlineReviews,
    apiBaseUrl,
  });

  const resolvedId = widgetId ?? config?.widget_id ?? "unknown";
  const { emit } = useWidgetEvents({ widgetId: resolvedId, onEvent });

  const cfg = config?.config;
  const npsCfg = cfg?.nps;
  const badge = cfg?.badge;
  const npsData: NpsData = config?.nps_data ?? {
    score: 0,
    totalResponses: 0,
    promoterPct: 0,
    passivePct: 0,
    detractorPct: 0,
  };

  const displayMode = npsCfg?.displayMode ?? "gauge";
  const showBreakdown = npsCfg?.showBreakdown !== false;
  const showCount = npsCfg?.showCount !== false;
  const showPeriod = npsCfg?.showPeriod !== false;
  const labelText = npsCfg?.labelText ?? "Net Promoter Score";
  const periodText = npsCfg?.periodText ?? "Last 12 months";
  const safeUrl = badge?.clickUrl ? sanitizeUrl(badge.clickUrl) : null;

  const ariaLabel = `Net Promoter Score is ${formatNpsScore(npsData.score)} based on ${npsData.totalResponses} ${pluralize(npsData.totalResponses, "response")}`;

  const npsContent = (
    <>
      {displayMode === "gauge" ? (
        <NpsGauge score={npsData.score} />
      ) : (
        <NpsNumeric score={npsData.score} />
      )}
      <div className="rw-nps__label">{labelText}</div>
      {showCount && npsData.totalResponses > 0 && (
        <div className="rw-nps__count">
          Based on {npsData.totalResponses} {pluralize(npsData.totalResponses, "response")}
        </div>
      )}
      {showPeriod && periodText && <div className="rw-nps__period">{periodText}</div>}
      {showBreakdown && npsData.totalResponses > 0 && <BreakdownBar npsData={npsData} />}
    </>
  );

  return (
    <WidgetShell
      className={className}
      style={style}
      ariaLabel={ariaLabel}
      loading={loading}
      error={error}
      fallback={fallback}
    >
      {config && (
        safeUrl ? (
          <a
            className="rw-nps"
            href={safeUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => emit("click_cta")}
            role="img"
            aria-label={ariaLabel}
          >
            {npsContent}
          </a>
        ) : (
          <div className="rw-nps" role="img" aria-label={ariaLabel}>
            {npsContent}
          </div>
        )
      )}
    </WidgetShell>
  );
}
