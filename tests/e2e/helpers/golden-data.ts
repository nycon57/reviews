import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Pool } from "pg";

export const GOLDEN_IDS = {
  orgPro: "22222222-2222-2222-2222-222222222222",
  orgEnterprise: "33333333-3333-3333-3333-333333333333",
  userBasic: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  userPro: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
  userEnterpriseManager: "dddddddd-dddd-dddd-dddd-dddddddddddd",
  publicProfileSlug: "golden-pro-profile",
  smartLinkSlug: "golden-proof-link",
  publicReviewText:
    "Golden-flow borrowers trusted this pro from pre-approval to closing, and the communication stayed crisp the whole way.",
  smartLinkQuote:
    "Golden-flow borrowers trusted this pro from pre-approval to closing, and the communication stayed crisp the whole way.",
  googlePlaceId: "GoldenPlaceId123",
} as const;

export interface SurveyRow {
  id: string;
  token: string;
  status: string | null;
  customer_email: string;
  customer_name: string;
  completed_at: string | null;
}

export interface ReviewRow {
  id: string;
  rating: number;
  text: string | null;
  customer_name: string | null;
  status: string | null;
  is_published: boolean | null;
}

export interface VideoRequestRow {
  id: string;
  token: string;
  status: string;
  customer_email: string;
  source_metadata: Record<string, unknown> | null;
}

export interface UserRow {
  id: string;
  email: string;
  organization_id: string | null;
}

export interface BillingOrgRow {
  id: string;
  name: string;
  subscription_tier: string | null;
  subscription_status: string | null;
}

let pool: Pool | null = null;

function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    const path = resolve(process.cwd(), file);
    if (!existsSync(path)) continue;

    for (const rawLine of readFileSync(path, "utf8").split("\n")) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const [key, ...rest] = line.split("=");
      if (!key || process.env[key]) continue;
      process.env[key] = rest.join("=").replace(/^["']|["']$/g, "");
    }
  }
}

function createPool() {
  loadEnv();
  const connectionUrl = process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL;
  if (!connectionUrl) {
    throw new Error("DATABASE_URL or DIRECT_DATABASE_URL must be set for golden-flow DB reads");
  }

  const url = new URL(connectionUrl);
  return new Pool({
    host: url.hostname,
    port: Number.parseInt(url.port, 10) || 5432,
    user: url.username,
    password: decodeURIComponent(url.password),
    database: url.pathname.slice(1) || "postgres",
    ssl: { rejectUnauthorized: false },
  });
}

export async function goldenQuery<T>(
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  if (!pool) pool = createPool();
  const result = await pool.query(sql, params);
  return result.rows as T[];
}

export async function closeGoldenDb() {
  if (!pool) return;
  await pool.end();
  pool = null;
}

export async function findSurveyByCustomerEmail(email: string): Promise<SurveyRow | null> {
  const rows = await goldenQuery<SurveyRow>(
    `SELECT id, token, status, customer_email, customer_name, completed_at
       FROM surveys
      WHERE customer_email = $1
      ORDER BY created_at DESC NULLS LAST
      LIMIT 1`,
    [email]
  );
  return rows[0] ?? null;
}

export async function findReviewForSurvey(surveyId: string): Promise<ReviewRow | null> {
  const rows = await goldenQuery<ReviewRow>(
    `SELECT r.id, r.rating, r.text, r.customer_name, r.status, r.is_published
       FROM reviews r
       JOIN survey_responses sr ON sr.id = r.survey_response_id
      WHERE sr.survey_id = $1
      ORDER BY r.created_at DESC NULLS LAST
      LIMIT 1`,
    [surveyId]
  );
  return rows[0] ?? null;
}

export async function findVideoRequestByCustomerEmail(email: string): Promise<VideoRequestRow | null> {
  const rows = await goldenQuery<VideoRequestRow>(
    `SELECT id, token, status, customer_email, source_metadata
       FROM video_testimonial_requests
      WHERE customer_email = $1
      ORDER BY created_at DESC
      LIMIT 1`,
    [email]
  );
  return rows[0] ?? null;
}

export async function countGrantedVideoConsentEvents(requestId: string): Promise<number> {
  const rows = await goldenQuery<{ count: string }>(
    `SELECT COUNT(*)::text AS count
       FROM testimonial_consent_events
      WHERE request_id = $1
        AND granted = true
        AND consent_type IN (
          'name_image_likeness_voice',
          'usage_rights',
          'ai_text_generation'
        )`,
    [requestId]
  );
  return Number(rows[0]?.count ?? 0);
}

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const rows = await goldenQuery<UserRow>(
    `SELECT id, email, organization_id
       FROM users
      WHERE email = $1
      LIMIT 1`,
    [email]
  );
  return rows[0] ?? null;
}

export async function getOrgForUserEmail(email: string): Promise<BillingOrgRow | null> {
  const rows = await goldenQuery<BillingOrgRow>(
    `SELECT o.id, o.name, o.subscription_tier, o.subscription_status
       FROM users u
       JOIN organizations o ON o.id = u.organization_id
      WHERE u.email = $1
      LIMIT 1`,
    [email]
  );
  return rows[0] ?? null;
}

export async function getOnboardingStatusForEmail(email: string): Promise<string | null> {
  const rows = await goldenQuery<{ onboarding_status: string | null }>(
    `SELECT o.onboarding_status
       FROM users u
       JOIN organizations o ON o.id = u.organization_id
      WHERE u.email = $1
      LIMIT 1`,
    [email]
  );
  return rows[0]?.onboarding_status ?? null;
}
