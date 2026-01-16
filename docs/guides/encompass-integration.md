# Encompass Integration Guide

This guide explains how RepWell integrates with Encompass (ICE Mortgage Technology) to automatically send survey requests when loan milestones are reached.

---

## Table of Contents

1. [Overview](#overview)
2. [How It Works](#how-it-works)
3. [Customer Onboarding Checklist](#customer-onboarding-checklist)
4. [Encompass Admin Setup](#encompass-admin-setup)
5. [RepWell Configuration](#repwell-configuration)
6. [Supported Milestones](#supported-milestones)
7. [Payload Reference](#payload-reference)
8. [Troubleshooting](#troubleshooting)
9. [FAQ](#faq)

---

## Overview

### What This Integration Does

When a loan reaches a specific milestone in Encompass (e.g., "Funded"), RepWell automatically:
1. Receives the milestone event via webhook
2. Looks up the configured survey template for that milestone
3. Creates a survey request for the borrower
4. Queues delivery based on the configured delay (e.g., 24 hours after funding)

### Benefits

- **Automated feedback collection** - No manual survey sending
- **Timely requests** - Surveys sent at optimal moments in the loan lifecycle
- **Configurable per milestone** - Different surveys for different stages
- **Delay options** - Send immediately or wait hours/days

---

## How It Works

```
┌─────────────┐     Webhook POST      ┌─────────────┐     Queue      ┌─────────────┐
│  Encompass  │ ──────────────────▶  │   RepWell   │ ────────────▶ │   Borrower  │
│     LOS     │   milestone event    │   Server    │    survey     │    Email    │
└─────────────┘                      └─────────────┘               └─────────────┘
```

1. **Encompass** fires an outbound webhook when a loan milestone changes
2. **RepWell** receives the event at `/api/webhooks/survey-trigger`
3. **RepWell** validates the API key and payload
4. **RepWell** looks up the milestone mapping for the organization
5. **RepWell** creates a survey and queues it for delivery
6. **Borrower** receives the survey email after the configured delay

---

## Customer Onboarding Checklist

Use this checklist when onboarding a new customer:

### Prerequisites

- [ ] Customer has Encompass admin access (or IT contact who does)
- [ ] Customer has RepWell account with API key generated
- [ ] Customer has at least one survey template created in RepWell

### Setup Steps

- [ ] Generate API key in RepWell (Settings → Webhooks → Generate Key)
- [ ] Provide customer with webhook URL and API key
- [ ] Customer configures Encompass webhook (see [Encompass Admin Setup](#encompass-admin-setup))
- [ ] Customer sends test webhook from Encompass
- [ ] Verify test event received in RepWell webhook logs
- [ ] Configure milestone mappings in RepWell
- [ ] Enable desired milestones (they start disabled by default)
- [ ] Send test survey to verify end-to-end flow

### Information to Collect from Customer

| Item | Example | Notes |
|------|---------|-------|
| Encompass Instance URL | `https://company.encompassapi.com` | For documentation |
| Milestones they want to trigger surveys | Funded, Clear to Close | Default is "Funded" only |
| Delay preferences per milestone | Funded: 24h, CTC: immediate | Can be adjusted later |
| Survey templates to use | NPS Survey, Post-Close Survey | Must exist in RepWell |

---

## Encompass Admin Setup

> **Note:** These steps must be performed by someone with Encompass admin access.

### Step 1: Access Webhook Settings

1. Log into Encompass as an administrator
2. Navigate to **Settings → Business Rules → Webhooks** (or **Encompass Settings → Services → Webhooks**)
3. Click **Add Webhook** or **New Subscription**

### Step 2: Configure the Webhook

| Field | Value |
|-------|-------|
| **Name** | RepWell Survey Trigger |
| **URL** | `https://app.repwell.com/api/webhooks/survey-trigger` |
| **Method** | POST |
| **Content Type** | application/json |
| **Events/Triggers** | Milestone Changed (or specific milestones) |

### Step 3: Add Authentication Header

Add a custom header for authentication:

| Header Name | Value |
|-------------|-------|
| `x-api-key` | `[Customer's RepWell API Key]` |

### Step 4: Configure Payload

The webhook must send a JSON payload. Use Encompass field mappings to include:

```json
{
  "event_type": "encompass.milestone",
  "milestone": "{{Milestone.Name}}",
  "loan_id": "{{Loan.GUID}}",
  "loan_number": "{{Loan.LoanNumber}}",
  "loan_officer_email": "{{LoanOfficer.Email}}",
  "loan_officer_name": "{{LoanOfficer.Name}}",
  "borrower_name": "{{Borrower.FirstName}} {{Borrower.LastName}}",
  "borrower_email": "{{Borrower.Email}}",
  "borrower_phone": "{{Borrower.Phone}}",
  "property_address": "{{Property.FullAddress}}",
  "loan_amount": "{{Loan.Amount}}",
  "loan_purpose": "{{Loan.Purpose}}",
  "close_date": "{{Loan.CloseDate}}"
}
```

> **Field mapping varies by Encompass version.** Work with the customer's Encompass admin to identify correct field tokens.

### Step 5: Select Milestone Triggers

Configure which milestones fire the webhook:

- **Funded** (most common)
- **Clear to Close**
- **Loan Submitted**
- **Approved**
- **Docs Sent**

### Step 6: Test the Webhook

1. In Encompass, find a test loan
2. Change its milestone to one that triggers the webhook
3. Check RepWell webhook logs to confirm receipt
4. Verify the survey was created (check Surveys page)

---

## RepWell Configuration

### Generating an API Key

1. Log into RepWell as an admin
2. Go to **Settings → Webhooks**
3. Click **Generate API Key**
4. Copy the key (it won't be shown again)
5. Provide this key to the customer for Encompass configuration

### Configuring Milestone Mappings

1. Go to **Settings → Webhooks**
2. Scroll to **Encompass Integration** section
3. You'll see pre-configured milestones:

| Milestone | Default Template | Default Delay | Default Status |
|-----------|------------------|---------------|----------------|
| Funded | Default | 24 hours | Disabled |
| Clear to Close | Default | Immediate | Disabled |
| Loan Submitted | Default | 48 hours | Disabled |
| Approved | Default | 24 hours | Disabled |
| Docs Sent | Default | 24 hours | Disabled |

### Enabling a Milestone

1. Find the milestone in the table
2. Toggle the **Active** switch to enable it
3. Select the appropriate **Survey Template**
4. Set the **Delay** (how long after milestone to send survey)

### Adding Custom Milestones

If the customer uses custom milestone names:

1. Click **Add Milestone**
2. Select from common milestones or enter a custom name
3. The name must **exactly match** what Encompass sends
4. Configure template and delay
5. Enable when ready

### Delay Options

| Delay | Use Case |
|-------|----------|
| Immediate | Time-sensitive feedback (e.g., application experience) |
| 1-4 hours | Same-day follow-up |
| 8-24 hours | Next-day survey (most common for post-close) |
| 48-72 hours | Allow borrower to settle before asking for feedback |
| 1 week | Long-term satisfaction check |

---

## Supported Milestones

### Pre-configured Milestones

These are the most common Encompass milestones:

| Milestone Name | Description | Typical Survey |
|----------------|-------------|----------------|
| `Funded` | Loan has funded | Post-close NPS |
| `Clear to Close` | Loan cleared for closing | Pre-close satisfaction |
| `Loan Submitted` | Application submitted | Application experience |
| `Approved` | Loan approved | Approval celebration |
| `Docs Sent` | Closing docs sent | Process check-in |

### Custom Milestones

Customers may have custom milestones like:
- `Docs Received`
- `Underwriting Complete`
- `Appraisal Ordered`
- `Appraisal Received`
- `Final Approval`

Add these as custom milestones in RepWell if needed.

---

## Payload Reference

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `event_type` | string | Must be `"encompass.milestone"` |
| `milestone` | string | Milestone name (e.g., `"Funded"`) |
| `loan_officer_email` | string | LO email for matching in RepWell |
| `borrower_name` | string | Borrower's full name |
| `borrower_email` | string | Borrower's email for survey delivery |

### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `loan_id` | string | Encompass loan GUID |
| `loan_number` | string | Human-readable loan number |
| `loan_officer_name` | string | LO name |
| `borrower_phone` | string | Borrower phone number |
| `property_address` | string | Property address |
| `loan_amount` | number | Loan amount in dollars |
| `loan_purpose` | string | Purchase, Refinance, etc. |
| `close_date` | string | Closing date (ISO format) |
| `co_borrower_name` | string | Co-borrower name |
| `co_borrower_email` | string | Co-borrower email |
| `metadata` | object | Any additional data |

### Example Payload

```json
{
  "event_type": "encompass.milestone",
  "milestone": "Funded",
  "loan_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "loan_number": "2024-00123",
  "loan_officer_email": "john.smith@mortgage.com",
  "loan_officer_name": "John Smith",
  "borrower_name": "Jane Doe",
  "borrower_email": "jane.doe@email.com",
  "borrower_phone": "555-123-4567",
  "property_address": "123 Main St, Austin, TX 78701",
  "loan_amount": 350000,
  "loan_purpose": "Purchase",
  "close_date": "2024-01-15"
}
```

---

## Troubleshooting

### Webhook Not Received

**Symptoms:** No events appearing in RepWell webhook logs

**Check:**
1. Verify the webhook URL is correct (`https://app.repwell.com/api/webhooks/survey-trigger`)
2. Confirm the API key header is set (`x-api-key`)
3. Check Encompass webhook logs for delivery errors
4. Ensure the milestone is configured to fire webhooks

### Survey Not Created

**Symptoms:** Webhook received but no survey created

**Check:**
1. Verify the milestone is **enabled** in RepWell
2. Check that `milestone` value exactly matches the configured name (case-sensitive)
3. Confirm `loan_officer_email` matches an LO in RepWell
4. Verify `borrower_email` is a valid email address
5. Check RepWell error logs for validation failures

### Wrong Survey Template

**Symptoms:** Survey created but wrong template used

**Check:**
1. Verify the correct template is selected for the milestone
2. If "Default" is selected, the organization's default template is used
3. Check if there are multiple mappings for similar milestone names

### LO Not Found

**Symptoms:** Error "Loan officer not found"

**Check:**
1. Verify the `loan_officer_email` in the payload
2. Confirm the LO exists in RepWell with that email
3. Check for email typos or case sensitivity issues
4. Ensure the LO is active (not deactivated)

### Duplicate Surveys

**Symptoms:** Multiple surveys sent for same milestone

**Check:**
1. Encompass may be sending duplicate webhooks
2. Check for multiple milestone changes in quick succession
3. RepWell has deduplication logic, but edge cases may occur
4. Contact support if duplicates persist

---

## FAQ

### For Customers

**Q: Do I need Encompass API access?**
A: No. You only need admin access to configure outbound webhooks in Encompass settings.

**Q: What if my milestone names are different?**
A: Add custom milestones in RepWell that exactly match your Encompass milestone names.

**Q: Can I send surveys to co-borrowers?**
A: Currently, surveys are sent to the primary borrower only. Co-borrower support may be added in the future.

**Q: How do I test without affecting real loans?**
A: Use a test loan in Encompass and verify the webhook is received. You can check the "Logs" tab in RepWell to see incoming webhooks.

**Q: What happens if the webhook fails?**
A: Encompass typically retries failed webhooks. Check both Encompass and RepWell logs to diagnose issues.

### For RepWell Employees

**Q: Customer says webhook isn't working - where do I check?**
A: Go to Settings → Webhooks → Logs tab. Filter by the customer's organization to see incoming events and any errors.

**Q: How do I add a milestone that's not in the dropdown?**
A: Click "Add Milestone" and select "Custom milestone..." to enter any name. Ensure it exactly matches what Encompass sends.

**Q: Customer wants different surveys for different loan types - is that possible?**
A: Not currently with milestone mappings. Recommend using the survey's conditional logic or creating separate survey templates.

**Q: Can we see the raw webhook payload?**
A: Yes, the webhook logs show the full payload for each received event.

**Q: What if the customer uses a different LOS (not Encompass)?**
A: The generic `loan.closed` event type can be used for other systems. The payload format is similar. Create integration-specific documentation as needed.

---

## Support

For additional help:

- **RepWell Support:** support@repwell.com
- **Documentation:** https://app.repwell.com/docs
- **Encompass Documentation:** https://developer.icemortgagetechnology.com/

---

*Last updated: January 2026*
