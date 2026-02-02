import type { CanvasElement, Template, TemplateInput } from "../types";

function generateId(): string {
  return `el-${Math.random().toString(36).slice(2, 10)}`;
}

function truncateText(text: string | null | undefined, maxLen: number): string {
  if (!text) return "";
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 3) + "...";
}

function generate(input: TemplateInput): CanvasElement[] {
  const review = input.review;
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
    backgroundColor: "#2f3e46",
  });

  // Accent bar at top
  elements.push({
    id: generateId(),
    type: "shape",
    x: 0,
    y: 0,
    width: 1,
    height: 0.008,
    rotation: 0,
    zIndex: 1,
    opacity: 1,
    locked: false,
    visible: true,
    shape: "rectangle",
    backgroundColor: "#84a98c",
  });

  // Star rating
  elements.push({
    id: generateId(),
    type: "rating",
    x: 0.5 - 0.15,
    y: 0.12,
    width: 0.3,
    height: 0.06,
    rotation: 0,
    zIndex: 2,
    opacity: 1,
    locked: false,
    visible: true,
    rating: review?.rating ?? 5,
    starColor: "#f5c518",
    starSize: 28,
  });

  // Quote mark
  elements.push({
    id: generateId(),
    type: "text",
    x: 0.08,
    y: 0.2,
    width: 0.12,
    height: 0.1,
    rotation: 0,
    zIndex: 2,
    opacity: 0.3,
    locked: false,
    visible: true,
    text: "\u201C",
    fontSize: 96,
    fontFamily: "Georgia, serif",
    fontWeight: "700",
    color: "#84a98c",
    textAlign: "left",
  });

  // Review text
  elements.push({
    id: generateId(),
    type: "text",
    x: 0.1,
    y: 0.28,
    width: 0.8,
    height: 0.38,
    rotation: 0,
    zIndex: 3,
    opacity: 1,
    locked: false,
    visible: true,
    text: truncateText(review?.text, 280),
    fontSize: 22,
    fontFamily: "Inter, sans-serif",
    fontWeight: "400",
    color: "#ffffff",
    textAlign: "center",
    lineHeight: 1.6,
  });

  // Divider
  elements.push({
    id: generateId(),
    type: "shape",
    x: 0.35,
    y: 0.7,
    width: 0.3,
    height: 0.003,
    rotation: 0,
    zIndex: 2,
    opacity: 0.5,
    locked: false,
    visible: true,
    shape: "rectangle",
    backgroundColor: "#84a98c",
  });

  // Customer name
  elements.push({
    id: generateId(),
    type: "text",
    x: 0.1,
    y: 0.74,
    width: 0.8,
    height: 0.06,
    rotation: 0,
    zIndex: 3,
    opacity: 1,
    locked: false,
    visible: true,
    text: review?.customerName ?? "Happy Customer",
    fontSize: 18,
    fontFamily: "Inter, sans-serif",
    fontWeight: "600",
    color: "#cad2c5",
    textAlign: "center",
  });

  // Source badge
  elements.push({
    id: generateId(),
    type: "text",
    x: 0.3,
    y: 0.82,
    width: 0.4,
    height: 0.04,
    rotation: 0,
    zIndex: 3,
    opacity: 0.7,
    locked: false,
    visible: true,
    text: `via ${review?.source ?? "Google"}`,
    fontSize: 14,
    fontFamily: "Inter, sans-serif",
    fontWeight: "400",
    color: "#84a98c",
    textAlign: "center",
  });

  // Org name at bottom
  elements.push({
    id: generateId(),
    type: "text",
    x: 0.1,
    y: 0.92,
    width: 0.8,
    height: 0.04,
    rotation: 0,
    zIndex: 3,
    opacity: 0.5,
    locked: false,
    visible: true,
    text: input.orgName ?? "Your Company",
    fontSize: 12,
    fontFamily: "Inter, sans-serif",
    fontWeight: "500",
    color: "#cad2c5",
    textAlign: "center",
    letterSpacing: 2,
  });

  return elements;
}

export const fiveStarSpotlight: Template = {
  metadata: {
    id: "five-star-spotlight",
    name: "5-Star Review Spotlight",
    description: "Highlight a single outstanding review with elegant typography",
    category: "review",
    minReviews: 1,
    requiresLoanOfficer: false,
    previewBgColor: "#2f3e46",
  },
  generate,
};
