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
  const lo = input.loanOfficer;
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
    backgroundColor: "#354f52",
  });

  // Left accent strip
  elements.push({
    id: generateId(),
    type: "shape",
    x: 0,
    y: 0,
    width: 0.005,
    height: 1,
    rotation: 0,
    zIndex: 1,
    opacity: 1,
    locked: false,
    visible: true,
    shape: "rectangle",
    backgroundColor: "#84a98c",
  });

  // LO photo placeholder circle
  const avatarCircle: CanvasElement = {
    id: generateId(),
    type: "shape",
    x: 0.38,
    y: 0.06,
    width: 0.24,
    height: 0.24,
    rotation: 0,
    zIndex: 2,
    opacity: 1,
    locked: false,
    visible: true,
    shape: "circle",
    backgroundColor: "#52796f",
  };
  if (lo?.avatarUrl) {
    avatarCircle.imageUrl = lo.avatarUrl;
    avatarCircle.objectFit = "cover";
  }
  elements.push(avatarCircle);

  // LO name
  elements.push({
    id: generateId(),
    type: "text",
    x: 0.1,
    y: 0.32,
    width: 0.8,
    height: 0.06,
    rotation: 0,
    zIndex: 3,
    opacity: 1,
    locked: false,
    visible: true,
    text: lo?.fullName ?? "Loan Officer Name",
    fontSize: 24,
    fontFamily: "Inter, sans-serif",
    fontWeight: "700",
    color: "#ffffff",
    textAlign: "center",
  });

  // Stats row
  const avgRating = lo?.averageRating?.toFixed(1) ?? "4.9";
  const totalReviews = lo?.totalReviews ?? 150;

  elements.push({
    id: generateId(),
    type: "stats",
    x: 0.15,
    y: 0.4,
    width: 0.3,
    height: 0.06,
    rotation: 0,
    zIndex: 3,
    opacity: 1,
    locked: false,
    visible: true,
    statLabel: "Avg Rating",
    statValue: `${avgRating} / 5.0`,
    color: "#cad2c5",
    fontSize: 14,
    fontFamily: "Inter, sans-serif",
  });

  elements.push({
    id: generateId(),
    type: "stats",
    x: 0.55,
    y: 0.4,
    width: 0.3,
    height: 0.06,
    rotation: 0,
    zIndex: 3,
    opacity: 1,
    locked: false,
    visible: true,
    statLabel: "Total Reviews",
    statValue: `${totalReviews}`,
    color: "#cad2c5",
    fontSize: 14,
    fontFamily: "Inter, sans-serif",
  });

  // Divider
  elements.push({
    id: generateId(),
    type: "shape",
    x: 0.1,
    y: 0.5,
    width: 0.8,
    height: 0.002,
    rotation: 0,
    zIndex: 2,
    opacity: 0.3,
    locked: false,
    visible: true,
    shape: "rectangle",
    backgroundColor: "#84a98c",
  });

  // Star rating
  elements.push({
    id: generateId(),
    type: "rating",
    x: 0.35,
    y: 0.54,
    width: 0.3,
    height: 0.05,
    rotation: 0,
    zIndex: 3,
    opacity: 1,
    locked: false,
    visible: true,
    rating: review?.rating ?? 5,
    starColor: "#f5c518",
    starSize: 22,
  });

  // Best review text
  elements.push({
    id: generateId(),
    type: "text",
    x: 0.08,
    y: 0.62,
    width: 0.84,
    height: 0.2,
    rotation: 0,
    zIndex: 3,
    opacity: 1,
    locked: false,
    visible: true,
    text: `"${truncateText(review?.text, 200)}"`,
    fontSize: 18,
    fontFamily: "Inter, sans-serif",
    fontWeight: "400",
    color: "#e0e0e0",
    textAlign: "center",
    lineHeight: 1.6,
  });

  // Customer name
  elements.push({
    id: generateId(),
    type: "text",
    x: 0.1,
    y: 0.84,
    width: 0.8,
    height: 0.04,
    rotation: 0,
    zIndex: 3,
    opacity: 0.7,
    locked: false,
    visible: true,
    text: `\u2014 ${review?.customerName ?? "Happy Customer"}`,
    fontSize: 14,
    fontFamily: "Inter, sans-serif",
    fontWeight: "500",
    color: "#84a98c",
    textAlign: "center",
  });

  // Org name
  elements.push({
    id: generateId(),
    type: "text",
    x: 0.1,
    y: 0.93,
    width: 0.8,
    height: 0.04,
    rotation: 0,
    zIndex: 3,
    opacity: 0.4,
    locked: false,
    visible: true,
    text: input.orgName ?? "Your Company",
    fontSize: 11,
    fontFamily: "Inter, sans-serif",
    fontWeight: "500",
    color: "#cad2c5",
    textAlign: "center",
    letterSpacing: 2,
  });

  return elements;
}

export const loSpotlight: Template = {
  metadata: {
    id: "lo-spotlight",
    name: "LO Spotlight",
    description:
      "Feature a loan officer with their photo, stats, and best review",
    category: "team",
    minReviews: 1,
    requiresLoanOfficer: true,
    previewBgColor: "#354f52",
  },
  generate,
};
