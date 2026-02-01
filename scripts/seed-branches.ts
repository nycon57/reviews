#!/usr/bin/env ts-node
/**
 * Seed Branches for Organizations
 *
 * Creates branches with real office addresses for existing organizations:
 * - TrueTone AI: NYC Headquarters (1 World Trade Center)
 * - Enterprise Test Corp: Chicago Office (Willis Tower)
 * - Individual Pro Test: LA Office (US Bank Tower)
 * - Individual Basic Test: Miami Office (1395 Brickell Ave)
 *
 * Usage:
 *   npx tsx scripts/seed-branches.ts
 *
 * Requires: DIRECT_DATABASE_URL or DATABASE_URL environment variable
 */

import { Pool } from "pg";
import * as fs from "fs";
import * as path from "path";
import crypto from "crypto";

// Load env files manually since we're running outside Next.js
function loadEnv() {
  // Try .env.local first, then .env
  const envPaths = [
    path.resolve(process.cwd(), ".env.local"),
    path.resolve(process.cwd(), ".env"),
  ];

  for (const envPath of envPaths) {
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
}

interface BranchData {
  organizationName: string;
  name: string;
  slug: string;
  address: {
    street: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  region: string;
}

// Branch data for seeding - real office complex addresses
const branchesToCreate: BranchData[] = [
  {
    organizationName: "TrueTone AI",
    name: "NYC Headquarters",
    slug: "nyc-headquarters",
    address: {
      street: "1 World Trade Center",
      city: "New York",
      state: "NY",
      postal_code: "10007",
      country: "United States",
    },
    region: "Northeast",
  },
  {
    organizationName: "Enterprise Test Corp",
    name: "Chicago Office",
    slug: "chicago-office",
    address: {
      street: "233 S Wacker Dr",
      city: "Chicago",
      state: "IL",
      postal_code: "60606",
      country: "United States",
    },
    region: "Midwest",
  },
  {
    organizationName: "Individual Pro Test",
    name: "LA Office",
    slug: "la-office",
    address: {
      street: "633 W 5th St",
      city: "Los Angeles",
      state: "CA",
      postal_code: "90071",
      country: "United States",
    },
    region: "West",
  },
  {
    organizationName: "Individual Basic Test",
    name: "Miami Office",
    slug: "miami-office",
    address: {
      street: "1395 Brickell Ave",
      city: "Miami",
      state: "FL",
      postal_code: "33131",
      country: "United States",
    },
    region: "Southeast",
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
      rejectUnauthorized:
        process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== undefined
          ? process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === "true"
          : process.env.NODE_ENV === "production",
    },
  });
}

/**
 * Geocode an address using the US Census Geocoder API
 */
