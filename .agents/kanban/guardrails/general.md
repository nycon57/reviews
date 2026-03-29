# General Guardrails — RepWell

## Code Standards
- TypeScript strict mode. No `any`. Use Zod for runtime validation at API boundaries.
- Generate database types from Supabase: `npm run db:types`
- Server Components by default. Client Components only when needed.
- Server Actions over API routes for mutations.
- ShadCN components before custom ones. One component per file.

## Quality Gates (Mandatory)
- `npm run build` must pass
- `npm run lint` must pass
- `/simplify` at end of every task
- `/react-doctor` after `/simplify`

## Pitfalls
- Never expose service role key to client
- Always validate user permissions before operations
- Don't trust client-side data — validate on server
- Don't fetch unnecessary data — use select() with specific columns
- Handle loading and error states in all UI
