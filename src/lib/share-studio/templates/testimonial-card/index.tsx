/**
 * Template 1: "Testimonial Card" — clean, professional
 *
 * Layout:
 * - Brand-colored top section with org name
 * - Circular avatar overlapping the color boundary
 * - White card body with decorative quote marks
 * - Quote text centered
 * - Star rating + customer name
 * - "Powered by RepWell" badge
 *
 * Works at 1:1 (1080x1080), 9:16 (1080x1920), 16:9 (1920x1080).
 */

import type { TemplateProps } from "../types";
import { wrapText } from "../text-wrap";
import { AvatarCircle } from "../shared/avatar-circle";
import { StarRating, starRatingWidth } from "../shared/star-rating";
import { OpenQuoteMark } from "../shared/quote-marks";
import { PoweredByBadge } from "../shared/powered-by-badge";

export function TestimonialCard(props: TemplateProps) {
  const { width, height } = props;
  const isVertical = height > width;
  const isLandscape = width > height;

  // Responsive layout scaling
  const padding = isVertical ? 60 : isLandscape ? 70 : 60;
  const headerHeight = isVertical ? height * 0.28 : isLandscape ? height * 0.35 : height * 0.3;
  const avatarRadius = isVertical ? 60 : isLandscape ? 55 : 60;
  const quoteFontSize = isVertical ? 28 : isLandscape ? 26 : 30;
  const nameFontSize = isVertical ? 22 : isLandscape ? 20 : 22;
  const orgFontSize = isVertical ? 20 : isLandscape ? 18 : 20;
  const starSize = isVertical ? 28 : isLandscape ? 24 : 28;
  const lineHeight = 1.4;

  const cx = width / 2;
  const avatarCy = headerHeight;

  // Text area: below avatar, above footer
  const textAreaTop = avatarCy + avatarRadius + 30;
  const footerHeight = isVertical ? 140 : 120;
  const textAreaBottom = height - footerHeight;
  const textMaxWidth = width - padding * 2 - 40; // Extra margin for breathing room

  const lines = wrapText(props.quote, textMaxWidth, quoteFontSize);
  const textBlockH = lines.length * quoteFontSize * lineHeight;
  const textStartY = textAreaTop + (textAreaBottom - textAreaTop - textBlockH) / 2;

  // Stars centered
  const starsW = starRatingWidth(starSize, 4);
  const starsX = cx - starsW / 2;
  const starsY = textAreaBottom + 10;

  const nameY = starsY + starSize + 24;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="tc-header-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={props.primaryColor} />
          <stop offset="100%" stopColor={props.secondaryColor} />
        </linearGradient>
      </defs>

      {/* Background */}
      <rect width={width} height={height} fill="#f8f9fa" />

      {/* Header gradient band */}
      <rect width={width} height={headerHeight} fill="url(#tc-header-bg)" />

      {/* Org name in header */}
      <text
        x={padding}
        y={headerHeight * 0.4}
        fill="#ffffff"
        fontSize={orgFontSize}
        fontFamily="Inter, sans-serif"
        fontWeight={700}
        opacity={0.9}
      >
        {props.orgName}
      </text>

      {/* Circular avatar at color boundary */}
      <AvatarCircle
        cx={cx}
        cy={avatarCy}
        radius={avatarRadius}
        imageBase64={props.avatarBase64}
        name={props.customerName}
        borderColor="#ffffff"
        borderWidth={5}
        fallbackBg={props.primaryColor}
      />

      {/* Decorative quote mark */}
      <OpenQuoteMark
        x={padding + 10}
        y={textStartY - 10}
        size={isVertical ? 80 : 60}
        color={props.primaryColor}
        opacity={0.15}
      />

      {/* Quote text */}
      <text
        x={cx}
        y={textStartY + quoteFontSize}
        textAnchor="middle"
        fill="#2f3e46"
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

      {/* Star rating */}
      <StarRating
        x={starsX}
        y={starsY}
        rating={props.rating}
        starSize={starSize}
      />

      {/* Customer name */}
      <text
        x={cx}
        y={nameY}
        textAnchor="middle"
        fill="#2f3e46"
        fontSize={nameFontSize}
        fontFamily="Inter, sans-serif"
        fontWeight={600}
      >
        {props.customerName}
      </text>

      {/* Verified subtitle */}
      <text
        x={cx}
        y={nameY + nameFontSize + 6}
        textAnchor="middle"
        fill="#6b7280"
        fontSize={nameFontSize - 4}
        fontFamily="Inter, sans-serif"
        fontWeight={400}
      >
        Verified Customer
      </text>

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
