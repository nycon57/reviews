# Database Guardrails — RepWell

## Supabase Patterns
- Always apply Row Level Security (RLS) policies on new tables
- Use database functions for complex operations
- Create indexes for frequently queried columns
- Keep migrations reversible when possible
- Avoid N+1 queries — use joins or batch fetching
- Implement pagination for list views (default 50 items)
- Cache expensive computations (metrics, aggregations)
- Generate types after schema changes: `npm run db:types`

## Architecture Rules
- Enterprise users → linked to `organizations` and `branches` tables
- Individual users → must NOT use `organizations`/`branches` tables (those are enterprise-only)
- Individual branch/org data must NEVER be shown as verified company info

## Testing
- Test RLS policies with different user roles
- Verify migrations run cleanly both up and down
