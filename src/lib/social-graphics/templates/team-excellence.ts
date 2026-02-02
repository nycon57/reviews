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
  const stats = input.stats;
  const reviews = (input.reviews ?? []).slice(0, 3);
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

  // Title
  elements.push({
    id: generateId(),
    type: "text",
    x: 0.1,
    y: 0.04,
    width: 0.8,
    height: 0.06,
    rotation: 0,
    zIndex: 2,
    opacity: 1,
    locked: false,
    visible: true,
    text: "Team Excellence",
    fontSize: 28,
    fontFamily: "Inter, sans-serif",
    fontWeight: "700",
    color: "#ffffff",
    textAlign: "center",
  });

  // Subtitle
  elements.push({
    id: generateId(),
    type: "text",
    x: 0.15,
    y: 0.11,
    width: 0.7,
    height: 0.04,
    rotation: 0,
    zIndex: 2,
    opacity: 0.7,
    locked: false,
    visible: true,
    text: "Our team delivers outstanding results",
    fontSize: 14,
    fontFamily: "Inter, sans-serif",
    fontWeight: "400",
    color: "#cad2c5",
    textAlign: "center",
  });

  // Stats bar
  elements.push({
    id: generateId(),
    type: "shape",
    x: 0.05,
    y: 0.18,
    width: 0.9,
    height: 0.1,
    rotation: 0,
    zIndex: 1,
    opacity: 0.15,
    locked: false,
    visible: true,
    shape: "rounded-rect",
    backgroundColor: "#84a98c",
    borderRadius: 12,
  });

  // Stat: Total reviews
  elements.push({
    id: generateId(),
    type: "stats",
    x: 0.08,
    y: 0.19,
    width: 0.25,
    height: 0.08,
    rotation: 0,
    zIndex: 3,
    opacity: 1,
    locked: false,
    visible: true,
    statLabel: "Total Reviews",
    statValue: `${stats?.totalReviews ?? 2450}`,
    color: "#ffffff",
    fontSize: 12,
    fontFamily: "Inter, sans-serif",
  });

  // Stat: Avg rating
  elements.push({
    id: generateId(),
    type: "stats",
    x: 0.37,
    y: 0.19,
    width: 0.25,
    height: 0.08,
    rotation: 0,
    zIndex: 3,
    opacity: 1,
    locked: false,
    visible: true,
    statLabel: "Avg Rating",
    statValue: `${stats?.averageRating?.toFixed(1) ?? "4.9"}`,
    color: "#ffffff",
    fontSize: 12,
    fontFamily: "Inter, sans-serif",
  });

  // Stat: Team size
  elements.push({
    id: generateId(),
    type: "stats",
    x: 0.66,
    y: 0.19,
    width: 0.25,
    height: 0.08,
    rotation: 0,
    zIndex: 3,
    opacity: 1,
    locked: false,
    visible: true,
    statLabel: "Team Members",
    statValue: `${stats?.totalLoanOfficers ?? 25}`,
    color: "#ffffff",
    fontSize: 12,
    fontFamily: "Inter, sans-serif",
  });

  // Top reviews - 3 horizontal cards
  for (let i = 0; i < 3; i++) {
    const review = reviews[i];
    const yBase = 0.32 + i * 0.21;

    // Card bg
    elements.push({
      id: generateId(),
      type: "shape",
      x: 0.05,
      y: yBase,
      width: 0.9,
      height: 0.18,
      rotation: 0,
      zIndex: 1,
      opacity: 1,
      locked: false,
      visible: true,
      shape: "rounded-rect",
      backgroundColor: "#354f52",
      borderRadius: 10,
    });

    // Rating
    elements.push({
      id: generateId(),
      type: "rating",
      x: 0.08,
      y: yBase + 0.02,
      width: 0.12,
      height: 0.03,
      rotation: 0,
      zIndex: 3,
      opacity: 1,
      locked: false,
      visible: true,
      rating: review?.rating ?? 5,
      starColor: "#f5c518",
      starSize: 14,
    });

    // Review text
    elements.push({
      id: generateId(),
      type: "text",
      x: 0.08,
      y: yBase + 0.06,
      width: 0.84,
      height: 0.07,
      rotation: 0,
      zIndex: 3,
      opacity: 1,
      locked: false,
      visible: true,
      text: `"${truncateText(review?.text, 140)}"`,
      fontSize: 13,
      fontFamily: "Inter, sans-serif",
      fontWeight: "400",
      color: "#e0e0e0",
      textAlign: "left",
      lineHeight: 1.5,
    });

    // Customer name
    elements.push({
      id: generateId(),
      type: "text",
      x: 0.08,
      y: yBase + 0.14,
      width: 0.84,
      height: 0.03,
      rotation: 0,
      zIndex: 3,
      opacity: 0.6,
      locked: false,
      visible: true,
      text: `\u2014 ${review?.customerName ?? "Team Client"} | ${review?.loanOfficerName ?? "LO Name"}`,
      fontSize: 11,
      fontFamily: "Inter, sans-serif",
      fontWeight: "500",
      color: "#84a98c",
      textAlign: "right",
    });
  }

  // Org name
  elements.push({
    id: generateId(),
    type: "text",
    x: 0.1,
    y: 0.94,
    width: 0.8,
    height: 0.03,
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

export const teamExcellence: Template = {
  metadata: {
    id: "team-excellence",
    name: "Team Excellence",
    description: "Showcase team performance stats with top client reviews",
    category: "team",
    minReviews: 3,
    requiresLoanOfficer: false,
    previewBgColor: "#2f3e46",
  },
  generate,
};
