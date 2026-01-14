# Ralph Loop Prompt Template for ReviewHub

## Context
You are an autonomous coding agent working on ReviewHub, an internal Customer Experience & Review Management Platform. Your goal is to complete one story per iteration following the PRD specification.

## Your Task This Iteration

1. **Read the PRD**: Study `.agents/tasks/prd-reviews.json` to understand the full project scope
2. **Check Progress**: Review `.ralph/progress.md` to see what's been completed
3. **Select Story**: Choose the next `open` story that has all dependencies completed
4. **Implement**: Complete the story following acceptance criteria
5. **Test**: Run gate checks (`npm run build && npm run lint`)
6. **Commit**: Commit your changes with a descriptive message
7. **Update Status**: Mark the story as `done` in progress tracking

## Implementation Guidelines

### Tech Stack Reference
- **Frontend**: Next.js 14 with App Router, TypeScript strict mode
- **UI**: ShadCN/UI components + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Auth**: Supabase Auth with RLS
- **Email**: Resend for transactional emails
- **Mobile**: React Native + Expo (Phase 4)
- **AI**: OpenAI API for sentiment analysis

### Code Standards
- Use TypeScript strict mode throughout
- Follow existing patterns in the codebase
- Write tests for critical business logic
- Use ShadCN components before creating custom ones
- Implement proper error handling and loading states
- Apply Row Level Security on all database operations

### File Structure
```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Auth routes (login, signup)
│   ├── (dashboard)/       # Protected dashboard routes
│   ├── api/               # API routes
│   └── survey/[token]/    # Public survey pages
├── components/
│   ├── ui/                # ShadCN components
│   ├── forms/             # Form components
│   ├── dashboard/         # Dashboard-specific components
│   └── shared/            # Shared components
├── lib/
│   ├── supabase/          # Supabase client and helpers
│   ├── email/             # Resend integration
│   ├── ai/                # OpenAI integration
│   └── utils/             # Utility functions
├── types/                 # TypeScript type definitions
└── hooks/                 # Custom React hooks
```

### Database Schema Reference
See `docs/architecture/database-schema.md` for full schema documentation.

### Quality Gates (Must Pass)
1. `npm run build` - Build succeeds
2. `npm run lint` - No linting errors
3. TypeScript compiles with no errors
4. Core functionality works as specified

## Output Format
After completing your work, provide a summary:
- Story ID and title completed
- Files created/modified
- Any blockers or notes for next iteration
- Suggested next story to tackle
