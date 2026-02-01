# Ralph Loop Prompt Template for ReviewHub

## Context
You are an autonomous coding agent working on ReviewHub, an internal Customer Experience & Review Management Platform. Your goal is to complete one story per iteration following the PRD specification.

## Multi-Pass Architecture

Ralph uses a **3-pass minimum** per story for iterative quality improvement:

| Pass | Focus | Key Skills | Commit Prefix |
|------|-------|------------|---------------|
| 1 | Implementation | `/feature-dev`, story-specific skills (see PROMPT_build.md Skill Matrix), `/vercel-react-best-practices`, `/next-best-practices` | `[Pass 1/3]` |
| 2 | Quality Review | `/code-review`, `/web-design-guidelines` (if UI), `/vercel-react-best-practices`, `/next-best-practices` | `[Pass 2/3]` |
| 3 | Polish & Finalize | `/code-simplifier`, `/writing-clearly-and-concisely`, `/agent-browser` (if UI), `/frontend-design` (if UI), `/copywriting` (if marketing) | `[Pass 3/3]` |

**Important**: Stories do NOT emit `<promise>COMPLETE</promise>` until Pass 3 verification passes.

## Your Task This Iteration

1. **Read the PRD**: Study `.agents/tasks/prd-reviews.json` to understand the full project scope
2. **Check Progress**: Review `.ralph/progress.md` to see what's been completed
3. **Determine Pass**: Count prior entries for current story (0=Pass 1, 1=Pass 2, 2+=Pass 3)
4. **Select Story**: Choose the next `open` story that has all dependencies completed
5. **Load Universal Skills**: `/next-best-practices`, `/vercel-react-best-practices`, `/supabase-postgres-best-practices`, `/writing-clearly-and-concisely`
6. **Load Story-Specific Skills**: Consult the Per-Story Skill Map in PROMPT_build.md
7. **Implement/Review/Polish**: Complete pass-specific tasks
8. **Test**: Run gate checks (`npm run build && npm run lint`)
9. **Commit**: Commit with pass prefix (e.g., `[Pass 1/3] feat: ...`)
10. **Update Status**: Mark story `done` ONLY after Pass 3 completes

## Plugin Strategy by Phase

### Phase 1: Foundation (MVP) - Stories S001-S010, S012
**Focus**: Core infrastructure, authentication, and basic survey/review functionality
**Required Plugins**:
- `/feature-dev` - Architecture planning and codebase exploration
- `/supabase-postgres-best-practices` - Database schema, RLS, migrations
- `/code-simplifier` - After implementation

**Guidelines**:
- Prioritize solid foundations over speed
- Establish patterns that later phases will follow
- Use `feature-dev:code-architect` for complex stories like S003 (Auth) and S005 (Survey Builder)

### Phase 2: Enhanced Features - Stories S009, S011, S013-S016, S026, S031
**Focus**: Manager dashboards, Google integration, approval workflows, and analytics
**Required Plugins**:
- `/feature-dev` - Architecture planning, especially for integrations
- `/frontend-design` - Dashboard UI components
- `/analytics-tracking` - For analytics stories
- `/code-simplifier` - After implementation

**Guidelines**:
- Reuse patterns established in Phase 1
- For S015 (Google Business Profile), use `feature-dev:code-explorer` to understand existing auth patterns
- Dashboard stories should use `/frontend-design` for polished, production-grade UI

### Phase 3: AI & Advanced - Stories S017-S022, S032
**Focus**: AI-powered features, response management, notifications
**Required Plugins**:
- `/feature-dev` - Critical for AI integration architecture
- `/ai-sdk` - AI SDK integration patterns
- `/code-review` - Review AI integrations for security and cost optimization

**Guidelines**:
- Use `feature-dev:code-architect` before starting any AI story
- Pay special attention to error handling and rate limiting for OpenAI API
- S019 (Sentiment Analysis) sets patterns for S020-S022; design it carefully

### Phase 4: Mobile & Integrations - Stories S023-S030
**Focus**: Mobile app, public API, integrations, and widgets
**Required Plugins**:
- `/frontend-design` - Essential for mobile UI (S023-S025)
- `/feature-dev` - For API design (S027) and integration architecture (S028-S030)
- `/vercel-composition-patterns` - Component architecture

**Guidelines**:
- S023 (Expo Setup) establishes mobile patterns; use `feature-dev:code-architect`
- For S027 (Public API), design for extensibility and versioning from the start
- S029 (Embeddable Widget) must be lightweight; target < 50KB bundle size

### Phase 5-9: Marketing, Integrations, AI Visibility, Docs (E8-E12)
**Required Plugins**:
- `/frontend-design`, `/seo-audit`, `/schema-markup` - Marketing pages
- `/copywriting` - All marketing copy
- `/feature-dev` - Integration and API stories

### Phase 10: Video Testimonials (E15) - Stories S050-S059
**Focus**: Video recording, processing, and testimonial management
**Required Plugins** (ALL stories):
- `/feature-dev` - ALWAYS run at start for architecture planning
- `/vercel-react-best-practices` - ALWAYS run for React component optimization
- `/frontend-design` - For video player UI, recording interface, gallery components
- `/code-review` - Run during Pass 2
- `/code-simplifier` - Run during Pass 3

**Technical Guidelines**:
- Use native MediaRecorder API for video capture
- Implement proper loading/processing states for video uploads
- Ensure mobile-first responsive design for recording UI
- Apply accessibility standards for video controls (WCAG 2.1 AA)
- Use ShadCN components as foundation, style per design system

