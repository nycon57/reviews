/**
 * QuoteReveal Component
 *
 * Typewriter effect for revealing quotes and text with various animation styles.
 */

import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { REPWELL_COLORS } from "../types";

interface QuoteRevealProps {
  /** The text to reveal */
  text: string;
  /** Frame to start the animation */
  startFrame: number;
  /** Animation style */
  style?: "typewriter" | "fade-words" | "slide-up" | "reveal";
  /** Font size in pixels */
  fontSize?: number;
  /** Text color */
  color?: string;
  /** Whether to show quote marks */
  showQuoteMarks?: boolean;
  /** Quote mark color */
  quoteMarkColor?: string;
  /** Text alignment */
  textAlign?: "left" | "center" | "right";
  /** Line height multiplier */
  lineHeight?: number;
  /** Characters revealed per frame (for typewriter) */
  charsPerFrame?: number;
  /** Maximum width in pixels */
  maxWidth?: number;
  /** Font family */
  fontFamily?: "display" | "sans";
  /** Font weight */
  fontWeight?: number;
  /** Whether text should be italic */
  italic?: boolean;
}

export const QuoteReveal: React.FC<QuoteRevealProps> = ({
  text,
  startFrame,
  style = "typewriter",
  fontSize = 36,
  color = REPWELL_COLORS.teal[500],
  showQuoteMarks = true,
  quoteMarkColor = REPWELL_COLORS.sage[200],
  textAlign = "center",
  lineHeight = 1.5,
  charsPerFrame = 2,
  maxWidth = 800,
  fontFamily = "display",
  fontWeight = 400,
  italic = true,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  switch (style) {
    case "typewriter":
      return (
        <TypewriterReveal
          text={text}
          startFrame={startFrame}
          frame={frame}
          fps={fps}
          fontSize={fontSize}
          color={color}
          showQuoteMarks={showQuoteMarks}
          quoteMarkColor={quoteMarkColor}
          textAlign={textAlign}
          lineHeight={lineHeight}
          charsPerFrame={charsPerFrame}
          maxWidth={maxWidth}
          fontFamily={fontFamily}
          fontWeight={fontWeight}
          italic={italic}
        />
      );

    case "fade-words":
      return (
        <FadeWordsReveal
          text={text}
          startFrame={startFrame}
          frame={frame}
          fps={fps}
          fontSize={fontSize}
          color={color}
          showQuoteMarks={showQuoteMarks}
          quoteMarkColor={quoteMarkColor}
          textAlign={textAlign}
          lineHeight={lineHeight}
          maxWidth={maxWidth}
          fontFamily={fontFamily}
          fontWeight={fontWeight}
          italic={italic}
        />
      );

    case "slide-up":
      return (
        <SlideUpReveal
          text={text}
          startFrame={startFrame}
          frame={frame}
          fps={fps}
          fontSize={fontSize}
          color={color}
          showQuoteMarks={showQuoteMarks}
          quoteMarkColor={quoteMarkColor}
          textAlign={textAlign}
          lineHeight={lineHeight}
          maxWidth={maxWidth}
          fontFamily={fontFamily}
          fontWeight={fontWeight}
          italic={italic}
        />
      );

    case "reveal":
    default:
      return (
        <MaskReveal
          text={text}
          startFrame={startFrame}
          frame={frame}
          fps={fps}
          fontSize={fontSize}
          color={color}
          showQuoteMarks={showQuoteMarks}
          quoteMarkColor={quoteMarkColor}
          textAlign={textAlign}
          lineHeight={lineHeight}
          maxWidth={maxWidth}
          fontFamily={fontFamily}
          fontWeight={fontWeight}
          italic={italic}
        />
      );
  }
};

// Common props interface for internal components
interface RevealComponentProps {
  text: string;
  startFrame: number;
  frame: number;
  fps: number;
  fontSize: number;
  color: string;
  showQuoteMarks: boolean;
  quoteMarkColor: string;
  textAlign: "left" | "center" | "right";
  lineHeight: number;
  maxWidth: number;
  fontFamily: "display" | "sans";
  fontWeight: number;
  italic: boolean;
  charsPerFrame?: number;
}

/**
 * Typewriter effect - characters appear one by one
 */
const TypewriterReveal: React.FC<RevealComponentProps> = ({
  text,
  startFrame,
  frame,
  fps,
  fontSize,
  color,
  showQuoteMarks,
  quoteMarkColor,
  textAlign,
  lineHeight,
  charsPerFrame = 2,
  maxWidth,
  fontFamily,
  fontWeight,
  italic,
}) => {
  const elapsedFrames = Math.max(0, frame - startFrame);
  const visibleChars = Math.min(Math.floor(elapsedFrames * charsPerFrame), text.length);
  const displayText = text.slice(0, visibleChars);

  // Cursor blink
  const cursorVisible = visibleChars < text.length && Math.floor(frame / (fps * 0.5)) % 2 === 0;

  const containerStyles = getContainerStyles(maxWidth, textAlign);
  const textStyles = getTextStyles(fontSize, color, lineHeight, fontFamily, fontWeight, italic);

  return (
    <div style={containerStyles}>
      {showQuoteMarks && <QuoteMark color={quoteMarkColor} position="open" fontSize={fontSize} />}
      <span style={textStyles}>
        {displayText}
        {cursorVisible && (
          <span
            style={{
              borderRight: `3px solid ${color}`,
              marginLeft: "2px",
              animation: "none",
            }}
          />
        )}
      </span>
      {showQuoteMarks && visibleChars === text.length && (
        <QuoteMark color={quoteMarkColor} position="close" fontSize={fontSize} />
      )}
    </div>
  );
};

/**
 * Fade words effect - words fade in sequentially
 */
const FadeWordsReveal: React.FC<RevealComponentProps> = ({
  text,
  startFrame,
  frame,
  fps,
  fontSize,
  color,
  showQuoteMarks,
  quoteMarkColor,
  textAlign,
  lineHeight,
  maxWidth,
  fontFamily,
  fontWeight,
  italic,
}) => {
  const words = text.split(" ");
  const framesPerWord = fps * 0.15; // 0.15 seconds per word

  const containerStyles = getContainerStyles(maxWidth, textAlign);
  const textStyles = getTextStyles(fontSize, color, lineHeight, fontFamily, fontWeight, italic);

  return (
    <div style={containerStyles}>
      {showQuoteMarks && <QuoteMark color={quoteMarkColor} position="open" fontSize={fontSize} />}
      <span style={{ ...textStyles, display: "inline" }}>
        {words.map((word, index) => {
          const wordStartFrame = startFrame + index * framesPerWord;
          const progress = interpolate(frame - wordStartFrame, [0, fps * 0.3], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });

          return (
            <span
              key={index}
              style={{
                opacity: progress,
                transform: `translateY(${interpolate(progress, [0, 1], [10, 0])}px)`,
                display: "inline-block",
                marginRight: "0.25em",
              }}
            >
              {word}
            </span>
          );
        })}
      </span>
      {showQuoteMarks && (
        <QuoteMark color={quoteMarkColor} position="close" fontSize={fontSize} />
      )}
    </div>
  );
};

