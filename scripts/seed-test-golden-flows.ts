#!/usr/bin/env ts-node

import { Pool } from "pg";
import * as fs from "fs";
import * as path from "path";

const ORG_PRO = "22222222-2222-2222-2222-222222222222";
const ORG_BASIC = "11111111-1111-1111-1111-111111111111";
const ORG_ENT = "33333333-3333-3333-3333-333333333333";
const USER_PRO = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const USER_ENT_MGR = "dddddddd-dddd-dddd-dddd-dddddddddddd";

const GOLDEN_SURVEY_TEMPLATE_ID = "f1000000-0001-4000-8000-000000000000";
const GOLDEN_REVIEW_ID = "f1000000-0002-4000-8000-000000000000";
const GOLDEN_PROOF_ITEM_ID = "f1000000-0003-4000-8000-000000000000";
const GOLDEN_PROOF_LINK_ID = "f1000000-0004-4000-8000-000000000000";
const GOLDEN_PUBLIC_PROFILE_SLUG = "golden-pro-profile";
const GOLDEN_SMART_LINK_SLUG = "golden-proof-link";
const GOLDEN_PLACE_ID = "GoldenPlaceId123";
const GOLDEN_REVIEW_TEXT =
  "Golden-flow borrowers trusted this pro from pre-approval to closing, and the communication stayed crisp the whole way.";

function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    const p = path.resolve(process.cwd(), file);
    if (!fs.existsSync(p)) continue;

    for (const rawLine of fs.readFileSync(p, "utf8").split("\n")) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const [key, ...rest] = line.split("=");
      if (key && !process.env[key]) {
        process.env[key] = rest.join("=").replace(/^["']|["']$/g, "");
      }
    }
  }
}

function createPool(): Pool {
  const url = process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL or DIRECT_DATABASE_URL must be set");

  const parsed = new URL(url);
  return new Pool({
    host: parsed.hostname,
    port: Number.parseInt(parsed.port, 10) || 5432,
    user: parsed.username,
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.slice(1) || "postgres",
    ssl: { rejectUnauthorized: false },
  });
}

