# ReviewHub - Agent Instructions

## Build & Test Commands

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build

# Linting
npm run lint
npm run lint:fix

# Type checking
npm run type-check

# Format code
npm run format
npm run format:check

# Tests
npm run test
npm run test:watch
npm run test:coverage
npm run test:e2e

# Database
npm run db:types      # Generate TypeScript types from Supabase
npm run db:push       # Push migrations to Supabase
npm run db:reset      # Reset and re-seed database
npm run db:generate   # Generate new migration
```

## Quality Gates

Before completing a story:
1. `npm run build` must pass
2. `npm run lint` must pass with no errors

## Adding ShadCN Components

```bash
npx shadcn@latest add <component-name>
```

## Project Structure

- `src/app/` - Next.js App Router pages
- `src/components/ui/` - ShadCN UI components
- `src/components/forms/` - Form components
- `src/components/dashboard/` - Dashboard components
- `src/components/surveys/` - Survey components
- `src/components/reviews/` - Review components
- `src/components/shared/` - Shared/common components
- `src/lib/` - Utility functions and integrations
- `src/hooks/` - Custom React hooks
- `src/types/` - TypeScript type definitions
- `supabase/` - Database migrations and edge functions