/**
 * Slide up effect - entire text slides up and fades in
 */
const SlideUpReveal: React.FC<RevealComponentProps> = ({
  text,
  startFrame,
  frame,
  fps,
  fontSize,
  color,
  showQuoteMarks,
  quoteMarkColor,
  textAlign,
  lineHeight,
  maxWidth,
  fontFamily,
  fontWeight,
  italic,
}) => {
  const progress = spring({
    frame: frame - startFrame,
    fps,
    config: {
      stiffness: 200,
      damping: 25,
    },
    durationInFrames: fps * 0.8,
  });

  const translateY = interpolate(progress, [0, 1], [40, 0]);
  const opacity = interpolate(progress, [0, 1], [0, 1]);

  const containerStyles = getContainerStyles(maxWidth, textAlign);
  const textStyles = getTextStyles(fontSize, color, lineHeight, fontFamily, fontWeight, italic);

  return (
    <div
      style={{
        ...containerStyles,
        transform: `translateY(${translateY}px)`,
        opacity,
      }}
    >
      {showQuoteMarks && <QuoteMark color={quoteMarkColor} position="open" fontSize={fontSize} />}
      <span style={textStyles}>{text}</span>
      {showQuoteMarks && (
        <QuoteMark color={quoteMarkColor} position="close" fontSize={fontSize} />
      )}
    </div>
  );
};

/**
 * Mask reveal effect - text revealed with gradient mask
 */
const MaskReveal: React.FC<RevealComponentProps> = ({
  text,
  startFrame,
  frame,
  fps,
  fontSize,
  color,
  showQuoteMarks,
  quoteMarkColor,
  textAlign,
  lineHeight,
  maxWidth,
  fontFamily,
  fontWeight,
  italic,
}) => {
  const progress = interpolate(frame - startFrame, [0, fps * 1.5], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const containerStyles = getContainerStyles(maxWidth, textAlign);
  const textStyles = getTextStyles(fontSize, color, lineHeight, fontFamily, fontWeight, italic);

  return (
    <div style={containerStyles}>
      {showQuoteMarks && <QuoteMark color={quoteMarkColor} position="open" fontSize={fontSize} />}
      <span
        style={{
          ...textStyles,
          backgroundImage: `linear-gradient(90deg, ${color} ${progress}%, transparent ${progress}%)`,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: progress >= 100 ? color : "transparent",
          backgroundClip: "text",
        }}
      >
        {text}
      </span>
      {showQuoteMarks && progress >= 100 && (
        <QuoteMark color={quoteMarkColor} position="close" fontSize={fontSize} />
      )}
    </div>
  );
};

/**
 * Quote mark component
 */
const QuoteMark: React.FC<{
  color: string;
  position: "open" | "close";
  fontSize: number;
}> = ({ color, position, fontSize }) => {
  const markStyles: React.CSSProperties = {
    fontFamily: "'Erstoria', Georgia, serif",
    fontSize: `${fontSize * 2}px`,
    color,
    opacity: 0.5,
    lineHeight: 0.5,
    userSelect: "none",
  };

  return <span style={markStyles}>{position === "open" ? "\u201C" : "\u201D"}</span>;
};

// Helper functions
function getContainerStyles(
  maxWidth: number,
  textAlign: "left" | "center" | "right"
): React.CSSProperties {
  return {
    maxWidth,
    textAlign,
    display: "flex",
    flexWrap: "wrap",
    justifyContent: textAlign === "center" ? "center" : textAlign === "right" ? "flex-end" : "flex-start",
    alignItems: "flex-start",
    gap: "0.5em",
  };
}

function getTextStyles(
  fontSize: number,
  color: string,
  lineHeight: number,
  fontFamily: "display" | "sans",
  fontWeight: number,
  italic: boolean
): React.CSSProperties {
  return {
    fontFamily:
      fontFamily === "display"
        ? "'Erstoria', Georgia, serif"
        : "'Source Sans 3', system-ui, sans-serif",
    fontSize: `${fontSize}px`,
    fontWeight,
    fontStyle: italic ? "italic" : "normal",
    color,
    lineHeight,
  };
}

export default QuoteReveal;
