/** Row type matching the sms_short_links database table. */
export interface SmsShortLink {
  id: string;
  organization_id: string;
  short_code: string;
  destination_url: string;
  borrower_phone: string | null;
  loan_officer_id: string | null;
  message_id: string | null;
  click_count: number;
  first_clicked_at: string | null;
  last_clicked_at: string | null;
  expires_at: string | null;
  created_at: string;
}

/** Input for creating a short link. */
export interface CreateShortLinkInput {
  organizationId: string;
  destinationUrl: string;
  metadata?: {
    borrowerPhone?: string;
    loanOfficerId?: string;
    messageId?: string;
    expiresInDays?: number;
  };
}

/** Click statistics for a short link. */
export interface ShortLinkClickStats {
  shortLinkId: string;
  shortCode: string;
  destinationUrl: string;
  clickCount: number;
  firstClickedAt: string | null;
  lastClickedAt: string | null;
  createdAt: string;
  expiresAt: string | null;
  isExpired: boolean;
}
