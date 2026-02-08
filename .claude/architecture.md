# Architecture

**Stack:** Next.js 16 (App Router) + TypeScript + Supabase (PostgreSQL) + Tailwind/ShadCN

## Authentication Pattern

- **Server client:** `src/lib/supabase/server.ts` - Cookie-based, use for server components/actions
- **Browser client:** `src/lib/supabase/client.ts` - Public anon key only
- **Admin client:** `src/lib/supabase/admin.ts` - Service role, bypasses RLS (server-only)
- **User roles:** `admin`, `manager`, `user`

## Data Patterns

- **Server Actions** (`src/lib/*/actions.ts`): Primary pattern for mutations. Use Zod validation, call `revalidatePath` after changes.
- **React Query**: Client-side data fetching for complex dashboard queries
- **Database types**: Auto-generated in `src/types/database.types.ts` via `npm run db:types`

## Route Groups

- `(dashboard)/` - Protected dashboard routes requiring auth
- `(auth)/` - Authentication pages (login, signup, callbacks)
- `(marketing)/` - Public marketing pages
- `(public)/` - Public survey submission pages
- `api/` - API routes for webhooks, cron jobs, integrations

## Key Integrations

- **OpenAI**: Sentiment analysis, key phrase extraction, response suggestions (`src/lib/ai/`)
- **Google Business Profile**: Review sync, OAuth in `src/app/api/auth/google/`
- **Resend**: Email delivery for surveys & notifications
- **Social OAuth**: Facebook, LinkedIn, Twitter for auto-publishing
