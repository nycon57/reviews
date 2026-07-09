#!/usr/bin/env ts-node
/**
 * Seed Comprehensive Demo Data for Test Users
 *
 * Populates ~20 tables with realistic mortgage-industry content so every
 * dashboard feature can be tested when logged in as any of the 5 test users.
 *
 * Prerequisites: run `npm run seed:test-users` first.
 * Usage: npm run seed:test-data
 *
 * Idempotent — safe to re-run (deletes then re-inserts in a transaction).
 */

import { Pool } from "pg";
import * as fs from "fs";
import * as path from "path";

// ---------------------------------------------------------------------------
// ENV
// ---------------------------------------------------------------------------
function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    const p = path.resolve(process.cwd(), file);
    if (fs.existsSync(p)) {
      for (const line of fs.readFileSync(p, "utf-8").split("\n")) {
        const t = line.trim();
        if (t && !t.startsWith("#")) {
          const [key, ...v] = t.split("=");
          const val = v.join("=").replace(/^["']|["']$/g, "");
          if (key && !process.env[key]) process.env[key] = val;
        }
      }
    }
  }
}

async function createPool(): Promise<Pool> {
  const url = process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL or DIRECT_DATABASE_URL must be set");
  const u = new URL(url);
  return new Pool({
    host: u.hostname,
    port: parseInt(u.port) || 5432,
    user: u.username,
    password: decodeURIComponent(u.password),
    database: u.pathname.slice(1) || "postgres",
    ssl: { rejectUnauthorized: false },
  });
}

// ---------------------------------------------------------------------------
// FIXED IDS
// ---------------------------------------------------------------------------
const ORG_BASIC = "11111111-1111-1111-1111-111111111111";
const ORG_PRO = "22222222-2222-2222-2222-222222222222";
const ORG_ENT = "33333333-3333-3333-3333-333333333333";
const ORG_IDS = [ORG_BASIC, ORG_PRO, ORG_ENT];

const USER_BASIC = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const USER_PRO = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const USER_ENT_USER = "cccccccc-cccc-cccc-cccc-cccccccccccc";
const USER_ENT_MGR = "dddddddd-dddd-dddd-dddd-dddddddddddd";
const USER_ENT_ADMIN = "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee";

// UUID prefixes for seed data (each table gets a unique prefix)
const PFX = {
  branch: "b0000000",
  dept: "d0000000",
  badge: "ba000000",
  surveyTpl: "20000000",
  exSurveyTpl: "21000000",
  responseTpl: "22000000",
  review: "10000000",
  survey: "30000000",
  surveyResp: "31000000",
  testimonial: "40000000",
  exSurvey: "50000000",
  exSurveyResp: "51000000",
  recognition: "60000000",
  metricSnap: "70000000",
  lbSnap: "71000000",
  repHist: "72000000",
  notifPref: "80000000",
  widgetCfg: "90000000",
};

function uuid(prefix: string, n: number): string {
  const s = n.toString().padStart(4, "0");
  return `${prefix}-${s}-4000-8000-000000000000`;
}

// ---------------------------------------------------------------------------
// DATE HELPERS — relative to NOW so trend charts always show recent data
// ---------------------------------------------------------------------------
const NOW = Date.now();
function daysAgo(d: number): string {
  return new Date(NOW - d * 86400000).toISOString();
}
function monthsAgo(m: number): string {
  const dt = new Date(NOW);
  dt.setMonth(dt.getMonth() - m);
  return dt.toISOString();
}

// ---------------------------------------------------------------------------
// REALISTIC MORTGAGE CONTENT
// ---------------------------------------------------------------------------
const REVIEW_TEXTS_5 = [
  "Absolutely phenomenal experience from start to finish! The team guided us through every step of the home buying process. We couldn't be happier with our new home.",
  "Outstanding service! They made our refinancing process incredibly smooth. The rates were competitive and the communication was excellent throughout.",
  "Best mortgage experience I've ever had. The loan officer was knowledgeable, responsive, and truly cared about finding us the best deal. Highly recommend!",
  "From pre-approval to closing, everything was handled professionally. The online portal made document submission a breeze. Five stars all around!",
  "We were first-time homebuyers and felt completely supported. Every question was answered promptly and the closing was ahead of schedule.",
  "Incredible team! They found us a rate that saved us over $200/month compared to other lenders. The process was transparent and efficient.",
  "Second time using them and won't go anywhere else. The refinance saved us thousands over the life of the loan. Thank you!",
  "Professional, responsive, and genuinely helpful. They went above and beyond to ensure our VA loan closed on time. Truly grateful.",
];

const REVIEW_TEXTS_4 = [
  "Great experience overall. The process took a bit longer than expected but the team was communicative and the end result was excellent.",
  "Very satisfied with the service. The loan officer was knowledgeable and helped us navigate a complex situation with our income documentation.",
  "Good experience. The rates were competitive and the team was professional. Minor delays in processing but nothing major.",
  "Solid service from start to finish. Would have liked slightly faster turnaround on the appraisal but everything else was smooth.",
  "Happy with our mortgage experience. The online tools were helpful and the loan officer was always available to answer questions.",
];

const REVIEW_TEXTS_3 = [
  "Average experience. Communication could have been better — had to follow up multiple times for updates on our application status.",
  "The process was okay but felt a bit disorganized at times. The rates were fair but not the best we were quoted elsewhere.",
  "Decent service but the closing was delayed twice. The loan officer was friendly but seemed overwhelmed with their caseload.",
];

const REVIEW_TEXTS_LOW = [
  "Disappointed with the experience. Poor communication, missed deadlines, and the closing costs were higher than initially quoted.",
  "Would not recommend. The loan officer was unresponsive and we almost lost our dream home due to delays in processing.",
];

const CUSTOMER_NAMES = [
  "Sarah Mitchell", "James Rodriguez", "Emily Chen", "Michael Thompson",
  "Jessica Williams", "David Kim", "Amanda Johnson", "Robert Garcia",
  "Jennifer Lee", "Christopher Davis", "Lauren Martinez", "Andrew Wilson",
  "Stephanie Brown", "Daniel Taylor", "Rachel Anderson", "Kevin Thomas",
  "Maria Hernandez", "Brian Jackson", "Ashley White", "Mark Harris",
  "Nicole Clark", "Patrick Lewis", "Samantha Robinson", "Jason Walker",
  "Rebecca Hall", "Timothy Allen", "Megan Young", "Ryan King",
  "Heather Wright", "Brandon Scott", "Amber Green", "Justin Adams",
  "Tiffany Nelson", "Nathan Baker", "Kimberly Hill", "Sean Campbell",
  "Laura Mitchell", "Derek Evans", "Christina Turner", "Gregory Phillips",
  "Michelle Collins", "Eric Stewart", "Angela Sanchez", "Steven Morris",
  "Danielle Rogers", "Matthew Reed", "Natalie Cook", "Benjamin Morgan",
  "Courtney Bell", "Adam Murphy", "Hannah Bailey", "Tyler Rivera",
  "Vanessa Cooper", "Jonathan Richardson", "Kayla Cox", "Dylan Howard",
  "Brittany Ward", "Shane Torres",
];

