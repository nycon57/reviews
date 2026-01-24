#!/usr/bin/env ts-node
/**
 * Seed Test Users for Role/Permission Testing
 *
 * Creates 5 test users covering all permission combinations:
 * - individual-basic@test.com: Individual account, Basic tier
 * - individual-pro@test.com: Individual account, Pro tier
 * - enterprise-user@test.com: Enterprise, user role
 * - enterprise-manager@test.com: Enterprise, manager role
 * - enterprise-admin@test.com: Enterprise, admin role
 *
 * Usage:
 *   npm run seed:test-users
 *
 * All users share password: TestPassword123!
 *
 * Requires: DATABASE_URL or DIRECT_DATABASE_URL environment variable
 */

import bcrypt from "bcrypt";
import crypto from "crypto";
import { Pool } from "pg";
import * as fs from "fs";
import * as path from "path";

const TEST_PASSWORD = "TestPassword123!";

// Load .env.local manually since we're running outside Next.js
function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    for (const line of envContent.split("\n")) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const [key, ...valueParts] = trimmed.split("=");
        const value = valueParts.join("=").replace(/^["']|["']$/g, "");
        if (key && !process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  }
}

interface TestOrg {
  id: string;
  name: string;
  slug: string;
  accountType: "individual" | "enterprise";
  subscriptionTier: "basic" | "pro" | "enterprise";
}

interface TestUser {
  id: string;
  email: string;
  fullName: string;
  role: "admin" | "manager" | "user";
  isOwner: boolean;
  organizationId: string;
  title: string;
  industry: string;
}

// Test organizations - use fixed UUIDs for reproducibility
const testOrgs: TestOrg[] = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    name: "Individual Basic Test",
    slug: "individual-basic-test",
    accountType: "individual",
    subscriptionTier: "basic",
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    name: "Individual Pro Test",
    slug: "individual-pro-test",
    accountType: "individual",
    subscriptionTier: "pro",
  },
  {
    id: "33333333-3333-3333-3333-333333333333",
    name: "Enterprise Test Corp",
    slug: "enterprise-test-corp",
    accountType: "enterprise",
    subscriptionTier: "enterprise",
  },
];

// Test users with fixed UUIDs
const testUsers: TestUser[] = [
  {
    id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    email: "individual-basic@test.com",
    fullName: "Individual Basic User",
    role: "admin", // Individual users are admin of their own org
    isOwner: true,
    organizationId: testOrgs[0].id,
    title: "Loan Officer",
    industry: "mortgage",
  },
  {
    id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    email: "individual-pro@test.com",
    fullName: "Individual Pro User",
    role: "admin",
    isOwner: true,
    organizationId: testOrgs[1].id,
    title: "Senior Loan Officer",
    industry: "mortgage",
  },
  {
    id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
    email: "enterprise-user@test.com",
    fullName: "Enterprise Team Member",
    role: "user",
    isOwner: false,
    organizationId: testOrgs[2].id,
    title: "Loan Officer",
    industry: "mortgage",
  },
  {
    id: "dddddddd-dddd-dddd-dddd-dddddddddddd",
    email: "enterprise-manager@test.com",
    fullName: "Enterprise Manager",
    role: "manager",
    isOwner: false,
    organizationId: testOrgs[2].id,
    title: "Branch Manager",
    industry: "mortgage",
  },
  {
    id: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
    email: "enterprise-admin@test.com",
    fullName: "Enterprise Admin",
    role: "admin",
    isOwner: true,
    organizationId: testOrgs[2].id,
    title: "VP of Operations",
    industry: "mortgage",
  },
];

async function createPool(): Promise<Pool> {
  const connectionUrl =
    process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL;

  if (!connectionUrl) {
    throw new Error(
      "DATABASE_URL or DIRECT_DATABASE_URL must be set in .env.local"
    );
  }

  const url = new URL(connectionUrl);

  return new Pool({
    host: url.hostname,
    port: parseInt(url.port) || 5432,
    user: url.username,
    password: decodeURIComponent(url.password),
    database: url.pathname.slice(1) || "postgres",
    ssl: {
      rejectUnauthorized: false,
    },
  });
}

