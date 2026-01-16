# Development Setup Guide

## Prerequisites

Before starting development, ensure you have the following installed:

- **Node.js** 18.x or higher
- **npm** 9.x or higher (or pnpm)
- **Git**
- **Supabase CLI** (`npm install -g supabase`)

### Optional Tools
- **Docker** (for local Supabase development)
- **VS Code** with recommended extensions
- **Claude Code CLI** (for Ralph development workflow)

## Initial Setup

### 1. Clone the Repository

```bash
git clone https://github.com/nycon57/reviews.git
cd reviews
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env.local
```

Configure the following variables in `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Resend (Email)
RESEND_API_KEY=re_xxxxxxxxxxxxx
EMAIL_FROM_ADDRESS=reviews@yourdomain.com
EMAIL_FROM_NAME=RepWell

# OpenAI (AI Features)
OPENAI_API_KEY=sk-xxxxxxxxxxxxx

# Google Business Profile (Optional for Phase 2+)
GOOGLE_CLIENT_ID=xxxxxxxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxx

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=RepWell
```

### 4. Supabase Setup

#### Option A: Use Supabase Cloud (Recommended)

1. Create a new project at [supabase.com](https://supabase.com)
2. Copy the URL and keys to your `.env.local`
3. Run migrations:

```bash
npx supabase link --project-ref your-project-ref
npx supabase db push
```

#### Option B: Local Supabase (Docker Required)

```bash
# Start local Supabase
npx supabase start

# Apply migrations
npx supabase db reset

# Get local credentials
npx supabase status
```

### 5. Generate TypeScript Types

After setting up the database:

```bash
npm run db:types
```

This generates types in `src/types/database.types.ts`.

### 6. Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

## Project Structure

```
reviews/
├── .agents/                    # Agent configuration
│   ├── ralph/                  # Ralph loop configuration
│   │   ├── config.sh          # Ralph settings
│   │   └── loop.md            # Loop prompt template
│   └── tasks/                  # PRD and task files
│       └── prd-reviews.json   # Main PRD
├── .ralph/                     # Ralph state (gitignored)
│   ├── progress.md            # Progress tracking
│   ├── guardrails.md          # Lessons learned
│   └── runs/                  # Run logs
├── docs/                       # Documentation
│   ├── architecture/          # System design
│   ├── api/                   # API documentation
│   └── guides/                # Development guides
├── public/                     # Static assets
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── (auth)/           # Auth routes
│   │   │   ├── login/
│   │   │   ├── signup/
│   │   │   └── forgot-password/
│   │   ├── (dashboard)/      # Protected routes
│   │   │   ├── dashboard/
│   │   │   ├── reviews/
│   │   │   ├── surveys/
│   │   │   ├── analytics/
│   │   │   ├── team/
│   │   │   └── settings/
│   │   ├── api/              # API routes
│   │   │   ├── surveys/
│   │   │   ├── reviews/
│   │   │   ├── webhooks/
│   │   │   └── analytics/
│   │   ├── survey/[token]/   # Public survey pages
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/               # ShadCN components
│   │   ├── forms/            # Form components
│   │   ├── dashboard/        # Dashboard components
│   │   ├── surveys/          # Survey components
│   │   ├── reviews/          # Review components
│   │   └── shared/           # Shared components
│   ├── lib/
│   │   ├── supabase/         # Supabase client & helpers
│   │   │   ├── client.ts     # Browser client
│   │   │   ├── server.ts     # Server client
│   │   │   └── admin.ts      # Admin client
│   │   ├── email/            # Resend integration
│   │   ├── ai/               # OpenAI integration
│   │   ├── google/           # Google API integration
│   │   └── utils/            # Utility functions
│   ├── types/
│   │   ├── database.types.ts # Generated Supabase types
│   │   └── index.ts          # Application types
│   └── hooks/                # Custom React hooks
├── supabase/
│   ├── migrations/           # Database migrations
│   ├── functions/            # Edge Functions
│   └── seed.sql              # Development seed data
├── mobile/                    # React Native app (Phase 4)
├── wordpress-plugin/          # WordPress plugin (Phase 4)
├── .env.example
├── .env.local                # Local environment (gitignored)
├── .eslintrc.json
├── .prettierrc
├── next.config.js
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

## Development Workflow

### Running Commands

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Linting
npm run lint
npm run lint:fix

# Type checking
npm run type-check

# Generate database types
npm run db:types

# Database migrations
npm run db:push      # Push migrations
npm run db:reset     # Reset and re-seed
npm run db:generate  # Generate new migration
```

### Code Style

We use ESLint and Prettier for code formatting:

```bash
# Format code
npm run format

# Check formatting
npm run format:check
```

### Adding ShadCN Components

```bash
# Add a new component
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add form
```

### Database Changes

1. Create a new migration:
```bash
npx supabase migration new your_migration_name
```

2. Edit the migration file in `supabase/migrations/`

3. Apply locally:
```bash
npx supabase db reset
```

4. Push to cloud:
```bash
npx supabase db push
```

5. Regenerate types:
```bash
npm run db:types
```

## Ralph Development Workflow

### Quick Start

```bash
# Install Ralph globally
npm i -g @iannuttall/ralph

# Run one development iteration
ralph build 1 --prd .agents/tasks/prd-reviews.json

# Dry run (no commits)
ralph build 1 --no-commit
```

### Using with Claude Code

The project is configured to use Claude Code as the default agent:

```bash
# Make sure Claude Code is installed
curl -fsSL https://claude.ai/install.sh | bash

# Run Ralph with Claude
ralph build 1 --agent=claude
```

### Monitoring Progress

Check `.ralph/progress.md` for completed stories and current status.

## Testing

### Unit Tests

```bash
npm run test
npm run test:watch
npm run test:coverage
```

### E2E Tests

```bash
npm run test:e2e
```

### Manual Testing Checklist

For each story completion:
- [ ] Feature works as specified in acceptance criteria
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Loading states and error handling
- [ ] Keyboard accessibility
- [ ] RLS policies working correctly

## Debugging

### Common Issues

**Supabase connection errors:**
- Verify `.env.local` variables are correct
- Check if Supabase project is active

**TypeScript errors after database changes:**
- Run `npm run db:types` to regenerate types

**Build errors:**
- Clear `.next` directory: `rm -rf .next`
- Clear node_modules: `rm -rf node_modules && npm install`

### Logging

```typescript
// In development, use console for debugging
console.log('Debug info:', data);

// For production logging, use the logger utility
import { logger } from '@/lib/utils/logger';
logger.info('Event occurred', { metadata });
logger.error('Error occurred', { error });
```

## VS Code Configuration

Recommended extensions:
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- TypeScript Vue Plugin (Volar)
- Supabase

Recommended settings (`.vscode/settings.json`):
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

## Deployment

### Vercel (Recommended)

1. Connect repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main

### Manual Deployment

```bash
npm run build
npm start
```

## Getting Help

- Check documentation in `docs/`
- Review PRD in `.agents/tasks/prd-reviews.json`
- Check Ralph progress in `.ralph/progress.md`
