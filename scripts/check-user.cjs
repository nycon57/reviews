const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const { Pool } = require('pg');

const connectionUrl = process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL;
console.log('Connection URL found:', !!connectionUrl);

if (!connectionUrl) {
  console.error('No DATABASE_URL found');
  process.exit(1);
}

const url = new URL(connectionUrl);
const pool = new Pool({
  host: url.hostname,
  port: parseInt(url.port) || 5432,
  user: url.username,
  password: decodeURIComponent(url.password),
  database: url.pathname.slice(1) || 'postgres',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  // List tables to find Better Auth tables
  console.log('\n=== Tables containing "user" or "account" ===');
  const tables = await pool.query(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema = 'public'
     AND (table_name LIKE '%user%' OR table_name LIKE '%account%' OR table_name LIKE '%session%')
     ORDER BY table_name`
  );
  console.log(tables.rows.map(r => r.table_name));

  // Check Better Auth user table (try different names)
  console.log('\n=== Better Auth User ===');
  try {
    const baUser = await pool.query(
      'SELECT id, email, name, created_at FROM "user" WHERE email = $1',
      ['jarrett.stanley@gmail.com']
    );
    console.log(baUser.rows.length ? baUser.rows[0] : 'Not found in "user"');
  } catch (e) {
    console.log('Table "user" not found, trying alternatives...');
  }

  // Check users table by email
  console.log('\n=== Users Table (by email) ===');
  const userByEmail = await pool.query(
    `SELECT u.id, u.email, u.full_name, u.role, u.is_owner, u.organization_id,
            o.name as org_name, o.account_type, o.subscription_tier
     FROM users u
     LEFT JOIN organizations o ON u.organization_id = o.id
     WHERE u.email = $1`,
    ['jarrett.stanley@gmail.com']
  );
  console.log(userByEmail.rows.length ? userByEmail.rows[0] : 'Not found');

  // Check users table by Better Auth ID
  console.log('\n=== Users Table (by Better Auth ID) ===');
  const userById = await pool.query(
    'SELECT id, email, full_name, role FROM users WHERE id = $1',
    ['18b29972-4441-40c1-ac1f-5bacd751698e']
  );
  console.log('Count:', userById.rows.length);
  console.log('All rows:', userById.rows);

  // Check for duplicate IDs
  console.log('\n=== Check for Duplicate User IDs ===');
  const duplicates = await pool.query(
    `SELECT id, COUNT(*) as count
     FROM users
     GROUP BY id
     HAVING COUNT(*) > 1`
  );
  console.log('Duplicate IDs:', duplicates.rows.length ? duplicates.rows : 'None found');

  // Check for duplicate emails
  console.log('\n=== Check for Duplicate Emails ===');
  const dupEmails = await pool.query(
    `SELECT email, COUNT(*) as count
     FROM users
     GROUP BY email
     HAVING COUNT(*) > 1`
  );
  console.log('Duplicate emails:', dupEmails.rows.length ? dupEmails.rows : 'None found');

  // Check the exact query that middleware uses
  console.log('\n=== Simulating Middleware Query (with org join) ===');
  const middlewareQuery = await pool.query(
    `SELECT u.id, u.role, u.organization_id, o.subscription_tier, o.account_type
     FROM users u
     LEFT JOIN organizations o ON u.organization_id = o.id
     WHERE u.id = $1`,
    ['18b29972-4441-40c1-ac1f-5bacd751698e']
  );
  console.log('Row count:', middlewareQuery.rows.length);
  console.log('Rows:', middlewareQuery.rows);

  // Check if org_id is duplicated in organizations table
  console.log('\n=== Check Organization ===');
  const org = await pool.query(
    `SELECT id, name, account_type, subscription_tier FROM organizations WHERE id = $1`,
    ['85ae6e91-dbd3-420d-a556-564292d053b7']
  );
  console.log('Organization count:', org.rows.length);
  console.log('Organization:', org.rows);

  // Check foreign key relationships on users table
  console.log('\n=== Foreign Keys on Users Table ===');
  const fks = await pool.query(
    `SELECT
       tc.constraint_name,
       kcu.column_name,
       ccu.table_name AS foreign_table_name,
       ccu.column_name AS foreign_column_name
     FROM information_schema.table_constraints AS tc
     JOIN information_schema.key_column_usage AS kcu
       ON tc.constraint_name = kcu.constraint_name
       AND tc.table_schema = kcu.table_schema
     JOIN information_schema.constraint_column_usage AS ccu
       ON ccu.constraint_name = tc.constraint_name
       AND ccu.table_schema = tc.table_schema
     WHERE tc.constraint_type = 'FOREIGN KEY'
       AND tc.table_name = 'users'
       AND ccu.table_name = 'organizations'`
  );
  console.log('FK relationships to organizations:', fks.rows);

  // Check RLS status
  console.log('\n=== RLS Status on users table ===');
  const rls = await pool.query(
    `SELECT relname, relrowsecurity, relforcerowsecurity
     FROM pg_class
     WHERE relname = 'users'`
  );
  console.log('RLS enabled:', rls.rows);

  // Check if there are any views or materialized views
  console.log('\n=== Views with "user" in name ===');
  const views = await pool.query(
    `SELECT table_name, table_type
     FROM information_schema.tables
     WHERE table_schema = 'public'
     AND table_name LIKE '%user%'`
  );
  console.log('Views:', views.rows);

  await pool.end();
}

main().catch(console.error);
