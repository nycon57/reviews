# Mobbin UI Reference Guide for Ralph Agents

## Overview
Use mobbin.com to research modern, production-grade UI patterns before implementing any frontend story. This ensures ReviewHub has a polished, professional interface that rivals top SaaS products.

## Authentication
- **URL**: https://mobbin.com
- **Login Method**: Google OAuth
- **Email**: jarrett.stanley@gmail.com (from env: MOBBIN_EMAIL)

## How to Use Mobbin

### Before Any UI Story
1. Load the browser automation tools (claude-in-chrome MCP)
2. Navigate to https://mobbin.com
3. Search for relevant UI patterns using the search queries below
4. Study 3-5 top examples for design inspiration
5. Document key patterns to implement

### Search Strategy
- Use specific keywords related to the feature
- Filter by "Web" for desktop or "iOS/Android" for mobile
- Look at apps with high design reputation (Stripe, Linear, Notion, Figma)

## Story-Specific Search Queries

### Phase 1: Foundation (MVP)

**S001 - Project Setup**
- N/A (infrastructure only)

**S004 - Base Layout & Navigation**
- "dashboard sidebar navigation"
- "responsive navigation header"
- "dark mode toggle settings"
- "breadcrumb navigation"
- Recommended apps: Linear, Notion, Figma

**S005 - Survey Builder**
- "survey form builder"
- "drag and drop form builder"
- "question type selector"
- "form preview mode"
- Recommended apps: Typeform, Tally, Maze

**S006 - Public Survey Form**
- "survey response form mobile"
- "progress indicator form"
- "thank you success page"
- Recommended apps: Typeform, SurveyMonkey

**S010 - Loan Officer Dashboard**
- "dashboard analytics overview"
- "metrics cards dashboard"
- "rating chart analytics"
- "recent activity feed"
- Recommended apps: Stripe Dashboard, Dub, Hashnode

### Phase 2: Enhanced Features

**S009 - Review Approval Workflow**
- "approval workflow queue"
- "content moderation interface"
- "bulk action toolbar"
- Recommended apps: Notion, Linear

**S011 - Manager Dashboard**
- "team analytics dashboard"
- "leaderboard comparison table"
- "performance metrics team"
- Recommended apps: Deel, Rippling, Lattice

**S013 - Gamification & Leaderboards**
- "gamification leaderboard"
- "achievement badges profile"
- "score progress indicator"
- Recommended apps: Duolingo, LinkedIn

**S014 - Reporting & Export**
- "report builder dashboard"
- "export data dialog"
- "date range picker"
- Recommended apps: Mixpanel, Amplitude

**S015 - Google Business Profile Integration**
- "oauth connection flow"
- "integration settings page"
- "sync status indicator"
- Recommended apps: Zapier, Make

**S016 - Review Aggregation Dashboard**
- "review management dashboard"
- "content feed filter"
- "search results list"
- Recommended apps: Birdeye, ReviewTrackers

### Phase 3: AI & Advanced

**S017 - Review Response Management**
- "message reply composer"
- "response template selector"
- "approval workflow dialog"
- Recommended apps: Intercom, Front

**S018 - Alert & Notification System**
- "notification center dropdown"
- "notification preferences settings"
- "alert banner component"
- Recommended apps: Slack, Linear

**S019 - Sentiment Analysis Engine**
- N/A (backend only)

**S020 - AI Insights Dashboard**
- "ai insights analytics"
- "sentiment trend chart"
- "word cloud visualization"
- Recommended apps: MonkeyLearn, Lexalytics

**S021 - AI Response Suggestions**
- "ai generated content card"
- "tone selector dropdown"
- "suggestion acceptance dialog"
- Recommended apps: Jasper, Copy.ai

**S022 - Testimonial Generator**
- "testimonial card design"
- "social media preview"
- "content export modal"
- Recommended apps: Testimonial.to, Senja

### Phase 4: Mobile & Integrations

**S023 - Expo Project Setup**
- "mobile app navigation bottom"
- "ios android design system"
- Recommended apps: Stripe, Cash App

**S024 - Mobile Dashboard**
- "mobile analytics dashboard"
- "pull to refresh list"
- "mobile metrics cards"
- Recommended apps: Stripe Mobile, Square

**S025 - Mobile Survey Request**
- "mobile contact picker"
- "quick action button mobile"
- "send confirmation modal mobile"
- Recommended apps: Typeform Mobile

**S027 - Public API**
- "api documentation page"
- "api key management"
- "code example component"
- Recommended apps: Stripe Docs, Twilio

**S028 - WordPress Integration Plugin**
- N/A (external plugin)

**S029 - Embeddable Widget**
- "review widget embed"
- "testimonial carousel"
- "star rating display"
- Recommended apps: Trustpilot, G2

**S030 - Zapier Integration**
- "integration marketplace"
- "zap configuration form"
- Recommended apps: Zapier

## Design Principles from Top Apps

### From Stripe
- Clean, spacious layouts with clear hierarchy
- Subtle shadows and borders for depth
- Consistent 8px spacing grid
- Monochromatic color with strategic accent colors

### From Linear
- Dark mode optimized design
- Keyboard shortcuts prominent
- Minimal chrome, maximum content
- Fast, responsive interactions

### From Notion
- Flexible, modular components
- Inline editing patterns
- Drag-and-drop interactions
- Contextual menus

### From Figma
- Collaborative indicators
- Tool palettes and panels
- Zoom and pan controls
- Property inspectors

## Key UI Patterns to Implement

### Dashboard Patterns
- Metric cards with sparkline trends
- Period selector (7d, 30d, 90d, custom)
- Quick filter chips
- Empty states with CTAs

### Table Patterns
- Column sorting and visibility toggles
- Bulk selection with action toolbar
- Infinite scroll or pagination
- Row hover actions

### Form Patterns
- Inline validation with clear errors
- Progress indicators for multi-step
- Auto-save with status indicator
- Keyboard navigation support

### Mobile Patterns
- Bottom navigation with 4-5 items max
- Pull-to-refresh for lists
- Swipe actions on list items
- Bottom sheets for modals

## Documentation Checklist

After researching Mobbin for a story, document:
1. [ ] 3-5 reference screenshots/URLs
2. [ ] Key design patterns to implement
3. [ ] Color palette and spacing decisions
4. [ ] Animation/interaction notes
5. [ ] Accessibility considerations