async function seedTestUsers() {
  console.log("🌱 Seeding test users for role/permission testing...\n");

  loadEnv();
  const pool = await createPool();

  try {
    // Hash password once for all users
    const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);
    console.log(`📝 Password for all test users: ${TEST_PASSWORD}\n`);

    // Start transaction
    await pool.query("BEGIN");

    // Clean up existing test data (in reverse order of dependencies)
    console.log("🧹 Cleaning up existing test data...");
    for (const user of testUsers) {
      // Delete accounts first (FK to users)
      await pool.query(
        "DELETE FROM accounts WHERE user_id IN (SELECT id FROM users WHERE email = $1)",
        [user.email]
      );
      // Delete sessions (FK to users)
      await pool.query(
        "DELETE FROM sessions WHERE user_id IN (SELECT id FROM users WHERE email = $1)",
        [user.email]
      );
      // Delete users
      await pool.query("DELETE FROM users WHERE email = $1", [user.email]);
    }
    for (const org of testOrgs) {
      await pool.query("DELETE FROM organizations WHERE slug = $1", [org.slug]);
    }

    // Create test organizations
    console.log("\n📁 Creating test organizations...");
    for (const org of testOrgs) {
      await pool.query(
        `INSERT INTO organizations (id, name, slug, account_type, subscription_tier, subscription_status, onboarding_status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, 'active', 'completed', NOW(), NOW())`,
        [org.id, org.name, org.slug, org.accountType, org.subscriptionTier]
      );
      console.log(
        `  ✅ ${org.name} (${org.accountType}, ${org.subscriptionTier})`
      );
    }

    // Create test users
    console.log("\n👤 Creating test users...");
    for (const user of testUsers) {
      // Insert user
      await pool.query(
        `INSERT INTO users (
          id, organization_id, email, full_name, role, is_owner, is_active,
          title, industry, email_verified_at, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, true, $7, $8, NOW(), NOW(), NOW())`,
        [
          user.id,
          user.organizationId,
          user.email,
          user.fullName,
          user.role,
          user.isOwner,
          user.title,
          user.industry,
        ]
      );

      // Create credential account for password login
      await pool.query(
        `INSERT INTO accounts (
          id, user_id, account_id, provider_id, password, created_at, updated_at
        )
        VALUES ($1, $2, $3, 'credential', $4, NOW(), NOW())`,
        [crypto.randomUUID(), user.id, user.email, passwordHash]
      );

      // Find org info for display
      const org = testOrgs.find((o) => o.id === user.organizationId)!;
      console.log(
        `  ✅ ${user.email} (${org.accountType}, ${user.role}, ${org.subscriptionTier})`
      );
    }

    // Commit transaction
    await pool.query("COMMIT");

    console.log("\n✨ Test users seeded successfully!\n");
    console.log("=".repeat(60));
    console.log("TEST USER CREDENTIALS");
    console.log("=".repeat(60));
    console.log(`Password: ${TEST_PASSWORD}\n`);
    console.log("Users:");
    console.log("-".repeat(60));
    console.log(
      "| Email                         | Account Type | Role         |"
    );
    console.log("-".repeat(60));
    for (const user of testUsers) {
      const org = testOrgs.find((o) => o.id === user.organizationId)!;
      const email = user.email.padEnd(29);
      const accountType = org.accountType.padEnd(12);
      const role = user.role.padEnd(12);
      console.log(`| ${email} | ${accountType} | ${role} |`);
    }
    console.log("-".repeat(60));

    console.log("\n📋 Sidebar Visibility Matrix:");
    console.log("-".repeat(80));
    console.log(
      "| Route              | Indiv Basic | Indiv Pro | Ent User | Ent Mgr | Ent Admin |"
    );
    console.log("-".repeat(80));
    const routes = [
      ["Dashboard", "✅", "✅", "✅", "✅", "✅"],
      ["Reviews", "✅", "✅", "✅", "✅", "✅"],
      ["Surveys", "✅", "✅", "✅", "✅", "✅"],
      ["Analytics", "✅", "✅", "✅", "✅", "✅"],
      ["Testimonials", "✅", "✅", "✅", "✅", "✅"],
      ["Manager Dashboard", "❌", "❌", "❌", "✅", "✅"],
      ["Team", "❌", "❌", "❌", "✅", "✅"],
      ["Recognition", "❌", "❌", "✅", "✅", "✅"],
      ["Leaderboard", "❌", "❌", "✅", "✅", "✅"],
      ["AI Insights", "🔒", "✅", "✅", "✅", "✅"],
      ["Geo Visibility", "🔒", "✅", "✅", "✅", "✅"],
      ["Website Analytics", "🔒", "✅", "✅", "✅", "✅"],
      ["EX Surveys", "❌", "❌", "❌", "✅", "✅"],
      ["Campaigns", "❌", "❌", "❌", "✅", "✅"],
      ["Organization", "❌", "❌", "❌", "❌", "✅"],
      ["Admin Analytics", "❌", "❌", "❌", "❌", "✅"],
    ];
    for (const [route, ...values] of routes) {
      const paddedRoute = (route as string).padEnd(18);
      const paddedValues = values.map((v) => (v as string).padStart(5).padEnd(11));
      console.log(`| ${paddedRoute} | ${paddedValues.join(" | ")} |`);
    }
    console.log("-".repeat(80));
    console.log("Legend: ✅=Visible, ❌=Hidden, 🔒=Locked (shows upgrade prompt)");

    console.log("\n📋 Testing Checklist:");
    console.log("  1. Login as each user at /login");
    console.log("  2. Verify sidebar shows correct items (compare to matrix)");
    console.log("  3. Try accessing restricted routes directly via URL");
    console.log("  4. Verify Pro features show lock icon for Basic tier");
    console.log("  5. Check RLS - each user should only see their org's data");
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error("❌ Error seeding test users:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the seed
seedTestUsers().catch((error) => {
  console.error(error);
  process.exit(1);
});
