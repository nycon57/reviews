// ── SMS Analytics Types ─────────────────────────────────────────────

export interface SmsAnalyticsSummary {
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  totalClicks: number;
  totalReviewsGenerated: number;
  totalCostCents: number;
  deliveryRate: number;
  clickRate: number;
  conversionRate: number;
  costPerReview: number;
}

export interface SmsDeliveryFunnel {
  sent: number;
  delivered: number;
  clicked: number;
  reviewed: number;
  sentToDelivered: number;
  deliveredToClicked: number;
  clickedToReviewed: number;
}

export interface SmsDailyVolume {
  date: string;
  sent: number;
  delivered: number;
  failed: number;
  clicked: number;
}

export interface SmsTemplatePerformanceRow {
  templateId: string;
  templateName: string;
  category: string;
  sends: number;
  deliveryRate: number;
  clickRate: number;
  conversionRate: number;
  avgCostCents: number;
}

export interface SmsLoLeaderboardRow {
  userId: string;
  userName: string;
  smsSent: number;
  reviewsGenerated: number;
  conversionRate: number;
  costPerReview: number;
}

export interface SmsOptOutTrend {
  date: string;
  optOutCount: number;
  optOutRate: number;
}

export interface SmsCostBreakdown {
  category: string;
  costCents: number;
  count: number;
}

export interface SmsTimeHeatmapCell {
  hour: number;
  dayOfWeek: number;
  sends: number;
  clicks: number;
  clickRate: number;
}

export interface SmsChannelComparison {
  channel: "email" | "sms";
  sent: number;
  deliveryRate: number;
  clickRate: number;
  conversionRate: number;
  costPerConversion: number;
}

export interface SmsAnalyticsData {
  summary: SmsAnalyticsSummary;
  funnel: SmsDeliveryFunnel;
  dailyVolume: SmsDailyVolume[];
  templatePerformance: SmsTemplatePerformanceRow[];
  loLeaderboard: SmsLoLeaderboardRow[];
  optOutTrend: SmsOptOutTrend[];
  costBreakdown: SmsCostBreakdown[];
  timeHeatmap: SmsTimeHeatmapCell[];
  channelComparison: SmsChannelComparison[] | null;
}
