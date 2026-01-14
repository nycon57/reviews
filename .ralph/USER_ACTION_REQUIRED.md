# User Action Required Log

This file tracks issues that need manual intervention during Ralph autonomous runs.

## Status
- **Started**: 2026-01-14
- **Target**: Complete S006-S032 (20 stories, excluding Phase 4 Mobile)
- **Current**: Running...

---

## Issues Requiring Attention

_None yet - Ralph is running..._

---

## Completed Stories Log

### Phase 1: Foundation (5 remaining)
| Story | Title | Status | Notes |
|-------|-------|--------|-------|
| S006 | Public Survey Form | Pending | |
| S007 | Email Service (Resend) | Pending | |
| S008 | Survey Distribution | Pending | |
| S010 | LO Dashboard | Pending | |
| S012 | Analytics Engine | Pending | |

### Phase 2: Enhanced Features (8 stories)
| Story | Title | Status | Notes |
|-------|-------|--------|-------|
| S009 | Review Approval Workflow | Pending | |
| S011 | Manager Dashboard | Pending | |
| S013 | Gamification & Leaderboards | Pending | |
| S014 | Reporting & Export | Pending | |
| S015 | Google Business Profile | Pending | Needs Google OAuth creds |
| S016 | Review Aggregation Dashboard | Pending | |
| S026 | Webhook System | Pending | |
| S031 | Multi-tenant Organization | Pending | |

### Phase 3: AI & Advanced (7 stories)
| Story | Title | Status | Notes |
|-------|-------|--------|-------|
| S017 | Review Response Management | Pending | |
| S018 | Alert & Notification System | Pending | |
| S019 | Sentiment Analysis Engine | Pending | Needs OpenAI API key |
| S020 | AI Insights Dashboard | Pending | |
| S021 | AI Response Suggestions | Pending | |
| S022 | Testimonial Generator | Pending | |
| S032 | SEO Optimization | Pending | |

### Phase 4: EXCLUDED (Mobile - separate repo)
- S023, S024, S025, S027, S028, S029, S030 - NOT building

---

## External Dependencies Checklist

- [ ] **Resend API Key** - Required for S007 (update RESEND_API_KEY in .env)
- [ ] **OpenAI API Key** - Required for S019-S022 (update OPENAI_API_KEY in .env)
- [ ] **Google OAuth Credentials** - Required for S015 (update GOOGLE_CLIENT_ID/SECRET in .env)

---
