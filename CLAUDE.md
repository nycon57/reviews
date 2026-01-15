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

ReviewHub is a customer experience & review management platform for mortgage/financial services. It replaces Experience.com/Birdeye with internal CRM capabilities including:
- Survey distribution & NPS tracking
- Review aggregation (Google, Zillow, internal)
- Testimonial management & social publishing
- Team leaderboards & gamification
- AI-powered sentiment analysis & insights
- Business listing optimization (Google Business Profile, Apple Business Connect)

## Architecture

**Stack:** Next.js 16 (App Router) + TypeScript + Supabase (PostgreSQL) + Tailwind/ShadCN

### Authentication Pattern
- **Server client:** `src/lib/supabase/server.ts` - Cookie-based, use for server components/actions
- **Browser client:** `src/lib/supabase/client.ts` - Public anon key only
- **Admin client:** `src/lib/supabase/admin.ts` - Service role, bypasses RLS (server-only)
- **User roles:** `admin`, `manager`, `loan_officer`

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

## Automatic Skill Invocation

Invoke these skills automatically when relevant:

| Skill | When to Use |
|-------|-------------|
| `vercel-react-best-practices` | Writing, reviewing, or refactoring React/Next.js components |
| `frontend-design:frontend-design` | Creating new UI components or pages |
| `commit` | User asks to commit or save work |
| `code-review:code-review` | User asks to review code or a PR |