const TESTIMONIAL_TEXTS = [
  "This team made our dream of homeownership a reality. Their expertise in mortgage lending is unmatched.",
  "I've referred three families to them and every single one had an amazing experience. That says it all.",
  "The refinancing process saved us $300/month. We're using that money to build our children's college fund.",
  "As a veteran, finding someone who truly understands VA loans was a game-changer. They handled everything seamlessly.",
  "First-time buyer here — they held our hand through every step. Could not have done it without them.",
  "Professional, transparent, and genuinely caring. They found us a rate we didn't think was possible.",
  "After being turned down by two other lenders, they found a solution. We're finally in our forever home.",
  "The technology they use made everything so easy. Upload docs, track progress, sign electronically. Loved it.",
  "Closed two weeks early! The entire team was responsive and made what could be stressful actually enjoyable.",
  "Best decision we made was choosing this team. The savings over our previous lender are substantial.",
  "They took time to explain every option and never pressured us. That kind of service is rare these days.",
  "From application to closing in under 30 days. Incredible efficiency without sacrificing quality of service.",
];

const SURVEY_NAMES = [
  "Post-Closing Experience Survey",
  "Pre-Approval Feedback",
  "Refinancing Satisfaction Survey",
  "Annual Customer Check-in",
  "Loan Officer Performance Review",
];

const NPS_QUESTIONS = JSON.stringify([
  {
    id: "q1",
    type: "nps",
    text: "How likely are you to recommend us to a friend or colleague?",
    required: true,
  },
  {
    id: "q2",
    type: "rating",
    text: "How would you rate your overall experience?",
    required: true,
    scale: 5,
  },
  {
    id: "q3",
    type: "text",
    text: "What could we have done better?",
    required: false,
  },
  {
    id: "q4",
    type: "text",
    text: "Would you like to share a testimonial about your experience?",
    required: false,
  },
]);

const CSAT_QUESTIONS = JSON.stringify([
  {
    id: "q1",
    type: "rating",
    text: "How satisfied are you with the communication during your loan process?",
    required: true,
    scale: 5,
  },
  {
    id: "q2",
    type: "rating",
    text: "How would you rate the timeliness of our service?",
    required: true,
    scale: 5,
  },
  {
    id: "q3",
    type: "nps",
    text: "How likely are you to use our services again?",
    required: true,
  },
  {
    id: "q4",
    type: "text",
    text: "Any additional comments?",
    required: false,
  },
]);

const EX_QUESTIONS_SATISFACTION = JSON.stringify([
  {
    id: "eq1",
    type: "rating",
    text: "How satisfied are you with your role?",
    required: true,
    scale: 5,
  },
  {
    id: "eq2",
    type: "rating",
    text: "How well does management support your growth?",
    required: true,
    scale: 5,
  },
  {
    id: "eq3",
    type: "nps",
    text: "How likely are you to recommend this company as a workplace?",
    required: true,
  },
  {
    id: "eq4",
    type: "text",
    text: "What would make this a better place to work?",
    required: false,
  },
]);

const EX_QUESTIONS_ENGAGEMENT = JSON.stringify([
  {
    id: "eq1",
    type: "rating",
    text: "I feel engaged and motivated at work.",
    required: true,
    scale: 5,
  },
  {
    id: "eq2",
    type: "rating",
    text: "I have the tools and resources I need to succeed.",
    required: true,
    scale: 5,
  },
  {
    id: "eq3",
    type: "rating",
    text: "My contributions are recognized and valued.",
    required: true,
    scale: 5,
  },
  {
    id: "eq4",
    type: "text",
    text: "Share one thing that would increase your engagement.",
    required: false,
  },
]);

const RESPONSE_TEMPLATE_CATEGORIES = [
  { name: "5-Star Thank You", category: "thank_you", tone: "friendly" },
  { name: "4-Star Appreciation", category: "thank_you", tone: "professional" },
  { name: "3-Star Acknowledgment", category: "custom", tone: "empathetic" },
  { name: "Low Rating Apology", category: "apologetic", tone: "empathetic" },
  { name: "Refinance Follow-up", category: "follow_up", tone: "professional" },
  { name: "First-Time Buyer Thanks", category: "thank_you", tone: "friendly" },
  { name: "VA Loan Gratitude", category: "thank_you", tone: "professional" },
  { name: "Process Delay Apology", category: "apologetic", tone: "empathetic" },
  { name: "General Thank You", category: "thank_you", tone: "friendly" },
];

const RESPONSE_TEMPLATE_CONTENTS = [
  "Thank you so much for the wonderful review, {{customer_name}}! It was a pleasure helping you with your home purchase. We're thrilled you had such a positive experience!",
  "Thank you for the kind words, {{customer_name}}! We're glad the process went smoothly for you. If you ever need anything in the future, don't hesitate to reach out.",
  "Thank you for your feedback, {{customer_name}}. We appreciate you sharing your experience and we're always looking for ways to improve our service.",
  "We sincerely apologize for the difficulties you experienced, {{customer_name}}. Your feedback is important to us and we'd like to make things right. Please contact us directly.",
  "Thank you for choosing us for your refinancing needs, {{customer_name}}! We're glad we could help you save on your monthly payments.",
  "Congratulations on your first home, {{customer_name}}! It was a privilege to guide you through this exciting milestone. Welcome to homeownership!",
  "Thank you for your service and for trusting us with your VA loan, {{customer_name}}. It's an honor to help veterans achieve their homeownership goals.",
  "We apologize for the delays you experienced, {{customer_name}}. We understand how stressful that can be and we're taking steps to improve our processing times.",
  "Thank you for the wonderful feedback, {{customer_name}}! Your trust in our team means the world to us. We're here whenever you need us!",
];

const RECOGNITION_MESSAGES = [
  "Outstanding job closing 5 loans this week! Your dedication to our clients is truly inspiring.",
  "Thank you for mentoring the new team members. Your patience and knowledge make a huge difference.",
  "Great work on the Johnson refinancing case — you navigated a complex situation beautifully.",
  "Your attention to detail on compliance documentation has been exceptional this quarter.",
  "Kudos for the creative solution on the first-time buyer program. The clients were thrilled!",
  "Amazing customer feedback this month — three 5-star reviews in one week!",
  "Thank you for stepping up during the busy season. Your extra effort didn't go unnoticed.",
  "Your presentation at the team meeting was excellent. Great insights on market trends!",
];

