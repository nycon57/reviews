# System Architecture Overview

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
├─────────────────────┬─────────────────────┬─────────────────────────────────┤
│   Web Application   │   Mobile App        │   Public Survey Pages           │
│   (Next.js 14)      │   (React Native)    │   (Next.js SSR)                │
│   - LO Dashboard    │   - Dashboard       │   - Survey Forms                │
│   - Manager Views   │   - Notifications   │   - Thank You Pages            │
│   - Admin Panel     │   - Quick Actions   │   - Review Submission          │
└─────────┬───────────┴─────────┬───────────┴─────────────┬───────────────────┘
          │                     │                         │
          └─────────────────────┼─────────────────────────┘
                                │
┌───────────────────────────────┴─────────────────────────────────────────────┐
│                              API LAYER                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│   Next.js API Routes                      │   Supabase Edge Functions       │
│   - /api/surveys/*                        │   - Email scheduling            │
│   - /api/reviews/*                        │   - Webhook processing          │
│   - /api/analytics/*                      │   - Google sync                 │
│   - /api/webhooks/*                       │   - AI analysis jobs            │
├─────────────────────────────────────────────────────────────────────────────┤
│                              AUTH LAYER                                      │
│   Supabase Auth + Row Level Security                                        │
│   - Email/Password + Magic Links                                            │
│   - Role-based access (Admin, Manager, LoanOfficer)                        │
│   - Organization-scoped data isolation                                      │
└─────────────────────────────────────────────────────────────────────────────┘
                                │
┌───────────────────────────────┴─────────────────────────────────────────────┐
│                              DATA LAYER                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│   Supabase PostgreSQL                                                        │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│   │ organizations│  │    users     │  │ loan_officers│  │   surveys    │   │
│   └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘   │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│   │   reviews    │  │  responses   │  │   metrics    │  │  email_logs  │   │
│   └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                │
┌───────────────────────────────┴─────────────────────────────────────────────┐
│                           INTEGRATION LAYER                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│   │    Resend    │  │  OpenAI API  │  │ Google Biz   │  │   Zapier     │   │
│   │   (Email)    │  │ (Sentiment)  │  │  Profile     │  │  (Webhooks)  │   │
│   └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Web Application (Next.js 14)

The primary interface for all users, built with Next.js 14 App Router.

**Key Routes:**
```
/                           # Landing/marketing page
/(auth)
  /login                    # Sign in page
  /signup                   # Sign up page
  /forgot-password          # Password reset
/(dashboard)
  /dashboard                # Main dashboard (role-specific)
  /reviews                  # Review management
  /surveys                  # Survey management
  /analytics                # Analytics & reports
  /settings                 # User/org settings
  /team                     # Team management (managers)
  /admin                    # Admin panel
/survey/[token]             # Public survey form
/api/*                      # API routes
```

### 2. Database Schema

See `database-schema.md` for detailed schema documentation.

**Core Entities:**
- `organizations` - Multi-tenant parent entity
- `users` - Platform users with roles
- `loan_officers` - LO profiles with metadata
- `surveys` - Survey templates and configurations
- `survey_responses` - Submitted survey responses
- `reviews` - Aggregated reviews from all sources
- `metrics_snapshots` - Cached analytics data

### 3. Authentication Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────▶│  Supabase   │────▶│  Database   │
│   (Browser) │     │    Auth     │     │    (RLS)    │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       │    JWT Token      │    User Context   │
       │◀──────────────────│◀──────────────────│
       │                   │                   │
       ▼                   ▼                   ▼
   Store in           Validate &          Apply RLS
   Session            Extract Role        Policies
```

**Roles:**
- `admin` - Full system access, organization management
- `manager` - Team oversight, all LO data in their org
- `loan_officer` - Own data only, limited settings

### 4. Survey Distribution Flow

```
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│  Loan Closes  │────▶│   Webhook     │────▶│  Create Job   │
│  (External)   │     │   Received    │     │   in Queue    │
└───────────────┘     └───────────────┘     └───────────────┘
                                                    │
                                                    ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│   Customer    │◀────│  Send Email   │◀────│  Process Job  │
│   Receives    │     │  via Resend   │     │  (Edge Func)  │
└───────────────┘     └───────────────┘     └───────────────┘
       │
       ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│   Clicks Link │────▶│  Survey Form  │────▶│ Save Response │
│   in Email    │     │   Rendered    │     │  to Database  │
└───────────────┘     └───────────────┘     └───────────────┘
                                                    │
                                                    ▼
                      ┌───────────────┐     ┌───────────────┐
                      │  Run AI       │────▶│  Notify LO    │
                      │  Analysis     │     │  & Manager    │
                      └───────────────┘     └───────────────┘
```

### 5. Review Aggregation Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    REVIEW SOURCES                            │
├─────────────────┬─────────────────┬─────────────────────────┤
│  Internal       │  Google Biz     │  Future: Zillow,        │
│  Surveys        │  Profile API    │  Facebook, etc.         │
└────────┬────────┴────────┬────────┴────────┬────────────────┘
         │                 │                 │
         ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────┐
│                 UNIFIED REVIEWS TABLE                        │
│  - source (internal, google, zillow, etc.)                  │
│  - loan_officer_id (FK)                                      │
│  - rating, text, customer_name                               │
│  - sentiment_score (AI-generated)                            │
│  - themes[] (AI-extracted)                                   │
│  - created_at, synced_at                                     │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                 ANALYTICS ENGINE                             │
│  - NPS calculation                                           │
│  - CSAT calculation                                          │
│  - Response rate                                             │
│  - Trend analysis                                            │
│  - Leaderboard rankings                                      │
└─────────────────────────────────────────────────────────────┘
```

## Integration Points

### Inbound Integrations (Webhooks)

| Integration | Event | Action |
|-------------|-------|--------|
| LOS (Encompass, etc.) | `loan.closed` | Trigger survey send |
| CRM (Salesforce, etc.) | `contact.created` | Create customer record |
| Google Business | OAuth callback | Connect account |

### Outbound Integrations

| Integration | Purpose | Frequency |
|-------------|---------|-----------|
| Resend | Send emails | On-demand |
| OpenAI | Sentiment analysis | Per new review |
| Google Business API | Fetch/reply reviews | Daily sync |
| WordPress REST API | Publish reviews | On approval |

## Security Model

### Row Level Security (RLS)

```sql
-- Example: Users can only see reviews from their organization
CREATE POLICY "users_own_org_reviews" ON reviews
  FOR SELECT
  USING (
    loan_officer_id IN (
      SELECT id FROM loan_officers
      WHERE organization_id = auth.jwt() ->> 'organization_id'
    )
  );

-- Example: Managers can see all reviews in their org
CREATE POLICY "managers_org_reviews" ON reviews
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'manager')
      AND organization_id = (
        SELECT organization_id FROM loan_officers
        WHERE id = reviews.loan_officer_id
      )
    )
  );
```

### API Authentication

- **Web App**: Supabase session cookies (httpOnly)
- **Mobile App**: Supabase JWT tokens
- **Public API**: API key header (`X-API-Key`)
- **Webhooks**: HMAC signature verification

## Performance Considerations

### Caching Strategy

| Data Type | Cache Location | TTL |
|-----------|----------------|-----|
| User sessions | Client-side | 1 hour |
| Dashboard metrics | Database (materialized) | 15 minutes |
| Leaderboards | Database (materialized) | 1 hour |
| Survey templates | Server-side cache | 5 minutes |

### Database Optimization

- Indexes on frequently queried columns (loan_officer_id, created_at, organization_id)
- Materialized views for complex aggregations
- Connection pooling via Supabase
- Query result pagination (default 50 items)

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Vercel Edge Network                     │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                    Next.js Application                   ││
│  │  - SSR pages (survey forms)                              ││
│  │  - Static pages (marketing)                              ││
│  │  - API routes                                            ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Cloud                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  PostgreSQL  │  │ Edge Functions│  │   Storage    │      │
│  │  (Database)  │  │ (Background)  │  │   (Files)    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

## Future Considerations

### Scalability Path
1. **Phase 1**: Single Supabase project, Vercel deployment
2. **Phase 2**: Add Redis caching for hot data
3. **Phase 3**: Implement job queue (Inngest/Trigger.dev) for background processing
4. **Phase 4**: Multi-region deployment for enterprise clients

### Feature Extensions
- Real-time review notifications via WebSockets
- Video testimonial capture
- Social media monitoring
- Competitive benchmarking
- White-label/custom domains per organization
