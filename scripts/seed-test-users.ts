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
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const TEST_PASSWORD = "TestPassword123!";

// Load env files manually since we're running outside Next.js
function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    const envPath = path.resolve(process.cwd(), file);
    if (!fs.existsSync(envPath)) continue;

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

async function syncSupabaseAuthUsers() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.log("  ⚠️  Skipping Supabase Auth user sync (missing service-role env)");
    return;
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data: existingUsers, error: listError } =
    await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });

  if (listError) {
    throw new Error(`Failed to list Supabase Auth users: ${listError.message}`);
  }

  const existingByEmail = new Map(
    existingUsers.users.map((user) => [user.email?.toLowerCase(), user])
  );

  for (const user of testUsers) {
    const org = testOrgs.find((candidate) => candidate.id === user.organizationId)!;
    const metadata = {
      full_name: user.fullName,
      organization_name: org.name,
    };
    const existing = existingByEmail.get(user.email.toLowerCase());

    if (existing && existing.id !== user.id) {
      const { error } = await supabase.auth.admin.deleteUser(existing.id);
      if (error) {
        throw new Error(`Failed to delete mismatched auth user ${user.email}: ${error.message}`);
      }
    }

    if (existing?.id === user.id) {
      const { error } = await supabase.auth.admin.updateUserById(user.id, {
        email: user.email,
        password: TEST_PASSWORD,
        email_confirm: true,
        user_metadata: metadata,
      });
      if (error) {
        throw new Error(`Failed to update auth user ${user.email}: ${error.message}`);
      }
      continue;
    }

    const { error } = await supabase.auth.admin.createUser({
      id: user.id,
      email: user.email,
      password: TEST_PASSWORD,
      email_confirm: true,
      user_metadata: metadata,
    } as Parameters<typeof supabase.auth.admin.createUser>[0] & { id: string });

    if (error) {
      throw new Error(`Failed to create auth user ${user.email}: ${error.message}`);
    }
  }
}

async function seedTestUsers() {
  console.log("🌱 Seeding test users for role/permission testing...\n");

  loadEnv();
  const pool = await createPool();

  try {
    // Hash password once for all users
    const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);
    console.log(`📝 Password for all test users: ${TEST_PASSWORD}\n`);

    console.log("🔐 Syncing Supabase Auth users...");
    await syncSupabaseAuthUsers();

    // Start transaction
    await pool.query("BEGIN");

    // Refresh auth rows without deleting fixed users/orgs referenced by seed data.
    console.log("🧹 Refreshing existing test auth data...");
    for (const user of testUsers) {
      await pool.query(
        "DELETE FROM accounts WHERE user_id = $1 OR user_id IN (SELECT id FROM users WHERE email = $2)",
        [user.id, user.email]
      );
      await pool.query(
        "DELETE FROM sessions WHERE user_id = $1 OR user_id IN (SELECT id FROM users WHERE email = $2)",
        [user.id, user.email]
      );
    }

    // Create test organizations
    console.log("\n📁 Creating test organizations...");
    for (const org of testOrgs) {
      await pool.query(
        `INSERT INTO organizations (id, name, slug, account_type, subscription_tier, subscription_status, onboarding_status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, 'active', 'completed', NOW(), NOW())
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           slug = EXCLUDED.slug,
           account_type = EXCLUDED.account_type,
           subscription_tier = EXCLUDED.subscription_tier,
           subscription_status = 'active',
           onboarding_status = 'completed',
           updated_at = NOW()`,
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
        VALUES ($1, $2, $3, $4, $5, $6, true, $7, $8, NOW(), NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET
          organization_id = EXCLUDED.organization_id,
          email = EXCLUDED.email,
          full_name = EXCLUDED.full_name,
          role = EXCLUDED.role,
          is_owner = EXCLUDED.is_owner,
          is_active = true,
          title = EXCLUDED.title,
          industry = EXCLUDED.industry,
          email_verified_at = COALESCE(users.email_verified_at, NOW()),
          updated_at = NOW()`,
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
