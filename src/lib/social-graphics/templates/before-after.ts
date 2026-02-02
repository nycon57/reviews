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
  const reviews = input.reviews ?? [];
  const reviewA = reviews[0] ?? input.review;
  const reviewB = reviews[1];
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
    backgroundColor: "#f8faf8",
  });

  // Title
  elements.push({
    id: generateId(),
    type: "text",
    x: 0.1,
    y: 0.05,
    width: 0.8,
    height: 0.06,
    rotation: 0,
    zIndex: 2,
    opacity: 1,
    locked: false,
    visible: true,
    text: "What Our Clients Say",
    fontSize: 26,
    fontFamily: "Inter, sans-serif",
    fontWeight: "700",
    color: "#2f3e46",
    textAlign: "center",
  });

  // Subtitle
  elements.push({
    id: generateId(),
    type: "text",
    x: 0.15,
    y: 0.12,
    width: 0.7,
    height: 0.04,
    rotation: 0,
    zIndex: 2,
    opacity: 0.6,
    locked: false,
    visible: true,
    text: "Side-by-side testimonials from real clients",
    fontSize: 14,
    fontFamily: "Inter, sans-serif",
    fontWeight: "400",
    color: "#52796f",
    textAlign: "center",
  });

  // Left card
  elements.push({
    id: generateId(),
    type: "shape",
    x: 0.03,
    y: 0.2,
    width: 0.45,
    height: 0.64,
    rotation: 0,
    zIndex: 1,
    opacity: 1,
    locked: false,
    visible: true,
    shape: "rounded-rect",
    backgroundColor: "#354f52",
    borderRadius: 16,
  });

  // Left rating
  elements.push({
    id: generateId(),
    type: "rating",
    x: 0.08,
    y: 0.24,
    width: 0.18,
    height: 0.04,
    rotation: 0,
    zIndex: 3,
    opacity: 1,
    locked: false,
    visible: true,
    rating: reviewA?.rating ?? 5,
    starColor: "#f5c518",
    starSize: 18,
  });

  // Left quote
  elements.push({
    id: generateId(),
    type: "text",
    x: 0.06,
    y: 0.32,
    width: 0.39,
    height: 0.35,
    rotation: 0,
    zIndex: 3,
    opacity: 1,
    locked: false,
    visible: true,
    text: `"${truncateText(reviewA?.text, 200)}"`,
    fontSize: 16,
    fontFamily: "Inter, sans-serif",
    fontWeight: "400",
    color: "#e0e0e0",
    textAlign: "left",
    lineHeight: 1.6,
  });

  // Left name
  elements.push({
    id: generateId(),
    type: "text",
    x: 0.06,
    y: 0.72,
    width: 0.39,
    height: 0.04,
    rotation: 0,
    zIndex: 3,
    opacity: 0.8,
    locked: false,
    visible: true,
    text: `\u2014 ${reviewA?.customerName ?? "Client A"}`,
    fontSize: 13,
    fontFamily: "Inter, sans-serif",
    fontWeight: "600",
    color: "#84a98c",
    textAlign: "left",
  });

  // Left source
  elements.push({
    id: generateId(),
    type: "text",
    x: 0.06,
    y: 0.77,
    width: 0.39,
    height: 0.03,
    rotation: 0,
    zIndex: 3,
    opacity: 0.5,
    locked: false,
    visible: true,
    text: `via ${reviewA?.source ?? "Google"}`,
    fontSize: 11,
    fontFamily: "Inter, sans-serif",
    fontWeight: "400",
    color: "#cad2c5",
    textAlign: "left",
  });

  // Right card
  elements.push({
    id: generateId(),
    type: "shape",
    x: 0.52,
    y: 0.2,
    width: 0.45,
    height: 0.64,
    rotation: 0,
    zIndex: 1,
    opacity: 1,
    locked: false,
    visible: true,
    shape: "rounded-rect",
    backgroundColor: "#52796f",
    borderRadius: 16,
  });

  // Right rating
  elements.push({
    id: generateId(),
    type: "rating",
    x: 0.57,
    y: 0.24,
    width: 0.18,
    height: 0.04,
    rotation: 0,
    zIndex: 3,
    opacity: 1,
    locked: false,
    visible: true,
    rating: reviewB?.rating ?? 5,
    starColor: "#f5c518",
    starSize: 18,
  });

  // Right quote
  elements.push({
    id: generateId(),
    type: "text",
    x: 0.55,
    y: 0.32,
    width: 0.39,
    height: 0.35,
    rotation: 0,
    zIndex: 3,
    opacity: 1,
    locked: false,
    visible: true,
    text: `"${truncateText(reviewB?.text, 200)}"`,
    fontSize: 16,
    fontFamily: "Inter, sans-serif",
    fontWeight: "400",
    color: "#e0e0e0",
    textAlign: "left",
    lineHeight: 1.6,
  });

  // Right name
  elements.push({
    id: generateId(),
    type: "text",
    x: 0.55,
    y: 0.72,
    width: 0.39,
    height: 0.04,
    rotation: 0,
    zIndex: 3,
    opacity: 0.8,
    locked: false,
    visible: true,
    text: `\u2014 ${reviewB?.customerName ?? "Client B"}`,
    fontSize: 13,
    fontFamily: "Inter, sans-serif",
    fontWeight: "600",
    color: "#84a98c",
    textAlign: "left",
  });

  // Right source
  elements.push({
    id: generateId(),
    type: "text",
    x: 0.55,
    y: 0.77,
    width: 0.39,
    height: 0.03,
    rotation: 0,
    zIndex: 3,
    opacity: 0.5,
    locked: false,
    visible: true,
    text: `via ${reviewB?.source ?? "Zillow"}`,
    fontSize: 11,
    fontFamily: "Inter, sans-serif",
    fontWeight: "400",
    color: "#cad2c5",
    textAlign: "left",
  });

  // Org name
  elements.push({
    id: generateId(),
    type: "text",
    x: 0.1,
    y: 0.9,
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
    color: "#354f52",
    textAlign: "center",
    letterSpacing: 2,
  });

  return elements;
}

export const beforeAfter: Template = {
  metadata: {
    id: "before-after",
    name: "Before & After",
    description: "Side-by-side comparison of two client testimonials",
    category: "review",
    minReviews: 2,
    requiresLoanOfficer: false,
    previewBgColor: "#f8faf8",
  },
  generate,
};
