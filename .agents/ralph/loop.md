# Ralph Loop Prompt Template for ReviewHub

## Context
You are an autonomous coding agent working on ReviewHub, an internal Customer Experience & Review Management Platform. Your goal is to complete one story per iteration following the PRD specification.

## Multi-Pass Architecture

Ralph uses a **3-pass minimum** per story for iterative quality improvement:

| Pass | Focus | Key Skills | Commit Prefix |
|------|-------|------------|---------------|
| 1 | Implementation | `/feature-dev`, `/frontend-design`, `/vercel-react-best-practices`, `/web-design-guidelines`  | `[Pass 1/3]` |
| 2 | Quality Review | `/code-review` | `[Pass 2/3]` |
| 3 | Polish & Finalize | `/code-simplifier`, browser test | `[Pass 3/3]` |

**Important**: Stories do NOT emit `<promise>COMPLETE</promise>` until Pass 3 verification passes.

## Your Task This Iteration

1. **Read the PRD**: Study `.agents/tasks/prd-reviews.json` to understand the full project scope
2. **Check Progress**: Review `.ralph/progress.md` to see what's been completed
3. **Determine Pass**: Count prior entries for current story (0=Pass 1, 1=Pass 2, 2+=Pass 3)
4. **Select Story**: Choose the next `open` story that has all dependencies completed
5. **Determine Phase & Load Plugins**: Based on the story's phase, load the appropriate plugins (see Plugin Strategy below)
6. **Implement/Review/Polish**: Complete pass-specific tasks
7. **Test**: Run gate checks (`npm run build && npm run lint`)
8. **Run Required Skills**: Based on pass number (see PROMPT_build.md)
9. **Commit**: Commit with pass prefix (e.g., `[Pass 1/3] feat: ...`)
10. **Update Status**: Mark story `done` ONLY after Pass 3 completes

## Plugin Strategy by Phase

### Phase 1: Foundation (MVP) - Stories S001-S010, S012
**Focus**: Core infrastructure, authentication, and basic survey/review functionality
**Required Plugins**:
- `/feature-dev` - Use at story start for architecture planning and codebase exploration
- `/code-simplifier` - Use after implementation to ensure clean, maintainable code

**Guidelines**:
- Prioritize solid foundations over speed
- Establish patterns that later phases will follow
- Use `feature-dev:code-architect` for complex stories like S003 (Auth) and S005 (Survey Builder)

### Phase 2: Enhanced Features - Stories S009, S011, S013-S016, S026, S031
**Focus**: Manager dashboards, Google integration, approval workflows, and analytics
**Required Plugins**:
- `/feature-dev` - For architecture planning, especially for integrations 
- `/frontend-design` - For dashboard UI components
- `/code-simplifier` - After implementation

**Guidelines**:
- Reuse patterns established in Phase 1
- For S015 (Google Business Profile), use `feature-dev:code-explorer` to understand existing auth patterns
- Dashboard stories should use `/frontend-design` for polished, production-grade UI

### Phase 3: AI & Advanced - Stories S017-S022, S032
**Focus**: AI-powered features, response management, notifications
**Required Plugins**:
- `/feature-dev` - Critical for AI integration architecture (S019-S022)
- `/code-simplifier` - AI code tends to get complex; simplify aggressively
- `/code-review` - Review AI integrations for security and cost optimization

**Guidelines**:
- Use `feature-dev:code-architect` before starting any AI story
- Pay special attention to error handling and rate limiting for OpenAI API
- S019 (Sentiment Analysis) sets patterns for S020-S022; design it carefully

### Phase 4: Mobile & Integrations - Stories S023-S030
**Focus**: Mobile app, public API, integrations, and widgets
**Required Plugins**:
- `/frontend-design` - Essential for mobile UI (S023-S025) to ensure polished, native-feeling interfaces
- `/feature-dev` - For API design (S027) and integration architecture (S028-S030)
- `/code-simplifier` - Mobile code and widgets need to be lightweight

**Guidelines**:
- S023 (Expo Setup) establishes mobile patterns; use `feature-dev:code-architect`
- For S027 (Public API), design for extensibility and versioning from the start
- S029 (Embeddable Widget) must be lightweight; target < 50KB bundle size

### Phase 10: Video Testimonials Epic (E15) - Stories S050-S059
**Focus**: Video recording, processing, and testimonial management
**Required Plugins** (ALL stories):
- `/feature-dev` - ALWAYS run at start for architecture planning
- `/vercel-react-best-practices` - ALWAYS run for React component optimization
- `/frontend-design` - For video player UI, recording interface, gallery components
- `/code-review` - Run during Pass 2 for quality assurance
- `/code-simplifier` - Run during Pass 3 for clean, maintainable code

**Mandatory Requirements**:
- **Design System**: Read `docs/design/REPWELL_DESIGN_SYSTEM` BEFORE any UI work
- **React Patterns**: All components must follow Vercel React best practices
- **3-Pass Minimum**: No story completes until Pass 3 verification passes

**Technical Guidelines**:
- Use native MediaRecorder API for video capture
- Implement proper loading/processing states for video uploads
- Ensure mobile-first responsive design for recording UI
- Apply accessibility standards for video controls (WCAG 2.1 AA)
- Use ShadCN components as foundation, style per design system

## Implementation Guidelines

### Tech Stack Reference
- **Frontend**: Next.js 16 with App Router, TypeScript strict mode, React 19
- **UI**: ShadCN/UI components + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Auth**: Supabase Auth with RLS
- **Email**: Resend for transactional emails
- **Mobile**: React Native + Expo (Phase 4)
- **AI**: OpenAI API for sentiment analysis
- **UI Reference**: Mobbin.com for production-grade design patterns

### UI Design Standards (Required for Frontend Stories)
Before implementing any UI, research patterns on Mobbin:
1. Read `.agents/ralph/MOBBIN_REFERENCE.md` for story-specific search queries
2. Use browser automation to browse https://mobbin.com (login: jarrett.stanley@gmail.com via Google OAuth)
3. Study 3-5 top examples from leading apps (Stripe, Linear, Notion, Figma)
4. Apply professional patterns - NO generic starter template aesthetics
5. Target the polish level of Stripe Dashboard or Linear

**Design Principles**:
- Clean, spacious layouts with clear visual hierarchy
- Consistent 8px spacing grid throughout
- Subtle shadows and borders for depth
- Strategic accent colors (not rainbow)
- Polished micro-interactions and hover states
- Proper loading, empty, and error states
- Accessibility WCAG 2.1 AA compliance

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
