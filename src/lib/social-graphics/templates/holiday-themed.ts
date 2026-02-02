import type { CanvasElement, Template, TemplateInput } from "../types";

function generateId(): string {
  return `el-${Math.random().toString(36).slice(2, 10)}`;
}

function truncateText(text: string | null | undefined, maxLen: number): string {
  if (!text) return "";
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 3) + "...";
}

interface SeasonalTheme {
  emoji: string;
  title: string;
  bgColor: string;
  accentColor: string;
  textColor: string;
  borderColor: string;
}

function getSeasonalTheme(): SeasonalTheme {
  const month = new Date().getMonth();

  // Dec, Jan, Feb - Winter
  if (month === 11 || month === 0 || month === 1) {
    return {
      emoji: "\u2744\ufe0f",
      title: "Holiday Wishes",
      bgColor: "#1a2332",
      accentColor: "#c0392b",
      textColor: "#ffffff",
      borderColor: "#c0392b",
    };
  }
  // Mar, Apr, May - Spring
  if (month >= 2 && month <= 4) {
    return {
      emoji: "\ud83c\udf38",
      title: "Spring Reviews",
      bgColor: "#f0f7f0",
      accentColor: "#52796f",
      textColor: "#2f3e46",
      borderColor: "#84a98c",
    };
  }
  // Jun, Jul, Aug - Summer
  if (month >= 5 && month <= 7) {
    return {
      emoji: "\u2600\ufe0f",
      title: "Summer Highlights",
      bgColor: "#fffbeb",
      accentColor: "#d97706",
      textColor: "#1c1917",
      borderColor: "#f59e0b",
    };
  }
  // Sep, Oct, Nov - Fall
  return {
    emoji: "\ud83c\udf41",
    title: "Autumn Reviews",
    bgColor: "#faf5f0",
    accentColor: "#92400e",
    textColor: "#1c1917",
    borderColor: "#d97706",
  };
}

function generate(input: TemplateInput): CanvasElement[] {
  const review = input.review;
  const theme = getSeasonalTheme();
  const elements: CanvasElement[] = [];

  // Background
  elements.push({
    id: generateId(),
    type: "shape",
    x: 0,
    y: 0,
    width: 1,
    height: 1,
    rotation: 0,
    zIndex: 0,
    opacity: 1,
    locked: true,
    visible: true,
    shape: "rectangle",
    backgroundColor: theme.bgColor,
  });

  // Border frame
  elements.push({
    id: generateId(),
    type: "shape",
    x: 0.03,
    y: 0.03,
    width: 0.94,
    height: 0.94,
    rotation: 0,
    zIndex: 1,
    opacity: 1,
    locked: false,
    visible: true,
    shape: "rounded-rect",
    borderColor: theme.borderColor,
    borderWidth: 2,
    borderRadius: 20,
    backgroundColor: "transparent",
  });

  // Corner decorations (seasonal emoji)
  const corners = [
    { x: 0.05, y: 0.04 },
    { x: 0.85, y: 0.04 },
    { x: 0.05, y: 0.88 },
    { x: 0.85, y: 0.88 },
  ];

  for (const corner of corners) {
    elements.push({
      id: generateId(),
      type: "text",
      x: corner.x,
      y: corner.y,
      width: 0.1,
      height: 0.06,
      rotation: 0,
      zIndex: 2,
      opacity: 0.7,
      locked: false,
      visible: true,
      text: theme.emoji,
      fontSize: 28,
      textAlign: "center",
    });
  }

  // Title
  elements.push({
    id: generateId(),
    type: "text",
    x: 0.1,
    y: 0.1,
    width: 0.8,
    height: 0.07,
    rotation: 0,
    zIndex: 3,
    opacity: 1,
    locked: false,
    visible: true,
    text: theme.title,
    fontSize: 28,
    fontFamily: "Georgia, serif",
    fontWeight: "700",
    color: theme.textColor,
    textAlign: "center",
  });

  // Subtitle
  elements.push({
    id: generateId(),
    type: "text",
    x: 0.15,
    y: 0.18,
    width: 0.7,
    height: 0.04,
    rotation: 0,
    zIndex: 3,
    opacity: 0.6,
    locked: false,
    visible: true,
    text: "from our wonderful clients",
    fontSize: 14,
    fontFamily: "Inter, sans-serif",
    fontWeight: "400",
    color: theme.textColor,
    textAlign: "center",
  });

  // Star rating
  elements.push({
    id: generateId(),
    type: "rating",
    x: 0.35,
    y: 0.26,
    width: 0.3,
    height: 0.05,
    rotation: 0,
    zIndex: 3,
    opacity: 1,
    locked: false,
    visible: true,
    rating: review?.rating ?? 5,
    starColor: "#f5c518",
    starSize: 24,
  });

  // Review text
  elements.push({
    id: generateId(),
    type: "text",
    x: 0.1,
    y: 0.35,
    width: 0.8,
    height: 0.32,
    rotation: 0,
    zIndex: 3,
    opacity: 1,
    locked: false,
    visible: true,
    text: `"${truncateText(review?.text, 250)}"`,
    fontSize: 20,
    fontFamily: "Georgia, serif",
    fontWeight: "400",
    color: theme.textColor,
    textAlign: "center",
    lineHeight: 1.7,
  });

  // Divider
  elements.push({
    id: generateId(),
    type: "shape",
    x: 0.35,
    y: 0.72,
    width: 0.3,
    height: 0.003,
    rotation: 0,
    zIndex: 2,
    opacity: 0.3,
    locked: false,
    visible: true,
    shape: "rectangle",
    backgroundColor: theme.accentColor,
  });

  // Customer name
  elements.push({
    id: generateId(),
    type: "text",
    x: 0.1,
    y: 0.76,
    width: 0.8,
    height: 0.04,
    rotation: 0,
    zIndex: 3,
    opacity: 0.8,
    locked: false,
    visible: true,
    text: review?.customerName ?? "Happy Client",
    fontSize: 16,
    fontFamily: "Inter, sans-serif",
    fontWeight: "600",
    color: theme.accentColor,
    textAlign: "center",
  });

  // Org name
  elements.push({
    id: generateId(),
    type: "text",
    x: 0.1,
    y: 0.82,
    width: 0.8,
    height: 0.04,
    rotation: 0,
    zIndex: 3,
    opacity: 0.4,
    locked: false,
    visible: true,
    text: input.orgName ?? "Your Company",
    fontSize: 12,
    fontFamily: "Inter, sans-serif",
    fontWeight: "500",
    color: theme.textColor,
    textAlign: "center",
    letterSpacing: 2,
  });

  return elements;
}

export const holidayThemed: Template = {
  metadata: {
    id: "holiday-themed",
    name: "Holiday Themed",
    description:
      "Seasonal template with holiday-appropriate graphics and borders",
    category: "seasonal",
    minReviews: 1,
    requiresLoanOfficer: false,
    previewBgColor: "#1a2332",
  },
  generate,
};
