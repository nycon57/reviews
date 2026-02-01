/**
 * VideoThumbnail Composition (Still)
 *
 * Generates branded thumbnails for video testimonials.
 * This is a static image composition, not a video.
 */

import { AbsoluteFill, Img } from "remotion";
import type { VideoThumbnailProps } from "../types";
import { REPWELL_COLORS } from "../types";
import { withOpacity, generateGradient } from "../utils/colors";

export const VideoThumbnail: React.FC<VideoThumbnailProps> = ({
  customerName,
  quote,
  rating,
  organization,
  loanOfficer,
  customerPhotoUrl,
}) => {
  // Background gradient
  const bgGradient = generateGradient(
    organization.primaryColor || REPWELL_COLORS.teal[400],
    organization.secondaryColor || REPWELL_COLORS.sage[200],
    135
  );

  // Truncate quote if too long
  const truncatedQuote =
    quote.length > 60 ? quote.slice(0, 57) + "..." : quote;

  return (
    <AbsoluteFill style={{ background: bgGradient }}>
      {/* Background decorative elements */}
      <div
        style={{
          position: "absolute",
          top: "-20%",
          right: "-10%",
          width: "50%",
          height: "70%",
          borderRadius: "50%",
          background: withOpacity(REPWELL_COLORS.white, 0.05),
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-30%",
          left: "-15%",
          width: "60%",
          height: "80%",
          borderRadius: "50%",
          background: withOpacity(REPWELL_COLORS.white, 0.03),
        }}
      />

      {/* Play button overlay */}
      <PlayButtonOverlay />

      {/* Content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          padding: "48px 64px",
          zIndex: 1,
        }}
      >
        {/* Organization logo */}
        <div style={{ position: "absolute", top: 24, left: 32 }}>
          {organization.logoUrl ? (
            <Img
              src={organization.logoUrl}
              style={{ height: 40, width: "auto", objectFit: "contain" }}
            />
          ) : (
            <div
              style={{
                fontFamily: "'Source Sans 3', system-ui, sans-serif",
                fontSize: 16,
                fontWeight: 600,
                color: REPWELL_COLORS.white,
              }}
            >
              {organization.name}
            </div>
          )}
        </div>

        {/* Customer photo (if available) */}
        {customerPhotoUrl ? (
          <Img
            src={customerPhotoUrl}
            style={{
              width: 100,
              height: 100,
              borderRadius: "50%",
              objectFit: "cover",
              border: `4px solid ${withOpacity(REPWELL_COLORS.white, 0.5)}`,
              marginBottom: 24,
            }}
          />
        ) : (
          <div
            style={{
              width: 100,
              height: 100,
              borderRadius: "50%",
              background: withOpacity(REPWELL_COLORS.white, 0.15),
              border: `4px solid ${withOpacity(REPWELL_COLORS.white, 0.3)}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 24,
            }}
          >
            <UserIcon size={50} />
          </div>
        )}

        {/* Quote */}
        <div
          style={{
            fontFamily: "'Erstoria', Georgia, serif",
            fontSize: 28,
            fontStyle: "italic",
            color: REPWELL_COLORS.white,
            textAlign: "center",
            maxWidth: "80%",
            lineHeight: 1.4,
            marginBottom: 20,
          }}
        >
          "{truncatedQuote}"
        </div>

        {/* Stars */}
        <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
          {[1, 2, 3, 4, 5].map((star) => (
            <StarIcon key={star} filled={star <= rating} size={24} />
          ))}
        </div>

        {/* Customer name */}
        <div
          style={{
            fontFamily: "'Source Sans 3', system-ui, sans-serif",
            fontSize: 18,
            fontWeight: 600,
            color: REPWELL_COLORS.white,
          }}
        >
          {customerName}
        </div>

        {/* Professional info (bottom right) */}
        <div
          style={{
            position: "absolute",
            bottom: 24,
            right: 32,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          {loanOfficer.photoUrl ? (
            <Img
              src={loanOfficer.photoUrl}
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                objectFit: "cover",
                border: `2px solid ${withOpacity(REPWELL_COLORS.white, 0.5)}`,
              }}
            />
          ) : (
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: withOpacity(REPWELL_COLORS.white, 0.15),
                border: `2px solid ${withOpacity(REPWELL_COLORS.white, 0.3)}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <UserIcon size={20} />
            </div>
          )}
          <div>
            <div
              style={{
                fontFamily: "'Source Sans 3', system-ui, sans-serif",
                fontSize: 12,
                color: withOpacity(REPWELL_COLORS.white, 0.7),
              }}
            >
              Review for
            </div>
            <div
              style={{
                fontFamily: "'Source Sans 3', system-ui, sans-serif",
                fontSize: 14,
                fontWeight: 600,
                color: REPWELL_COLORS.white,
              }}
            >
              {loanOfficer.fullName}
            </div>
          </div>
        </div>

        {/* Video testimonial badge */}
        <div
          style={{
            position: "absolute",
            bottom: 24,
            left: 32,
            background: withOpacity(REPWELL_COLORS.white, 0.15),
            padding: "8px 16px",
            borderRadius: 20,
            fontFamily: "'Source Sans 3', system-ui, sans-serif",
            fontSize: 12,
            fontWeight: 500,
            color: REPWELL_COLORS.white,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <VideoIcon size={14} />
          Video Testimonial
        </div>
      </div>
    </AbsoluteFill>
  );
};

/**
 * Play button overlay
 */
const PlayButtonOverlay: React.FC = () => {
  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: 80,
        height: 80,
        borderRadius: "50%",
        background: withOpacity(REPWELL_COLORS.white, 0.9),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
        zIndex: 10,
      }}
    >
      <svg width={32} height={32} viewBox="0 0 24 24" fill={REPWELL_COLORS.teal[400]}>
        <path d="M8 5v14l11-7z" />
      </svg>
    </div>
  );
};

/**
 * User icon
 */
const UserIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
      stroke={REPWELL_COLORS.white}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle
      cx="12"
      cy="7"
      r="4"
      stroke={REPWELL_COLORS.white}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * Star icon
 */
const StarIcon: React.FC<{ filled: boolean; size: number }> = ({ filled, size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path
      d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
      fill={filled ? "#FFD700" : withOpacity(REPWELL_COLORS.white, 0.3)}
      stroke={filled ? "#FFD700" : "none"}
      strokeWidth="1"
    />
  </svg>
);

/**
 * Video icon
 */
const VideoIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect
      x="2"
      y="5"
      width="14"
      height="14"
      rx="2"
      stroke={REPWELL_COLORS.white}
      strokeWidth="2"
    />
    <path
      d="M16 9L22 5V19L16 15"
      stroke={REPWELL_COLORS.white}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default VideoThumbnail;
