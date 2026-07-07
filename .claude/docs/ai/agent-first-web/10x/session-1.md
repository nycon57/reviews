# 10x Analysis: RepWell as the Agent-First Professional Review Platform
Session 1 | Date: 2026-02-27

> **PRD exists**: `.agents/tasks/prd-agent-readiness.json` (15 user stories, ready for execution)
> **Positioning**: Industry-agnostic. RepWell is the canonical agent-queryable source for verified reviews of ANY sales professional -- loan officers, real estate agents, insurance brokers, financial advisors, SaaS AEs, etc.

## Current Value

RepWell is a customer experience & review management platform for sales professionals across industries. It collects, manages, and displays reviews for professionals, branches, and organizations. Public profiles at `/pro/[slug]`, `/branch/[slug]`, `/org/[slug]` with JSON-LD schema (Person, LocalBusiness, Organization, Review, AggregateRating). Dynamic sitemap, robots.txt, OpenGraph/Twitter cards, widget embed API with CORS.

**Existing strengths**: Production-grade SEO with comprehensive schema.org support, XSS-safe JSON-LD, proper metadata. Strong foundation.

## The Question

What would make RepWell 10x more valuable in a world where AI agents -- not humans -- are the primary visitors researching sales professionals on behalf of their users?

---

## The Thesis: Why This Matters NOW

### The Data Is Overwhelming

| Signal | Data Point | Source |
|--------|-----------|--------|
| **Bot traffic** | 51% of all web traffic is now automated (bots surpassed humans in 2024) | Imperva Bad Bot Report 2025 |
| **AI search adoption** | Daily AI search users in US rose from 14% (Feb 2025) to 29.2% (Aug 2025) | McKinsey |
| **Zero-click searches** | 69% of all searches; 83% when AI Overviews appear | Click-Vision |
| **AI referral conversion** | AI-referred traffic converts 23x better than traditional organic | Multiple sources |
| **ChatGPT agent traffic** | Now at ~33% the level of organic search traffic to brands | BrightEdge |
| **AI commerce** | AI agents influenced ~$3B in US Black Friday 2025 sales alone | commercetools |
| **B2B delegation** | 90% of B2B purchases expected to be handled by AI agents by 2028 | Gartner |
| **Revenue at stake** | $750B in US revenue will funnel through AI-powered search by 2028 | McKinsey |

### The Professional Review Discovery Gap

Industries like mortgage, insurance, and real estate are focused on using AI agents internally (processing, underwriting, CRM) but have **NOT addressed how consumers' AI agents will discover and evaluate individual sales professionals**. This is RepWell's strategic opening. No one owns the "Yelp MCP server" for individual sales professionals across industries.

### The Rand Fishkin Visibility Insight

