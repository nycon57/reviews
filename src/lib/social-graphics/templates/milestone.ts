import type { CanvasElement, Template, TemplateInput } from "../types";

function generateId(): string {
  return `el-${Math.random().toString(36).slice(2, 10)}`;
}

function generate(input: TemplateInput): CanvasElement[] {
  const stats = input.stats;
  const totalReviews = stats?.totalReviews ?? 500;
  const avgRating = stats?.averageRating?.toFixed(1) ?? "4.8";
  const elements: CanvasElement[] = [];

  // Background gradient (simulated with overlapping shapes)
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

  // Decorative circle top-right
  elements.push({
    id: generateId(),
    type: "shape",
    x: 0.7,
    y: -0.1,
    width: 0.4,
    height: 0.4,
    rotation: 0,
    zIndex: 1,
    opacity: 0.08,
    locked: false,
    visible: true,
    shape: "circle",
    backgroundColor: "#84a98c",
  });

  // Decorative circle bottom-left
  elements.push({
    id: generateId(),
    type: "shape",
    x: -0.1,
    y: 0.7,
    width: 0.35,
    height: 0.35,
    rotation: 0,
    zIndex: 1,
    opacity: 0.06,
    locked: false,
    visible: true,
    shape: "circle",
    backgroundColor: "#52796f",
  });

  // Celebration emoji
  elements.push({
    id: generateId(),
    type: "text",
    x: 0.4,
    y: 0.08,
    width: 0.2,
    height: 0.1,
    rotation: 0,
    zIndex: 2,
    opacity: 1,
    locked: false,
    visible: true,
    text: "\ud83c\udf89",
    fontSize: 48,
    fontFamily: "Inter, sans-serif",
    textAlign: "center",
  });

  // Milestone label
  elements.push({
    id: generateId(),
    type: "text",
    x: 0.1,
    y: 0.2,
    width: 0.8,
    height: 0.06,
    rotation: 0,
    zIndex: 2,
    opacity: 0.8,
    locked: false,
    visible: true,
    text: "MILESTONE REACHED",
    fontSize: 16,
    fontFamily: "Inter, sans-serif",
    fontWeight: "600",
    color: "#84a98c",
    textAlign: "center",
    letterSpacing: 4,
  });

  // Big number
  elements.push({
    id: generateId(),
    type: "text",
    x: 0.1,
    y: 0.3,
    width: 0.8,
    height: 0.2,
    rotation: 0,
    zIndex: 3,
    opacity: 1,
    locked: false,
    visible: true,
    text: `${totalReviews}`,
    fontSize: 72,
    fontFamily: "Inter, sans-serif",
    fontWeight: "800",
    color: "#ffffff",
    textAlign: "center",
  });

  // "Reviews" label
  elements.push({
    id: generateId(),
    type: "text",
    x: 0.2,
    y: 0.5,
    width: 0.6,
    height: 0.06,
    rotation: 0,
    zIndex: 3,
    opacity: 1,
    locked: false,
    visible: true,
    text: "5-Star Reviews & Counting",
    fontSize: 20,
    fontFamily: "Inter, sans-serif",
    fontWeight: "500",
    color: "#cad2c5",
    textAlign: "center",
  });

  // Divider
  elements.push({
    id: generateId(),
    type: "shape",
    x: 0.3,
    y: 0.62,
    width: 0.4,
    height: 0.003,
    rotation: 0,
    zIndex: 2,
    opacity: 0.4,
    locked: false,
    visible: true,
    shape: "rectangle",
    backgroundColor: "#84a98c",
  });

  // Average rating stat
  elements.push({
    id: generateId(),
    type: "stats",
    x: 0.15,
    y: 0.68,
    width: 0.3,
    height: 0.08,
    rotation: 0,
    zIndex: 3,
    opacity: 1,
    locked: false,
    visible: true,
    statLabel: "Average Rating",
    statValue: avgRating,
    color: "#cad2c5",
    fontSize: 14,
    fontFamily: "Inter, sans-serif",
  });

  // 5-star count
  elements.push({
    id: generateId(),
    type: "stats",
    x: 0.55,
    y: 0.68,
    width: 0.3,
    height: 0.08,
    rotation: 0,
    zIndex: 3,
    opacity: 1,
    locked: false,
    visible: true,
    statLabel: "5-Star Reviews",
    statValue: `${stats?.fiveStarCount ?? Math.round(totalReviews * 0.85)}`,
    color: "#cad2c5",
    fontSize: 14,
    fontFamily: "Inter, sans-serif",
  });

  // Thank you message
  elements.push({
    id: generateId(),
    type: "text",
    x: 0.1,
    y: 0.82,
    width: 0.8,
    height: 0.06,
    rotation: 0,
    zIndex: 3,
    opacity: 0.8,
    locked: false,
    visible: true,
    text: "Thank you to all our amazing clients!",
    fontSize: 16,
    fontFamily: "Inter, sans-serif",
    fontWeight: "400",
    color: "#84a98c",
    textAlign: "center",
  });

  // Org name
  elements.push({
    id: generateId(),
    type: "text",
    x: 0.1,
    y: 0.92,
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
    color: "#cad2c5",
    textAlign: "center",
    letterSpacing: 2,
  });

  return elements;
}

export const milestoneTemplate: Template = {
  metadata: {
    id: "milestone",
    name: "Milestone Celebration",
    description: "Celebrate reaching a review count milestone",
    category: "stats",
    minReviews: 0,
    requiresLoanOfficer: false,
    previewBgColor: "#2f3e46",
  },
  generate,
};
