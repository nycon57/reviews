# ReviewHub - Customer Experience & Review Management Platform

An internal Customer Experience & Review Management Platform built to replace Experience.com/Birdeye with a custom solution tailored for mortgage and financial services companies.

## Overview

ReviewHub is a comprehensive platform for:
- **Automated Review Collection**: Send surveys automatically when loans close
- **Multi-Platform Aggregation**: Consolidate reviews from Google, Zillow, and internal surveys
- **AI-Powered Analytics**: Sentiment analysis, NPS tracking, and actionable insights
- **Reputation Management**: Monitor, respond to, and leverage customer feedback
- **SEO Optimization**: Structured data and profile optimization for search visibility

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| UI Components | ShadCN/UI |
| Backend | Supabase (PostgreSQL + Edge Functions) |
| Authentication | Supabase Auth with Row Level Security |
| Email | Resend |
| Mobile | React Native + Expo |
| AI | OpenAI API (GPT-4) |

## Project Structure

```
reviews/
├── .agents/                 # Agent configuration
│   ├── ralph/              # Ralph loop configuration
│   └── tasks/              # PRD and task definitions
├── .ralph/                  # Ralph state (progress, logs)
├── docs/                    # Project documentation
│   ├── architecture/       # System design docs
│   ├── api/                # API documentation
│   └── guides/             # Development guides
├── src/
│   ├── app/                # Next.js App Router
│   ├── components/         # React components
│   ├── lib/                # Utility libraries
│   ├── types/              # TypeScript definitions
│   └── hooks/              # Custom React hooks
├── mobile/                  # React Native app (Phase 4)
├── supabase/               # Database migrations & functions
└── wordpress-plugin/        # WordPress integration (Phase 4)
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm
- Supabase account
- Resend account
- OpenAI API key (for AI features)

### Development Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/nycon57/reviews.git
   cd reviews
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy environment variables:
   ```bash
   cp .env.example .env.local
   ```

4. Configure environment variables in `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   RESEND_API_KEY=your_resend_api_key
   OPENAI_API_KEY=your_openai_api_key
   ```

5. Run database migrations:
   ```bash
   npx supabase db push
   ```

6. Start development server:
   ```bash
   npm run dev
   ```

## Ralph Development Workflow

This project uses the Ralph agent loop for autonomous development. See `.agents/tasks/prd-reviews.json` for the full PRD.

### Running Ralph

```bash
# Generate/view PRD
ralph prd

# Run one development iteration
ralph build 1

# Run with specific PRD
ralph build 1 --prd .agents/tasks/prd-reviews.json

# Dry run (no commits)
ralph build 1 --no-commit
```

### Story Status

Stories progress through these states:
- `open` - Ready to be worked on
- `in_progress` - Currently being implemented
- `done` - Completed and verified

## Development Phases

### Phase 1: Foundation (MVP)
- Project setup and authentication
- Survey builder and distribution
- Basic LO dashboard
- Core analytics engine

### Phase 2: Enhanced Features
- Manager dashboards and leaderboards
- Google Business Profile integration
- Approval workflows
- Multi-tenant support

### Phase 3: AI & Advanced
- Sentiment analysis
- AI insights dashboard
- Response suggestions
- SEO optimization

### Phase 4: Mobile & Integrations
- React Native mobile app
- Public REST API
- WordPress plugin
- Embeddable widgets
- Zapier integration

## Key Features

### For Loan Officers
- Personal dashboard with ratings and reviews
- Review response tools
- Reputation score tracking
- Performance insights

### For Managers
- Team overview and comparisons
- Leaderboards and gamification
- Performance alerts
- Custom reporting

### For Administrators
- Survey template builder
- Multi-tenant organization management
- Integration configuration
- System settings

## API Documentation

See `docs/api/` for full API documentation including:
- Authentication
- Reviews API
- Surveys API
- Analytics API
- Webhooks

## Contributing

1. Check `.agents/tasks/prd-reviews.json` for available stories
2. Follow the tech stack and coding standards
3. Ensure all gates pass before committing
4. Update progress tracking after completing stories

## License

Proprietary - Internal use only (with future SaaS commercialization planned)
