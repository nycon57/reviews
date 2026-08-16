/**
 * EndCard Component
 *
 * Closing segment of a Clip: the professional's contact block plus a QR code
 * pointing at the review's smart link, so a viewer can act immediately.
 * Replaces the generic BrandedOutro when contact data is available.
 */

import { useCurrentFrame, useVideoConfig, interpolate, spring, Img } from "remotion";
import QRCode from "react-qr-code";
import type { EndCardContact, OrganizationBranding, VideoFormat } from "../types";
import { REPWELL_COLORS } from "../types";
import { withOpacity, generateGradient } from "../utils/colors";

interface EndCardProps {
  contact: EndCardContact;
  organization: OrganizationBranding;
  format: VideoFormat;
  /** Start frame of the end card within the composition */
  startFrame: number;
}

function useReveal(relativeFrame: number, fps: number, delaySec: number) {
  const progress = spring({
    frame: relativeFrame - fps * delaySec,
    fps,
    config: { stiffness: 200, damping: 24 },
    durationInFrames: Math.floor(fps * 0.5),
  });
  return {
    opacity: interpolate(progress, [0, 1], [0, 1]),
    translateY: interpolate(progress, [0, 1], [18, 0]),
    scale: interpolate(progress, [0, 1], [0.92, 1]),
  };
}

export const EndCard: React.FC<EndCardProps> = ({
  contact,
  organization,
  format,
  startFrame,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const relativeFrame = frame - startFrame;

  const isVertical = format === "9:16";

  const bgGradient = generateGradient(
    organization.primaryColor || REPWELL_COLORS.teal[400],
    organization.secondaryColor || REPWELL_COLORS.sage[200],
    135
  );

  const bgOpacity = interpolate(relativeFrame, [0, fps * 0.4], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const identity = useReveal(relativeFrame, fps, 0.25);
  const cta = useReveal(relativeFrame, fps, 0.7);
  const qr = useReveal(relativeFrame, fps, 1.0);

  const photoSize = isVertical ? 168 : 132;
  const qrSize = isVertical ? 230 : 180;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: bgGradient,
        opacity: bgOpacity,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: isVertical ? 44 : 32,
        padding: isVertical ? "80px 48px" : "56px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Soft decorative circles */}
      <div
        style={{
          position: "absolute",
          top: "-18%",
          left: "-12%",
          width: "55%",
          height: "55%",
          borderRadius: "50%",
          background: withOpacity(REPWELL_COLORS.white, 0.05),
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-25%",
          right: "-18%",
          width: "70%",
          height: "70%",
          borderRadius: "50%",
          background: withOpacity(REPWELL_COLORS.white, 0.04),
        }}
      />

      {/* Identity */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 20,
          opacity: identity.opacity,
          transform: `translateY(${identity.translateY}px)`,
          zIndex: 1,
        }}
      >
        {contact.professionalPhotoUrl ? (
          <Img
            src={contact.professionalPhotoUrl}
            style={{
              width: photoSize,
              height: photoSize,
              borderRadius: "50%",
              objectFit: "cover",
              border: `5px solid ${withOpacity(REPWELL_COLORS.white, 0.85)}`,
            }}
          />
        ) : (
          <div
            style={{
              width: photoSize,
              height: photoSize,
              borderRadius: "50%",
              background: withOpacity(REPWELL_COLORS.white, 0.18),
              border: `5px solid ${withOpacity(REPWELL_COLORS.white, 0.85)}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "'Erstoria', Georgia, serif",
              fontSize: photoSize * 0.4,
              color: REPWELL_COLORS.white,
            }}
          >
            {contact.professionalName.charAt(0)}
          </div>
        )}

        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontFamily: "'Erstoria', Georgia, serif",
              fontSize: isVertical ? 52 : 44,
              color: REPWELL_COLORS.white,
              textShadow: "0 2px 8px rgba(0,0,0,0.18)",
            }}
          >
            {contact.professionalName}
          </div>
          {contact.professionalTitle && (
            <div
              style={{
                marginTop: 8,
                fontFamily: "'Source Sans 3', system-ui, sans-serif",
                fontSize: isVertical ? 26 : 22,
                fontWeight: 500,
                color: withOpacity(REPWELL_COLORS.white, 0.88),
              }}
            >
              {contact.professionalTitle}
              {organization.name ? ` · ${organization.name}` : ""}
            </div>
          )}
        </div>
      </div>

      {/* CTA */}
      <div
        style={{
          opacity: cta.opacity,
          transform: `translateY(${cta.translateY}px)`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 14,
          zIndex: 1,
        }}
      >
        <div
          style={{
            fontFamily: "'Source Sans 3', system-ui, sans-serif",
            fontSize: isVertical ? 30 : 26,
            fontWeight: 700,
            color: organization.primaryColor || REPWELL_COLORS.teal[400],
            background: REPWELL_COLORS.white,
            padding: "16px 36px",
            borderRadius: 999,
            boxShadow: "0 6px 24px rgba(0,0,0,0.18)",
          }}
        >
          {contact.ctaText || `Work with ${contact.professionalName.split(" ")[0]}`}
        </div>
        {(contact.phone || contact.website) && (
          <div
            style={{
              fontFamily: "'Source Sans 3', system-ui, sans-serif",
              fontSize: isVertical ? 22 : 18,
              fontWeight: 500,
              color: withOpacity(REPWELL_COLORS.white, 0.9),
              display: "flex",
              gap: 18,
            }}
          >
            {contact.phone && <span>{contact.phone}</span>}
            {contact.website && <span>{contact.website}</span>}
          </div>
        )}
      </div>

      {/* QR to smart link */}
      {contact.qrUrl && (
        <div
          style={{
            opacity: qr.opacity,
            transform: `scale(${qr.scale})`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
            zIndex: 1,
          }}
        >
          <div
            style={{
              background: REPWELL_COLORS.white,
              padding: 16,
              borderRadius: 16,
              boxShadow: "0 6px 24px rgba(0,0,0,0.18)",
              display: "flex",
            }}
          >
            <QRCode
              value={contact.qrUrl}
              size={qrSize}
              fgColor={REPWELL_COLORS.teal[500]}
              bgColor={REPWELL_COLORS.white}
            />
          </div>
          <div
            style={{
              fontFamily: "'Source Sans 3', system-ui, sans-serif",
              fontSize: isVertical ? 20 : 16,
              fontWeight: 500,
              color: withOpacity(REPWELL_COLORS.white, 0.85),
            }}
          >
            Scan to read the full review
          </div>
        </div>
      )}

      {/* Org logo, quiet corner placement */}
      {organization.logoUrl && (
        <Img
          src={organization.logoUrl}
          style={{
            position: "absolute",
            bottom: 28,
            right: 32,
            height: isVertical ? 44 : 36,
            width: "auto",
            maxWidth: 200,
            objectFit: "contain",
            opacity: 0.85,
          }}
        />
      )}
    </div>
  );
};

export default EndCard;
