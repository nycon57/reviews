# Database

Supabase PostgreSQL with Row Level Security (RLS) for multi-tenant isolation.

## Migrations

Located in `supabase/migrations/`. After any schema change, run `npm run db:types` to regenerate TypeScript types.

## Key Tables

`organizations`, `users`, `branches` (global_slug, manager_id), `loan_officers`, `survey_templates`, `surveys`, `survey_responses`, `reviews`, `testimonials`, `leaderboards`, `social_connections`, `business_listings`

## Workflow

1. Use Supabase MCP `apply_migration` for schema changes
2. Run `npm run db:types` after migrations
3. Use Supabase MCP `get_advisors` after DDL changes to check security/performance
4. Use Supabase MCP `get_logs` for debugging runtime errors