Fishkin ran [2,961 prompts across ChatGPT, Claude, and Google AI](https://searchengineland.com/ai-recommendations-inconsistent-fix-469250) asking for brand recommendations. Fewer than 1 in 100 runs produced the same ranked list. But **visibility percentage** -- how often a brand appears at all across many runs -- IS statistically meaningful. When the model is confident about an entity's relevance, it shows up consistently.

**Implication**: RepWell's goal isn't "ranking #1." It's being **consistently present** when agents research sales professionals. Maximize appearance rate through structured data density, cross-platform corroboration, and entity confidence.

### Agent Choice Homogeneity

The [arxiv paper on agentic e-commerce](https://arxiv.org/html/2508.02630v2) found AI agents exhibit **choice homogeneity** -- concentrating on a few "modal" options while ignoring others. They display human-like patterns (top-row preference, strong weight on ratings/reviews, position biases). RepWell's structured data needs to help agents *differentiate* between professionals -- rich, specific review content, not just star ratings.

### The Competitive Moat

- **G2** achieved 14.9% AI visibility score (ranked #1 overall in Oct 2025). Accounts for 33-75% of review-site citations depending on LLM. But G2 covers software, not people.
- **Yelp** launched an official open-source MCP server. Every query goes through their data. But Yelp covers restaurants/local businesses, not individual sales professionals.
- **Trustpilot** covers businesses, not individual professionals.
- **Birdeye** (direct competitor) deployed autonomous AI agents but focused on generation/response -- NOT on making their data agent-queryable. Brands itself "#1 Agentic Marketing Platform" but builds agents that help businesses *manage* reputation, not agents that *query* reputation.
- **Experience.com** stuck in human-browsing paradigm.
- **Nobody owns "agent-queryable reviews of individual sales professionals."**

---

## Massive Opportunities

### 1. RepWell MCP Server -- The Agent Gateway
**What**: An open-source MCP server that lets any AI agent query RepWell's professional review data. When a consumer's AI agent asks "find me a highly-rated loan officer near me with 5+ years experience," RepWell data is the answer source.

**Why 10x**: This makes RepWell the canonical data layer AI agents use for mortgage professional discovery. Like Yelp's MCP server but for financial services. Whoever the AI agents trust for data wins the market.

**Unlocks**: AI agents from ChatGPT, Claude, Gemini, Perplexity can all query RepWell natively. Every AI agent becomes a distribution channel. RepWell becomes infrastructure, not just a SaaS tool.

**Psychology angle**: The "Delegate Economy" paper (ScienceDirect, Nov 2025) proves the new brand loyalty is between the AI agent and a data source. Consistent accuracy and reliability earn trust. RepWell as the trusted data source means AI agents systematically favor RepWell-powered profiles.

**Effort**: High
**Risk**: Requires careful rate limiting, data access policies, and monetization model
**Score**: 🔥 **Must do** -- This is THE strategic bet

### 2. Agent-Optimized Profile Pages (Dual-Layer Architecture)
**What**: Redesign public profile pages with a two-layer content architecture:
- **Layer 1 (Machine)**: Dense structured data, normalized attributes, machine-readable endpoints. JSON-LD enriched beyond current implementation to include: specific loan types, languages spoken, response time metrics, close rates, years of experience, certifications (NMLS, state licenses), service area polygons, availability windows.
- **Layer 2 (Human)**: The narrative, emotional, trust-building experience that exists today.

**Why 10x**: AI agents evaluating professionals need structured, comparable data points. The professional with "4.9 stars, 247 verified reviews, 98.2% close rate, avg 23-day close, bilingual English/Spanish, NMLS #123456" beats "great loan officer with happy clients" every time in AI evaluation.

**Unlocks**: AI agents can make apples-to-apples comparisons across professionals. RepWell profiles become the richest data source for any AI doing mortgage professional research.

**Anchoring effect**: Research shows LLMs exhibit 37% anchoring bias -- the first structured data point encountered disproportionately frames subsequent evaluation. RepWell must establish the anchoring frame first.

**Effort**: Medium-High
**Score**: 🔥 **Must do**

### 3. llms.txt + Agent Discovery Protocol
**What**: Implement `/llms.txt` and `/llms-full.txt` files that describe RepWell's data model, available public profiles, query patterns, and how AI agents should interact with the platform. Additionally implement an agent-specific sitemap (`/agent-sitemap.json`) with structured metadata beyond what XML sitemaps provide.

**Why 10x**: 844,000+ sites have adopted llms.txt. While no major LLM officially consumes it yet, it's the emerging standard and costs nearly nothing to implement. More importantly: the `/llms-full.txt` companion document gives AI models comprehensive context about what RepWell is and what data it offers.

**Psychology**: This is the digital equivalent of a welcome mat. When an AI agent arrives, it immediately understands the site's purpose, data model, and how to extract value. Zero friction = higher trust signal.

**Effort**: Low
**Score**: 🔥 **Must do** -- trivial effort, asymmetric upside

### 4. WebMCP Tool Registration (THE NEWEST DEVELOPMENT -- Feb 2026)
**What**: [Google Chrome 146 shipped WebMCP in early preview](https://developer.chrome.com/blog/webmcp-epp) (February 2026). A [joint Google-Microsoft initiative under W3C standardization](https://venturebeat.com/infrastructure/google-chrome-ships-webmcp-in-early-preview-turning-every-website-into-a). WebMCP lets websites register callable tools via `navigator.modelContext` API. Instead of an agent screenshot-scraping a reviews page, RepWell declares structured, callable tools:
- `searchProfessionalReviews(name, industry, location)` → structured results
- `getProfessionalProfile(id)` → full profile with ratings
- `compareProfessionals(id1, id2)` → side-by-side comparison

**Why 10x**: Benchmarks show [67% reduction in computational overhead and ~98% task accuracy](https://www.marktechpost.com/2026/02/14/google-ai-introduces-the-webmcp-to-enable-direct-and-structured-website-interactions-for-new-ai-agents/) vs screenshot-based agent interaction. This is the "USB-C for AI agents" -- a universal interface. RepWell would be one of the first review platforms to implement it.

**Unlocks**: Every Chrome 146+ browser with an AI agent can natively query RepWell data through structured tool calls. No scraping, no API keys needed for basic queries, no HTML parsing. Zero-friction data access.

**Effort**: Medium (requires client-side script + API endpoints)
**Risk**: Standard is in early preview; API may change. But implementing now signals leadership.
**Score**: 🔥 **Must do** -- first-mover advantage on a W3C standard

### 5. Professional Digital Twin API
**What**: Each RepWell professional profile becomes a queryable "digital twin" -- an API endpoint that an AI agent can interrogate conversationally. Not just static data, but contextual answers: "What does this loan officer specialize in?" "How do their rates compare to local averages?" "What do reviewers say about their communication style?"

**Why 10x**: Josh Bersin (Oct 2025) predicted digital replicas of professionals within a year. This makes RepWell profiles active participants in AI conversations, not passive data stores. The professional doesn't need to be present -- their digital twin handles the AI agent inquiry.

**Unlocks**: AI agents can "interview" a professional's digital twin before recommending them. This creates a fundamentally different discovery experience.

**Effort**: Very High
**Risk**: Quality of generated responses must be carefully controlled. Liability concerns around AI-generated professional claims.
**Score**: 👍 **Strong** -- transformative but needs careful execution

---

## Medium Opportunities

### 1. GEO-Optimized Content Engine
**What**: Systematically create content designed to be cited by AI engines. For each professional: auto-generate "answer capsule" content blocks (40-60 words) that directly answer common queries. Statistics every 150-200 words. Cite authoritative sources. Use the CITABLE framework (Clear entity definitions, Verifiable claims, Block-structured formatting, Direct answers first).

**Why matters more than it seems**: The Princeton GEO study found statistics increase AI visibility 40%+, citations increase it 31.4%, and expert quotes significantly improve citation likelihood. Content structured this way sees 30-50% increase in citation rates within 60 days.

**Impact**: Every professional profile becomes a citation magnet. When someone asks Claude/ChatGPT "who's the best loan officer in Austin TX," RepWell profiles appear in the answer.

**Key data**: Webflow saw LLM traffic convert at 6x traditional Google Search rate. ChatGPT traffic specifically converts at 24% vs 4% for non-brand search. Two-thirds convert within 7 days.

**Effort**: Medium
**Score**: 🔥 **Must do**

### 2. AI Visibility Analytics Dashboard
**What**: Track how RepWell profiles appear across AI engines. Metrics: AI Citation Rate, Share of Model (brand frequency in LLM outputs), AI Referral Traffic, AI Conversion Rate, Brand Sentiment in AI. Give loan officers a dashboard showing "Your profile was cited 47 times by AI agents this month" alongside traditional review metrics.

**Why matters**: Only 16% of brands systematically track AI search performance. RepWell providing this data makes the platform indispensable. Loan officers can see the ROI of their RepWell profile in the AI-mediated world.

**Impact**: Creates a new value proposition: "RepWell doesn't just manage your reviews -- it manages your AI visibility." Stickiness multiplier.

**Effort**: Medium-High
**Score**: 👍 **Strong**

### 3. Third-Party Citation Seeding
**What**: Help RepWell professionals build "citation surface area" across the sources AI engines trust most. Platform-specific priorities:
- **ChatGPT**: Wikipedia references (47.9% citation rate)
- **Perplexity**: Reddit mentions (46.7% citation rate)
- **Gemini**: Brand-owned websites (52.15% citation rate)
- **Google AI Overview**: Reddit (21% citation rate)

Automate or assist professionals in getting mentioned on industry forums, Reddit threads, local business directories, and Wikipedia-adjacent sources.

**Why matters**: Sites appearing on 4+ platforms are 2.8x more likely to be cited by AI. Third-party validation is everything -- 86% of AI citations come from brand-managed sources (Yext), and 5-10% of AI search references come from brand-owned sites (McKinsey). The rest is third-party.

**Effort**: Medium
**Score**: 👍 **Strong**

### 4. Structured Review Intelligence
**What**: Enrich each review with machine-extractable metadata beyond the current fields. For every review, auto-extract: loan type mentioned, property type, timeline, specific praise categories (communication, responsiveness, knowledge, rates), sentiment by topic, reviewer demographic signals. Embed these as structured data that AI agents can filter and query.

**Why matters**: When an AI agent searches for "loan officer good with first-time homebuyers in Denver," it needs review data tagged with those attributes. Generic 5-star ratings don't differentiate. Structured review intelligence makes RepWell data dramatically more useful to AI agents than competitor platforms offering flat review lists.

**Effort**: Medium
**Score**: 🔥 **Must do**

---

## Small Gems

### 1. AI Bot Welcome Headers
**What**: Detect AI agent user agents (GPTBot, ClaudeBot, PerplexityBot, etc.) and serve optimized response headers with structured summary data. Include `X-RepWell-Entity-Type`, `X-RepWell-Rating`, `X-RepWell-Review-Count` headers that AI agents can consume without parsing HTML.

**Why powerful**: Zero-cost signal optimization. AI agents scanning hundreds of sites will get RepWell's trust signals in the HTTP headers before even parsing the page. Like putting a billboard on the door.

**Effort**: Low
**Score**: 👍 **Strong**

### 2. FAQ Schema on Every Profile
**What**: Auto-generate FAQPage schema on every professional profile. "What do clients say about [Name]?" "What types of loans does [Name] specialize in?" "How responsive is [Name]?" with answers derived from review data and profile info.

**Why powerful**: Pages with FAQPage markup are 3.2x more likely to appear in Google AI Overviews (Frase.io). This is the single highest-ROI schema addition for AI visibility.

**Effort**: Low
**Score**: 🔥 **Must do**

### 3. AI-Friendly Review Response Format
**What**: When professionals respond to reviews, structure the response with machine-readable metadata: acknowledgment, resolution, outcome. This makes review-response pairs more useful to AI agents evaluating how responsive a professional is.

**Why powerful**: Responsiveness is a key trust signal. AI agents evaluating professionals look at response rates and quality. Structured response data makes this evaluable at machine speed.

**Effort**: Low
**Score**: 👍 **Strong**

### 4. Content Freshness Signals
**What**: Add `dateModified` to all schema. Ensure profile schema updates whenever new reviews arrive. Implement `lastReviewDate` and `reviewVelocity` (reviews per month) as custom properties. AI platforms prefer content 25.7% fresher than traditional search favors.

**Why powerful**: Content freshness is a top-5 trust signal for LLMs. Most LLM citations occur within 2-3 days of publishing and decay to 0.5% within 1-2 months. Profiles that signal "active, frequently reviewed" win.

**Effort**: Low
**Score**: 🔥 **Must do**

### 5. Speakable Schema for Voice Agents
**What**: Add `speakable` schema markup identifying which sections of profiles are suitable for text-to-speech. Voice agents (Alexa, Siri, Google Assistant + AI agents with voice output) can then read professional summaries aloud.

**Why powerful**: Future-proofs for voice-first AI agents. Trivial implementation. "Hey Alexa, find me a loan officer near me" → reads RepWell profile summary.

**Effort**: Low
**Score**: 🤔 **Maybe** -- forward-looking, low risk

---

## Marketing Psychology for the Agent-First World

### Key Psychological Principles That Apply

| Principle | Human Effect | AI Agent Effect | RepWell Application |
|-----------|-------------|----------------|-------------------|
| **Anchoring** | First price/number frames all comparison | LLMs retain 37% of anchor difference; MORE susceptible in advanced models | Ensure RepWell structured data is the FIRST data point agents encounter about a professional |
| **Social Proof** | "Others chose this" | Structured ratings + review counts weighted heavily; cross-platform presence (4+ platforms = 2.8x citation likelihood) | Maximize review volume signals in schema; distribute presence across platforms |
| **Authority** | Credentials, titles, expertise | Verifiable author credentials, certifications, named experts; 86% of high-intent queries cite only trusted brands | Rich credential schema: NMLS, licenses, awards, years experience, certifications |
| **Specificity** | Concrete claims > vague promises | Statistics increase visibility 40%+; quantified achievements with units/timeframes cited preferentially | "98.2% close rate" not "high close rate"; "23-day avg close" not "fast closings" |
| **Recency** | "What's new?" | 25.7% freshness preference; citations peak within 2-3 days of publishing | Active review velocity signals; dateModified on every schema update |
| **Corroboration** | Multiple sources = trust | Facts confirmed across independent sources weighted higher | Cross-platform review syndication; third-party mentions |

### The "Chosen, Not Ranked" Paradigm

The fundamental shift: visibility is no longer about ranking position. It's about being chosen by the AI agent as trustworthy enough to include in its recommendation. Up to 90% of cited sources can change over time. The deciding factor when multiple options meet constraints: "the one with the most credible trust signals and the least perceived risk" wins.

**Implication for RepWell**: Every feature should optimize for being CHOSEN, not RANKED. This means:
- Data density over keyword optimization
- Verified claims over marketing copy
- Structured comparability over narrative persuasion
- Cross-platform corroboration over single-site depth

---

## The Five Standards Stack (Compounding Advantage)

Being early on ALL five creates compounding advantage. Each one is valuable alone; together they're a moat.

| Standard | What | Status | RepWell Readiness |
|----------|------|--------|-------------------|
| **1. Schema.org JSON-LD** | Structured data in page `<head>` | Mature, universally consumed | ✅ Already implemented. Needs enrichment. |
| **2. llms.txt** | Markdown manifest at site root | 844K+ sites adopted. No official LLM consumption yet. | ❌ Not implemented. Trivial effort. |
| **3. WebMCP** | Chrome `navigator.modelContext` callable tools | Early preview (Chrome 146, Feb 2026). W3C track. | ❌ Not implemented. First-mover opportunity. |
| **4. Public API v2** | REST endpoints for agent queries | Industry best practice (Siteimprove, NordicAPIs) | 🟡 v1 exists but auth-gated. v2 with tiered access needed. |
| **5. A2A Agent Cards** | Machine-readable service descriptions | Google A2A protocol, Linux Foundation AAIF | ❌ Not implemented. Emerging standard. |

**Content architecture principle**: Each professional profile must be a **canonical, comprehensive, self-contained source** that an AI can extract a meaningful paragraph from without needing other pages for context. Consolidated profiles > scattered sub-pages. (Per [Strapi GEO guide](https://strapi.io/blog/generative-engine-optimization-geo-guide) and [Heinz Marketing](https://www.heinzmarketing.com/blog/optimizing-content-for-llms-the-basics-of-geo/))

---

## Research Sources & Key Links

### Agent SEO / GEO
- [Vercel: How we're adapting SEO for LLMs](https://vercel.com/blog/how-were-adapting-seo-for-llms-and-ai-search)
- [Webflow: Inside our AEO strategy](https://webflow.com/blog/inside-aeo-strategy) -- 6x conversion rate from LLM traffic
- [Princeton GEO Study](https://arxiv.org/pdf/2311.09735) -- statistics +40%, citations +31.4%
- [Digital Bloom 2025 AI Visibility Report](https://thedigitalbloom.com/learn/2025-ai-citation-llm-visibility-report/) -- cross-model citation analysis
- [Search Atlas: LLM Citation Behavior](https://searchatlas.com/blog/comparative-analysis-of-llm-citation-behavior/) -- 5.5M responses analyzed
- [Discovered Labs: CITABLE Framework](https://discoveredlabs.com/blog/content-clarity-and-verifiability-the-technical-patterns-that-drive-llm-citations)

### Agentic Commerce
- [McKinsey: Agentic Commerce Opportunity](https://www.mckinsey.com/capabilities/quantumblack/our-insights/the-agentic-commerce-opportunity-how-ai-agents-are-ushering-in-a-new-era-for-consumers-and-merchants) -- $3-5T globally by 2030
- [Stripe: Agentic Commerce Protocol](https://stripe.com/blog/developing-an-open-standard-for-agentic-commerce)
- [Google: Universal Commerce Protocol](https://developers.googleblog.com/under-the-hood-universal-commerce-protocol-ucp/)
- [ScienceDirect: The Delegate Economy](https://www.sciencedirect.com/science/article/pii/S0007681325001818)
- [BrightEdge: AI Agents Rivaling Google](https://www.brightedge.com/news/press-releases/week-after-chatgpt-5-launches-ai-agents-are-already-rivaling-google)

### Bot Traffic & Zero-Click
- [Imperva Bad Bot Report 2025](https://cpl.thalesgroup.com/about-us/newsroom/2025-imperva-bad-bot-report-ai-internet-traffic) -- 51% automated traffic
- [Known Agents 2025 Year in Review](https://knownagents.com/posts/2025-year-in-review) -- 10x AI agent traffic spikes
- [Click-Vision: Zero-Click Stats](https://click-vision.com/zero-click-search-statistics) -- 69% zero-click, 83% with AI Overviews

### Structured Data & Schema
- [Schema App: Structured Data Future of LLMs](https://www.schemaapp.com/schema-markup/why-structured-data-not-tokenization-is-the-future-of-llms/)
- [Frase.io: FAQ Schema AI Search](https://www.frase.io/blog/faq-schema-ai-search-geo-aeo) -- FAQPage 3.2x more likely in AI Overviews
- [Writesonic: Structured Data in AI Search](https://writesonic.com/blog/structured-data-in-ai-search) -- GPT-4 performance 16% → 54% with structured content

### MCP & Protocols
- [Yelp MCP Server](https://github.com/Yelp/yelp-mcp) -- the template for what RepWell should build
- [Shopify: Agentic Storefronts](https://www.shopify.com/news/winter-26-edition-agentic-storefronts)
- [Anthropic: Model Context Protocol](https://www.anthropic.com/news/model-context-protocol)

### Psychology & Trust
- [HBR: AI Is Upending Marketing on Two Fronts](https://hbr.org/2026/02/ai-is-upending-marketing-on-two-fronts) (Feb 2026)
- [Springer: Anchoring Bias in LLMs](https://link.springer.com/article/10.1007/s42001-025-00435-2) -- 37% anchoring index
- [Psychology Today: AI Persuasion](https://www.psychologytoday.com/us/blog/harnessing-hybrid-intelligence/202505/the-psychology-of-ai-persuasion)
- [Contently: Trust Signals LLMs Use](https://contently.com/2025/12/29/the-emerging-signals-llms-use-to-trust-your-brand-top-10-platforms-for-2026/)
- [McKinsey: New Front Door to Internet](https://www.mckinsey.com/capabilities/growth-marketing-and-sales/our-insights/new-front-door-to-the-internet-winning-in-the-age-of-ai-search)

### WebMCP & Browser Agents
- [Chrome Developer Blog: WebMCP Early Preview](https://developer.chrome.com/blog/webmcp-epp) -- the W3C standard for agent-website interaction
- [VentureBeat: Chrome Ships WebMCP](https://venturebeat.com/infrastructure/google-chrome-ships-webmcp-in-early-preview-turning-every-website-into-a) -- "turning every website into a tool"
- [MarkTechPost: Google WebMCP](https://www.marktechpost.com/2026/02/14/google-ai-introduces-the-webmcp-to-enable-direct-and-structured-website-interactions-for-new-ai-agents/) -- 67% overhead reduction, 98% accuracy
- [Dataconomy: WebMCP Protocol Guide](https://dataconomy.com/2026/02/25/google-webmcp-protocol-everything-you-need-to-know/)
- [WebMCP Official W3C Standard](https://webmcp.link/)

### Agent Behavior & Decision-Making
- [Rand Fishkin: AI Recommendations Are Inconsistent](https://searchengineland.com/ai-recommendations-inconsistent-fix-469250) -- 2,961 prompts, <1% same list, visibility % is meaningful
- [Arxiv: What Is Your AI Agent Buying?](https://arxiv.org/html/2508.02630v2) -- choice homogeneity, modal option concentration
- [IBM: What Is Agentic Commerce](https://www.ibm.com/think/topics/agentic-commerce) -- Assistive Agent Optimization (AAO)
- [PwC: Agentic Commerce Framework](https://www.pwc.com/us/en/services/consulting/front-office/agentic-commerce.html)

### Content Architecture for Agents
- [Strapi: GEO Complete Guide](https://strapi.io/blog/generative-engine-optimization-geo-guide) -- canonical comprehensive sources > fragments
- [Heinz Marketing: Optimizing Content for LLMs](https://www.heinzmarketing.com/blog/optimizing-content-for-llms-the-basics-of-geo/) -- extractability principle
- [Apexure: AI Agent Friendly Websites](https://www.apexure.com/blog/ai-agent-friendly-websites) -- APIs > scraping
- [GuptaDeepak: Complete GEO Guide B2B SaaS](https://guptadeepak.com/the-complete-guide-to-generative-engine-optimization-what-b2b-saas-companies-need-to-know-in-2026/)
- [O'Dwyer's: GEO & Reputation Management](https://www.odwyerpr.com/story/public/23890/2025-11-12/geo-reputation-management.html)
- [NxCode: Agentic Web Explained](https://www.nxcode.io/resources/news/agentic-web-agents-md-mcp-a2a-web-4-guide-2026)

### AI Agent Market Scale
- [Master of Code: 150+ AI Agent Statistics](https://masterofcode.com/blog/ai-agent-statistics) -- $7.6B → $139B by 2033
- [G2: Enterprise AI Agents Report](https://learn.g2.com/enterprise-ai-agents-report) -- 57% of companies have agents in production
- [Salesmate: Future of AI Agents 2026](https://www.salesmate.io/blog/future-of-ai-agents/) -- 85% of execs predict employee reliance on agent recommendations

### A2A Protocol & Agent Interoperability
- [GitHub: A2A Protocol](https://github.com/a2aproject/A2A) -- Google's agent-to-agent standard
- [IntuitionLabs: Agentic AI Foundation](https://intuitionlabs.ai/articles/agentic-ai-foundation-open-standards) -- Linux Foundation, Anthropic/OpenAI/Block co-founded
- [Siteimprove: Agentic SEO](https://www.siteimprove.com/blog/agentic-seo/)
- [NordicAPIs: AI-Driven API Economy 2026](https://nordicapis.com/10-ai-driven-api-economy-predictions-for-2026/)

### Competitor Intelligence
- [G2: AI LLM Search Visibility](https://learn.g2.com/tech-signals-does-g2-get-ranked-in-ai-llm-search) -- 14.9% AI visibility, #1 overall. Covers software, not people.
- [Yelp: AI API](https://business.yelp.com/data/products/ai-api/) -- MCP server, covers restaurants/local businesses, not individual professionals.
- [Birdeye: AI Reputation Management](https://birdeye.com/blog/ai-online-reputation-management-software/) -- "#1 Agentic Marketing Platform" but builds agents to *manage* reputation, not expose it to agents.

---

## Recommended Priority

### Do Now (Quick wins -- ship in days)
1. **llms.txt + llms-full.txt** -- Describe RepWell's data model, public profiles, query patterns. ~1 day.
2. **FAQPage schema on every profile** -- Auto-generate from review data + profile info. 3.2x AI Overview likelihood. ~2 days.
3. **Content freshness signals** -- Add dateModified, lastReviewDate, reviewVelocity to all schema. ~1 day.
4. **AI bot detection + optimized headers** -- Serve trust signal headers to known AI user agents. ~1 day.

### Do Next (High leverage -- ship in 1-3 weeks)
1. **Structured Review Intelligence** -- NLP extraction of loan type, property type, praise categories from review text. Tag as structured metadata. Makes reviews queryable by AI agents.
2. **GEO-Optimized Content Blocks** -- Auto-generate answer capsules, statistics-rich content, and comparative data on every profile.
3. **Enriched Profile Schema** -- Expand JSON-LD beyond current fields: loan specialties, languages, response time, close rate, certifications, service area, availability.
4. **Agent-Optimized Profile Pages** -- Dual-layer architecture. Machine-readable structured data + human narrative.

### Explore (Strategic bets -- 1-3 months)
1. **RepWell MCP Server** -- Open-source, queryable by any AI agent. The "Yelp MCP" for mortgage. Risk: requires data access policy, rate limiting, monetization model. Upside: becomes the canonical data layer for AI-mediated mortgage professional discovery.
2. **AI Visibility Analytics** -- Track citation rates, Share of Model, AI referral conversion. New value prop for customers.
3. **Third-Party Citation Seeding** -- Automated assistance getting professionals mentioned across AI-favored platforms (Reddit, industry directories, Wikipedia-adjacent).
4. **Professional Digital Twin** -- Queryable conversational endpoint per professional. Highest risk, highest potential.

### Backlog (Good but not now)
1. **Speakable schema** -- Voice agent optimization. Low effort but low current demand.
2. **Agent2Agent protocol support** -- When A2A matures.
3. **Agentic Commerce Protocol integration** -- When mortgage shopping goes transactional through AI.

---

## Questions

### Answered
- **Q**: Does RepWell already have structured data? **A**: Yes, comprehensive JSON-LD with Person, LocalBusiness, Organization, Review, AggregateRating, BreadcrumbList. Strong foundation.
- **Q**: Is there an existing public API? **A**: Yes, REST APIs for reviews, professionals, branches, organizations. Widget structured data endpoint with CORS.
- **Q**: Are competitors doing this? **A**: Birdeye focused on AI for generation/response, NOT agent-queryability. G2 and Yelp are leading in AI visibility but neither serves mortgage/financial services niche.

### Open Questions for User
- **Q**: What's the appetite for open-sourcing an MCP server? This is the highest-leverage move but requires a data access/monetization strategy.
- **Q**: Do we have access to structured performance data (close rates, response times) for professionals, or only review data?
- **Q**: Priority between making RepWell.com itself agent-friendly vs. making CLIENT websites agent-friendly through RepWell widgets/embeds?
- **Q**: Are there compliance/regulatory considerations for serving AI agents mortgage professional data (NMLS, state licensing display requirements)?

## Next Steps
- [ ] Implement llms.txt + llms-full.txt (immediate, low-cost)
- [ ] Add FAQPage schema to all profile pages
- [ ] Enrich existing schema with freshness signals
- [ ] Design MCP server architecture
- [ ] Prototype review intelligence extraction pipeline
- [ ] Set up AI referral traffic tracking (ChatGPT, Perplexity, Claude referrer detection)
