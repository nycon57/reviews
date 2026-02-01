# REVIEWS.io Competitive Intelligence Report
## For RepWell Feature Planning & Design Reference

> Scraped 45+ pages from reviews.io on 2026-01-31. All raw data in `.firecrawl/competitor-research/`.

---

## TABLE OF CONTENTS
1. [Executive Summary](#1-executive-summary)
2. [SMS & Conditional Messaging Flows](#2-sms--conditional-messaging-flows)
3. [Comparison Page Blueprint](#3-comparison-page-blueprint)
4. [Core Product Features](#4-core-product-features)
5. [AI Features](#5-ai-features)
6. [Pricing & Business Model](#6-pricing--business-model)
7. [Design Patterns](#7-design-patterns)
8. [RepWell Feature Gap Matrix](#8-repwell-feature-gap-matrix)
9. [Recommended Build Priorities](#9-recommended-build-priorities)

---

## 1. EXECUTIVE SUMMARY

REVIEWS.io is an eCommerce-focused review management platform (Shopify-first) with 8,200+ brands. Their core differentiator is the **"Flow" visual automation builder** -- a node-based engine where SMS, email, conditional branches, and delays are drag-and-drop nodes. They have 8 competitor comparison pages, transparent pricing ($0-$499/mo), and strong AI features.

**Key insights for RepWell:**
- Their "Flow" builder is the #1 feature to study and adapt
- SMS is 3x more effective than email alone (their data)
- Comparison pages are a major SEO/sales play (8 pages targeting competitor keywords)
- AI features (reply, summary, assistant, nuggets) are positioned front-and-center
- No mortgage/financial services specialization = our opportunity

---

## 2. SMS & CONDITIONAL MESSAGING FLOWS

### The "Flow" Builder (Their Core Differentiator)

A visual drag-and-drop automation engine for review collection campaigns.

**Node Types:**
- **Trigger**: Order complete, survey response, review submitted
- **Delay**: Configurable hours/days per step
- **Condition/Branch**: Rating threshold, responded/not, location, product type
- **Action**: Send email, send SMS, request video, escalate to support, push to Klaviyo

**How SMS Works (Not Standalone):**
- SMS is a channel option within the Flow builder
- Combined email + SMS campaigns (not either/or)
- Typical flow: Email invite → Wait → Check response → SMS follow-up if no response
- 5-star reviewers get video/photo request via SMS
- Low ratings trigger support escalation

**Segmentation Dimensions:**
- Customer location/geography
- Purchase history
- Product type / collection
- Social following
- Review rating (post-submission)
- Response status (responded vs. not)

**Multi-Channel Sequencing Example:**
1. Customer order triggers the flow
2. Email invite sent (Day 0 + delay)
3. Wait X days, check if responded
4. If no → Send SMS reminder
5. If 5-star → Request video via SMS
6. If low rating → Trigger support workflow

### Survey & NPS Integration
- **Survey types**: On-site, post-checkout, shareable link, post-review
- **50+ templates**, 8 question types
- Post-review conditional surveys (branch by rating)
- **NPS**: Licensed provider, combined with review invite in single flow
- NPS segments (Promoter/Passive/Detractor) feed into flow conditions

### Klaviyo Integration Pattern
- Push review data to Klaviyo customer profiles
- Push events: review submitted, review read, widget interaction
- Embed star ratings and UGC in Klaviyo emails
- Use review content in abandoned cart flows
- Sentiment data for external segmentation

---

## 3. COMPARISON PAGE BLUEPRINT

### Two Templates Identified

**Template A (Legacy)**: Bazaarvoice, Trusted Shops, BirdEye
- Lead capture form in hero
- Feature comparison table (checkmark/cross)
- G2/OMR score side-by-side

**Template B (Modern -- Recommended)**: Yotpo, Feefo, Stamped, Trustpilot, Okendo
- Full-width hero, no form
- Tabbed content sections
- Testimonial carousel
- Feature cards (visual, not table)
- FAQ accordion
- Massive social proof wall

### Modern Comparison Page Structure (16 Sections)

1. **Hero**: "[Competitor] vs RepWell" label, H1 ("It's time to switch from X"), 2 CTAs
2. **Logo bar**: Scrolling customer logos
3. **Pricing tabs** (3): Pricing advantage, no hidden add-ons, no contract lock-in
4. **Smooth transition**: Bullet list of what you keep when switching
5. **Testimonials**: 3 cards mentioning the competitor by name
6. **3 differentiators**: Ease of use, widget speed, support quality
7. **Feature showcase**: 6-8 visual cards with screenshots
8. **AI features tabs** (3): Convert more, smarter decisions, respond faster
9. **Integration logos**: Partner ecosystem
10. **Reputation management**: Multi-platform monitoring
11. **Migration steps**: 3-step process + contract buyout mention
12. **G2/Review comparison**: Side-by-side scores
13. **Case studies**: 4 cards with specific metrics
14. **FAQ accordion**: 4-7 questions (mix standard + competitor-specific)
15. **Social proof wall**: 15-20 logos + testimonial cards
16. **Footer CTA**: "Switch to the friendly review platform"

### H1 Patterns
- "It's time to switch from [Competitor]"
- "Switch from [Competitor]. Grow faster."
- "#1 Alternative to [Competitor]"

### URL Pattern
`/front/[competitor]-alternative`

### SEO Tactic
Passes `?switching_from=[competitor]` parameter to demo booking for sales attribution.

### Feature Comparison Table (From BirdEye page -- most detailed)

**Categories compared:**
- Pricing (flexible vs. requires call)
- Features (company profile, seller ratings, 3rd party monitoring)
- Review Collection (booster, auto email, API, A/B testing, photo reviews)
- Customization (editable email, additional questions, voucher codes)
- Review Handling (respond, forward, auto-share, retargeting)
- Publishing (widgets, API, rich snippets, expert answers)
- Product Reviews (collection, photos, SEO widgets, Google Shopping)
- Reporting (sentiment, timeline, NPS, engagement, advocacy)
- eCommerce (Magento, Shopify, WooCommerce, etc.)
- Settings (multiple branches)
- Support (email, chat, phone, CSM)

### RepWell Comparison Pages to Create
- `/compare/experience-com`
- `/compare/birdeye`
- `/compare/socialsurvey`
- `/compare/total-expert`
- `/compare/trustpilot`

---

## 4. CORE PRODUCT FEATURES

### Review Collection
- Automated email invites (branded templates)
- SMS invites (3x more effective)
- Custom invitation flows with segmentation
- Review Booster (bulk invite historical customers -- 400+ reviews overnight)
- In-store collection via iOS/Android app + QR codes
- Import/migration from other platforms (CSV)

### Review Management
- **Reputation Manager**: Single dashboard for Google, Facebook, Trustpilot, Yelp, TripAdvisor, Etsy, G2, TikTok Shop (23 portals)
- Distribute invites across platforms (e.g., 70% REVIEWS.io, 30% Google)
- AI-powered distribution optimization
- Negative review alerting

### Display & Publishing
- Company review widgets (customizable, no-code editor)
- Product review widgets
- Social Proof Editor (drag-and-drop banner creation)
- Shoppable UGC Galleries (tag products in customer images)
- Review Photos & Videos widget
- Review Nuggets (AI-extracted phrases near buy buttons)

### Google Integration
- **Google Licensed Partner**
- Google Seller Ratings (stars on Search ads, Shopping, YouTube)
- Google Business Profile integration
- Google Shopping Stars / Rich Snippets
- Dashboard eligibility tracker

### Video Reviews ("Video First")
- Video-centric invitation campaigns
- Pre-designed video review templates
- One-click publish to website and social
- Video reviews alongside text in widgets

### Local & In-Store
- iOS/Android collection app
- Branch review ratings (compare locations)
- Sentiment analysis per location
- QR code collection
- Near 100% conversion at checkout

### Session Replays
- Track customer interactions with review content
- Identify friction in purchasing journey
- Monitor how reviews influence decisions

### Review Syndication
- Direct partnerships: Google, Walmart, BazaarVoice
- Multi-TLD / global store support
- Distribute text, photo, and video reviews to retail partners

---

## 5. AI FEATURES

| Feature | Description | RepWell Equivalent |
|---------|-------------|-------------------|
| **AI Review Reply** | ChatGPT-powered one-click reply generation, tone-matched, editable | AI response suggestions (already building) |
| **AI Assistant** | Natural language Q&A over review data ("Why are people returning X?") | AI insights dashboard |
| **AI Review Summary** | Widget showing AI-generated review summaries above the fold | Profile-level review summaries |
| **AI Reports / Insights** | Performance reports, improvement tips, competitor analysis | Analytics dashboard |
| **Review Nuggets** | AI-extracted purchase sentiments displayed near buy buttons | Highlight testimonial phrases on profiles |

**FAQ reveals deeper AI capabilities:**
- "Why are people returning this product?"
- "What's driving 5-star reviews for [product]?"
- "Which delivery issues come up most often?"
- Trained on verified reviews + attribute data specific to each brand

---

## 6. PRICING & BUSINESS MODEL

### Pricing Tiers (USD, monthly, per domain)

| Plan | Price | Invites | Key Features |
|------|-------|---------|-------------|
| **Free** | $0 | 25 | Basic product & company reviews |
| **Essentials** | $29 | 300 | Photo/video reviews, automated collection |
| **Start-Up** | $99 | 1,500 | Google Seller Ratings, reputation manager, Klaviyo, surveys, flows |
| **Grow** | $299 | 5,000 | AI features (summary, replies), attributes, nuggets |
| **Plus** | $499 | 10,000 | API access, UGC galleries, syndication, dedicated CSM |
| **Enterprise** | Custom | Custom | Custom API, reports, dashboards |

- **SMS**: 100/month baseline on Start-Up+ (adjustable)
- **20% annual discount** available
- **14-day free trial** on all plans
- **No long-term contracts** -- month-to-month
- **API gated at $499/mo** (Plus tier)

### Feature Gating Strategy
- Free/Essentials: Land users with basic collection
- Start-Up ($99): Google integrations, reputation manager, Klaviyo, surveys
- Grow ($299): AI features (the conversion optimization tier)
- Plus ($499): API access, UGC galleries, syndication (enterprise-lite)

### Integration Ecosystem
**eCommerce**: Shopify, BigCommerce, Magento, WooCommerce, Shopware
**Marketing**: Klaviyo, ActiveCampaign, Dotdigital, Attentive, Omnisend
**CRM/Support**: Salesforce, HubSpot, Gorgias, Zendesk, Intercom, Freshworks
**Social**: TikTok/TikTok Shop, Instagram, Facebook
**Syndication**: Bazaarvoice, Walmart

### Contract Buyout Program
- Will honor remainder of customer's existing contract with competitor (2-10 months)
- Upload current contract during sign-up
- Dedicated landing page and CTA

### Customer Results
| Brand | Result |
|-------|--------|
| Stripe & Stare | 76% cost savings switching from Yotpo, +12% conversion |
| Blindster | +30% review collection |
| Charlie Hustle | +9.84% revenue switching from Yotpo |
| KickPush | 400+ reviews overnight via Review Booster |
| Loci | +29% conversion from UGC galleries |
| BOXRAW | +25% conversion from Review Nuggets |
| Faerly | +155% increase in 5-star reviews |

---

## 7. DESIGN PATTERNS

### Global Page Structure
1. **Hero**: Badge icon → H1 (benefit-focused) → Description → Dual CTAs → Screenshot
2. **Testimonial Block**: Quote marks → Blockquote → Name + verified badge → Title + Company
3. **Feature Sections**: Uppercase label → H2 → Description → CTA → Screenshot (alternating L/R)
4. **Feature Grid**: 3-4 columns, icon + name + description
5. **Success Stories**: Grid of 4 cards, metric-led headlines
6. **FAQ Accordion**: 5-8 customer-concern questions, cross-links to other features
7. **Bottom CTA**: Benefit statement + dual CTAs

### Visual Design
- Mesh gradient backgrounds
- Badge icons above section headings
- Screenshots in browser/device frames
- Verified badge checkmarks on testimonials
- Blur/glow effects behind images
- Light, clean aesthetic (no dark mode)
- Built on **Webflow** (not custom-coded)

### Navigation Architecture
```
Solutions (Company Reviews, Product Reviews, Local, In-Store, Google Seller Ratings)
How It Works (Collection, Management, Publishing, Import, Widgets, Integrations)
Features (Video, Social Proof, Reputation, SMS, NPS, Reporting, Analytics)
Resources (Case Studies, Blog, Guides, Support)
Pricing
```

---

## 8. REPWELL FEATURE GAP MATRIX

| Feature | REVIEWS.io | RepWell Status | Priority |
|---------|-----------|---------------|----------|
| Visual Flow Builder | Yes ("Flow") | Not yet | **HIGH** |
| SMS channel in flows | Yes | Not yet | **HIGH** |
| Multi-channel sequencing (email→SMS) | Yes | Not yet | **HIGH** |
| Condition: rating threshold | Yes | Not yet | **HIGH** |
| Condition: responded/not responded | Yes | Not yet | **HIGH** |
| AI Review Reply | Yes | Building | **HIGH** |
| AI Assistant (Q&A over reviews) | Yes | Not yet | **HIGH** |
| Competitor comparison pages | 8 pages | Not yet | **HIGH** |
| Reputation Manager (23 platforms) | Yes | Partial (Google, Zillow) | **HIGH** |
| Review Booster (bulk historical) | Yes | Not yet | **MEDIUM** |
| AI Review Summary widget | Yes | Not yet | **MEDIUM** |
| Review Nuggets (AI phrases) | Yes | Not yet | **MEDIUM** |
| Post-review conditional surveys | Yes | Not yet | **MEDIUM** |
| NPS + review in single flow | Yes | Separate currently | **MEDIUM** |
| Video request via SMS | Yes | Partial (video exists) | **MEDIUM** |
| Push review events to CRM/webhooks | Yes | Not yet | **MEDIUM** |
| Condition: customer location | Yes | Not yet | **MEDIUM** |
| Social Proof Editor (banners) | Yes | Not yet | **MEDIUM** |
| Attributes (structured review data) | Yes | Not yet | **MEDIUM** |
| In-store/QR code collection | Yes | Not yet | **LOW** |
| 50+ survey templates | Yes | Partial | **LOW** |
| Review import/migration | Yes | Not yet | **LOW** |
| Review syndication | Yes | N/A | **LOW** |
| Session replays | Yes | Not yet | **LOW** |

---

## 9. RECOMMENDED BUILD PRIORITIES

### Phase 1: Flow Engine + SMS (Highest Value)
- Visual flow builder with drag-and-drop nodes
- Node types: Trigger, Delay, Condition (branch), Action
- Conditions: rating threshold, responded/not, location, professional, branch
- Actions: send email, send SMS, request video, escalate to support, push webhook
- Twilio SMS integration as channel within flows

### Phase 2: AI Features + Comparison Pages
- AI Review Summary for professional profiles
- AI Assistant (Q&A over review data)
- Review Nuggets (highlight testimonial phrases)
- Build 5 comparison pages: Experience.com, Birdeye, SocialSurvey, Total Expert, Trustpilot
- Follow the 16-section modern template

### Phase 3: Reputation Management Expansion
- Add Yelp, Facebook, BBB to reputation monitoring
- Distribute invites across platforms with configurable ratios
- Negative review alerting + auto-escalation
- Review Booster for new LO onboarding (bulk invite past clients)

### Phase 4: Advanced Integrations + UGC
- CRM data sync (push review data to Salesforce/HubSpot/Encompass)
- Webhook events for external automation
- Social Proof Editor (branded testimonial banners)
- Post-review conditional surveys
- Combine NPS + review in single flow

---

*Raw scrape data: `.firecrawl/competitor-research/` (45 files)*
*Analysis agents: SMS flows, comparison pages, core features, pricing/business model*
