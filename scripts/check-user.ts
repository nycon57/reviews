#!/usr/bin/env ts-node
import { Pool } from "pg";
import * as fs from "fs";
import * as path from "path";

// Load .env.local
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

async function main() {
  loadEnv();

  const connectionUrl = process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL;
  if (!connectionUrl) {
    console.error("No DATABASE_URL found");
    process.exit(1);
  }

  const url = new URL(connectionUrl);
  const pool = new Pool({
    host: url.hostname,
    port: parseInt(url.port) || 5432,
    user: url.username,
    password: decodeURIComponent(url.password),
    database: url.pathname.slice(1) || "postgres",
    ssl: { rejectUnauthorized: false }
  });

  try {
    // Check Better Auth user table
    console.log("\n=== Better Auth User (ba_user) ===");
    const baUser = await pool.query(
      `SELECT id, email, name, created_at FROM ba_user WHERE email = $1`,
      ["jarrett.stanley@gmail.com"]
    );
    console.log(baUser.rows.length ? baUser.rows[0] : "Not found");

    // Check users table by email
    console.log("\n=== Users Table (by email) ===");
    const userByEmail = await pool.query(
      `SELECT u.id, u.email, u.full_name, u.role, u.is_owner, u.organization_id,
              o.name as org_name, o.account_type, o.subscription_tier
       FROM users u
       LEFT JOIN organizations o ON u.organization_id = o.id
       WHERE u.email = $1`,
      ["jarrett.stanley@gmail.com"]
    );
    console.log(userByEmail.rows.length ? userByEmail.rows[0] : "Not found");

    // Check users table by Better Auth ID
    console.log("\n=== Users Table (by Better Auth ID) ===");
    const userById = await pool.query(
      `SELECT id, email, full_name, role FROM users WHERE id = $1`,
      ["18b29972-4441-40c1-ac1f-5bacd751698e"]
    );
    console.log(userById.rows.length ? userById.rows[0] : "Not found");

    // Check accounts table for this user
    console.log("\n=== Accounts Table ===");
    const accounts = await pool.query(
      `SELECT a.id, a.user_id, a.provider_id, a.account_id
       FROM accounts a
       JOIN ba_user bu ON bu.id = a.user_id
       WHERE bu.email = $1`,
      ["jarrett.stanley@gmail.com"]
    );
    console.log(accounts.rows.length ? accounts.rows : "Not found");

  } finally {
    await pool.end();
  }
}

main().catch(console.error);
