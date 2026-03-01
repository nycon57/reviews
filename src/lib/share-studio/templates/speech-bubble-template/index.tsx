/**
 * Template 2: "Speech Bubble" — conversational, friendly
 *
 * Layout:
 * - Brand gradient top half with "Client Testimonial" header
 * - Circular avatar at the boundary
 * - White speech bubble shape containing the quote
 * - Star rating inside the bubble
 * - Customer name below the bubble
 * - Optional CTA button at bottom
 * - "Powered by RepWell" badge
 *
 * Works at 1:1 (1080x1080), 9:16 (1080x1920), 16:9 (1920x1080).
 */

import type { TemplateProps } from "../types";
import { wrapText } from "../text-wrap";
import { AvatarCircle } from "../shared/avatar-circle";
import { StarRating, starRatingWidth } from "../shared/star-rating";
import { SpeechBubble } from "../shared/speech-bubble";
import { CtaButton } from "../shared/cta-button";
import { PoweredByBadge } from "../shared/powered-by-badge";

export function SpeechBubbleTemplate(props: TemplateProps) {
  const { width, height } = props;
  const isVertical = height > width;
  const isLandscape = width > height;

  // Responsive layout
  const padding = isVertical ? 50 : isLandscape ? 60 : 50;
  const gradientHeight = isVertical ? height * 0.32 : isLandscape ? height * 0.38 : height * 0.35;
  const avatarRadius = isVertical ? 50 : isLandscape ? 45 : 50;
  const quoteFontSize = isVertical ? 26 : isLandscape ? 24 : 28;
  const nameFontSize = isVertical ? 22 : isLandscape ? 18 : 20;
  const headerFontSize = isVertical ? 18 : isLandscape ? 16 : 16;
  const starSize = isVertical ? 26 : isLandscape ? 22 : 26;
  const lineHeight = 1.4;
  const cx = width / 2;

  // Bubble dimensions
  const bubblePadding = isVertical ? 50 : isLandscape ? 40 : 50;
  const bubbleX = padding;
  const bubbleWidth = width - padding * 2;
  const bubbleTop = gradientHeight + avatarRadius + 20;
  const bubbleInnerWidth = bubbleWidth - bubblePadding * 2;

  // Wrap quote text
  const lines = wrapText(props.quote, bubbleInnerWidth, quoteFontSize);
  const textBlockH = lines.length * quoteFontSize * lineHeight;

  // Bubble height = padding + text + stars + padding
  const starsH = starSize + 20;
  const bubbleContentH = bubblePadding + textBlockH + 20 + starsH + bubblePadding;
  const bubbleHeight = Math.max(bubbleContentH, isVertical ? 200 : 160);
  const bubbleTailH = 25;

  // Positions inside bubble
  const textStartY = bubbleTop + bubblePadding + quoteFontSize;
  const starsY = bubbleTop + bubblePadding + textBlockH + 20;
  const starsW = starRatingWidth(starSize, 4);
  const starsX = cx - starsW / 2;

  // Below bubble
  const belowBubble = bubbleTop + bubbleHeight + bubbleTailH + 20;
  const nameY = belowBubble;

  // CTA
  const showCta = !!props.ctaText;
  const ctaY = nameY + nameFontSize + 30;
  const ctaWidth = Math.min(280, width - padding * 2);
  const ctaHeight = 48;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="sb-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={props.primaryColor} />
          <stop offset="100%" stopColor={props.secondaryColor} />
        </linearGradient>
      </defs>

      {/* Full background */}
      <rect width={width} height={height} fill="#f5f5f5" />

      {/* Gradient top section */}
      <rect width={width} height={gradientHeight} fill="url(#sb-grad)" />

      {/* Header text */}
      <text
        x={cx}
        y={gradientHeight * 0.35}
        textAnchor="middle"
        fill="#ffffff"
        fontSize={headerFontSize}
        fontFamily="Inter, sans-serif"
        fontWeight={600}
        letterSpacing="2"
        opacity={0.85}
      >
        CLIENT TESTIMONIAL
      </text>

      {/* Org name */}
      <text
        x={cx}
        y={gradientHeight * 0.35 + headerFontSize + 12}
        textAnchor="middle"
        fill="#ffffff"
        fontSize={headerFontSize + 6}
        fontFamily="Inter, sans-serif"
        fontWeight={700}
      >
        {props.orgName}
      </text>

      {/* Avatar at gradient boundary */}
      <AvatarCircle
        cx={cx}
        cy={gradientHeight}
        radius={avatarRadius}
        imageBase64={props.avatarBase64}
        name={props.customerName}
        borderColor="#ffffff"
        borderWidth={5}
        fallbackBg={props.primaryColor}
      />

      {/* Speech bubble */}
      <SpeechBubble
        x={bubbleX}
        y={bubbleTop}
        width={bubbleWidth}
        height={bubbleHeight}
        cornerRadius={24}
        tailHeight={bubbleTailH}
        tailWidth={35}
        fill="#ffffff"
      />

      {/* Quote text inside bubble */}
      <text
        x={cx}
        y={textStartY}
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

      {/* Stars inside bubble */}
      <StarRating
        x={starsX}
        y={starsY}
        rating={props.rating}
        starSize={starSize}
      />

      {/* Customer name below bubble */}
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
        y={nameY + nameFontSize + 4}
        textAnchor="middle"
        fill="#6b7280"
        fontSize={nameFontSize - 4}
        fontFamily="Inter, sans-serif"
      >
        Verified Customer
      </text>

      {/* Optional CTA */}
      {showCta && (
        <CtaButton
          x={cx - ctaWidth / 2}
          y={ctaY}
          width={ctaWidth}
          height={ctaHeight}
          label={props.ctaText!}
          fillColor={props.primaryColor}
          cornerRadius={ctaHeight / 2}
        />
      )}

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
