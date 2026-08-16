# PRD: AI Visibility Monitoring System

> **Epic:** E21 — AI Visibility Real-Time Monitoring
> **Stories:** S166–S183
> **Priority:** Post-1.0 (Phase 2)
> **Author:** Claude (AI-generated PRD)
> **Last Updated:** 2026-02-05
> **Status:** Draft

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Background & Market Research](#2-background--market-research)
3. [System Architecture](#3-system-architecture)
4. [Technical Specification](#4-technical-specification)
5. [Database Schema](#5-database-schema)
6. [Implementation Stories](#6-implementation-stories)
7. [Cost Model](#7-cost-model)
8. [Risk Matrix](#8-risk-matrix)
9. [Testing Strategy](#9-testing-strategy)
10. [Proof & Evidence System](#10-proof--evidence-system)

---

## 1. Executive Summary

### Problem

RepWell's `/dashboard/geo` route has a polished UI shell backed by 9 database tables and 18+ server actions — but every metric displayed to users is fabricated. Platform-specific scores use `Math.random()` (actions.ts:125-131), mention counts are hardcoded (actions.ts:876-922), competitor comparisons are fully simulated (actions.ts:1241-1249), and performance history writes random data (actions.ts:1538-1556).

This means our "AI Visibility" feature is currently a readiness assessment tool at best and a liability at worst. Users see numbers that look real but have zero connection to how AI search engines actually reference their business.

### Solution

Replace all fabricated data with a **two-tier measurement system**:

1. **Readiness Scoring (Tier 1)** — Enhance the existing score calculation with deterministic, data-driven metrics. No external API calls needed. This refines what already exists in `calculateScoreBreakdown()` (actions.ts:160-231) to be honest about what it measures.

2. **Real Monitoring (Tier 2)** — Query actual AI search platforms (Perplexity, Google Gemini, ChatGPT, Claude, Bing Copilot) with mortgage-specific prompts, detect entity mentions via NLP, and store verified results with evidence. This replaces all `Math.random()` and hardcoded data.

### Market Gap

No mortgage/financial services CX platform offers real-time AI search monitoring. Experience.com and Birdeye track traditional SEO and Google Business Profile metrics but are blind to the shift toward AI-generated answers. This feature gives RepWell a defensible competitive advantage in the $4.7B reputation management market.

### Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Monitoring accuracy | >85% precision on mention detection | Manual audit of 200 random results |
| Cost per entity/month | <$8 at Standard tier | API cost tracking table |
| Dashboard load time | <2s for 30-day view | Lighthouse + real user monitoring |
| Customer adoption | 40% of orgs enable within 60 days | Feature flag analytics |
| False positive rate | <10% of detected mentions | Weekly sampling audit |

---

## 2. Background & Market Research

### 2.1 How AI Visibility Works

AI search engines (ChatGPT, Perplexity, Google AI Overviews, etc.) generate answers by:

1. **Retrieval** — Querying an index or performing real-time web search to find relevant sources
2. **Grounding** — Selecting authoritative sources and extracting factual claims
3. **Generation** — Synthesizing an answer with inline citations or source attributions
4. **Ranking signals** — Entity clarity, structured data (schema.org), citation frequency, content freshness, topical authority

For mortgage professionals, this means a borrower asking "best loan officer in Denver for FHA loans" gets a synthesized answer — not a list of 10 blue links. Being mentioned (or not) in that answer has direct business impact.

### 2.2 What We Currently Measure vs. What We Need

| Aspect | Current State | Target State |
|--------|---------------|--------------|
| Readiness score | Based on profile completeness — bio length, photo, NMLS, reviews (actions.ts:160-231) | Same foundation + schema validation, citation graph analysis |
| Platform scores | `Math.random()` variation on overall (actions.ts:125-131) | Real per-platform query results |
| Mention detection | 3 hardcoded fake mentions (actions.ts:876-922) | NLP-based detection from actual AI responses |
| Competitor comparison | Fully random 50-90 range (actions.ts:1241-1249) | Side-by-side queries with same prompts |
| Performance history | Random counts written to DB (actions.ts:1538-1556) | Aggregated from real monitoring results |
| Evidence/proof | None | Screenshot-equivalent evidence + source URLs |

### 2.3 Competitive Landscape

| Platform | AI Monitoring? | What They Track | Pricing |
|----------|---------------|-----------------|---------|
| **Experience.com** | No | Traditional SEO, Google Business, review aggregation | $299-599/mo per location |
| **Birdeye** | No | Review monitoring, local SEO, social listening | $299-499/mo per location |
| **Semrush** | Partial | "AI Overviews" tracking in SERP features | $129-499/mo (not per-entity) |
| **BrightLocal** | Partial | Google AI Overview mention tracking only | $39-79/mo per location |
| **Brand24** | No | Social/web mention monitoring, no AI search | $99-399/mo |
| **Otterly.ai** | Yes | AI search monitoring across platforms | ~$50-200/mo per brand |
| **Peec AI** | Yes | AI citation tracking, brand monitoring | ~$100-300/mo per brand |

**Key insight:** Generic AI monitoring tools exist but none are purpose-built for mortgage/financial services, none integrate with a CX platform, and none provide actionable optimization tied to review collection.

### 2.4 Available APIs & Costs

#### Primary Query APIs

| API | Endpoint | Cost | Rate Limit | Best For |
|-----|----------|------|------------|----------|
| **Perplexity Sonar** | `POST /chat/completions` (model: `sonar`) | $5/1K requests (small), $10/1K (medium) | 50 req/min (free), 500/min (pro) | Primary monitoring — returns sources with citations |
| **Google Gemini (Grounding)** | Vertex AI `generateContent` with `google_search_retrieval` tool | $0.075/1K chars input + $0.30/1K chars output + grounding fee | 60 RPM (free), 1000 RPM (paid) | Google AI Overview simulation |
| **OpenAI (web search)** | `POST /v1/chat/completions` (model: `gpt-4o-search-preview`) | ~$2.50/1M input + $10/1M output + $30/1K search calls | 500 RPM (Tier 5) | ChatGPT perspective |
| **Anthropic Claude** | `POST /v1/messages` with `web_search` tool | $3/1M input + $15/1M output + ~$10/1K searches | 1000 RPM (Tier 3) | Claude perspective |

#### SERP & AI Overview APIs

| API | Endpoint | Cost | Rate Limit | Best For |
|-----|----------|------|------------|----------|
| **SerpApi** | `GET /search?engine=google&gl=us` | $50/mo (5K searches), $100/mo (15K) | 1 req/sec | Google AI Overview extraction |
| **Bing Web Search API** | `GET /v7.0/search` | $3/1K transactions (S1) | 250 calls/sec | Bing Copilot context |
| **ValueSERP** | `GET /search` | $50/mo (5K), $100/mo (15K) | No hard limit | Backup SERP provider |

#### NLP & Analysis APIs

| API | Purpose | Cost |
|-----|---------|------|
| **OpenAI Embeddings** | Semantic similarity for mention detection | $0.02/1M tokens (text-embedding-3-small) |
| **OpenAI GPT-4o-mini** | Mention classification, sentiment analysis | $0.15/1M input, $0.60/1M output |

### 2.5 Prompt Engineering for Mortgage-Specific Monitoring

AI search behavior is prompt-dependent. "Best mortgage lender" produces different results than "FHA loan officer near me with good reviews." Our prompt library must cover:

1. **Direct entity queries** — "Tell me about [Name] at [Company]"
2. **Service-category queries** — "Best [loan type] lender in [City]"
3. **Comparison queries** — "Compare mortgage lenders in [Area]"
4. **Problem-solving queries** — "How do I get approved for [loan type] with [situation]?"
5. **Review/reputation queries** — "Reviews for [Company] mortgage services"

See Section 4.4 for the full 50-prompt library.

---

## 3. System Architecture

### 3.1 High-Level Data Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        SCHEDULING LAYER                              │
│                                                                      │
│  ┌──────────────┐  ┌──────────────────┐  ┌────────────────────┐    │
│  │ Cron Trigger  │  │ Manual Trigger   │  │ Event Trigger      │    │
│  │ (daily/weekly)│  │ (dashboard btn)  │  │ (new review, etc.) │    │
│  └──────┬───────┘  └────────┬─────────┘  └─────────┬──────────┘    │
│         └──────────────────┬┼───────────────────────┘               │
│                            ││                                        │
│                    ┌───────▼▼────────┐                               │
│                    │ monitoring_queue │                               │
│                    │   (Supabase)     │                               │
│                    └───────┬─────────┘                               │
└────────────────────────────┼────────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────────┐
│                        PROCESSING LAYER                              │
│                                                                      │
│  ┌────────────────────────────────────────────────────────┐         │
│  │                Queue Processor                          │         │
│  │  1. Atomic claim (UPDATE WHERE status='pending')        │         │
│  │  2. Rate limit check per API                            │         │
│  │  3. Select adapter based on platform                    │         │
│  │  4. Execute query via adapter                           │         │
│  │  5. Run mention detection pipeline                      │         │
│  │  6. Store results + evidence                            │         │
│  │  7. Update cost tracking                                │         │
│  │  8. Mark complete or retry with backoff                 │         │
│  └────────────────────────────────────────────────────────┘         │
│                                                                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│  │Perplexity│ │  Gemini  │ │ ChatGPT  │ │  Claude  │ │  SerpApi │ │
│  │ Adapter  │ │ Adapter  │ │ Adapter  │ │ Adapter  │ │ Adapter  │ │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────────┐
│                        ANALYSIS LAYER                                │
│                                                                      │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │ Mention Detection │  │ Sentiment Engine  │  │ Confidence Scorer│  │
│  │ (NLP + semantic)  │  │ (classify ±/0)   │  │ (0.0–1.0 score) │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘  │
│                                                                      │
│  ┌──────────────────┐  ┌──────────────────┐                        │
│  │ Evidence Capture  │  │ Score Aggregation │                        │
│  │ (response + meta) │  │ (per-platform)    │                        │
│  └──────────────────┘  └──────────────────┘                        │
└─────────────────────────────────────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────────┐
│                        STORAGE LAYER                                 │
│                                                                      │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │monitoring_results │  │ geo_ai_mentions  │  │   api_costs      │  │
│  │ (raw responses)   │  │ (detected refs)  │  │ (cost tracking)  │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘  │
│                                                                      │
│  Existing tables updated:                                            │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │geo_visibility_    │  │geo_performance_  │  │geo_competitor_   │  │
│  │scores (real data) │  │history (real)    │  │comparisons (real)│  │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.2 Queue Design

The monitoring queue follows the same pattern as the SMS queue processor (`src/lib/sms/automation/queue-processor.ts`):

| Concept | SMS Queue Pattern | Monitoring Queue Pattern |
|---------|-------------------|--------------------------|
| **Table** | `sms_messages` with `status='queued'` | `monitoring_queue` with `status='pending'` |
| **Claiming** | Optimistic lock: `UPDATE SET status='sent' WHERE status='queued'` (queue-processor.ts:66-70) | Atomic claim: `UPDATE SET status='processing', claimed_at=NOW() WHERE status='pending'` |
| **Batch size** | Configurable, default 100 (queue-processor.ts:22) | Configurable, default 50 |
| **Error handling** | `markFailed()` with error_code + error_message (queue-processor.ts:161-175) | Same pattern + retry_count + next_retry_at |
| **Scheduling** | `scheduled_at` column, cron at `/api/cron/process-sms-queue` | `scheduled_for` column, cron at `/api/cron/process-monitoring-queue` |
| **Pre-checks** | Consent check, credit check, quiet hours (queue-processor.ts:78-112) | Rate limit check, cost budget check, API health check |
| **Retry** | Rescheduled to next valid time on quiet hours block | Exponential backoff: 1min, 5min, 30min, 2hr (max 4 retries) |

### 3.3 API Adapter Interface

All AI platform integrations implement a common interface, allowing new platforms to be added without modifying the queue processor:

```typescript
interface AISearchAdapter {
  platform: AISearchPlatform;

  /** Execute a search query and return the raw response */
  query(params: QueryParams): Promise<QueryResult>;

  /** Check current rate limit status */
  checkRateLimit(): Promise<RateLimitStatus>;

  /** Estimate cost for a query */
  estimateCost(params: QueryParams): number;

  /** Validate API key is configured and working */
  healthCheck(): Promise<HealthCheckResult>;
}

interface QueryParams {
  prompt: string;
  entityName: string;
  entityLocation?: string;
  maxTokens?: number;
}

interface QueryResult {
  response: string;
  sources: Source[];
  model: string;
  tokensUsed: { input: number; output: number };
  latencyMs: number;
  rawResponse: unknown; // Full API response for evidence storage
}
```

### 3.4 Cron Job Architecture

```
┌─────────────────────────────────────────────────────┐
│              Cron Schedule                            │
├──────────────────┬──────────────────────────────────┤
│ Every 15 min     │ Process monitoring_queue           │
│ Daily 2:00 AM    │ Schedule next day's monitoring     │
│ Daily 3:00 AM    │ Aggregate daily performance        │
│ Weekly Sunday AM │ Generate weekly report snapshots   │
│ Monthly 1st      │ Cost rollup & budget alerts        │
└──────────────────┴──────────────────────────────────┘
```

All cron jobs follow the existing pattern at `src/app/api/cron/process-sms-queue/route.ts`:
- Vercel Cron with `CRON_SECRET` auth header
- Admin client for DB access (no user context)
- Result logging for observability

---

## 4. Technical Specification

### 4.1 Mention Detection Algorithm

Detecting whether an AI response mentions a specific entity requires multiple signals:

```
Input: AI response text, entity name, entity aliases, entity location

Step 1: Exact Match
  - Case-insensitive search for entity name
  - Search for known aliases (e.g., "J. Smith" for "John Smith")
  - Search for organization name
  - If exact match → confidence 0.95+

Step 2: Fuzzy Match
  - Levenshtein distance < 3 for names
  - Handle common variations (LLC, Inc, Corp dropped)
  - Handle name reordering ("Smith, John" vs "John Smith")
  - If fuzzy match → confidence 0.70-0.90

Step 3: Semantic Match (via embeddings)
  - Generate embedding for entity description
  - Generate embedding for each sentence in response
  - Cosine similarity > 0.85 threshold
  - If semantic match only → confidence 0.50-0.70

Step 4: Context Validation
  - Check if location context matches (same city/state)
  - Check if industry context matches (mortgage/lending)
  - Check if NMLS number is present
  - Context match boosts confidence by 0.05-0.15

Step 5: Mention Type Classification
  - "direct": Entity explicitly named and recommended
  - "indirect": Entity described but not named (e.g., "a lender in Denver specializing in FHA")
  - "comparison": Entity listed alongside competitors

Step 6: Sentiment Classification
  - "positive": Recommended, praised, cited as expert
  - "neutral": Mentioned factually without judgment
  - "negative": Criticized, warned against, unfavorable comparison

Output: {
  mentioned: boolean,
  confidence: 0.0-1.0,
  mentionType: 'direct' | 'indirect' | 'comparison',
  sentiment: 'positive' | 'neutral' | 'negative',
  matchedText: string,        // The exact text that matched
  contextWindow: string,       // 200 chars surrounding the match
  matchMethod: 'exact' | 'fuzzy' | 'semantic'
}
```

**Confidence thresholds:**
- `>= 0.80` — Auto-verified, shown in dashboard
- `0.60 - 0.79` — Flagged for review, shown with indicator
- `< 0.60` — Stored but not displayed unless manually verified

### 4.2 Readiness Score Enhancement (Tier 1)

The existing `calculateScoreBreakdown()` (actions.ts:160-231) uses reasonable heuristics but hardcodes base scores. Enhancement plan:

| Category | Current Logic | Enhanced Logic |
|----------|---------------|----------------|
| **Content Completeness** (20%) | Bio length check, photo presence | + FAQ count, template usage, content freshness score |
| **Structured Data** (20%) | Hardcoded 50 | Validate actual schema.org markup on public profile, check JSON-LD |
| **Entity Clarity** (15%) | NMLS presence, name completeness | + Unique entity disambiguation score, cross-reference consistency |
| **Citation Potential** (20%) | Review count/rating | + Review recency, review depth (word count), response rate |
| **Topical Authority** (15%) | Hardcoded 60 | Content uniqueness score, keyword coverage for service area |
| **Freshness** (10%) | Last profile update | + Last review date, content update frequency, activity score |

**Platform scores replace Math.random():** Each platform gets a weighted readiness score based on what that platform values:
- **Perplexity**: Heavily weights citations and source quality
- **Google AI Overview**: Weights structured data and entity clarity
- **ChatGPT**: Weights content completeness and topical authority
- **Claude**: Weights factual accuracy and structured data
- **Bing Copilot**: Weights web presence breadth and freshness
- **Gemini**: Weights Google ecosystem signals and structured data

### 4.3 Real Monitoring Pipeline (Tier 2)

```
For each monitored entity:
  1. Select prompts from monitoring_prompts based on entity type + location
  2. For each enabled platform:
     a. Check rate limit (sliding window per API)
     b. Check cost budget (daily + monthly caps)
     c. Format prompt with entity context
     d. Execute via platform adapter
     e. Run mention detection pipeline
     f. Store raw response in monitoring_results
     g. If mention detected, insert into geo_ai_mentions
     h. Log API cost to api_costs table
  3. After all platforms queried:
     a. Calculate real platform_scores from results
     b. Update geo_visibility_scores with real data
     c. Aggregate into geo_performance_history
```

### 4.4 Prompt Library (50 Mortgage-Specific Prompts)

Prompts are organized by category and parameterized with `{entity_name}`, `{company}`, `{city}`, `{state}`, `{loan_type}`, `{specialty}`.

#### Category 1: Direct Entity Queries (10 prompts)

| ID | Prompt Template | Expected Mention Type |
|----|-----------------|----------------------|
| P01 | "Tell me about {entity_name} at {company} in {city}, {state}" | direct |
| P02 | "Is {entity_name} a good mortgage loan officer?" | direct |
| P03 | "What do reviews say about {entity_name} mortgage services?" | direct |
| P04 | "{entity_name} {company} reviews and ratings" | direct |
| P05 | "Should I work with {entity_name} for my home loan?" | direct |
| P06 | "What is {entity_name}'s NMLS number and credentials?" | direct |
| P07 | "{company} mortgage company reviews" | direct (org) |
| P08 | "Tell me about {company} mortgage lending in {city}" | direct (org) |
| P09 | "Is {company} a legitimate mortgage lender?" | direct (org) |
| P10 | "{entity_name} loan officer experience and qualifications" | direct |

#### Category 2: Service-Category Queries (12 prompts)

| ID | Prompt Template | Expected Mention Type |
|----|-----------------|----------------------|
| P11 | "Best mortgage loan officer in {city}, {state}" | comparison |
| P12 | "Top rated mortgage lenders in {city}" | comparison |
| P13 | "Best {loan_type} lender in {city}, {state}" | comparison |
| P14 | "Who offers the best FHA loans in {city}?" | comparison |
| P15 | "Best VA loan specialist in {city}, {state}" | comparison |
| P16 | "Top jumbo mortgage lenders in {city}" | comparison |
| P17 | "Best first-time home buyer lender in {city}" | comparison |
| P18 | "Recommended mortgage brokers near {city}, {state}" | comparison |
| P19 | "Most trusted mortgage companies in {state}" | comparison |
| P20 | "Best refinance lenders in {city}, {state}" | comparison |
| P21 | "Who has the lowest mortgage rates in {city}?" | comparison |
| P22 | "Best mortgage lender for self-employed borrowers in {city}" | comparison |

#### Category 3: Problem-Solving Queries (12 prompts)

| ID | Prompt Template | Expected Mention Type |
|----|-----------------|----------------------|
| P23 | "How do I get a mortgage with bad credit in {city}?" | indirect |
| P24 | "What's the process for getting an FHA loan in {state}?" | indirect |
| P25 | "How much do I need for a down payment in {city}?" | indirect |
| P26 | "What documents do I need for a mortgage application?" | indirect |
| P27 | "How long does it take to close on a house in {state}?" | indirect |
| P28 | "Can I get a mortgage with student loan debt?" | indirect |
| P29 | "First-time home buyer programs in {city}, {state}" | indirect |
| P30 | "How to choose between FHA and conventional loan?" | indirect |
| P31 | "What credit score do I need for a mortgage in {state}?" | indirect |
| P32 | "How to get pre-approved for a mortgage in {city}" | indirect |
| P33 | "USDA loan eligibility in {state}" | indirect |
| P34 | "Reverse mortgage options in {city}, {state}" | indirect |

#### Category 4: Comparison Queries (8 prompts)

| ID | Prompt Template | Expected Mention Type |
|----|-----------------|----------------------|
| P35 | "Compare mortgage lenders in {city}: who is best?" | comparison |
| P36 | "{company} vs [competitor] for mortgage lending" | comparison |
| P37 | "Online mortgage lenders vs local lenders in {city}" | comparison |
| P38 | "Bank vs mortgage broker for home loan in {state}" | comparison |
| P39 | "Pros and cons of using {company} for mortgage" | direct |
| P40 | "Mortgage company rankings in {city}, {state}" | comparison |
| P41 | "Which mortgage lender has best customer service in {city}?" | comparison |
| P42 | "Best reviewed mortgage companies in {state}" | comparison |

#### Category 5: Reputation & Review Queries (8 prompts)

| ID | Prompt Template | Expected Mention Type |
|----|-----------------|----------------------|
| P43 | "What are people saying about {company} mortgages?" | direct |
| P44 | "Complaints about {company} mortgage services" | direct |
| P45 | "{entity_name} mortgage officer reviews from borrowers" | direct |
| P46 | "Is {company} BBB accredited?" | direct |
| P47 | "Customer satisfaction ratings for mortgage lenders in {city}" | comparison |
| P48 | "Horror stories about mortgage lenders in {city}" | indirect |
| P49 | "Most recommended mortgage professionals in {city}" | comparison |
| P50 | "Trustworthy mortgage advisors in {city}, {state}" | comparison |

### 4.5 Platform Adapter Specifications

#### Perplexity Sonar Adapter

```typescript
// Primary monitoring adapter — best cost/value for citation-heavy responses
class PerplexityAdapter implements AISearchAdapter {
  platform = 'perplexity' as const;
  baseUrl = 'https://api.perplexity.ai';

  // Model selection:
  // - sonar: $5/1K requests, good for most queries
  // - sonar-pro: $10/1K requests, for complex comparison queries

  async query(params: QueryParams): Promise<QueryResult> {
    // POST /chat/completions
    // model: "sonar"
    // messages: [{ role: "user", content: params.prompt }]
    // return_citations: true
    // return_related_questions: false
    // search_recency_filter: "month"
  }

  // Rate limit: 50 RPM (free), 500 RPM (pro)
  // Retry: 429 → exponential backoff starting at 2s
}
```

#### Google Gemini Grounding Adapter

```typescript
// Best for understanding Google AI Overview behavior
class GeminiAdapter implements AISearchAdapter {
  platform = 'google_ai_overview' as const;

  async query(params: QueryParams): Promise<QueryResult> {
    // Vertex AI generateContent
    // model: "gemini-2.0-flash"
    // tools: [{ google_search_retrieval: { dynamic_retrieval_config: { mode: "MODE_DYNAMIC" } } }]
    // Extracts grounding metadata from response for source attribution
  }

  // Rate limit: 60 RPM (free), 1000 RPM (paid)
  // Special: Parse groundingMetadata for search suggestions and web sources
}
```

#### ChatGPT Web Search Adapter

```typescript
// Represents the ChatGPT user experience
class ChatGPTAdapter implements AISearchAdapter {
  platform = 'chatgpt' as const;

  async query(params: QueryParams): Promise<QueryResult> {
    // POST /v1/chat/completions
    // model: "gpt-4o-search-preview"
    // web_search_options: { search_context_size: "medium" }
    // Parse annotations for URL citations
  }

  // Rate limit: 500 RPM (Tier 5)
  // Cost: $2.50/1M input + $10/1M output + $30/1K search calls
}
```

#### Claude Web Search Adapter

```typescript
// Represents the Claude user experience
class ClaudeAdapter implements AISearchAdapter {
  platform = 'claude' as const;

  async query(params: QueryParams): Promise<QueryResult> {
    // POST /v1/messages
    // model: "claude-sonnet-4-5-20250929"
    // tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 3 }]
    // Parse tool_use results for search evidence
  }

  // Rate limit: 1000 RPM (Tier 3)
  // Cost: $3/1M input + $15/1M output + ~$10/1K searches
}
```

#### SerpApi Adapter (AI Overviews)

```typescript
// Extracts Google AI Overview snippets from SERP results
class SerpApiAdapter implements AISearchAdapter {
  platform = 'google_ai_overview' as const; // Supplements Gemini

  async query(params: QueryParams): Promise<QueryResult> {
    // GET /search?engine=google&q={prompt}&gl=us&hl=en
    // Parse ai_overview field from response JSON
    // Extract organic results for citation analysis
  }

  // Rate limit: 1 req/sec
  // Cost: $50/mo (5K searches), $100/mo (15K)
}
```

#### Bing Copilot Adapter

```typescript
// Bing Web Search as proxy for Copilot behavior
class BingAdapter implements AISearchAdapter {
  platform = 'bing_copilot' as const;

  async query(params: QueryParams): Promise<QueryResult> {
    // GET /v7.0/search?q={prompt}&mkt=en-US
    // Focus on featured snippets, entity cards, and web results
    // Bing Copilot uses these as grounding sources
  }

  // Rate limit: 250 calls/sec (S1)
  // Cost: $3/1K transactions
}
```

### 4.6 Rate Limiting Strategy

```typescript
interface RateLimiter {
  /** Sliding window rate limiter per platform */
  canProceed(platform: AISearchPlatform): Promise<boolean>;

  /** Record a request */
  record(platform: AISearchPlatform): Promise<void>;

  /** Get time until next available slot */
  getWaitTime(platform: AISearchPlatform): Promise<number>;
}

// Configuration per platform
const RATE_LIMITS: Record<AISearchPlatform, { rpm: number; dailyMax: number }> = {
  perplexity:        { rpm: 40,  dailyMax: 2000 },  // 80% of 50 RPM limit
  google_ai_overview:{ rpm: 48,  dailyMax: 5000 },  // 80% of 60 RPM limit
  chatgpt:           { rpm: 100, dailyMax: 3000 },  // 20% of 500 RPM limit (cost control)
  claude:            { rpm: 100, dailyMax: 3000 },  // 10% of 1000 RPM limit (cost control)
  bing_copilot:      { rpm: 60,  dailyMax: 5000 },  // conservative
  gemini:            { rpm: 48,  dailyMax: 5000 },   // alias for google_ai_overview
};
```

### 4.7 Retry & Backoff Strategy

Following the SMS queue pattern (queue-processor.ts:66-76) but with exponential backoff:

```
Attempt 1: Immediate
Attempt 2: 1 minute delay
Attempt 3: 5 minutes delay
Attempt 4: 30 minutes delay
Attempt 5: 2 hours delay (final)

After 5 failures:
  - Mark as 'failed' with error details
  - Skip this platform for this monitoring cycle
  - Alert if failure rate > 20% for any platform
```

Error classification:
- **Retryable**: 429 (rate limit), 500/502/503 (server error), timeout, network error
- **Non-retryable**: 400 (bad request), 401/403 (auth), 404, malformed response
- **Budget exceeded**: Skip remaining queries, log, alert

---

## 5. Database Schema

### 5.1 New Tables

#### `monitoring_queue`

Job queue for AI search monitoring requests. Follows SMS queue pattern.

```sql
CREATE TABLE IF NOT EXISTS monitoring_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('loan_officer', 'branch', 'organization')),
  entity_id UUID NOT NULL,

  -- Job specification
  platform TEXT NOT NULL CHECK (platform IN ('perplexity', 'chatgpt', 'google_ai_overview', 'bing_copilot', 'claude', 'gemini')),
  prompt_id TEXT NOT NULL,          -- References monitoring_prompts.id
  prompt_text TEXT NOT NULL,         -- Rendered prompt (with entity substitutions)

  -- Queue management (mirrors sms_messages pattern)
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  scheduled_for TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  claimed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Retry management
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 4,
  next_retry_at TIMESTAMPTZ,
  last_error TEXT,
  error_code TEXT,

  -- Result reference
  result_id UUID,                    -- References monitoring_results.id after completion

  -- Cost tracking
  estimated_cost DECIMAL(10,6),
  actual_cost DECIMAL(10,6),

  -- Metadata
  priority INTEGER NOT NULL DEFAULT 5, -- 1=highest, 10=lowest
  batch_id UUID,                     -- Group related jobs

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for queue processing
CREATE INDEX idx_monitoring_queue_pending ON monitoring_queue(status, scheduled_for)
  WHERE status = 'pending';
CREATE INDEX idx_monitoring_queue_processing ON monitoring_queue(status, claimed_at)
  WHERE status = 'processing';
CREATE INDEX idx_monitoring_queue_org ON monitoring_queue(organization_id);
CREATE INDEX idx_monitoring_queue_entity ON monitoring_queue(entity_type, entity_id);
CREATE INDEX idx_monitoring_queue_batch ON monitoring_queue(batch_id) WHERE batch_id IS NOT NULL;
```

#### `monitoring_results`

Raw responses from AI search platforms. Immutable audit trail.

```sql
CREATE TABLE IF NOT EXISTS monitoring_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('loan_officer', 'branch', 'organization')),
  entity_id UUID NOT NULL,

  -- Query details
  platform TEXT NOT NULL CHECK (platform IN ('perplexity', 'chatgpt', 'google_ai_overview', 'bing_copilot', 'claude', 'gemini')),
  prompt_id TEXT NOT NULL,
  prompt_text TEXT NOT NULL,

  -- Response
  response_text TEXT NOT NULL,
  response_sources JSONB DEFAULT '[]'::JSONB,  -- [{url, title, snippet}]
  response_model TEXT,
  response_tokens JSONB DEFAULT '{}'::JSONB,   -- {input: N, output: N}
  response_latency_ms INTEGER,
  raw_response JSONB,                           -- Full API response (evidence)

  -- Mention detection results
  mention_detected BOOLEAN NOT NULL DEFAULT FALSE,
  mention_confidence DECIMAL(3,2),              -- 0.00-1.00
  mention_type TEXT CHECK (mention_type IN ('direct', 'indirect', 'comparison')),
  mention_sentiment TEXT CHECK (mention_sentiment IN ('positive', 'neutral', 'negative')),
  matched_text TEXT,                             -- The text that triggered the match
  context_window TEXT,                           -- Surrounding text for verification
  match_method TEXT CHECK (match_method IN ('exact', 'fuzzy', 'semantic')),

  -- Verification
  is_verified BOOLEAN DEFAULT FALSE,
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMPTZ,
  verification_override BOOLEAN DEFAULT FALSE,  -- Admin manually changed detection

  -- Cost
  actual_cost DECIMAL(10,6),

  -- Timestamps
  queried_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_monitoring_results_org ON monitoring_results(organization_id);
CREATE INDEX idx_monitoring_results_entity ON monitoring_results(entity_type, entity_id);
CREATE INDEX idx_monitoring_results_platform ON monitoring_results(platform);
CREATE INDEX idx_monitoring_results_mention ON monitoring_results(mention_detected, mention_confidence)
  WHERE mention_detected = TRUE;
CREATE INDEX idx_monitoring_results_queried ON monitoring_results(queried_at DESC);
```

#### `monitoring_prompts`

Versioned prompt library for AI search queries.

```sql
CREATE TABLE IF NOT EXISTS monitoring_prompts (
  id TEXT PRIMARY KEY,                            -- e.g., "P01", "P02"

  -- Prompt definition
  category TEXT NOT NULL CHECK (category IN ('direct_entity', 'service_category', 'problem_solving', 'comparison', 'reputation')),
  template TEXT NOT NULL,                          -- With {entity_name}, {city}, etc. placeholders
  expected_mention_type TEXT NOT NULL CHECK (expected_mention_type IN ('direct', 'indirect', 'comparison')),

  -- Targeting
  entity_types TEXT[] NOT NULL DEFAULT ARRAY['loan_officer', 'branch', 'organization'],
  applicable_platforms TEXT[] NOT NULL DEFAULT ARRAY['perplexity', 'chatgpt', 'google_ai_overview', 'bing_copilot', 'claude', 'gemini'],

  -- Scheduling
  frequency TEXT NOT NULL DEFAULT 'weekly' CHECK (frequency IN ('daily', 'weekly', 'biweekly', 'monthly')),
  priority INTEGER NOT NULL DEFAULT 5,            -- 1=high frequency, 10=low

  -- Versioning
  version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,

  -- Effectiveness tracking
  total_runs INTEGER DEFAULT 0,
  mention_rate DECIMAL(5,4) DEFAULT 0.0,          -- % of runs that detected a mention
  last_run_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_monitoring_prompts_active ON monitoring_prompts(is_active, category)
  WHERE is_active = TRUE;
CREATE INDEX idx_monitoring_prompts_frequency ON monitoring_prompts(frequency, priority);
```

#### `api_costs`

Granular cost tracking for budget management and billing.

```sql
CREATE TABLE IF NOT EXISTS api_costs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- What was called
  platform TEXT NOT NULL CHECK (platform IN ('perplexity', 'chatgpt', 'google_ai_overview', 'bing_copilot', 'claude', 'gemini', 'serpapi', 'openai_embeddings')),
  api_endpoint TEXT NOT NULL,
  model TEXT,

  -- Cost breakdown
  tokens_input INTEGER DEFAULT 0,
  tokens_output INTEGER DEFAULT 0,
  search_calls INTEGER DEFAULT 0,
  cost_input DECIMAL(10,6) DEFAULT 0,
  cost_output DECIMAL(10,6) DEFAULT 0,
  cost_search DECIMAL(10,6) DEFAULT 0,
  cost_total DECIMAL(10,6) NOT NULL,

  -- Reference
  monitoring_result_id UUID REFERENCES monitoring_results(id),
  queue_job_id UUID REFERENCES monitoring_queue(id),

  -- Budget tracking
  daily_budget_remaining DECIMAL(10,4),
  monthly_budget_remaining DECIMAL(10,4),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for cost reporting
CREATE INDEX idx_api_costs_org ON api_costs(organization_id);
CREATE INDEX idx_api_costs_platform ON api_costs(platform, created_at DESC);
CREATE INDEX idx_api_costs_daily ON api_costs(organization_id, created_at::DATE);
CREATE INDEX idx_api_costs_monthly ON api_costs(organization_id, DATE_TRUNC('month', created_at));
```

#### `monitoring_schedules`

Per-entity monitoring configuration. Controls frequency and platform selection.

```sql
CREATE TABLE IF NOT EXISTS monitoring_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('loan_officer', 'branch', 'organization')),
  entity_id UUID NOT NULL,

  -- Schedule configuration
  tier TEXT NOT NULL DEFAULT 'standard' CHECK (tier IN ('basic', 'standard', 'premium')),
  is_enabled BOOLEAN DEFAULT TRUE,

  -- Platform selection (which platforms to monitor)
  enabled_platforms TEXT[] NOT NULL DEFAULT ARRAY['perplexity', 'google_ai_overview'],

  -- Frequency overrides
  frequency_override TEXT CHECK (frequency_override IN ('daily', 'weekly', 'biweekly', 'monthly')),

  -- Budget controls
  monthly_budget_cap DECIMAL(10,2),               -- Max spend per month for this entity
  daily_query_limit INTEGER DEFAULT 20,            -- Max queries per day

  -- Tracking
  last_monitoring_at TIMESTAMPTZ,
  next_monitoring_at TIMESTAMPTZ,
  total_queries_this_month INTEGER DEFAULT 0,
  total_cost_this_month DECIMAL(10,4) DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_monitoring_schedule UNIQUE (entity_type, entity_id)
);

CREATE INDEX idx_monitoring_schedules_org ON monitoring_schedules(organization_id);
CREATE INDEX idx_monitoring_schedules_next ON monitoring_schedules(next_monitoring_at)
  WHERE is_enabled = TRUE;
CREATE INDEX idx_monitoring_schedules_entity ON monitoring_schedules(entity_type, entity_id);
```

### 5.2 Modifications to Existing Tables

#### `geo_ai_mentions` — Add columns

```sql
-- Link to monitoring result that detected this mention
ALTER TABLE geo_ai_mentions ADD COLUMN IF NOT EXISTS monitoring_result_id UUID REFERENCES monitoring_results(id);

-- Detection confidence score
ALTER TABLE geo_ai_mentions ADD COLUMN IF NOT EXISTS confidence DECIMAL(3,2);

-- Match details
ALTER TABLE geo_ai_mentions ADD COLUMN IF NOT EXISTS matched_text TEXT;
ALTER TABLE geo_ai_mentions ADD COLUMN IF NOT EXISTS match_method TEXT CHECK (match_method IN ('exact', 'fuzzy', 'semantic'));

-- Evidence
ALTER TABLE geo_ai_mentions ADD COLUMN IF NOT EXISTS evidence_snapshot JSONB;  -- {response_text, sources, timestamp}
```

#### `geo_visibility_scores` — Add columns

```sql
-- Track data source (readiness vs. real monitoring)
ALTER TABLE geo_visibility_scores ADD COLUMN IF NOT EXISTS data_source TEXT DEFAULT 'readiness'
  CHECK (data_source IN ('readiness', 'monitored', 'hybrid'));

-- Monitoring metadata
ALTER TABLE geo_visibility_scores ADD COLUMN IF NOT EXISTS last_monitored_at TIMESTAMPTZ;
ALTER TABLE geo_visibility_scores ADD COLUMN IF NOT EXISTS monitoring_query_count INTEGER DEFAULT 0;
ALTER TABLE geo_visibility_scores ADD COLUMN IF NOT EXISTS monitoring_mention_count INTEGER DEFAULT 0;
```

#### `geo_performance_history` — Add columns

```sql
-- Link to monitoring data
ALTER TABLE geo_performance_history ADD COLUMN IF NOT EXISTS data_source TEXT DEFAULT 'readiness'
  CHECK (data_source IN ('readiness', 'monitored', 'hybrid'));

-- Detailed platform metrics from monitoring
ALTER TABLE geo_performance_history ADD COLUMN IF NOT EXISTS monitoring_queries_run INTEGER DEFAULT 0;
ALTER TABLE geo_performance_history ADD COLUMN IF NOT EXISTS monitoring_cost DECIMAL(10,4) DEFAULT 0;
ALTER TABLE geo_performance_history ADD COLUMN IF NOT EXISTS mention_breakdown JSONB DEFAULT '{}'::JSONB;
  -- {direct: N, indirect: N, comparison: N, positive: N, neutral: N, negative: N}
```

### 5.3 RLS Policies for New Tables

All new tables follow the existing organization-based RLS pattern from `20240101000015_geo_platform.sql`:

```sql
-- Enable RLS
ALTER TABLE monitoring_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring_schedules ENABLE ROW LEVEL SECURITY;

-- Organization-scoped access (same pattern as geo_visibility_scores)
CREATE POLICY "Users can view own org monitoring queue" ON monitoring_queue
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Users can view own org monitoring results" ON monitoring_results
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
  );

-- Prompts are system-level, readable by all authenticated users
CREATE POLICY "Authenticated users can view prompts" ON monitoring_prompts
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view own org API costs" ON api_costs
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Users can view own org monitoring schedules" ON monitoring_schedules
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
  );

-- Admin/manager write access for schedules
CREATE POLICY "Admins can manage monitoring schedules" ON monitoring_schedules
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM users
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- Service role full access for queue processing (cron jobs use admin client)
-- Admin client bypasses RLS, so no explicit service role policies needed
```

---

## 6. Implementation Stories

### Phase 1: Foundation (S166-S170)

---

#### S166 — API Adapter Interface & Perplexity Adapter

**Epic:** E21
**Priority:** P0
**Estimate:** L
**Dependencies:** None

**Description:**
Create the adapter interface for AI search platform integrations and implement the first adapter (Perplexity Sonar). This establishes the pattern all subsequent adapters will follow. Includes rate limiting infrastructure, cost estimation, and health checking.

**Acceptance Criteria:**
1. `AISearchAdapter` TypeScript interface defined in `src/lib/geo/monitoring/types.ts` with `query()`, `checkRateLimit()`, `estimateCost()`, `healthCheck()` methods
2. `PerplexityAdapter` implements the interface, calls Perplexity Sonar API (`POST /chat/completions`) with `return_citations: true`
3. Sliding-window rate limiter implemented (stores request timestamps in memory + Redis/Supabase fallback) with configurable RPM per platform
4. Cost estimation returns accurate per-query cost based on model selection (sonar vs sonar-pro)
5. Health check validates API key and returns latency measurement
6. Unit tests for adapter with mocked API responses (>90% coverage)
7. Environment variable `PERPLEXITY_API_KEY` documented in `.env.example`
8. Error responses (429, 500, timeout) handled with typed error classes

**Gates:**
- `npm run build` passes
- `npm run lint` passes
- Unit tests pass with >90% coverage on adapter code

---

#### S167 — Monitoring Queue Table & Processor

**Epic:** E21
**Priority:** P0
**Estimate:** L
**Dependencies:** S166

**Description:**
Create the `monitoring_queue` table and queue processor following the SMS queue pattern (`src/lib/sms/automation/queue-processor.ts`). Implements atomic job claiming, exponential backoff retry, and batch processing via Vercel Cron.

**Acceptance Criteria:**
1. Supabase migration creates `monitoring_queue` table with all columns, indexes, and RLS policies per schema spec
2. Queue processor at `src/lib/geo/monitoring/queue-processor.ts` implements: atomic claim (`UPDATE WHERE status='pending'`), batch fetch with configurable size, sequential processing per job
3. Exponential backoff: 1min → 5min → 30min → 2hr → fail (max 4 retries)
4. Cron route at `src/app/api/cron/process-monitoring-queue/route.ts` with `CRON_SECRET` auth
5. Job scheduling function that creates queue entries for all enabled entities based on their `monitoring_schedules`
6. Queue processor returns `QueueProcessorResult` with processed/completed/failed/retried counts
7. Error classification: retryable (429, 5xx, timeout) vs non-retryable (400, 401, 404)
8. Integration test with real DB (Supabase local) covering claim race condition, retry escalation, and batch completion

**Gates:**
- `npm run build` passes
- `npm run lint` passes
- Migration applies cleanly
- Integration tests pass

---

#### S168 — Monitoring Results & Evidence Storage

**Epic:** E21
**Priority:** P0
**Estimate:** M
**Dependencies:** S166

**Description:**
Create the `monitoring_results` table for storing raw AI search responses as an immutable audit trail. Includes evidence capture (full response text, sources, model info, token counts) for later verification.

**Acceptance Criteria:**
1. Supabase migration creates `monitoring_results` table with all columns, indexes, and RLS policies
2. `storeMonitoringResult()` server action accepts a `QueryResult` + mention detection output and persists to DB
3. Evidence snapshot includes: full response text, parsed sources array, model identifier, token counts, query latency
4. Results are immutable — no UPDATE policy for regular users
5. Retention policy documented: results older than 12 months can be archived (not implemented yet, just documented)
6. `getMonitoringResults()` server action with pagination, filtering by platform/date/mention status

**Gates:**
- `npm run build` passes
- `npm run lint` passes
- Migration applies cleanly

---

#### S169 — Mention Detection Pipeline

**Epic:** E21
**Priority:** P0
**Estimate:** XL
**Dependencies:** S168

**Description:**
Implement the NLP-based mention detection algorithm that analyzes AI search responses to determine if a specific entity is mentioned. Three-stage detection: exact match, fuzzy match, semantic match. Includes confidence scoring and sentiment classification.

**Acceptance Criteria:**
1. `detectMention()` function at `src/lib/geo/monitoring/mention-detection.ts` implements all 6 steps from Section 4.1 algorithm spec
2. Exact match handles: entity name, known aliases, organization name, NMLS number — confidence 0.95+
3. Fuzzy match handles: name variations, abbreviations, missing suffixes (LLC, Inc) — confidence 0.70-0.90, using Levenshtein distance < 3
4. Semantic match via OpenAI text-embedding-3-small: generates embeddings for entity description + response sentences, cosine similarity > 0.85 threshold — confidence 0.50-0.70
5. Sentiment classification (positive/neutral/negative) using GPT-4o-mini structured output with 3-class prompt
6. Confidence thresholds applied: >=0.80 auto-verified, 0.60-0.79 flagged, <0.60 stored but hidden
7. Unit tests with 30+ test cases covering: exact matches, near-misses, false positives, multi-entity responses, no-mention responses
8. Benchmark: <500ms average per response (excluding embedding API call)

**Gates:**
- `npm run build` passes
- `npm run lint` passes
- Unit tests pass with >95% coverage on detection code
- Benchmark meets <500ms target

---

#### S170 — Prompt Library & Seed Data

**Epic:** E21
**Priority:** P1
**Estimate:** M
**Dependencies:** S167

**Description:**
Create the `monitoring_prompts` table and seed it with the 50 mortgage-specific prompts from Section 4.4. Includes prompt rendering (variable substitution) and effectiveness tracking.

**Acceptance Criteria:**
1. Supabase migration creates `monitoring_prompts` table per schema spec
2. Seed migration inserts all 50 prompts (P01-P50) with correct categories, expected mention types, entity types, and frequency settings
3. `renderPrompt()` function substitutes variables: `{entity_name}`, `{company}`, `{city}`, `{state}`, `{loan_type}`, `{specialty}` from entity data
4. `selectPromptsForEntity()` selects appropriate prompts based on entity type, schedule tier, and prompt frequency/priority
5. Prompt effectiveness tracking: `total_runs` and `mention_rate` updated after each monitoring cycle
6. Admin UI not required (prompts managed via DB/migration only)

**Gates:**
- `npm run build` passes
- `npm run lint` passes
- All 50 prompts render correctly with test entity data

---

### Phase 2: Core Monitoring (S171-S175)

---

#### S171 — Remaining Platform Adapters (Gemini, ChatGPT, Claude, Bing)

**Epic:** E21
**Priority:** P1
**Estimate:** XL
**Dependencies:** S166

**Description:**
Implement the remaining 4 platform adapters following the interface established in S166. Each adapter handles platform-specific API details, response parsing, and source extraction.

**Acceptance Criteria:**
1. `GeminiAdapter` calls Vertex AI `generateContent` with `google_search_retrieval` grounding tool, parses `groundingMetadata` for sources
2. `ChatGPTAdapter` calls OpenAI `chat/completions` with `gpt-4o-search-preview` model and `web_search_options`, parses annotations for URL citations
3. `ClaudeAdapter` calls Anthropic messages API with `web_search` tool, parses `tool_use` results for search evidence
4. `BingAdapter` calls Bing Web Search API v7, focuses on featured snippets and entity cards as Copilot grounding sources
5. Each adapter has unit tests with mocked responses (>90% coverage)
6. All adapters handle rate limits (429), server errors (5xx), and timeouts with appropriate retry signals
7. Environment variables documented: `GOOGLE_AI_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `BING_SEARCH_API_KEY`
8. Platform health check dashboard data available via `getAdapterHealth()` aggregate function

**Gates:**
- `npm run build` passes
- `npm run lint` passes
- All adapter unit tests pass

---

#### S172 — SerpApi Adapter for Google AI Overviews

**Epic:** E21
**Priority:** P1
**Estimate:** M
**Dependencies:** S166

**Description:**
Implement SerpApi adapter specifically for extracting Google AI Overview content from search results. This supplements the Gemini adapter by capturing what Google actually shows users in the SERP AI Overview box.

**Acceptance Criteria:**
1. `SerpApiAdapter` implements `AISearchAdapter` interface
2. Calls SerpApi Google search endpoint with `gl=us&hl=en`
3. Parses `ai_overview` field from response when present
4. Falls back to `featured_snippets` and `knowledge_graph` when no AI Overview
5. Extracts organic results for citation context analysis
6. Rate limited to 1 req/sec per SerpApi TOS
7. Unit tests with mocked SERP response fixtures (with and without AI Overview)
8. Environment variable: `SERPAPI_API_KEY`

**Gates:**
- `npm run build` passes
- `npm run lint` passes
- Unit tests pass

---

#### S173 — Cost Tracking & Budget Controls

**Epic:** E21
**Priority:** P1
**Estimate:** L
**Dependencies:** S167, S168

**Description:**
Create the `api_costs` table and budget management system. Every API call logs its cost. Organizations have daily and monthly budget caps. Queue processor checks budget before executing queries.

**Acceptance Criteria:**
1. Supabase migration creates `api_costs` table per schema spec
2. `logApiCost()` function called after every API request, records token counts, cost breakdown (input/output/search), and links to monitoring_result
3. `checkBudget()` function returns remaining daily and monthly budget for an organization
4. Queue processor calls `checkBudget()` before each query — skips if exceeded, logs warning
5. `getCostReport()` server action returns: daily/weekly/monthly cost breakdown by platform, per-entity costs, trend data
6. Budget alert system: email notification (via existing Resend integration) when 80% and 100% of monthly budget consumed
7. Admin can set `monthly_budget_cap` per entity via `monitoring_schedules`
8. Cost estimation is within 20% of actual cost for each platform

**Gates:**
- `npm run build` passes
- `npm run lint` passes
- Integration tests verify budget enforcement

---

#### S174 — Monitoring Schedules & Entity Configuration

**Epic:** E21
**Priority:** P1
**Estimate:** M
**Dependencies:** S167, S170

**Description:**
Create the `monitoring_schedules` table and scheduling logic. Each entity gets a monitoring schedule based on tier (basic/standard/premium). The scheduler creates queue entries based on prompt frequency and entity configuration.

**Acceptance Criteria:**
1. Supabase migration creates `monitoring_schedules` table per schema spec
2. `createSchedule()` and `updateSchedule()` server actions for admin/manager roles
3. Tier configuration determines:
   - Basic: 2 platforms, weekly, 10 prompts/cycle
   - Standard: 4 platforms, weekly, 25 prompts/cycle
   - Premium: 6 platforms, twice-weekly, all 50 prompts/cycle
4. `scheduleMonitoringCycle()` function creates queue entries for all enabled entities based on their schedule, prompt selection, and platform configuration
5. Daily cron job calls `scheduleMonitoringCycle()` to populate queue for the day
6. `getMonitoringSchedule()` server action returns current schedule for an entity
7. Rate limiting per entity: max N queries per day based on tier
8. Default schedule auto-created when monitoring is first enabled for an entity

**Gates:**
- `npm run build` passes
- `npm run lint` passes
- Schedule produces correct queue entries for each tier

---

#### S175 — Score Calculation Replacement (Remove Math.random)

**Epic:** E21
**Priority:** P0
**Estimate:** L
**Dependencies:** S169, S174

**Description:**
Replace all `Math.random()` and hardcoded data in `src/lib/geo/actions.ts` with real data from monitoring results. This is the critical integration point where fabricated data becomes real.

**Acceptance Criteria:**
1. `calculateVisibilityScore()` (actions.ts:51-155): Platform scores derived from actual monitoring results when available, falls back to readiness estimate (no more `Math.random()`)
2. `getAISearchPerformance()` (actions.ts:769-829): Returns real mention counts, citation counts, and platform breakdown from `monitoring_results` aggregation
3. `getGEODashboardSummary()` (actions.ts:834-954): `recentMentions` populated from `geo_ai_mentions` (not hardcoded), `summary` metrics from real aggregations
4. `compareWithCompetitor()` (actions.ts:1196-1315): Competitor scores from parallel monitoring of competitor entities (not `Math.random()`)
5. `recordPerformanceSnapshot()` (actions.ts:1511-1571): Counts from actual `monitoring_results`, not fabricated
6. `data_source` column updated correctly: 'readiness' when no monitoring data, 'monitored' when real data, 'hybrid' when partial
7. Backwards compatible: dashboard still works for entities without monitoring enabled (shows readiness scores with clear "estimated" label)
8. All existing unit tests still pass; new tests for real-data code paths

**Gates:**
- `npm run build` passes
- `npm run lint` passes
- Dashboard renders correctly with both readiness-only and monitored entities
- No instances of `Math.random()` remain in actions.ts

---

### Phase 3: Dashboard Integration (S176-S180)

---

#### S176 — Monitoring Status UI in GEO Dashboard

**Epic:** E21
**Priority:** P1
**Estimate:** M
**Dependencies:** S174, S175

**Description:**
Add monitoring status indicators to the existing GEO dashboard. Users should see whether their data is estimated (readiness) or real (monitored), when the last monitoring cycle ran, and the next scheduled run.

**Acceptance Criteria:**
1. `data_source` badge on visibility score card: "Estimated" (amber) vs "Monitored" (green) vs "Hybrid" (blue)
2. Last monitoring timestamp displayed with relative time ("2 hours ago", "Yesterday")
3. Next scheduled monitoring displayed ("Next check: Tomorrow at 2 AM")
4. Platform breakdown cards show which platforms are actively monitored vs estimated
5. "Enable Monitoring" CTA for entities without monitoring schedules
6. Loading states during monitoring data fetch
7. Responsive design matches existing geo dashboard components
8. No layout shift — gracefully degrades when monitoring data is absent

**Gates:**
- `npm run build` passes
- `npm run lint` passes
- Visual verification via browser

---

#### S177 — Real Mentions Feed & Evidence Viewer

**Epic:** E21
**Priority:** P1
**Estimate:** L
**Dependencies:** S175

**Description:**
Replace the hardcoded mentions in `recent-mentions.tsx` with a real-time feed from `geo_ai_mentions`. Includes an evidence viewer that shows the full AI response with the mention highlighted.

**Acceptance Criteria:**
1. Mentions feed pulls from `geo_ai_mentions` table with pagination (10 per page)
2. Each mention card shows: platform icon, query text, sentiment badge, confidence score, timestamp, mention type
3. Click on mention opens evidence drawer/modal showing: full AI response text with matched text highlighted, source URLs, detection confidence breakdown
4. Filter by: platform, sentiment, mention type, date range, confidence threshold
5. Sort by: date (default), confidence, platform
6. Empty state for entities with no detected mentions yet
7. Confidence indicator: green checkmark (>=0.80), amber warning (0.60-0.79), hidden (<0.60 unless admin)
8. "Verify" and "Dismiss" actions for admin/manager to manually review flagged mentions

**Gates:**
- `npm run build` passes
- `npm run lint` passes
- Visual verification via browser
- Pagination works correctly

---

#### S178 — Real Competitor Comparison

**Epic:** E21
**Priority:** P2
**Estimate:** L
**Dependencies:** S175, S171

**Description:**
Replace simulated competitor comparisons with real side-by-side monitoring. Same prompts are run for the entity and its competitors, producing genuine comparison data.

**Acceptance Criteria:**
1. Competitor setup: admin adds competitor by name + domain (already exists in `geo_competitors` table)
2. When monitoring runs, competitor entities get the same prompts run through the same platforms
3. Comparison view shows real vs-competitor mention rates per platform
4. Gap analysis derived from actual data: which platforms mention competitor but not the entity
5. Opportunity areas extracted from prompt categories where competitor appears but entity doesn't
6. Historical comparison trends stored in `geo_competitor_comparisons`
7. Cost for competitor monitoring shown separately (competitor queries count against org budget)
8. "Compare Now" manual trigger option for on-demand comparison

**Gates:**
- `npm run build` passes
- `npm run lint` passes
- Comparison data is clearly labeled as real vs estimated

---

#### S179 — Performance History with Real Data

**Epic:** E21
**Priority:** P1
**Estimate:** M
**Dependencies:** S175

**Description:**
Update the performance history aggregation to use real monitoring data. Daily/weekly/monthly snapshots now reflect actual mention counts, citation rates, and platform-level metrics.

**Acceptance Criteria:**
1. `recordPerformanceSnapshot()` aggregates from `monitoring_results` for the period: total queries, total mentions, mention rate, platform breakdown
2. Historical chart shows clear transition point from "estimated" to "monitored" data (visual indicator on timeline)
3. Trend calculations (score_change, mentions_change) based on comparing consecutive real periods
4. `mention_breakdown` JSONB column populated with: `{direct: N, indirect: N, comparison: N, positive: N, neutral: N, negative: N}`
5. Cost per period tracked via `monitoring_cost` column
6. Performance export (CSV) includes all raw metrics
7. Period aggregation cron runs daily at 3 AM

**Gates:**
- `npm run build` passes
- `npm run lint` passes
- Historical chart renders correctly with mixed readiness/monitored data

---

#### S180 — Monitoring Settings UI

**Epic:** E21
**Priority:** P1
**Estimate:** M
**Dependencies:** S174, S176

**Description:**
Admin/manager interface for configuring monitoring schedules. Tier selection, platform enablement, budget caps, and entity-level controls.

**Acceptance Criteria:**
1. Settings panel accessible from GEO dashboard (gear icon) for admin/manager roles only
2. Tier selection (Basic/Standard/Premium) with clear description of what each includes and estimated cost
3. Per-platform toggle to enable/disable specific AI search platforms
4. Monthly budget cap input with current spend indicator
5. Daily query limit configuration
6. Bulk enable/disable monitoring for all entities in org
7. API key status indicators: configured (green), missing (red), expired (amber)
8. Changes saved via `updateSchedule()` server action

**Gates:**
- `npm run build` passes
- `npm run lint` passes
- Settings persist correctly across page reloads

---

### Phase 4: Enhancement (S181-S183)

---

#### S181 — Evidence Sharing & Export

**Epic:** E21
**Priority:** P2
**Estimate:** M
**Dependencies:** S177

**Description:**
Allow users to share evidence of AI mentions with stakeholders. Export capabilities for reports and presentations.

**Acceptance Criteria:**
1. "Share" button on evidence viewer generates a shareable link (expiring, org-scoped)
2. Shareable link renders a public page with: AI response text, mention highlighted, platform/date metadata (no auth required)
3. PDF export of mention evidence (single mention or batch)
4. CSV export of all mentions for a date range
5. "Monthly AI Visibility Report" auto-generated PDF with: score trends, mention counts, top queries, platform breakdown
6. Shareable links expire after 30 days (configurable)

**Gates:**
- `npm run build` passes
- `npm run lint` passes

---

#### S182 — Alerting & Notifications

**Epic:** E21
**Priority:** P2
**Estimate:** M
**Dependencies:** S175

**Description:**
Proactive notifications when monitoring detects significant changes: new mentions, score changes, competitor movement, budget warnings.

**Acceptance Criteria:**
1. Email notification (via Resend) for: first AI mention detected, new high-confidence mention, score increase/decrease >10 points
2. Dashboard notification bell integration with existing notification system
3. Weekly digest email: summary of monitoring activity, mention counts, score changes
4. Budget alert emails at 80% and 100% monthly spend
5. Platform health alerts: email if any adapter fails >50% of queries in 24 hours
6. Notification preferences: per-user opt-in/out for each alert type
7. Rate-limited: max 1 mention notification per entity per 6 hours (prevent spam)

**Gates:**
- `npm run build` passes
- `npm run lint` passes
- Email templates render correctly

---

#### S183 — Analytics & ROI Dashboard

**Epic:** E21
**Priority:** P2
**Estimate:** L
**Dependencies:** S179, S173

**Description:**
Advanced analytics view showing monitoring ROI, cost efficiency, and optimization recommendations. Helps orgs understand the value of their AI visibility investment.

**Acceptance Criteria:**
1. Cost-per-mention metric: total monitoring spend / total mentions detected
2. Platform efficiency comparison: which platforms produce the most mentions per dollar
3. Prompt effectiveness ranking: which prompts detect mentions most frequently
4. ROI calculator: estimated lead value from AI visibility based on mention volume and industry conversion rates
5. Optimization recommendations: "Consider disabling [platform] — 0 mentions in 30 days, $X spent" or "Upgrade to Premium — you're missing mentions on [platforms]"
6. Time-series charts: cost trends, mention trends, efficiency trends over 90 days
7. Exportable as PDF for stakeholder presentations
8. Admin-only access

**Gates:**
- `npm run build` passes
- `npm run lint` passes

---

## 7. Cost Model

### 7.1 Per-Query Cost Estimates

| Platform | Cost/Query | Notes |
|----------|-----------|-------|
| Perplexity Sonar | $0.005 | sonar model, ~500 tokens out |
| Perplexity Sonar Pro | $0.010 | sonar-pro, for complex queries |
| Google Gemini (grounded) | $0.003 | gemini-2.0-flash + grounding fee |
| ChatGPT (web search) | $0.035 | $0.005 tokens + $0.030 search call |
| Claude (web search) | $0.015 | $0.005 tokens + $0.010 search |
| SerpApi | $0.010-0.020 | $50/5K or $100/15K searches |
| Bing Web Search | $0.003 | $3/1K transactions |
| OpenAI Embeddings (detection) | $0.0001 | Per response analyzed |
| GPT-4o-mini (sentiment) | $0.0005 | Per classification |

### 7.2 Per-Entity Monthly Cost by Tier

| Tier | Platforms | Prompts/Cycle | Cycles/Month | Queries/Month | Est. Cost/Entity/Month |
|------|-----------|---------------|--------------|---------------|----------------------|
| **Basic** | 2 (Perplexity + SerpApi) | 10 | 4 (weekly) | 80 | **$1.50-2.50** |
| **Standard** | 4 (+Gemini, ChatGPT) | 25 | 4 (weekly) | 400 | **$4.00-6.00** |
| **Premium** | 6 (all) | 50 | 8 (twice/week) | 2,400 | **$12.00-18.00** |

### 7.3 Organization-Level Cost Projections

| Org Size | Entities | Tier | Monthly Cost | Annual Cost |
|----------|----------|------|-------------|-------------|
| Small (1 branch, 5 LOs) | 7 | Basic | $10-18 | $120-216 |
| Medium (3 branches, 20 LOs) | 24 | Standard | $96-144 | $1,152-1,728 |
| Large (10 branches, 100 LOs) | 111 | Standard | $444-666 | $5,328-7,992 |
| Enterprise (50 branches, 500 LOs) | 551 | Mixed | $1,500-3,000 | $18,000-36,000 |

### 7.4 Infrastructure Costs

| Component | Monthly Cost | Notes |
|-----------|-------------|-------|
| Supabase DB storage | ~$0 incremental | Already provisioned, monitoring adds ~50MB/month per 100 entities |
| Vercel Cron | $0 | Included in Pro plan |
| API key management | $0 | Environment variables |
| **Total infra overhead** | **~$0** | Marginal cost on existing infrastructure |

### 7.5 Pricing Recommendation

| Plan Tier | Suggested Price/Entity/Month | Margin | Notes |
|-----------|------------------------------|--------|-------|
| Basic | $5 | 60-70% | Good entry point, limited platforms |
| Standard | $10 | 50-60% | Best value, recommended default |
| Premium | $25 | 30-45% | Full coverage, for competitive markets |

Include monitoring as part of a higher-tier RepWell subscription rather than a standalone add-on. This drives upgrade revenue while the marginal cost is manageable.

---

## 8. Risk Matrix

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|-----------|--------|------------|
| R1 | **AI response non-determinism** — Same prompt returns different results on different days | High | Medium | Run each prompt multiple times per cycle; aggregate over time rather than relying on single snapshots; clearly communicate that AI visibility is probabilistic |
| R2 | **API cost overrun** — Bug or misconfiguration leads to excessive API calls | Medium | High | Hard budget caps at org and platform level (S173); queue processor checks budget before every query; daily cost alerts; kill switch to disable all monitoring |
| R3 | **TOS/rate limit violations** — Automated querying violates AI platform terms of service | Medium | High | Conservative rate limits at 20-80% of published limits; randomized delays between queries; monitor for 429 responses and back off; legal review of each API's TOS before launch |
| R4 | **False positive mentions** — Detection algorithm reports mentions that aren't real | Medium | Medium | Multi-stage detection with confidence scoring; human verification for <0.80 confidence; weekly false positive audit; feedback loop to improve detection |
| R5 | **False negative mentions** — Algorithm misses real mentions | Medium | Medium | Semantic matching as fallback; periodic manual spot-checks; prompt library tuning based on missed mentions; user-reported missing mention flow |
| R6 | **API deprecation/changes** — Platform APIs change breaking adapters | Medium | Medium | Adapter abstraction layer isolates changes; health check endpoint detects issues early; adapter versioning; monitor API changelogs |
| R7 | **Data freshness perception** — Users expect real-time but monitoring is periodic | Low | Medium | Clear "last checked" timestamps; explain monitoring cadence; offer manual "Check Now" button (rate limited) |
| R8 | **Scale bottleneck** — Queue processing too slow for large orgs | Low | High | Batch processing with configurable concurrency; priority-based queue ordering; horizontal scaling via multiple cron workers if needed |
| R9 | **Privacy/compliance** — Storing AI response text may have implications | Low | Medium | Only store response text related to the querying org's entities; retention policy; data deletion on org offboarding |
| R10 | **Competitor gaming** — Competitors discover they're being monitored | Low | Low | Queries look like normal user searches; no identifying headers; distributed across time |

---

## 9. Testing Strategy

### 9.1 Unit Tests

| Component | Test Count | Coverage Target | Key Test Cases |
|-----------|-----------|-----------------|----------------|
| Mention Detection | 30+ | 95% | Exact match, fuzzy match (name variations), semantic match, multi-entity response, no mention, false positive cases, sentiment classification, confidence scoring |
| Platform Adapters | 10+ per adapter | 90% | Success response parsing, 429 handling, 500 handling, timeout, malformed response, rate limit check, cost estimation |
| Queue Processor | 15+ | 90% | Atomic claim, batch processing, retry escalation, budget exceeded, all-fail scenario, mixed success/fail batch |
| Prompt Library | 50+ | 100% | Every prompt renders correctly with test entity data, no unsubstituted variables |
| Cost Tracking | 10+ | 90% | Cost calculation accuracy, budget enforcement, daily/monthly rollup |

### 9.2 Integration Tests

| Scenario | Setup | Assertions |
|----------|-------|-----------|
| Full monitoring cycle | Create entity + schedule → run scheduler → process queue → verify results | Queue entries created, results stored, mentions detected, scores updated |
| Budget enforcement | Set $1 budget → queue 200 queries | Processing stops at budget limit, remaining jobs stay pending |
| Retry flow | Mock API to fail 3x then succeed | Job retried with correct backoff intervals, succeeds on attempt 4 |
| Multi-platform | Run same prompt through all 6 adapters | Each adapter returns valid result, results stored separately |
| Concurrent claims | 2 workers claim same batch | No duplicate processing (atomic claim prevents it) |
| Entity without monitoring | Load dashboard for unmonitored entity | Shows readiness scores with "Estimated" label, no errors |

### 9.3 E2E Tests (Playwright)

| Flow | Steps |
|------|-------|
| Enable monitoring | Navigate to GEO dashboard → Click "Enable Monitoring" → Select tier → Confirm → Verify schedule created |
| View real mentions | Navigate to GEO dashboard → Verify mentions feed loads → Click mention → Verify evidence modal |
| Configure monitoring | Navigate to settings → Change tier → Toggle platform → Set budget → Save → Verify changes persist |
| Export evidence | Navigate to mentions → Select mention → Click Share → Verify shareable link works |

### 9.4 Validation Against Real Platforms

Before launch, manually validate detection accuracy:

1. **Ground truth dataset**: Manually query each platform with 10 prompts for 5 test entities
2. **Record expected results**: Which entities were mentioned, in what context
3. **Run detection pipeline**: Compare automated detection against manual ground truth
4. **Calculate metrics**: Precision (of detected mentions, how many are real), Recall (of real mentions, how many were detected), F1 score
5. **Target**: Precision > 85%, Recall > 70%, F1 > 0.77

---

## 10. Proof & Evidence System

### 10.1 What Constitutes "Evidence"

For each detected mention, the system stores:

| Evidence Component | Storage Location | Purpose |
|-------------------|------------------|---------|
| Full AI response text | `monitoring_results.response_text` | Primary evidence that the mention exists |
| Source URLs cited | `monitoring_results.response_sources` | Verify what sources the AI used |
| Matched text excerpt | `monitoring_results.matched_text` | Exact text that triggered detection |
| Context window (200 chars) | `monitoring_results.context_window` | Surrounding context for verification |
| Platform + model | `monitoring_results.platform`, `.response_model` | Provenance |
| Query timestamp | `monitoring_results.queried_at` | When the evidence was captured |
| Raw API response | `monitoring_results.raw_response` | Full technical proof |
| Detection confidence | `monitoring_results.mention_confidence` | Algorithm's certainty |
| Match method | `monitoring_results.match_method` | How the mention was detected |

### 10.2 Verification Workflow

```
Mention Detected
     │
     ▼
confidence >= 0.80? ──Yes──► Auto-verified → Show in dashboard
     │
     No
     │
     ▼
confidence >= 0.60? ──Yes──► Flagged for review → Show with warning badge
     │                            │
     No                           ▼
     │                  Admin reviews evidence
     ▼                      │           │
Stored but hidden      Verify      Dismiss
     │                  (override)   (remove)
     ▼                      │           │
Only visible to           Shown in    Archived
admins via filter        dashboard
```

### 10.3 Shareable Evidence Format

When a user shares evidence externally:

```
┌─────────────────────────────────────────────┐
│  🔍 AI Visibility Evidence                   │
│                                              │
│  Entity: John Smith, ABC Mortgage            │
│  Platform: Perplexity                        │
│  Date: January 15, 2026                      │
│  Confidence: 0.94 (High)                     │
│                                              │
│  Query: "Best FHA loan officer in Denver"    │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │ AI Response (excerpt):                 │  │
│  │                                        │  │
│  │ "...For FHA loans in Denver, **John    │  │
│  │ Smith** at ABC Mortgage is highly      │  │
│  │ recommended by borrowers. With over    │  │
│  │ 15 years of experience and a 4.9-star  │  │
│  │ rating from 200+ reviews..."           │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  Sources cited by AI:                        │
│  • abcmortgage.com/team/john-smith           │
│  • zillow.com/lender-profile/john-smith      │
│  • bbb.org/abc-mortgage                      │
│                                              │
│  ─────────────────────────────────────────   │
│  Verified by RepWell AI Visibility Monitor   │
│  repwell.com                                 │
└──────────────────────────────────────────────┘
```

### 10.4 Evidence Retention Policy

| Data Type | Retention | Reason |
|-----------|-----------|--------|
| Raw API responses | 12 months | Storage cost management; older evidence less relevant |
| Detected mentions | Indefinite | Historical record; low storage cost |
| Monitoring results (summary) | Indefinite | Aggregation source |
| Performance history | Indefinite | Trend analysis |
| Shareable links | 30 days (default) | Security; link rot prevention |
| API cost records | 24 months | Billing audit trail |

---

## Appendix A: Story Dependency Graph

```
S166 (Adapter Interface + Perplexity)
  ├── S167 (Queue + Processor)
  │     ├── S170 (Prompt Library) ──── S174 (Schedules)
  │     └── S173 (Cost Tracking)        │
  ├── S168 (Results Storage)            │
  │     └── S169 (Mention Detection)    │
  │           └── S175 (Score Replacement) ◄─── S174
  ├── S171 (Remaining Adapters)         │
  └── S172 (SerpApi Adapter)            │
                                        │
S175 (Score Replacement)                │
  ├── S176 (Monitoring Status UI)  ◄─── S174
  ├── S177 (Mentions Feed + Evidence)
  │     └── S181 (Evidence Sharing)
  ├── S178 (Real Competitor Comparison)
  ├── S179 (Performance History)
  │     └── S183 (Analytics Dashboard) ◄── S173
  └── S182 (Alerting & Notifications)

S180 (Monitoring Settings UI) ◄── S174, S176
```

## Appendix B: Environment Variables Required

```bash
# AI Search Platform API Keys
PERPLEXITY_API_KEY=pplx-xxxx          # Required for Perplexity Sonar
OPENAI_API_KEY=sk-xxxx                 # Required for ChatGPT + embeddings + classification
ANTHROPIC_API_KEY=sk-ant-xxxx          # Required for Claude web search
GOOGLE_AI_API_KEY=xxxx                 # Required for Gemini grounding
BING_SEARCH_API_KEY=xxxx               # Required for Bing Web Search
SERPAPI_API_KEY=xxxx                    # Required for Google AI Overview extraction

# Monitoring Configuration
MONITORING_ENABLED=true                 # Global kill switch
MONITORING_DEFAULT_TIER=standard        # Default tier for new entities
MONITORING_DAILY_BUDGET_DEFAULT=10.00   # Default daily budget per org ($)
MONITORING_MONTHLY_BUDGET_DEFAULT=200   # Default monthly budget per org ($)
```

## Appendix C: Glossary

| Term | Definition |
|------|-----------|
| **GEO** | Generative Engine Optimization — optimizing content for AI search engines |
| **Readiness Score** | Tier 1 assessment of how well an entity is positioned for AI visibility (no API calls) |
| **Monitoring Score** | Tier 2 score based on actual AI search platform queries |
| **Mention** | An instance where an AI search engine references an entity in its response |
| **Citation** | When an AI response specifically links to or credits a source associated with the entity |
| **Evidence** | The stored proof that a mention occurred: response text, sources, metadata |
| **Confidence** | 0.0-1.0 score indicating how certain the detection algorithm is that a mention is genuine |
| **Adapter** | Platform-specific implementation of the `AISearchAdapter` interface |
| **Queue Job** | A single monitoring query waiting to be processed in `monitoring_queue` |
| **Monitoring Cycle** | One complete round of queries for all prompts on all enabled platforms for an entity |

## Appendix D: File Location Reference

| Component | Path |
|-----------|------|
| Existing actions (to modify) | `src/lib/geo/actions.ts` |
| Existing types | `src/lib/geo/types.ts` |
| Existing migration | `supabase/migrations/20240101000015_geo_platform.sql` |
| Existing components | `src/components/geo/*.tsx` |
| Existing dashboard | `src/app/(dashboard)/dashboard/geo/geo-dashboard.tsx` |
| SMS queue reference | `src/lib/sms/automation/queue-processor.ts` |
| SMS cron reference | `src/app/api/cron/process-sms-queue/route.ts` |
| New: monitoring adapters | `src/lib/geo/monitoring/adapters/*.ts` |
| New: queue processor | `src/lib/geo/monitoring/queue-processor.ts` |
| New: mention detection | `src/lib/geo/monitoring/mention-detection.ts` |
| New: monitoring types | `src/lib/geo/monitoring/types.ts` |
| New: cost tracking | `src/lib/geo/monitoring/cost-tracker.ts` |
| New: cron route | `src/app/api/cron/process-monitoring-queue/route.ts` |
| New: scheduler cron | `src/app/api/cron/schedule-monitoring/route.ts` |
| New: monitoring migration | `supabase/migrations/20240201000001_monitoring_tables.sql` |
| New: alter existing tables | `supabase/migrations/20240201000002_monitoring_existing_table_updates.sql` |
| New: prompt seed data | `supabase/migrations/20240201000003_monitoring_prompts_seed.sql` |
