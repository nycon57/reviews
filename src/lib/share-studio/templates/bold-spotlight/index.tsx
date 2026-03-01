/**
 * Template 3: "Bold Spotlight" — modern, high-impact
 *
 * Layout:
 * - Split background: brand primary top, neutral bottom
 * - Large circular avatar with brand-colored ring
 * - Customer name + title prominently displayed
 * - Quote in a dark rounded card
 * - Stars inside the card
 * - Org branding at bottom
 * - "Powered by RepWell" badge
 *
 * Works at 1:1 (1080x1080), 9:16 (1080x1920), 16:9 (1920x1080).
 */

import type { TemplateProps } from "../types";
import { wrapText } from "../text-wrap";
import { AvatarCircle } from "../shared/avatar-circle";
import { StarRating, starRatingWidth } from "../shared/star-rating";
import { PoweredByBadge } from "../shared/powered-by-badge";

export function BoldSpotlight(props: TemplateProps) {
  const { width, height } = props;
  const isVertical = height > width;
  const isLandscape = width > height;

  // Responsive layout
  const padding = isVertical ? 60 : isLandscape ? 80 : 60;
  const splitY = isVertical ? height * 0.35 : isLandscape ? height * 0.4 : height * 0.38;
  const avatarRadius = isVertical ? 65 : isLandscape ? 55 : 65;
  const quoteFontSize = isVertical ? 24 : isLandscape ? 22 : 26;
  const nameFontSize = isVertical ? 26 : isLandscape ? 22 : 26;
  const orgFontSize = isVertical ? 16 : isLandscape ? 15 : 16;
  const starSize = isVertical ? 24 : isLandscape ? 20 : 24;
  const lineHeight = 1.4;
  const cx = width / 2;

  // Avatar position
  const avatarCy = splitY;

  // Name + title below avatar
  const nameY = avatarCy + avatarRadius + 35;
  const subtitleY = nameY + nameFontSize + 6;

  // Dark quote card
  const cardMarginTop = 25;
  const cardX = padding;
  const cardWidth = width - padding * 2;
  const cardTop = subtitleY + 20 + cardMarginTop;
  const cardPadding = isVertical ? 40 : 30;
  const cardInnerWidth = cardWidth - cardPadding * 2;
  const cardRadius = 20;

  // Wrap quote text for card
  const lines = wrapText(props.quote, cardInnerWidth, quoteFontSize);
  const textBlockH = lines.length * quoteFontSize * lineHeight;

  // Card dimensions
  const starsH = starSize + 20;
  const cardContentH = cardPadding + textBlockH + 20 + starsH + cardPadding;
  const cardHeight = Math.max(cardContentH, isVertical ? 180 : 140);

  // Positions inside card
  const cardTextStartY = cardTop + cardPadding + quoteFontSize;
  const cardStarsY = cardTop + cardPadding + textBlockH + 20;
  const starsW = starRatingWidth(starSize, 4);
  const starsX = cx - starsW / 2;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="bs-top-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={props.primaryColor} />
          <stop offset="100%" stopColor={props.secondaryColor} />
        </linearGradient>
      </defs>

      {/* Bottom half background */}
      <rect width={width} height={height} fill="#f0f0f0" />

      {/* Top half brand gradient */}
      <rect width={width} height={splitY} fill="url(#bs-top-grad)" />

      {/* Org name in top-left */}
      <text
        x={padding}
        y={padding - 10}
        fill="#ffffff"
        fontSize={orgFontSize}
        fontFamily="Inter, sans-serif"
        fontWeight={700}
        letterSpacing="1"
        opacity={0.85}
      >
        {props.orgName.toUpperCase()}
      </text>

      {/* White ring behind border for contrast */}
      <circle
        cx={cx}
        cy={avatarCy}
        r={avatarRadius + 6}
        fill="none"
        stroke="#ffffff"
        strokeWidth={3}
      />

      {/* Large avatar with brand ring */}
      <AvatarCircle
        cx={cx}
        cy={avatarCy}
        radius={avatarRadius}
        imageBase64={props.avatarBase64}
        name={props.customerName}
        borderColor={props.primaryColor}
        borderWidth={6}
        fallbackBg={props.secondaryColor}
      />

      {/* Customer name */}
      <text
        x={cx}
        y={nameY}
        textAnchor="middle"
        fill="#1f2937"
        fontSize={nameFontSize}
        fontFamily="Inter, sans-serif"
        fontWeight={700}
      >
        {props.customerName}
      </text>

      {/* Verified subtitle */}
      <text
        x={cx}
        y={subtitleY}
        textAnchor="middle"
        fill="#6b7280"
        fontSize={nameFontSize - 6}
        fontFamily="Inter, sans-serif"
        fontWeight={400}
      >
        Verified Customer
      </text>

      {/* Dark quote card */}
      <rect
        x={cardX}
        y={cardTop}
        width={cardWidth}
        height={cardHeight}
        rx={cardRadius}
        ry={cardRadius}
        fill="#1f2937"
      />

      {/* Quote text inside card */}
      <text
        x={cx}
        y={cardTextStartY}
        textAnchor="middle"
        fill="#f9fafb"
        fontSize={quoteFontSize}
        fontFamily="Inter, sans-serif"
        fontWeight={400}
        fontStyle="italic"
      >
        {lines.map((line, i) => (
          <tspan key={i} x={cx} dy={i === 0 ? 0 : quoteFontSize * lineHeight}>
            {i === 0 ? `\u201C${line}` : line}
            {i === lines.length - 1 ? "\u201D" : ""}
          </tspan>
        ))}
      </text>

      {/* Stars inside card */}
      <StarRating
        x={starsX}
        y={cardStarsY}
        rating={props.rating}
        starSize={starSize}
        emptyColor="#4b5563"
      />

      {/* Accent line below card */}
      <rect
        x={cx - 40}
        y={cardTop + cardHeight + 15}
        width={80}
        height={4}
        rx={2}
        fill={props.primaryColor}
      />

      {/* Powered by RepWell */}
      <PoweredByBadge
        x={cx}
        y={height - 30}
        fontSize={12}
        color="#9ca3af"
        anchor="middle"
      />
    </svg>
  );
}