### Phase 11: Product Email Sequencing (E16) - Stories S073-S095
**Focus**: Product-triggered email sequences, email design system, A/B testing
**Required Plugins**:
- `/email-sequence`, `/react-email`, `/resend`, `/send-email` - Email infrastructure
- `/email-best-practices` - Deliverability and compliance
- `/copywriting` - Email copy quality
- `/frontend-design` - Preferences UI, analytics dashboard
- `/stripe-best-practices` - Billing/dunning sequences
- `/ab-test-setup` - A/B testing framework

### Phase 12: SMS Channel (E18) - Stories S096-S113
**Focus**: Twilio SMS integration, compliance, two-way messaging
**Required Plugins**:
- `/feature-dev` - Architecture for Twilio integration, consent engine, credits system
- `/supabase-postgres-best-practices` - 9 new database tables, RLS policies
- `/frontend-design` - Settings UI, template editor, analytics, conversation UI
- `/form-cro` - Multi-step forms (10DLC wizard, compliance settings)
- `/signup-flow-cro` - 10DLC registration wizard (S104)
- `/stripe-best-practices` - Credit billing integration (S106)
- `/analytics-tracking` - SMS analytics dashboard (S109)
- `/vercel-composition-patterns` - Flow Builder integration (S110), conversation UI (S112)

**Technical Guidelines**:
- TCPA compliance (S098) and 10DLC (S104) are legal requirements before production SMS
- All SMS sends must check consent, quiet hours, and credit balance
- Phone numbers: E.164 storage, (XXX) XXX-XXXX display
- Quiet hours enforcement at send time with re-scheduling
- Credit deduction must be atomic (SELECT ... FOR UPDATE)

### Phase 13: Competitor Comparison Pages (E19) - Stories S114-S131
**Focus**: SEO landing pages with shared template, structured data, A/B testing
**Required Plugins**:
- `/frontend-design` - 16 section sub-components, masonry layouts, carousels
- `/seo-audit` - Lighthouse 90+, Core Web Vitals, meta optimization
- `/schema-markup` - FAQPage, BreadcrumbList, Product JSON-LD
- `/copywriting` - Competitor-specific persuasive copy (5 pages)
- `/competitor-alternatives` - Competitor positioning and content strategy
- `/page-cro` - Conversion optimization for comparison pages
- `/ab-test-setup` - H1 and CTA A/B testing (S131)
- `/analytics-tracking` - switching_from tracking, conversion analytics
- `/pricing-strategy` - Pricing comparison sections (S117)

**Technical Guidelines**:
- All pages statically generated via generateStaticParams
- JSON-LD must validate in Google Rich Results Test
- Performance: LCP < 2.5s, CLS < 0.1, Lighthouse 90+
- Copy must be factual and defensible
- URL pattern: /compare/[competitor]-alternative

### Phase 14: Embeddable Review Widgets (E20) - Stories S132-S165
**Focus**: 9 widget types, embed script, no-code builder, Social Proof Editor
**Required Plugins**:
- `/feature-dev` - embed.js architecture, public API, NPM package, WordPress plugin
- `/supabase-postgres-best-practices` - Widget schema, events, analytics queries
- `/frontend-design` - Widget Builder, all widget UIs, Social Proof Editor canvas
- `/vercel-composition-patterns` - Component composition for 9 widget types
- `/schema-markup` - JSON-LD injection for SEO widgets (S142)
- `/seo-audit` - Structured data validation, SEO dashboard (S160)
- `/analytics-tracking` - Widget impressions, clicks, conversions (S145, S154)
- `/ab-test-setup` - Widget A/B testing (S153)
- `/form-cro` - Widget Builder configuration forms (S139)
- `/popup-cro` - Social Proof Banner trigger optimization (S151)
- `/copywriting` - Integration guides, template content (S158, S163)

**Technical Guidelines**:
- embed.js MUST be < 15KB gzipped — enforce in CI
- Shadow DOM encapsulation required — no style leakage to/from host page
- NMLS disclaimer required on all mortgage-related widgets
- Widget must not block host page rendering (async load, no inline scripts)
- Public API rate limiting: 100/min config, 60/min analytics
- React NPM package (S155) must be tree-shakeable

## Implementation Guidelines

### Tech Stack Reference
- **Frontend**: Next.js 16 with App Router, TypeScript strict mode, React 19
- **UI**: ShadCN/UI components + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Auth**: Supabase Auth with RLS
- **Email**: Resend for transactional emails
- **SMS**: Twilio (Phase 12)
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
│   ├── (marketing)/       # Public marketing pages
│   │   └── compare/       # Competitor comparison pages (E19)
│   ├── api/               # API routes
│   │   ├── webhooks/      # Webhook handlers (Twilio, CRM)
│   │   ├── cron/          # Scheduled jobs (SMS queue, follow-ups)
│   │   └── v1/            # Public API v1
│   └── survey/[token]/    # Public survey pages
├── components/
│   ├── ui/                # ShadCN components
│   ├── forms/             # Form components
│   ├── dashboard/         # Dashboard-specific components
│   ├── settings/sms/      # SMS settings components (E18)
│   ├── competitor-pages/  # Comparison page sections (E19)
│   ├── widgets/           # Widget builder & controls (E20)
│   ├── messages/          # Two-way SMS conversation (E18)
│   ├── social-graphics/   # Social Proof Editor (E20)
│   └── shared/            # Shared components
├── embed/                 # Widget embed script (E20)
│   ├── core/              # embed.js, Shadow DOM, loader
│   ├── widgets/           # Widget renderers
│   └── i18n/              # Widget translations
├── lib/
│   ├── supabase/          # Supabase client and helpers
│   ├── sms/               # Twilio/SMS service layer (E18)
│   ├── competitor-pages/  # Comparison page configs (E19)
│   ├── widgets/           # Widget API and actions (E20)
│   ├── social-graphics/   # Social Proof Editor logic (E20)
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
