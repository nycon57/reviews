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
  const reviews = (input.reviews ?? []).slice(0, 4);
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

  // Header bar
  elements.push({
    id: generateId(),
    type: "shape",
    x: 0,
    y: 0,
    width: 1,
    height: 0.14,
    rotation: 0,
    zIndex: 1,
    opacity: 1,
    locked: false,
    visible: true,
    shape: "rectangle",
    backgroundColor: "#354f52",
  });

  // Title
  elements.push({
    id: generateId(),
    type: "text",
    x: 0.05,
    y: 0.03,
    width: 0.9,
    height: 0.05,
    rotation: 0,
    zIndex: 2,
    opacity: 1,
    locked: false,
    visible: true,
    text: "Monthly Review Roundup",
    fontSize: 26,
    fontFamily: "Inter, sans-serif",
    fontWeight: "700",
    color: "#ffffff",
    textAlign: "center",
  });

  // Subtitle
  elements.push({
    id: generateId(),
    type: "text",
    x: 0.1,
    y: 0.085,
    width: 0.8,
    height: 0.04,
    rotation: 0,
    zIndex: 2,
    opacity: 0.8,
    locked: false,
    visible: true,
    text: `Top ${reviews.length} reviews this month`,
    fontSize: 14,
    fontFamily: "Inter, sans-serif",
    fontWeight: "400",
    color: "#cad2c5",
    textAlign: "center",
  });

  // 2x2 grid of review cards
  const positions = [
    { x: 0.03, y: 0.17 },
    { x: 0.52, y: 0.17 },
    { x: 0.03, y: 0.55 },
    { x: 0.52, y: 0.55 },
  ];

  const cardW = 0.45;
  const cardH = 0.34;

  for (let i = 0; i < 4; i++) {
    const review = reviews[i];
    const pos = positions[i];

    // Card background
    elements.push({
      id: generateId(),
      type: "shape",
      x: pos.x,
      y: pos.y,
      width: cardW,
      height: cardH,
      rotation: 0,
      zIndex: 1,
      opacity: 1,
      locked: false,
      visible: true,
      shape: "rounded-rect",
      backgroundColor: "#ffffff",
      borderColor: "#e2e8f0",
      borderWidth: 1,
      borderRadius: 12,
    });

    // Star rating
    elements.push({
      id: generateId(),
      type: "rating",
      x: pos.x + 0.02,
      y: pos.y + 0.02,
      width: 0.15,
      height: 0.04,
      rotation: 0,
      zIndex: 2,
      opacity: 1,
      locked: false,
      visible: true,
      rating: review?.rating ?? 5,
      starColor: "#f5c518",
      starSize: 16,
    });

    // Review text
    elements.push({
      id: generateId(),
      type: "text",
      x: pos.x + 0.02,
      y: pos.y + 0.08,
      width: cardW - 0.04,
      height: 0.18,
      rotation: 0,
      zIndex: 2,
      opacity: 1,
      locked: false,
      visible: true,
      text: review ? `"${truncateText(review.text, 120)}"` : '"Great experience!"',
      fontSize: 13,
      fontFamily: "Inter, sans-serif",
      fontWeight: "400",
      color: "#354f52",
      textAlign: "left",
      lineHeight: 1.5,
    });

    // Customer name
    elements.push({
      id: generateId(),
      type: "text",
      x: pos.x + 0.02,
      y: pos.y + cardH - 0.06,
      width: cardW - 0.04,
      height: 0.04,
      rotation: 0,
      zIndex: 2,
      opacity: 0.7,
      locked: false,
      visible: true,
      text: `\u2014 ${review?.customerName ?? "Customer"}`,
      fontSize: 12,
      fontFamily: "Inter, sans-serif",
      fontWeight: "500",
      color: "#52796f",
      textAlign: "right",
    });
  }

  // Org name footer
  elements.push({
    id: generateId(),
    type: "text",
    x: 0.1,
    y: 0.93,
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
    color: "#354f52",
    textAlign: "center",
    letterSpacing: 2,
  });

  return elements;
}

export const monthlyRoundup: Template = {
  metadata: {
    id: "monthly-roundup",
    name: "Monthly Review Roundup",
    description: "Showcase your top 4 reviews in an elegant grid layout",
    category: "review",
    minReviews: 4,
    requiresLoanOfficer: false,
    previewBgColor: "#f8faf8",
  },
  generate,
};