async function geocodeAddress(
  street: string,
  city: string,
  state: string,
  zip: string
): Promise<{ latitude: number; longitude: number } | null> {
  try {
    const fullAddress = `${street}, ${city}, ${state} ${zip}`;
    const url = new URL(
      "https://geocoding.geo.census.gov/geocoder/locations/onelineaddress"
    );
    url.searchParams.set("address", fullAddress);
    url.searchParams.set("benchmark", "Public_AR_Current");
    url.searchParams.set("format", "json");

    console.log(`    Geocoding: ${fullAddress}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`    Census geocoder error: ${response.status}`);
      return null;
    }

    const data = await response.json();

    if (!data.result?.addressMatches?.length) {
      console.log("    No match found, using fallback coordinates");
      return null;
    }

    const match = data.result.addressMatches[0];
    const result = {
      latitude: match.coordinates.y,
      longitude: match.coordinates.x,
    };
    console.log(`    Found: ${result.latitude}, ${result.longitude}`);
    return result;
  } catch (error) {
    console.error("    Geocoding error:", error instanceof Error ? error.message : error);
    return null;
  }
}

// Fallback coordinates for known locations
const fallbackCoords: Record<string, { latitude: number; longitude: number }> = {
  "NYC Headquarters": { latitude: 40.7127, longitude: -74.0134 }, // WTC
  "Chicago Office": { latitude: 41.8789, longitude: -87.6359 }, // Willis Tower
  "LA Office": { latitude: 34.0511, longitude: -118.2565 }, // US Bank Tower
  "Miami Office": { latitude: 25.7617, longitude: -80.1918 }, // Brickell
};

async function seedBranches() {
  console.log("🏢 Seeding branches for organizations...\n");

  loadEnv();
  const pool = await createPool();

  try {
    await pool.query("BEGIN");

    // Find organizations by name
    console.log("📋 Looking up organizations...");
    const orgResults = await pool.query(
      `SELECT id, name FROM organizations
       WHERE name IN ($1, $2, $3, $4)`,
      branchesToCreate.map((b) => b.organizationName)
    );

    const orgMap = new Map<string, string>();
    for (const row of orgResults.rows) {
      orgMap.set(row.name, row.id);
      console.log(`  ✅ Found: ${row.name} (${row.id})`);
    }

    // Check if TrueTone AI exists, create if not
    if (!orgMap.has("TrueTone AI")) {
      console.log("\n  Creating TrueTone AI organization...");
      const trueToneId = crypto.randomUUID();
      await pool.query(
        `INSERT INTO organizations (id, name, slug, account_type, subscription_tier, subscription_status, onboarding_status, created_at, updated_at)
         VALUES ($1, 'TrueTone AI', 'truetone-ai', 'enterprise', 'enterprise', 'active', 'completed', NOW(), NOW())`,
        [trueToneId]
      );
      orgMap.set("TrueTone AI", trueToneId);
      console.log(`  ✅ Created: TrueTone AI (${trueToneId})`);
    }

    // Create branches
    console.log("\n🏢 Creating branches...");
    const createdBranches: Array<{ id: string; name: string; orgName: string }> = [];

    for (const branch of branchesToCreate) {
      const orgId = orgMap.get(branch.organizationName);
      if (!orgId) {
        console.log(`  ⚠️  Skipping ${branch.name}: Organization '${branch.organizationName}' not found`);
        continue;
      }

      // Check if branch already exists
      const existing = await pool.query(
        `SELECT id FROM branches WHERE organization_id = $1 AND slug = $2`,
        [orgId, branch.slug]
      );

      if (existing.rows.length > 0) {
        console.log(`  ⏭️  Skipping ${branch.name}: Already exists`);
        createdBranches.push({
          id: existing.rows[0].id,
          name: branch.name,
          orgName: branch.organizationName,
        });
        continue;
      }

      // Geocode the address
      const coords = await geocodeAddress(
        branch.address.street,
        branch.address.city,
        branch.address.state,
        branch.address.postal_code
      );

      // Use fallback if geocoding fails
      const finalCoords = coords || fallbackCoords[branch.name] || null;

      const branchId = crypto.randomUUID();
      await pool.query(
        `INSERT INTO branches (
          id, organization_id, name, slug, address, region,
          latitude, longitude, is_active, is_public,
          created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, true, NOW(), NOW())`,
        [
          branchId,
          orgId,
          branch.name,
          branch.slug,
          JSON.stringify(branch.address),
          branch.region,
          finalCoords?.latitude || null,
          finalCoords?.longitude || null,
        ]
      );

      console.log(`  ✅ Created: ${branch.name} for ${branch.organizationName}`);
      if (finalCoords) {
        console.log(`     📍 ${finalCoords.latitude.toFixed(4)}, ${finalCoords.longitude.toFixed(4)}`);
      }

      createdBranches.push({
        id: branchId,
        name: branch.name,
        orgName: branch.organizationName,
      });
    }

    // Assign users to their org's branch
    console.log("\n👥 Assigning users to branches...");
    for (const branch of createdBranches) {
      const orgId = orgMap.get(branch.orgName);
      if (!orgId) continue;

      const result = await pool.query(
        `UPDATE users
         SET branch_id = $1, updated_at = NOW()
         WHERE organization_id = $2 AND branch_id IS NULL`,
        [branch.id, orgId]
      );

      if (result.rowCount && result.rowCount > 0) {
        console.log(`  ✅ Assigned ${result.rowCount} user(s) to ${branch.name}`);
      }
    }

    // Update branch member counts
    console.log("\n📊 Updating branch member counts...");
    await pool.query(`
      UPDATE branches b
      SET total_members = (
        SELECT COUNT(*) FROM users u
        WHERE u.branch_id = b.id AND u.is_active = true
      )
    `);

    await pool.query("COMMIT");

    // Verification
    console.log("\n✨ Branches seeded successfully!\n");
    console.log("=".repeat(80));
    console.log("VERIFICATION");
    console.log("=".repeat(80));

    const verifyResult = await pool.query(`
      SELECT
        b.name as branch_name,
        o.name as org_name,
        b.latitude,
        b.longitude,
        b.region,
        b.total_members
      FROM branches b
      JOIN organizations o ON b.organization_id = o.id
      WHERE b.is_active = true
      ORDER BY o.name
    `);

    console.log("\nBranches with coordinates:");
    console.log("-".repeat(80));
    for (const row of verifyResult.rows) {
      const lat = row.latitude?.toFixed(4) || "null";
      const lng = row.longitude?.toFixed(4) || "null";
      console.log(`  ${row.org_name}: ${row.branch_name}`);
      console.log(`    📍 ${lat}, ${lng} | Region: ${row.region} | Members: ${row.total_members || 0}`);
    }

    console.log("\n📋 Next Steps:");
    console.log("  1. Load /directory to see map markers");
    console.log("  2. Verify 4 markers in NYC, Chicago, LA, Miami");
    console.log("  3. Click markers to see branch/professional details");
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error("❌ Error seeding branches:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the seed
seedBranches().catch((error) => {
  console.error(error);
  process.exit(1);
});