// ---------------------------------------------------------------------------
// MAIN SEED FUNCTION
// ---------------------------------------------------------------------------
async function seedTestData() {
  console.log("🌱 Seeding comprehensive demo data for test users...\n");

  loadEnv();
  const pool = await createPool();

  try {
    await pool.query("BEGIN");

    // Disable triggers during bulk insert
    await pool.query("SET session_replication_role = 'replica'");
    console.log("⚡ Triggers disabled for bulk insert\n");

    // -----------------------------------------------------------------------
    // PHASE 0: CLEANUP
    // -----------------------------------------------------------------------
    console.log("🧹 Phase 0: Cleaning up existing seed data...");
    const orgFilter = `organization_id = ANY($1)`;
    const seedPrefixes = Object.values(PFX);

    const allUserIds = [
      USER_BASIC,
      USER_PRO,
      USER_ENT_USER,
      USER_ENT_MGR,
      USER_ENT_ADMIN,
    ];

    // Tables with only id prefix (no org or user FK needed for filtering)
    const idOnlyTables = [
      "survey_responses",
      "ex_survey_responses",
    ];
    for (const table of idOnlyTables) {
      let totalDeleted = 0;
      for (const prefix of seedPrefixes) {
        const res = await pool.query(
          `DELETE FROM ${table} WHERE id::text LIKE $1`,
          [`${prefix}%`]
        );
        if (res.rowCount) totalDeleted += res.rowCount;
      }
      if (totalDeleted > 0) {
        console.log(`  Deleted ${totalDeleted} rows from ${table}`);
      }
    }

    // Tables with organization_id (delete in reverse FK order)
    const orgTables = [
      "widget_configs",
      "metrics_snapshots",
      "recognitions",
      "ex_surveys",
      "testimonials",
      "surveys",
      "reviews",
      "response_templates",
      "ex_survey_templates",
      "survey_templates",
      "recognition_badges",
    ];

    for (const table of orgTables) {
      let totalDeleted = 0;
      for (const prefix of seedPrefixes) {
        const res = await pool.query(
          `DELETE FROM ${table} WHERE ${orgFilter} AND id::text LIKE $2`,
          [ORG_IDS, `${prefix}%`]
        );
        if (res.rowCount) totalDeleted += res.rowCount;
      }
      if (totalDeleted > 0) {
        console.log(`  Deleted ${totalDeleted} rows from ${table}`);
      }
    }

    const legacyExTemplateCleanup = await pool.query(
      `DELETE FROM ex_survey_templates
        WHERE organization_id = $1
          AND name = ANY($2)`,
      [
        ORG_ENT,
        ["Employee Pulse Survey", "Employee Engagement Survey"],
      ]
    );
    if (legacyExTemplateCleanup.rowCount) {
      console.log(
        `  Deleted ${legacyExTemplateCleanup.rowCount} legacy EX survey templates`
      );
    }

    // Tables keyed by user_id (no organization_id)
    const userTables = [
      "reputation_history",
      "notification_preferences",
      "leaderboard_snapshots",
    ];
    for (const table of userTables) {
      let totalDeleted = 0;
      for (const prefix of seedPrefixes) {
        const res = await pool.query(
          `DELETE FROM ${table} WHERE user_id = ANY($1) AND id::text LIKE $2`,
          [allUserIds, `${prefix}%`]
        );
        if (res.rowCount) totalDeleted += res.rowCount;
      }
      if (totalDeleted > 0) {
        console.log(`  Deleted ${totalDeleted} rows from ${table}`);
      }
    }

    // Clean branches and departments
    for (const prefix of seedPrefixes) {
      await pool.query(
        `DELETE FROM departments WHERE ${orgFilter} AND id::text LIKE $2`,
        [ORG_IDS, `${prefix}%`]
      );
      await pool.query(
        `DELETE FROM branches WHERE ${orgFilter} AND id::text LIKE $2`,
        [ORG_IDS, `${prefix}%`]
      );
    }

    // Reset user cached metrics
    await pool.query(
      `UPDATE users SET total_reviews = 0, average_rating = NULL, nps_score = NULL, reputation_score = NULL, branch_id = NULL, department_id = NULL, manager_user_id = NULL WHERE id = ANY($1)`,
      [allUserIds]
    );

    console.log("  ✅ Cleanup complete\n");

    // -----------------------------------------------------------------------
    // PHASE 1: STRUCTURE
    // -----------------------------------------------------------------------
    console.log("🏗️  Phase 1: Creating structure...");

    // 1. Branches (enterprise only)
    const branches = [
      { id: uuid(PFX.branch, 1), name: "Downtown Branch", slug: "downtown", region: "Metro" },
      { id: uuid(PFX.branch, 2), name: "Suburban Branch", slug: "suburban", region: "Suburbs" },
      { id: uuid(PFX.branch, 3), name: "Westside Branch", slug: "westside", region: "West" },
    ];
    for (const b of branches) {
      await pool.query(
        `INSERT INTO branches (id, organization_id, name, slug, region, is_active, is_public, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, true, true, NOW(), NOW())`,
        [b.id, ORG_ENT, b.name, b.slug, b.region]
      );
    }
    console.log(`  ✅ ${branches.length} branches`);

    // 2. Departments (enterprise only)
    const departments = [
      { id: uuid(PFX.dept, 1), name: "Sales", slug: "sales" },
      { id: uuid(PFX.dept, 2), name: "Operations", slug: "operations" },
      { id: uuid(PFX.dept, 3), name: "Marketing", slug: "marketing" },
    ];
    for (const d of departments) {
      await pool.query(
        `INSERT INTO departments (id, organization_id, name, slug, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, true, NOW(), NOW())`,
        [d.id, ORG_ENT, d.name, d.slug]
      );
    }
    console.log(`  ✅ ${departments.length} departments`);

    // 3. Update enterprise users with branch/dept/manager
    await pool.query(
      `UPDATE users SET branch_id = $1, department_id = $2, manager_user_id = $3 WHERE id = $4`,
      [branches[0].id, departments[0].id, USER_ENT_MGR, USER_ENT_USER]
    );
    await pool.query(
      `UPDATE users SET branch_id = $1, department_id = $2, manager_user_id = $3 WHERE id = $4`,
      [branches[0].id, departments[0].id, USER_ENT_ADMIN, USER_ENT_MGR]
    );
    await pool.query(
      `UPDATE users SET branch_id = $1, department_id = $2 WHERE id = $3`,
      [branches[1].id, departments[1].id, USER_ENT_ADMIN]
    );
    console.log("  ✅ Enterprise users updated with branch/dept/manager");

    // 4. Recognition badges (enterprise only)
    const badges = [
      { id: uuid(PFX.badge, 1), name: "Top Producer", icon: "trophy", category: "excellence", color: "#FFD700", points: 100 },
      { id: uuid(PFX.badge, 2), name: "Client Champion", icon: "heart", category: "customer_focus", color: "#FF6B6B", points: 75 },
      { id: uuid(PFX.badge, 3), name: "Team Player", icon: "users", category: "teamwork", color: "#4ECDC4", points: 50 },
      { id: uuid(PFX.badge, 4), name: "Innovation Star", icon: "lightbulb", category: "innovation", color: "#45B7D1", points: 60 },
      { id: uuid(PFX.badge, 5), name: "Mentor of the Month", icon: "shield", category: "mentorship", color: "#96CEB4", points: 40 },
    ];
    for (const b of badges) {
      await pool.query(
        `INSERT INTO recognition_badges (id, organization_id, name, icon, category, color, points, is_active, is_default, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, true, false, NOW(), NOW())`,
        [b.id, ORG_ENT, b.name, b.icon, b.category, b.color, b.points]
      );
    }
    console.log(`  ✅ ${badges.length} recognition badges`);

    // 5. Survey templates
    const surveyTemplates = [
      { id: uuid(PFX.surveyTpl, 1), orgId: ORG_BASIC, name: "Post-Closing Survey", desc: "Basic customer feedback after closing", questions: NPS_QUESTIONS },
      { id: uuid(PFX.surveyTpl, 2), orgId: ORG_PRO, name: "Post-Closing Experience", desc: "Detailed post-closing feedback", questions: NPS_QUESTIONS },
      { id: uuid(PFX.surveyTpl, 3), orgId: ORG_PRO, name: "Refinancing Satisfaction", desc: "Feedback from refinancing clients", questions: CSAT_QUESTIONS },
      { id: uuid(PFX.surveyTpl, 4), orgId: ORG_ENT, name: "Comprehensive CX Survey", desc: "Full customer experience assessment", questions: NPS_QUESTIONS },
      { id: uuid(PFX.surveyTpl, 5), orgId: ORG_ENT, name: "CSAT Quick Pulse", desc: "Quick satisfaction check", questions: CSAT_QUESTIONS },
    ];
    for (const t of surveyTemplates) {
      await pool.query(
        `INSERT INTO survey_templates (id, organization_id, name, description, questions, is_active, is_default, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, true, false, NOW(), NOW())`,
        [t.id, t.orgId, t.name, t.desc, t.questions]
      );
    }
    console.log(`  ✅ ${surveyTemplates.length} survey templates`);

    // 6. EX survey templates (enterprise only)
    const exSurveyTemplates = [
      {
        id: uuid(PFX.exSurveyTpl, 1),
        name: "Employee Pulse Survey",
        desc: "Quarterly employee satisfaction pulse",
        type: "pulse",
        questions: EX_QUESTIONS_SATISFACTION,
        frequency: "quarterly",
      },
      {
        id: uuid(PFX.exSurveyTpl, 2),
        name: "Employee Engagement Survey",
        desc: "Monthly engagement check-in",
        type: "engagement",
        questions: EX_QUESTIONS_ENGAGEMENT,
        frequency: "monthly",
      },
    ];
    for (const t of exSurveyTemplates) {
      await pool.query(
        `INSERT INTO ex_survey_templates (id, organization_id, name, description, survey_type, questions, frequency, is_active, is_anonymous, is_default, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, true, true, false, NOW(), NOW())`,
        [t.id, ORG_ENT, t.name, t.desc, t.type, t.questions, t.frequency]
      );
    }
    console.log(`  ✅ ${exSurveyTemplates.length} EX survey templates`);

    // 7. Response templates
    const responseTemplates: {
      id: string;
      orgId: string;
      name: string;
      category: string;
      tone: string;
      content: string;
    }[] = [];
    let rtIdx = 1;
    // 2 basic
    for (let i = 0; i < 2; i++) {
      responseTemplates.push({
        id: uuid(PFX.responseTpl, rtIdx++),
        orgId: ORG_BASIC,
        name: RESPONSE_TEMPLATE_CATEGORIES[i].name,
        category: RESPONSE_TEMPLATE_CATEGORIES[i].category,
        tone: RESPONSE_TEMPLATE_CATEGORIES[i].tone,
        content: RESPONSE_TEMPLATE_CONTENTS[i],
      });
    }
    // 3 pro
    for (let i = 2; i < 5; i++) {
      responseTemplates.push({
        id: uuid(PFX.responseTpl, rtIdx++),
        orgId: ORG_PRO,
        name: RESPONSE_TEMPLATE_CATEGORIES[i].name,
        category: RESPONSE_TEMPLATE_CATEGORIES[i].category,
        tone: RESPONSE_TEMPLATE_CATEGORIES[i].tone,
        content: RESPONSE_TEMPLATE_CONTENTS[i],
      });
    }
    // 4 enterprise
    for (let i = 5; i < 9; i++) {
      responseTemplates.push({
        id: uuid(PFX.responseTpl, rtIdx++),
        orgId: ORG_ENT,
        name: RESPONSE_TEMPLATE_CATEGORIES[i].name,
        category: RESPONSE_TEMPLATE_CATEGORIES[i].category,
        tone: RESPONSE_TEMPLATE_CATEGORIES[i].tone,
        content: RESPONSE_TEMPLATE_CONTENTS[i],
      });
    }
    for (const t of responseTemplates) {
      await pool.query(
        `INSERT INTO response_templates (id, organization_id, name, category, tone, content, is_active, is_default, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, true, false, NOW(), NOW())`,
        [t.id, t.orgId, t.name, t.category, t.tone, t.content]
      );
    }
    console.log(`  ✅ ${responseTemplates.length} response templates\n`);

    // -----------------------------------------------------------------------
    // PHASE 2: CONTENT
    // -----------------------------------------------------------------------
    console.log("📝 Phase 2: Creating content...");

    // 8. Reviews
    const sources = ["google", "internal", "zillow"];
    const sentimentMap: Record<number, { label: string; score: number }> = {
      5: { label: "positive", score: 0.9 },
      4: { label: "positive", score: 0.7 },
      3: { label: "neutral", score: 0.4 },
      2: { label: "negative", score: 0.2 },
      1: { label: "negative", score: 0.1 },
    };

    interface ReviewDef {
      orgId: string;
      userId: string;
      count: number;
      ratingDist: number[]; // weights for [5, 4, 3, 2, 1]
    }

    const reviewDefs: ReviewDef[] = [
      { orgId: ORG_BASIC, userId: USER_BASIC, count: 8, ratingDist: [5, 2, 1, 0, 0] },
      { orgId: ORG_PRO, userId: USER_PRO, count: 15, ratingDist: [9, 4, 1, 1, 0] },
      { orgId: ORG_ENT, userId: USER_ENT_ADMIN, count: 15, ratingDist: [10, 3, 1, 1, 0] },
      { orgId: ORG_ENT, userId: USER_ENT_MGR, count: 12, ratingDist: [7, 3, 1, 1, 0] },
      { orgId: ORG_ENT, userId: USER_ENT_USER, count: 8, ratingDist: [4, 2, 1, 1, 0] },
    ];

    let reviewIdx = 1;
    let custIdx = 0;
    const reviewIds: { id: string; orgId: string; userId: string; rating: number }[] = [];

    for (const def of reviewDefs) {
      // Build rating array from distribution
      const ratings: number[] = [];
      const ratingValues = [5, 4, 3, 2, 1];
      for (let r = 0; r < ratingValues.length; r++) {
        for (let c = 0; c < def.ratingDist[r]; c++) {
          ratings.push(ratingValues[r]);
        }
      }
      // Pad if needed
      while (ratings.length < def.count) ratings.push(5);

      for (let i = 0; i < def.count; i++) {
        const id = uuid(PFX.review, reviewIdx++);
        const rating = ratings[i];
        const source = sources[i % sources.length];
        const sentiment = sentimentMap[rating];
        const dayOffset = Math.floor((i / def.count) * 180); // spread over 6 months
        const reviewDate = daysAgo(180 - dayOffset);
        const status = i < def.count - 2 ? "approved" : i === def.count - 2 ? "pending" : "rejected";
        const customerName = CUSTOMER_NAMES[custIdx % CUSTOMER_NAMES.length];
        custIdx++;

        let text: string;
        if (rating === 5) text = REVIEW_TEXTS_5[i % REVIEW_TEXTS_5.length];
        else if (rating === 4) text = REVIEW_TEXTS_4[i % REVIEW_TEXTS_4.length];
        else if (rating === 3) text = REVIEW_TEXTS_3[i % REVIEW_TEXTS_3.length];
        else text = REVIEW_TEXTS_LOW[i % REVIEW_TEXTS_LOW.length];

        const hasResponse = status === "approved" && rating >= 4 && i % 3 === 0;
        const responseText = hasResponse
          ? `Thank you for the wonderful review, ${customerName}! We appreciate your trust in our team.`
          : null;

        await pool.query(
          `INSERT INTO reviews (id, organization_id, user_id, customer_name, customer_email, rating, text, source, review_date, status, sentiment_label, sentiment_score, key_phrases, themes, response_text, response_at, is_published, featured, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $19)`,
          [
            id,
            def.orgId,
            def.userId,
            customerName,
            `${customerName.toLowerCase().replace(/\s/g, ".")}@example.com`,
            rating,
            text,
            source,
            reviewDate,
            status,
            sentiment.label,
            sentiment.score,
            `{${rating >= 4 ? '"great service","professional","responsive"' : '"needs improvement","communication"'}}`,
            `{${rating >= 4 ? '"customer service","loan process"' : '"delays","communication"'}}`,
            responseText,
            hasResponse ? daysAgo(180 - dayOffset - 1) : null,
            status === "approved",
            rating === 5 && i < 3,
            reviewDate,
          ]
        );
        reviewIds.push({ id, orgId: def.orgId, userId: def.userId, rating });
      }
    }
    console.log(`  ✅ ${reviewIdx - 1} reviews`);

    // 9. Surveys
    interface SurveyDef {
      orgId: string;
      userId: string;
      templateId: string;
      count: number;
    }
    const surveyDefs: SurveyDef[] = [
      { orgId: ORG_BASIC, userId: USER_BASIC, templateId: surveyTemplates[0].id, count: 5 },
      { orgId: ORG_PRO, userId: USER_PRO, templateId: surveyTemplates[1].id, count: 10 },
      { orgId: ORG_ENT, userId: USER_ENT_ADMIN, templateId: surveyTemplates[3].id, count: 8 },
      { orgId: ORG_ENT, userId: USER_ENT_MGR, templateId: surveyTemplates[3].id, count: 7 },
      { orgId: ORG_ENT, userId: USER_ENT_USER, templateId: surveyTemplates[4].id, count: 5 },
    ];

    let surveyIdx = 1;
    const surveyIds: { id: string; orgId: string; userId: string; status: string }[] = [];

    for (const def of surveyDefs) {
      for (let i = 0; i < def.count; i++) {
        const id = uuid(PFX.survey, surveyIdx);
        const token = `survey-token-${surveyIdx}`;
        surveyIdx++;
        const dayOffset = Math.floor((i / def.count) * 180);
        const sentAt = daysAgo(180 - dayOffset);
        const statusOptions = ["completed", "completed", "completed", "opened", "sent"];
        const status = statusOptions[i % statusOptions.length];
        const customerName = CUSTOMER_NAMES[(custIdx++) % CUSTOMER_NAMES.length];

        await pool.query(
          `INSERT INTO surveys (id, organization_id, user_id, template_id, customer_name, customer_email, token, status, sent_at, opened_at, completed_at, transaction_type, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $13)`,
          [
            id,
            def.orgId,
            def.userId,
            def.templateId,
            customerName,
            `${customerName.toLowerCase().replace(/\s/g, ".")}@example.com`,
            token,
            status,
            sentAt,
            status !== "sent" ? daysAgo(180 - dayOffset - 1) : null,
            status === "completed" ? daysAgo(180 - dayOffset - 2) : null,
            i % 2 === 0 ? "purchase" : "refinance",
            sentAt,
          ]
        );
        surveyIds.push({ id, orgId: def.orgId, userId: def.userId, status });
      }
    }
    console.log(`  ✅ ${surveyIdx - 1} surveys`);

    // 10. Survey responses (only for completed surveys)
    let srIdx = 1;
    const completedSurveys = surveyIds.filter((s) => s.status === "completed");
    for (const survey of completedSurveys) {
      const id = uuid(PFX.surveyResp, srIdx++);
      // Vary NPS: promoters 9-10, passives 7-8, detractors 0-6
      const npsOptions = [10, 9, 9, 10, 8, 7, 5, 3]; // ~50% promoter, ~25% passive, ~25% detractor
      const npsScore = npsOptions[srIdx % npsOptions.length];
      const overallRating = npsScore >= 9 ? 5 : npsScore >= 7 ? 4 : npsScore >= 5 ? 3 : 2;
      const sentiment = sentimentMap[overallRating];

      const testimonialTexts = [
        "Excellent experience, would highly recommend!",
        "Great service from start to finish.",
        "Very satisfied with the process.",
        "Good experience overall.",
        null,
        null,
      ];

      await pool.query(
        `INSERT INTO survey_responses (id, survey_id, nps_score, overall_rating, answers, sentiment_label, sentiment_score, testimonial_text, key_phrases, themes, submitted_at, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $11)`,
        [
          id,
          survey.id,
          npsScore,
          overallRating,
          JSON.stringify({
            q1: npsScore,
            q2: overallRating,
            q3: npsScore >= 7 ? "Everything was great!" : "Communication could be improved.",
            q4: testimonialTexts[srIdx % testimonialTexts.length] || "",
          }),
          sentiment.label,
          sentiment.score,
          testimonialTexts[srIdx % testimonialTexts.length],
          `{"mortgage","${npsScore >= 7 ? "great experience" : "needs improvement"}"}`,
          `{"${npsScore >= 7 ? "customer service" : "communication"}","loan process"}`,
          daysAgo(Math.max(0, 170 - srIdx * 5)),
        ]
      );
    }
    console.log(`  ✅ ${srIdx - 1} survey responses`);

    // 11. Testimonials (curated from top reviews)
    const topReviews = reviewIds.filter((r) => r.rating === 5);
    let testIdx = 1;
    const testimonialCounts: Record<string, number> = {
      [ORG_BASIC]: 2,
      [ORG_PRO]: 4,
      [ORG_ENT]: 6,
    };
    for (const orgId of ORG_IDS) {
      const orgReviews = topReviews.filter((r) => r.orgId === orgId);
      const count = testimonialCounts[orgId];
      for (let i = 0; i < count && i < orgReviews.length; i++) {
        const id = uuid(PFX.testimonial, testIdx++);
        const review = orgReviews[i];
        const status = i < count - 1 ? "approved" : "draft";
        await pool.query(
          `INSERT INTO testimonials (id, organization_id, user_id, review_id, content, format, status, original_quote, key_highlights, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())`,
          [
            id,
            orgId,
            review.userId,
            review.id,
            TESTIMONIAL_TEXTS[testIdx % TESTIMONIAL_TEXTS.length],
            ["short", "medium", "long"][i % 3],
            status,
            TESTIMONIAL_TEXTS[testIdx % TESTIMONIAL_TEXTS.length],
            `{"${i % 2 === 0 ? "professional service" : "great rates"}","${i % 2 === 0 ? "responsive team" : "smooth process"}"}`,
          ]
        );
      }
    }
    console.log(`  ✅ ${testIdx - 1} testimonials`);

    // 12. EX Surveys (enterprise only)
    const exSurveys = [
      {
        id: uuid(PFX.exSurvey, 1),
        templateId: exSurveyTemplates[0].id,
        name: "Q4 Employee Pulse",
        type: "pulse",
        status: "closed",
        startDate: monthsAgo(3),
        endDate: monthsAgo(2),
      },
      {
        id: uuid(PFX.exSurvey, 2),
        templateId: exSurveyTemplates[1].id,
        name: "January Engagement Check-in",
        type: "engagement",
        status: "closed",
        startDate: monthsAgo(1),
        endDate: daysAgo(5),
      },
      {
        id: uuid(PFX.exSurvey, 3),
        templateId: exSurveyTemplates[0].id,
        name: "Q1 Employee Pulse",
        type: "pulse",
        status: "active",
        startDate: daysAgo(7),
        endDate: daysAgo(-14),
      },
    ];
    for (const s of exSurveys) {
      await pool.query(
        `INSERT INTO ex_surveys (id, organization_id, template_id, name, survey_type, status, start_date, end_date, is_anonymous, total_invites, total_responses, response_rate, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, 3, $9, $10, NOW(), NOW())`,
        [
          s.id,
          ORG_ENT,
          s.templateId,
          s.name,
          s.type,
          s.status,
          s.startDate,
          s.endDate,
          s.status === "closed" ? 3 : 1,
          s.status === "closed" ? 100 : 33,
        ]
      );
    }
    console.log(`  ✅ ${exSurveys.length} EX surveys`);

    // 13. EX Survey Responses (3 per completed survey = 9 total, 1 for active = 10)
    let exRespIdx = 1;
    const entUsers = [USER_ENT_USER, USER_ENT_MGR, USER_ENT_ADMIN];
    const entDepts = [departments[0].id, departments[0].id, departments[1].id];

    for (const survey of exSurveys) {
      const respondents = survey.status === "closed" ? 3 : 1;
      for (let i = 0; i < respondents; i++) {
        const id = uuid(PFX.exSurveyResp, exRespIdx++);
        // Vary eNPS: admin=excellent, mgr=good, user=mixed
        const enpsScores = [6, 8, 9]; // user, mgr, admin
        const enps = enpsScores[i % 3];
        const overallRating = enps >= 9 ? 5 : enps >= 7 ? 4 : 3;

        await pool.query(
          `INSERT INTO ex_survey_responses (id, survey_id, department_id, is_anonymous, enps_score, overall_rating, answers, sentiment_label, sentiment_score, role_category, tenure_range, submitted_at, created_at)
           VALUES ($1, $2, $3, true, $4, $5, $6, $7, $8, $9, $10, $11, $11)`,
          [
            id,
            survey.id,
            entDepts[i % 3],
            enps,
            overallRating,
            JSON.stringify({
              eq1: overallRating,
              eq2: overallRating,
              eq3: enps,
              eq4: enps >= 8 ? "Love the team culture!" : "More growth opportunities would be nice.",
            }),
            overallRating >= 4 ? "positive" : "neutral",
            overallRating >= 4 ? 0.8 : 0.5,
            ["user", "manager", "admin"][i % 3],
            ["1-3 years", "3-5 years", "5+ years"][i % 3],
            daysAgo(Math.max(0, 30 - exRespIdx * 3)),
          ]
        );
      }
    }
    console.log(`  ✅ ${exRespIdx - 1} EX survey responses`);

    // 14. Recognitions (enterprise only, peer recognition)
    const recognitionPairs = [
      { from: USER_ENT_ADMIN, to: USER_ENT_MGR, badge: 0 },
      { from: USER_ENT_ADMIN, to: USER_ENT_USER, badge: 1 },
      { from: USER_ENT_MGR, to: USER_ENT_ADMIN, badge: 2 },
      { from: USER_ENT_MGR, to: USER_ENT_USER, badge: 3 },
      { from: USER_ENT_USER, to: USER_ENT_ADMIN, badge: 4 },
      { from: USER_ENT_USER, to: USER_ENT_MGR, badge: 0 },
      { from: USER_ENT_ADMIN, to: USER_ENT_MGR, badge: 1 },
      { from: USER_ENT_MGR, to: USER_ENT_USER, badge: 2 },
    ];
    for (let i = 0; i < recognitionPairs.length; i++) {
      const p = recognitionPairs[i];
      const id = uuid(PFX.recognition, i + 1);
      await pool.query(
        `INSERT INTO recognitions (id, organization_id, from_user_id, to_user_id, badge_id, message, points_awarded, visibility, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'public', $8)`,
        [
          id,
          ORG_ENT,
          p.from,
          p.to,
          badges[p.badge].id,
          RECOGNITION_MESSAGES[i],
          badges[p.badge].points,
          daysAgo(Math.max(0, 160 - i * 20)),
        ]
      );
    }
    console.log(`  ✅ ${recognitionPairs.length} recognitions\n`);

    // -----------------------------------------------------------------------
    // PHASE 3: ANALYTICS & CONFIG
    // -----------------------------------------------------------------------
    console.log("📊 Phase 3: Creating analytics & config...");

    // 15. Metrics snapshots (6 months x 3 orgs = 18, plus per-user for enterprise = 30)
    let msIdx = 1;
    interface MetricsEntry {
      orgId: string;
      userId: string | null;
      monthsBack: number;
      avgRating: number;
      totalReviews: number;
      nps: number;
      responseRate: number;
    }

    const metricsEntries: MetricsEntry[] = [];
    for (let m = 5; m >= 0; m--) {
      // Basic org
      metricsEntries.push({
        orgId: ORG_BASIC,
        userId: null,
        monthsBack: m,
        avgRating: 4.3 + (5 - m) * 0.05,
        totalReviews: 1 + (5 - m),
        nps: 45 + (5 - m) * 3,
        responseRate: 60 + (5 - m) * 2,
      });
      // Pro org
      metricsEntries.push({
        orgId: ORG_PRO,
        userId: null,
        monthsBack: m,
        avgRating: 4.5 + (5 - m) * 0.03,
        totalReviews: 2 + (5 - m) * 2,
        nps: 55 + (5 - m) * 2,
        responseRate: 70 + (5 - m) * 1.5,
      });
      // Enterprise org
      metricsEntries.push({
        orgId: ORG_ENT,
        userId: null,
        monthsBack: m,
        avgRating: 4.6 + (5 - m) * 0.02,
        totalReviews: 5 + (5 - m) * 5,
        nps: 60 + (5 - m) * 3,
        responseRate: 75 + (5 - m) * 1,
      });
      // Enterprise per-user
      metricsEntries.push({
        orgId: ORG_ENT,
        userId: USER_ENT_ADMIN,
        monthsBack: m,
        avgRating: 4.8 + (5 - m) * 0.01,
        totalReviews: 2 + (5 - m) * 2,
        nps: 70 + (5 - m) * 2,
        responseRate: 85 + (5 - m) * 1,
      });
      metricsEntries.push({
        orgId: ORG_ENT,
        userId: USER_ENT_MGR,
        monthsBack: m,
        avgRating: 4.5 + (5 - m) * 0.02,
        totalReviews: 1 + (5 - m) * 2,
        nps: 55 + (5 - m) * 3,
        responseRate: 70 + (5 - m) * 2,
      });
    }

    for (const entry of metricsEntries) {
      const id = uuid(PFX.metricSnap, msIdx++);
      const periodStart = monthsAgo(entry.monthsBack + 1);
      const periodEnd = monthsAgo(entry.monthsBack);

      await pool.query(
        `INSERT INTO metrics_snapshots (id, organization_id, user_id, period_type, period_start, period_end, metrics, computed_at)
         VALUES ($1, $2, $3, 'monthly', $4, $5, $6, $7)`,
        [
          id,
          entry.orgId,
          entry.userId,
          periodStart,
          periodEnd,
          JSON.stringify({
            average_rating: Math.round(entry.avgRating * 100) / 100,
            total_reviews: entry.totalReviews,
            nps_score: entry.nps,
            response_rate: Math.round(entry.responseRate * 10) / 10,
            five_star_count: Math.round(entry.totalReviews * 0.6),
            four_star_count: Math.round(entry.totalReviews * 0.25),
            three_star_count: Math.round(entry.totalReviews * 0.1),
            two_star_count: Math.round(entry.totalReviews * 0.03),
            one_star_count: Math.round(entry.totalReviews * 0.02),
            surveys_sent: Math.round(entry.totalReviews * 1.5),
            surveys_completed: Math.round(entry.totalReviews * 1.5 * (entry.responseRate / 100)),
          }),
          periodEnd,
        ]
      );
    }
    console.log(`  ✅ ${msIdx - 1} metrics snapshots`);

    // 16. Leaderboard snapshots (enterprise only, 3 users x 6 months = 18)
    let lbIdx = 1;
    for (let m = 5; m >= 0; m--) {
      const snapshotDate = monthsAgo(m);
      const periodKey = new Date(snapshotDate).toISOString().slice(0, 7); // YYYY-MM

      const leaderboardUsers = [
        { userId: USER_ENT_ADMIN, rank: 1, repScore: 92 + (5 - m), avgRating: 4.85, totalReviews: 2 + (5 - m) * 2, nps: 72 },
        { userId: USER_ENT_MGR, rank: 2, repScore: 82 + (5 - m), avgRating: 4.55, totalReviews: 1 + (5 - m) * 2, nps: 58 },
        { userId: USER_ENT_USER, rank: 3, repScore: 68 + (5 - m), avgRating: 4.1, totalReviews: 1 + (5 - m), nps: 40 },
      ];

      for (const u of leaderboardUsers) {
        const id = uuid(PFX.lbSnap, lbIdx++);
        const snapshotDateOnly = new Date(snapshotDate).toISOString().slice(0, 10);
        await pool.query(
          `INSERT INTO leaderboard_snapshots (id, organization_id, user_id, period_type, period_key, snapshot_date, rank, reputation_score, average_rating, total_reviews, nps_score, created_at)
           VALUES ($1, $2, $3, 'monthly', $4, $5::date, $6, $7, $8, $9, $10, $11)`,
          [
            id,
            ORG_ENT,
            u.userId,
            periodKey,
            snapshotDateOnly,
            u.rank,
            u.repScore,
            u.avgRating,
            u.totalReviews,
            u.nps,
            snapshotDate,
          ]
        );
      }
    }
    console.log(`  ✅ ${lbIdx - 1} leaderboard snapshots`);

    // 17. Reputation history (Pro: 3, Enterprise: 9)
    let rhIdx = 1;
    // Pro user
    for (let i = 0; i < 3; i++) {
      const id = uuid(PFX.repHist, rhIdx++);
      const prevScore = 70 + i * 5;
      const change = [3, 5, -2][i];
      await pool.query(
        `INSERT INTO reputation_history (id, user_id, previous_score, new_score, change_amount, change_reason, recorded_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [id, USER_PRO, prevScore, prevScore + change, change, change > 0 ? "New 5-star review received" : "Response time exceeded threshold", monthsAgo(5 - i * 2)]
      );
    }
    // Enterprise users
    for (const userId of entUsers) {
      for (let i = 0; i < 3; i++) {
        const id = uuid(PFX.repHist, rhIdx++);
        const baseScore = userId === USER_ENT_ADMIN ? 85 : userId === USER_ENT_MGR ? 75 : 65;
        const prevScore = baseScore + i * 3;
        const change = [4, 2, -1][i];
        await pool.query(
          `INSERT INTO reputation_history (id, user_id, previous_score, new_score, change_amount, change_reason, recorded_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [id, userId, prevScore, prevScore + change, change, change > 0 ? "Positive review streak" : "Below-average rating received", monthsAgo(5 - i * 2)]
        );
      }
    }
    console.log(`  ✅ ${rhIdx - 1} reputation history entries`);

    // 18. Notification preferences (1 per user)
    for (let i = 0; i < allUserIds.length; i++) {
      const id = uuid(PFX.notifPref, i + 1);
      await pool.query(
        `INSERT INTO notification_preferences (id, user_id, email_enabled, email_new_review, email_negative_review, email_response_posted, email_review_approved, email_badge_earned, email_mention, in_app_enabled, in_app_new_review, in_app_negative_review, in_app_response_posted, in_app_review_approved, in_app_badge_earned, in_app_mention, instant_alert_enabled, instant_alert_threshold, digest_enabled, digest_frequency, created_at, updated_at)
         VALUES ($1, $2, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, 3, true, 'weekly', NOW(), NOW())`,
        [id, allUserIds[i]]
      );
    }
    console.log(`  ✅ ${allUserIds.length} notification preferences`);

    // 19. Widget configs
    const widgetConfigs = [
      {
        id: uuid(PFX.widgetCfg, 1),
        orgId: ORG_BASIC,
        name: "Basic Review Widget",
        widgetType: "lo_review" as const,
        entityType: "user" as const,
        entityId: USER_BASIC,
        widgetId: "widget-basic-001",
      },
      {
        id: uuid(PFX.widgetCfg, 2),
        orgId: ORG_PRO,
        name: "Pro Review Carousel",
        widgetType: "review_carousel" as const,
        entityType: "user" as const,
        entityId: USER_PRO,
        widgetId: "widget-pro-001",
      },
      {
        id: uuid(PFX.widgetCfg, 3),
        orgId: ORG_ENT,
        name: "Enterprise Star Badge",
        widgetType: "star_rating_badge" as const,
        entityType: "organization" as const,
        entityId: ORG_ENT,
        widgetId: "widget-ent-001",
      },
      {
        id: uuid(PFX.widgetCfg, 4),
        orgId: ORG_ENT,
        name: "Branch Review Wall",
        widgetType: "review_wall" as const,
        entityType: "branch" as const,
        entityId: branches[0].id,
        widgetId: "widget-ent-002",
      },
    ];
    for (const w of widgetConfigs) {
      await pool.query(
        `INSERT INTO widget_configs (id, organization_id, name, widget_type, entity_type, entity_id, widget_id, status, config, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', $8, NOW(), NOW())`,
        [
          w.id,
          w.orgId,
          w.name,
          w.widgetType,
          w.entityType,
          w.entityId,
          w.widgetId,
          JSON.stringify({
            theme: "light",
            showRating: true,
            maxReviews: 10,
            autoPlay: w.widgetType === "review_carousel",
          }),
        ]
      );
    }
    console.log(`  ✅ ${widgetConfigs.length} widget configs\n`);

    // -----------------------------------------------------------------------
    // PHASE 4: COMPUTED UPDATES
    // -----------------------------------------------------------------------
    console.log("🔄 Phase 4: Computing user metrics...");

    // Compute actual metrics from seeded reviews
    interface UserMetrics {
      userId: string;
      totalReviews: number;
      avgRating: number;
      nps: number;
      reputation: number;
    }

    const userMetrics: UserMetrics[] = [
      {
        userId: USER_BASIC,
        totalReviews: reviewIds.filter((r) => r.userId === USER_BASIC).length,
        avgRating:
          reviewIds.filter((r) => r.userId === USER_BASIC).reduce((s, r) => s + r.rating, 0) /
          Math.max(1, reviewIds.filter((r) => r.userId === USER_BASIC).length),
        nps: 50,
        reputation: 72,
      },
      {
        userId: USER_PRO,
        totalReviews: reviewIds.filter((r) => r.userId === USER_PRO).length,
        avgRating:
          reviewIds.filter((r) => r.userId === USER_PRO).reduce((s, r) => s + r.rating, 0) /
          Math.max(1, reviewIds.filter((r) => r.userId === USER_PRO).length),
        nps: 62,
        reputation: 83,
      },
      {
        userId: USER_ENT_ADMIN,
        totalReviews: reviewIds.filter((r) => r.userId === USER_ENT_ADMIN).length,
        avgRating:
          reviewIds.filter((r) => r.userId === USER_ENT_ADMIN).reduce((s, r) => s + r.rating, 0) /
          Math.max(1, reviewIds.filter((r) => r.userId === USER_ENT_ADMIN).length),
        nps: 72,
        reputation: 95,
      },
      {
        userId: USER_ENT_MGR,
        totalReviews: reviewIds.filter((r) => r.userId === USER_ENT_MGR).length,
        avgRating:
          reviewIds.filter((r) => r.userId === USER_ENT_MGR).reduce((s, r) => s + r.rating, 0) /
          Math.max(1, reviewIds.filter((r) => r.userId === USER_ENT_MGR).length),
        nps: 58,
        reputation: 84,
      },
      {
        userId: USER_ENT_USER,
        totalReviews: reviewIds.filter((r) => r.userId === USER_ENT_USER).length,
        avgRating:
          reviewIds.filter((r) => r.userId === USER_ENT_USER).reduce((s, r) => s + r.rating, 0) /
          Math.max(1, reviewIds.filter((r) => r.userId === USER_ENT_USER).length),
        nps: 40,
        reputation: 70,
      },
    ];

    for (const m of userMetrics) {
      await pool.query(
        `UPDATE users SET total_reviews = $1, average_rating = $2, nps_score = $3, reputation_score = $4 WHERE id = $5`,
        [
          m.totalReviews,
          Math.round(m.avgRating * 100) / 100,
          m.nps,
          m.reputation,
          m.userId,
        ]
      );
    }
    console.log("  ✅ User metrics updated\n");

    // -----------------------------------------------------------------------
    // RE-ENABLE TRIGGERS & COMMIT
    // -----------------------------------------------------------------------
    await pool.query("SET session_replication_role = 'origin'");
    console.log("⚡ Triggers re-enabled");

    await pool.query("COMMIT");

    // -----------------------------------------------------------------------
    // SUMMARY
    // -----------------------------------------------------------------------
    console.log("\n✨ Demo data seeded successfully!\n");
    console.log("=".repeat(55));
    console.log("SEED DATA SUMMARY");
    console.log("=".repeat(55));
    console.log(`  Branches:              ${branches.length}`);
    console.log(`  Departments:           ${departments.length}`);
    console.log(`  Recognition Badges:    ${badges.length}`);
    console.log(`  Survey Templates:      ${surveyTemplates.length}`);
    console.log(`  EX Survey Templates:   ${exSurveyTemplates.length}`);
    console.log(`  Response Templates:    ${responseTemplates.length}`);
    console.log(`  Reviews:               ${reviewIdx - 1}`);
    console.log(`  Surveys:               ${surveyIdx - 1}`);
    console.log(`  Survey Responses:      ${srIdx - 1}`);
    console.log(`  Testimonials:          ${testIdx - 1}`);
    console.log(`  EX Surveys:            ${exSurveys.length}`);
    console.log(`  EX Survey Responses:   ${exRespIdx - 1}`);
    console.log(`  Recognitions:          ${recognitionPairs.length}`);
    console.log(`  Metrics Snapshots:     ${msIdx - 1}`);
    console.log(`  Leaderboard Snapshots: ${lbIdx - 1}`);
    console.log(`  Reputation History:    ${rhIdx - 1}`);
    console.log(`  Notification Prefs:    ${allUserIds.length}`);
    console.log(`  Widget Configs:        ${widgetConfigs.length}`);
    console.log("=".repeat(55));
    console.log("\n📋 Verification Checklist:");
    console.log("  1. Login as each test user at /login");
    console.log("  2. Dashboard should show metrics (rating, NPS, review count)");
    console.log("  3. Reviews page should have entries with mixed statuses");
    console.log("  4. Surveys page should show templates + sent surveys");
    console.log("  5. Team page (enterprise) should show member comparison");
    console.log("  6. Analytics trend charts should show 6 months of data");
    console.log("  7. Re-run this script to confirm idempotency");
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error("❌ Error seeding test data:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

seedTestData().catch((error) => {
  console.error(error);
  process.exit(1);
});
