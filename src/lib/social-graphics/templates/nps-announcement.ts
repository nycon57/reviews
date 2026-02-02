import type { CanvasElement, Template, TemplateInput } from "../types";

function generateId(): string {
  return `el-${Math.random().toString(36).slice(2, 10)}`;
}

function getNpsCategory(score: number): { label: string; color: string } {
  if (score >= 70) return { label: "Excellent", color: "#22c55e" };
  if (score >= 50) return { label: "Great", color: "#84a98c" };
  if (score >= 0) return { label: "Good", color: "#f5c518" };
  return { label: "Needs Improvement", color: "#ef4444" };
}

function generate(input: TemplateInput): CanvasElement[] {
  const stats = input.stats;
  const npsScore = stats?.npsScore ?? 72;
  const npsInfo = getNpsCategory(npsScore);
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
    backgroundColor: "#ffffff",
  });

  // Top accent
  elements.push({
    id: generateId(),
    type: "shape",
    x: 0,
    y: 0,
    width: 1,
    height: 0.006,
    rotation: 0,
    zIndex: 1,
    opacity: 1,
    locked: false,
    visible: true,
    shape: "rectangle",
    backgroundColor: "#52796f",
  });

  // "NPS Score" label
  elements.push({
    id: generateId(),
    type: "text",
    x: 0.1,
    y: 0.06,
    width: 0.8,
    height: 0.05,
    rotation: 0,
    zIndex: 2,
    opacity: 0.6,
    locked: false,
    visible: true,
    text: "NET PROMOTER SCORE",
    fontSize: 14,
    fontFamily: "Inter, sans-serif",
    fontWeight: "600",
    color: "#52796f",
    textAlign: "center",
    letterSpacing: 3,
  });

  // NPS gauge background circle
  elements.push({
    id: generateId(),
    type: "shape",
    x: 0.3,
    y: 0.14,
    width: 0.4,
    height: 0.4,
    rotation: 0,
    zIndex: 1,
    opacity: 0.08,
    locked: false,
    visible: true,
    shape: "circle",
    backgroundColor: "#52796f",
  });

  // Big NPS number
  elements.push({
    id: generateId(),
    type: "text",
    x: 0.2,
    y: 0.22,
    width: 0.6,
    height: 0.18,
    rotation: 0,
    zIndex: 3,
    opacity: 1,
    locked: false,
    visible: true,
    text: `${npsScore}`,
    fontSize: 80,
    fontFamily: "Inter, sans-serif",
    fontWeight: "800",
    color: "#2f3e46",
    textAlign: "center",
  });

  // NPS category label
  elements.push({
    id: generateId(),
    type: "text",
    x: 0.2,
    y: 0.42,
    width: 0.6,
    height: 0.05,
    rotation: 0,
    zIndex: 3,
    opacity: 1,
    locked: false,
    visible: true,
    text: npsInfo.label,
    fontSize: 18,
    fontFamily: "Inter, sans-serif",
    fontWeight: "600",
    color: npsInfo.color,
    textAlign: "center",
  });

  // Divider
  elements.push({
    id: generateId(),
    type: "shape",
    x: 0.2,
    y: 0.56,
    width: 0.6,
    height: 0.002,
    rotation: 0,
    zIndex: 2,
    opacity: 0.2,
    locked: false,
    visible: true,
    shape: "rectangle",
    backgroundColor: "#354f52",
  });

  // Stats row
  elements.push({
    id: generateId(),
    type: "stats",
    x: 0.05,
    y: 0.62,
    width: 0.28,
    height: 0.1,
    rotation: 0,
    zIndex: 3,
    opacity: 1,
    locked: false,
    visible: true,
    statLabel: "Total Reviews",
    statValue: `${stats?.totalReviews ?? 1234}`,
    color: "#354f52",
    fontSize: 13,
    fontFamily: "Inter, sans-serif",
  });

  elements.push({
    id: generateId(),
    type: "stats",
    x: 0.36,
    y: 0.62,
    width: 0.28,
    height: 0.1,
    rotation: 0,
    zIndex: 3,
    opacity: 1,
    locked: false,
    visible: true,
    statLabel: "Avg Rating",
    statValue: `${stats?.averageRating?.toFixed(1) ?? "4.8"}`,
    color: "#354f52",
    fontSize: 13,
    fontFamily: "Inter, sans-serif",
  });

  elements.push({
    id: generateId(),
    type: "stats",
    x: 0.67,
    y: 0.62,
    width: 0.28,
    height: 0.1,
    rotation: 0,
    zIndex: 3,
    opacity: 1,
    locked: false,
    visible: true,
    statLabel: "5-Star",
    statValue: `${stats?.fiveStarCount ?? 980}`,
    color: "#354f52",
    fontSize: 13,
    fontFamily: "Inter, sans-serif",
  });

  // Message
  elements.push({
    id: generateId(),
    type: "text",
    x: 0.1,
    y: 0.8,
    width: 0.8,
    height: 0.06,
    rotation: 0,
    zIndex: 3,
    opacity: 0.7,
    locked: false,
    visible: true,
    text: "Our clients love us. Here's the proof.",
    fontSize: 16,
    fontFamily: "Inter, sans-serif",
    fontWeight: "400",
    color: "#52796f",
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
    color: "#354f52",
    textAlign: "center",
    letterSpacing: 2,
  });

  return elements;
}

export const npsAnnouncement: Template = {
  metadata: {
    id: "nps-announcement",
    name: "NPS Score Announcement",
    description: "Display your NPS score with a gauge and key performance stats",
    category: "stats",
    minReviews: 0,
    requiresLoanOfficer: false,
    previewBgColor: "#ffffff",
  },
  generate,
};
