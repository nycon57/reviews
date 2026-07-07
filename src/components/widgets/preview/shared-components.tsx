import {
  SOURCE_ICONS,
  SOURCE_LABELS,
  getPreviewMetaStyle,
  previewT,
} from "./shared";
import { formatReviewSource } from "@/lib/reviews/source-labels";

interface SourceBadgeProps {
  source: string;
  lang?: string;
  metaScale?: number;
}

/** Source badge with icon + "Via Google" label for review cards. */
export function SourceBadge({ source, lang = "en", metaScale = 0.8 }: SourceBadgeProps) {
  const iconData = SOURCE_ICONS[source];
  const label = SOURCE_LABELS[source] ?? formatReviewSource(source);

  return (
    <span
      className="inline-flex items-center gap-1 text-[11px] capitalize"
      style={getPreviewMetaStyle("var(--rw-text-subtle, #9ca3af)", metaScale)}
    >
      {iconData?.icon ? (
        <img
          src={iconData.icon}
          alt={label}
          className="w-3.5 h-3.5 object-contain flex-shrink-0"
        />
      ) : iconData ? (
        <span
          className="inline-flex w-3.5 h-3.5 rounded-sm items-center justify-center text-[8px] font-bold text-white flex-shrink-0"
          style={{ background: iconData.bg }}
        >
          {iconData.letter}
        </span>
      ) : null}
      {previewT(lang, "via")} {label}
    </span>
  );
}