async function seedGoldenFlows() {
  loadEnv();
  const pool = createPool();

  try {
    await pool.query("BEGIN");

    const { rowCount: testUsersReady } = await pool.query(
      "SELECT 1 FROM users WHERE id = ANY($1::uuid[])",
      [[USER_PRO, USER_ENT_MGR]]
    );
    if (testUsersReady !== 2) {
      throw new Error("Golden-flow seed requires npm run seed:test-users first");
    }

    const surveyQuestions = [
      {
        id: "golden-rating",
        type: "rating",
        title: "How would you rate your experience?",
        required: true,
        order: 1,
        config: {
          maxRating: 5,
          labels: { low: "Poor", high: "Excellent" },
        },
      },
      {
        id: "golden-testimonial",
        type: "text",
        title: "What should others know about your experience?",
        required: true,
        order: 2,
        config: {
          multiline: true,
          minLength: 20,
          maxLength: 800,
          placeholder: "Share a few specifics about what went well...",
        },
      },
      {
        id: "golden-nps",
        type: "nps",
        title: "How likely are you to recommend us?",
        required: true,
        order: 3,
        config: {
          labels: {
            detractor: "Not likely",
            passive: "Neutral",
            promoter: "Very likely",
          },
        },
      },
    ];

    await pool.query(
      `INSERT INTO survey_templates (
         id, organization_id, name, description, questions, branding,
         thank_you_config, is_active, is_default, created_by, created_at, updated_at
       )
       VALUES (
         $1, $2, 'Golden Flow Review Survey',
         'Normalized survey used by golden-flow acquisition coverage.',
         $3::jsonb,
         $4::jsonb,
         $5::jsonb,
         true, true, $6, '2000-01-01T00:00:00.000Z', NOW()
       )
       ON CONFLICT (id) DO UPDATE SET
         questions = EXCLUDED.questions,
         branding = EXCLUDED.branding,
         thank_you_config = EXCLUDED.thank_you_config,
         is_active = true,
         is_default = true,
         updated_at = NOW()`,
      [
        GOLDEN_SURVEY_TEMPLATE_ID,
        ORG_ENT,
        JSON.stringify(surveyQuestions),
        JSON.stringify({ showProgressBar: true, showQuestionNumbers: true }),
        JSON.stringify({
          title: "Thank you for your feedback!",
          message: "We appreciate you taking the time to share your experience.",
          showReviewRedirect: true,
          reviewRedirectRating: 5,
        }),
        USER_ENT_MGR,
      ]
    );

    await pool.query(
      `UPDATE organizations
          SET onboarding_status = 'completed',
              subscription_tier = 'basic',
              subscription_status = 'active',
              updated_at = NOW()
        WHERE id = $1`,
      [ORG_BASIC]
    );

    await pool.query(
      `UPDATE organizations
          SET name = 'Golden Flow Mortgage',
              primary_color = '#256f6c',
              subscription_tier = 'pro',
              subscription_status = 'active',
              updated_at = NOW()
        WHERE id = $1`,
      [ORG_PRO]
    );

    await pool.query(
      `UPDATE users
          SET slug = $2,
              full_name = 'Golden Pro Advisor',
              title = 'Senior Mortgage Advisor',
              bio = 'A test-seeded public profile used for RepWell golden-flow verification.',
              nmls_id = 'GOLDEN123',
              phone = '(555) 010-4242',
              address = $3::jsonb,
              latitude = 40.7128,
              longitude = -74.0060,
              accepts_public_reviews = true,
              is_active = true,
              google_place_id = $4,
              cta_button_text = 'Book a consult',
              cta_button_url = 'https://example.com/golden-consult',
              personal_website_url = 'https://example.com/golden-pro',
              updated_at = NOW()
        WHERE id = $1`,
      [
        USER_PRO,
        GOLDEN_PUBLIC_PROFILE_SLUG,
        JSON.stringify({
          street: "200 Golden Flow Ave",
          city: "New York",
          state: "NY",
          zip: "10001",
        }),
        GOLDEN_PLACE_ID,
      ]
    );

    await pool.query(
      `UPDATE users
          SET google_place_id = $2,
              updated_at = NOW()
        WHERE id = $1`,
      [USER_ENT_MGR, GOLDEN_PLACE_ID]
    );

    await pool.query(
      `INSERT INTO reviews (
         id, organization_id, user_id, customer_name, customer_email, rating,
         text, source, review_date, status, sentiment_label, sentiment_score,
         key_phrases, themes, response_text, response_at, is_published,
         featured, created_at, updated_at
       )
       VALUES (
         $1, $2, $3, 'Avery Golden', 'avery.golden@example.com', 5,
         $4, 'internal', NOW() - INTERVAL '1 day', 'approved', 'positive', 0.96,
         ARRAY['communication','pre-approval','closing'],
         ARRAY['customer service','loan process'],
         'Thank you, Avery. It was a pleasure helping you through the process.',
         NOW() - INTERVAL '12 hours', true, true, NOW() - INTERVAL '1 day', NOW()
       )
       ON CONFLICT (id) DO UPDATE SET
         text = EXCLUDED.text,
         rating = EXCLUDED.rating,
         status = 'approved',
         is_published = true,
         featured = true,
         updated_at = NOW()`,
      [GOLDEN_REVIEW_ID, ORG_PRO, USER_PRO, GOLDEN_REVIEW_TEXT]
    );

    const metrics = await pool.query<{ total: string; average: string }>(
      `SELECT COUNT(*)::text AS total, ROUND(AVG(rating)::numeric, 2)::text AS average
         FROM reviews
        WHERE user_id = $1
          AND status = 'approved'
          AND is_published = true`,
      [USER_PRO]
    );
    await pool.query(
      `UPDATE users
          SET total_reviews = $2,
              average_rating = $3,
              featured_review_ids = ARRAY[$4]::uuid[],
              updated_at = NOW()
        WHERE id = $1`,
      [
        USER_PRO,
        Number(metrics.rows[0]?.total ?? 1),
        Number(metrics.rows[0]?.average ?? 5),
        GOLDEN_REVIEW_ID,
      ]
    );

    await pool.query(
      `INSERT INTO proof_items (
         id, organization_id, presenter_user_id, created_by, customer_name,
         quote, rating, source_type, source_id, source_platform,
         source_review_date, source_snapshot, title, summary, status,
         approval_required, approved_by, approved_at, published_at, created_at, updated_at
       )
       VALUES (
         $1, $2, $3, $3, 'Avery Golden', $4, 5, 'review', $5, 'internal',
         NOW() - INTERVAL '1 day',
         $6::jsonb,
         'Golden Flow Mortgage Review',
         'A verified review used by the golden-flow public smart-link test.',
         'approved', false, $3, NOW(), NOW(), NOW(), NOW()
       )
       ON CONFLICT (id) DO UPDATE SET
         quote = EXCLUDED.quote,
         source_snapshot = EXCLUDED.source_snapshot,
         status = 'approved',
         published_at = NOW(),
         updated_at = NOW()`,
      [
        GOLDEN_PROOF_ITEM_ID,
        ORG_PRO,
        USER_PRO,
        GOLDEN_REVIEW_TEXT,
        GOLDEN_REVIEW_ID,
        JSON.stringify({
          text: GOLDEN_REVIEW_TEXT,
          rating: 5,
          customer_name: "Avery Golden",
        }),
      ]
    );

    await pool.query(
      `INSERT INTO proof_links (
         id, organization_id, proof_item_id, created_by, slug, title,
         description, destination_url, published, published_at, created_at, updated_at
       )
       VALUES (
         $1, $2, $3, $4, $5, 'Golden Flow Proof Link',
         'Golden-flow public proof-link fixture.',
         '/pro/${GOLDEN_PUBLIC_PROFILE_SLUG}', true, NOW(), NOW(), NOW()
       )
       ON CONFLICT (id) DO UPDATE SET
         slug = EXCLUDED.slug,
         title = EXCLUDED.title,
         description = EXCLUDED.description,
         destination_url = EXCLUDED.destination_url,
         published = true,
         published_at = NOW(),
         updated_at = NOW()`,
      [GOLDEN_PROOF_LINK_ID, ORG_PRO, GOLDEN_PROOF_ITEM_ID, USER_PRO, GOLDEN_SMART_LINK_SLUG]
    );

    await pool.query("COMMIT");
    console.log("✅ Golden-flow fixtures seeded");
    console.log(`  Public profile: /pro/${GOLDEN_PUBLIC_PROFILE_SLUG}`);
    console.log(`  Smart link: /s/${GOLDEN_SMART_LINK_SLUG}`);
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error("❌ Failed to seed golden-flow fixtures", error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

void seedGoldenFlows();
