# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm run dev              # Development server
npm run build            # Production build (required before PR)
npm run lint             # ESLint check (required before PR)
npm run lint:fix         # Auto-fix lint issues
npm run type-check       # TypeScript type checking
npm run format           # Prettier formatting

npm run test             # Vitest unit tests
npm run test:watch       # Watch mode
npm run test:e2e         # Playwright E2E tests

npm run db:types         # Generate TypeScript types from Supabase schema
npm run db:push          # Push migrations to Supabase
npm run db:generate      # Create new migration

npx shadcn@latest add <component>  # Add ShadCN components
```

**Quality Gates:** `npm run build` and `npm run lint` must pass before completing any story.

## Project Overview

RepWell is a customer experience & review management platform for mortgage/financial services. It replaces Experience.com/Birdeye with internal CRM capabilities including:
- Survey distribution & NPS tracking
- Review aggregation (Google, Zillow, internal)
- Testimonial management & social publishing
- Team leaderboards & gamification
- AI-powered sentiment analysis & insights
- Business listing optimization (Google Business Profile)

## Design System (MANDATORY)

**CRITICAL:** Read and strictly follow `docs/design/REPWELL_DESIGN_SYSTEM` for ALL design, component, and UI work.

- Read the full document before creating or modifying ANY UI
- Follow all specifications exactly (colors, typography, spacing, components, motion, responsive patterns)
- Never deviate from the design system without explicit user approval

## Architecture

**Stack:** Next.js 16 (App Router) + TypeScript + Supabase (PostgreSQL) + Tailwind/ShadCN

### Authentication Pattern
- **Server client:** `src/lib/supabase/server.ts` - Cookie-based, use for server components/actions
- **Browser client:** `src/lib/supabase/client.ts` - Public anon key only
- **Admin client:** `src/lib/supabase/admin.ts` - Service role, bypasses RLS (server-only)
- **User roles:** `admin`, `manager`, `user`

### Data Patterns
- **Server Actions** (`src/lib/*/actions.ts`): Primary pattern for mutations. Use Zod validation, call `revalidatePath` after changes.
- **React Query**: Client-side data fetching for complex dashboard queries
- **Database types**: Auto-generated in `src/types/database.types.ts` via `npm run db:types`

### Route Groups
- `(dashboard)/` - Protected dashboard routes requiring auth
- `(auth)/` - Authentication pages (login, signup, callbacks)
- `(marketing)/` - Public marketing pages
- `(public)/` - Public survey submission pages
- `api/` - API routes for webhooks, cron jobs, integrations

### Key Integrations
- **OpenAI**: Sentiment analysis, key phrase extraction, response suggestions (`src/lib/ai/`)
- **Google Business Profile**: Review sync, OAuth in `src/app/api/auth/google/`
- **Resend**: Email delivery for surveys & notifications
- **Social OAuth**: Facebook, LinkedIn, Twitter for auto-publishing

## Database

Supabase PostgreSQL with Row Level Security (RLS) for multi-tenant isolation. Migrations in `supabase/migrations/`.

Key tables: `organizations`, `users`, `loan_officers`, `survey_templates`, `surveys`, `survey_responses`, `reviews`, `testimonials`, `leaderboards`, `social_connections`, `business_listings`

## Development Workflow

1. Check `.agents/tasks/prd-reviews.json` for available stories
2. Create feature branch from main
3. Run `npm run db:types` after any schema changes
4. Ensure build and lint pass before PR

## Automatic Skill & Plugin Invocation

**IMPORTANT:** Proactively invoke skills and MCP plugins without being asked. Do not wait for explicit requests.

### Skills - Invoke Automatically

| Skill | Trigger Conditions |
|-------|-------------------|
| `vercel-react-best-practices` | ANY React/Next.js work: writing components, reviewing code, refactoring, fixing bugs, adding features. Use on EVERY component change. |
| `frontend-design:frontend-design` | Creating ANY new UI: pages, components, layouts, modals, forms. Always use for visual work. Must follow design system. |
| `feature-dev:feature-dev` | Starting ANY new feature implementation. Use at the beginning of feature work. |
| `commit` | After completing ANY task, fixing bugs, or when code is in a good state. Proactively offer to commit. |
| `commit-commands:commit-push-pr` | When feature is complete and ready for review. |
| `code-review:code-review` | Before merging, after completing features, or when user mentions "review", "PR", or "check". |
| `web-design-guidelines` | After creating UI, reviewing components, or when user mentions "accessibility", "UX", "design review". |
| `prd` | When user discusses new features, requirements, planning, or mentions "PRD", "spec", "requirements". |
| `cartographer:cartographer` | When onboarding, exploring unfamiliar code, or user asks about codebase structure. |
| `dev-browser` | ANY browser interaction: testing UI, filling forms, screenshots, navigating sites, web automation. |

### MCP Plugins - Use Proactively

#### Supabase Plugin (`mcp__plugin_supabase_supabase__*`)
- **Database queries**: Use `execute_sql` for reading data, checking schema, debugging
- **Migrations**: Use `apply_migration` for ANY schema changes (tables, columns, indexes, RLS policies)
- **Type generation**: After migrations, remind to run `npm run db:types`
- **Logs**: Use `get_logs` when debugging errors, checking auth issues, or investigating bugs
- **Advisors**: Use `get_advisors` after DDL changes to check for security/performance issues
- **Edge Functions**: Use `deploy_edge_function` for serverless functions

#### GitHub Plugin (`mcp__plugin_github_github__*`)
- **PRs**: Use `create_pull_request` after pushing feature branches
- **Issues**: Use `list_issues`, `search_issues` when discussing bugs or features
- **Code Search**: Use `search_code` to find patterns across the repo
- **Reviews**: Use `pull_request_read` and `pull_request_review_write` for PR reviews
- **Branches**: Use `list_branches`, `create_branch` for branch management

#### Context7 Plugin (`mcp__plugin_context7_context7__*`)
- **Documentation lookup**: Use `resolve-library-id` then `query-docs` when:
  - Implementing features with external libraries (React Query, Zod, Supabase, etc.)
  - Uncertain about API usage or best practices
  - User asks "how do I..." for any library
  - Debugging library-specific issues
- **Always check docs** for: Next.js, Supabase, TanStack Query, Zod, Radix UI, Tailwind, Framer Motion

#### Browser Automation (`mcp__claude-in-chrome__*`)
- Use for ANY request involving:
  - Testing the app in browser
  - Taking screenshots
  - Filling out forms
  - Navigating websites
  - Web scraping or data extraction
  - Visual verification of UI changes

### Invocation Rules

1. **Don't ask permission** - Invoke skills/plugins when conditions are met
2. **Chain skills** - Use multiple skills in sequence (e.g., `feature-dev` → code → `vercel-react-best-practices` → `commit`)
3. **Lookup before implementing** - Use Context7 to check library docs before writing integration code
4. **Verify with Supabase plugin** - Query database directly to verify schema, test queries, check RLS
5. **Always review** - Use `code-review` or `web-design-guidelines` after significant changes
6. **Always follow design system** - Read and strictly follow `docs/design/REPWELL_DESIGN_SYSTEM` before ANY UI/component work.

## Plan Mode

- Make the plan extremely concise. Sacrifice grammar for the sake of concision.
- At the end of each plan, give me a list of unresolved questions to answer, if any.