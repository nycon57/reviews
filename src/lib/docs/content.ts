// Documentation content structure
export interface DocSection {
  id: string;
  title: string;
  slug: string;
  description: string;
  icon: string;
  articles: DocArticle[];
}

export interface DocArticle {
  id: string;
  title: string;
  slug: string;
  description: string;
  content: string;
  tags: string[];
}

export const docSections: DocSection[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    slug: "getting-started",
    description: "Learn the basics of RepWell and get up and running quickly",
    icon: "Rocket",
    articles: [
      {
        id: "introduction",
        title: "Introduction to RepWell",
        slug: "introduction",
        description: "Overview of RepWell and its key features",
        tags: ["basics", "overview"],
        content: `
# Introduction to RepWell

RepWell is a comprehensive customer experience and review management platform designed specifically for mortgage professionals and lending organizations.

## What is RepWell?

RepWell helps you:
- **Collect customer feedback** through customizable surveys
- **Manage your online reputation** across multiple platforms
- **Gain AI-powered insights** from customer sentiment analysis
- **Track performance metrics** for loan officers and teams
- **Automate review workflows** with intelligent distribution

## Key Benefits

### For Loan Officers
- Build your online reputation with verified reviews
- Track your performance metrics and NPS score
- Receive instant notifications for new feedback
- Generate marketing testimonials from positive reviews

### For Managers
- Monitor team performance at a glance
- Compare loan officers with leaderboards
- Identify training opportunities from feedback trends
- Generate reports for stakeholder meetings

### For Organizations
- Aggregate reviews across all locations
- Maintain brand consistency in responses
- Ensure compliance with approval workflows
- Integrate with existing CRM and LOS systems

## Getting Help

If you need assistance:
- Browse the documentation sections in the sidebar
- Search for specific topics using the search bar
- Contact support at support@repwell.com
        `,
      },
      {
        id: "quick-start",
        title: "Quick Start Guide",
        slug: "quick-start",
        description: "Get started with RepWell in 5 minutes",
        tags: ["basics", "setup"],
        content: `
# Quick Start Guide

Follow these steps to get up and running with RepWell in just a few minutes.

## Step 1: Accept Your Invitation

If you've received an invitation email:
1. Click the invitation link in your email
2. Create your password
3. Complete your profile information

## Step 2: Complete Your Profile

A complete profile helps customers identify you:
1. Go to **Settings** > **Profile**
2. Upload a professional headshot
3. Add your bio and contact information
4. Configure your public profile settings

## Step 3: Send Your First Survey

Try sending a survey to test the system:
1. Navigate to **Send Survey** in the sidebar
2. Enter a customer's email (you can use your own for testing)
3. Select a survey template
4. Click **Send Survey**

## Step 4: Explore the Dashboard

Familiarize yourself with key sections:
- **Dashboard**: Overview of your metrics and recent reviews
- **Reviews**: View and manage all your reviews
- **Analytics**: Deep dive into performance data
- **Surveys**: Manage survey templates

## Step 5: Configure Notifications

Set up your notification preferences:
1. Go to **Settings** > **Notifications**
2. Enable email alerts for new reviews
3. Set up instant alerts for negative feedback
4. Configure digest frequency

## Next Steps

Now that you're set up:
- Read about [Survey Templates](/docs/surveys/templates)
- Learn about [Analytics](/docs/analytics/metrics)
- Explore [Team Management](/docs/admin/team)
        `,
      },
      {
        id: "account-setup",
        title: "Account Setup",
        slug: "account-setup",
        description: "Configure your account settings and profile",
        tags: ["account", "setup", "profile"],
        content: `
# Account Setup

Learn how to configure your RepWell account for optimal performance.

## Profile Settings

### Personal Information
Update your basic information:
- **Display Name**: How you appear to team members
- **Email**: Primary contact email
- **Phone**: Contact number (optional)
- **Timezone**: For scheduling and notifications

### Profile Photo
A professional photo builds trust:
- Recommended size: 400x400 pixels
- Accepted formats: JPG, PNG
- Use a recent, professional headshot

### Bio
Your bio appears on your public profile:
- Keep it professional but personable
- Highlight your experience and specialties
- Include relevant certifications

## Notification Settings

### Email Notifications
Configure what emails you receive:
- **New Reviews**: Immediate notification for each new review
- **Survey Responses**: When customers complete surveys
- **Weekly Digest**: Summary of weekly activity
- **Team Updates**: Changes to team structure

### In-App Notifications
Control the notification center:
- Enable/disable notification types
- Set quiet hours if needed
- Configure notification sounds

## Security Settings

### Password
Keep your account secure:
- Use a strong, unique password
- Change password every 90 days
- Enable two-factor authentication if available

### Sessions
Manage active sessions:
- View all logged-in devices
- Revoke sessions remotely
- Check last login activity
        `,
      },
    ],
  },
  {
    id: "surveys",
    title: "Surveys & Feedback",
    slug: "surveys",
    description: "Create, distribute, and manage customer surveys",
    icon: "FileText",
    articles: [
      {
        id: "templates",
        title: "Survey Templates",
        slug: "templates",
        description: "Create and manage survey templates",
        tags: ["surveys", "templates", "customization"],
        content: `
# Survey Templates

Templates define the questions and structure of your customer surveys.

## Default Templates

RepWell includes pre-built templates:

### Post-Transaction Survey
- Star rating (1-5)
- NPS question (0-10)
- Open-ended feedback
- Platform redirect for positive ratings

### NPS Survey
- Net Promoter Score question
- Follow-up question based on score
- Optional additional feedback

### CSAT Survey
- Customer satisfaction rating
- Service quality questions
- Improvement suggestions

## Creating Custom Templates

### Step 1: Navigate to Templates
1. Go to **Surveys** in the sidebar
2. Click **Templates** tab
3. Click **Create Template**

### Step 2: Basic Settings
- **Template Name**: Internal identifier
- **Description**: Purpose of the survey
- **Active Status**: Enable/disable the template

### Step 3: Add Questions
Choose from question types:
- **Star Rating**: 1-5 star scale
- **NPS**: 0-10 likelihood scale
- **Multiple Choice**: Single or multiple selection
- **Text**: Open-ended response
- **Yes/No**: Binary response

### Step 4: Configure Logic
Set up conditional logic:
- Show questions based on previous answers
- Route to different thank-you pages by score
- Trigger platform redirects for promoters

## Best Practices

### Keep It Short
- Aim for 3-5 questions maximum
- Respect your customers' time
- Higher completion rates with shorter surveys

### Ask the Right Questions
- Focus on actionable feedback
- Include both quantitative and qualitative
- Make questions clear and specific

### Test Before Sending
- Preview the survey on mobile
- Send test surveys to yourself
- Verify all logic branches work
        `,
      },
      {
        id: "distribution",
        title: "Survey Distribution",
        slug: "distribution",
        description: "Send and automate survey delivery",
        tags: ["surveys", "email", "automation"],
        content: `
# Survey Distribution

Learn how to send surveys to your customers effectively.

## Manual Distribution

### Send Individual Survey
1. Navigate to **Send Survey**
2. Enter customer details:
   - Email address (required)
   - First and last name
   - Loan officer assignment
3. Select survey template
4. Click **Send Survey**

### Best Times to Send
- Within 1-3 days of transaction close
- Avoid weekends and holidays
- Consider customer timezone

## Automated Distribution

### Webhook Integration
Connect your LOS for automatic triggers:
1. Go to **Settings** > **Integrations**
2. Copy your webhook URL
3. Configure your LOS to send events
4. Map fields to RepWell data

### Trigger Events
Supported trigger events:
- **loan.closed**: When a loan closes
- **contact.created**: New contact added
- **milestone.reached**: Custom milestones

### Reminder System
Automatic follow-up for non-responders:
- First reminder: 3 days after initial
- Second reminder: 7 days after initial
- Configurable timing and messaging

## Distribution Queue

### Queue Management
View and manage pending surveys:
- See scheduled send times
- Pause or cancel individual sends
- Bulk actions for queue management

### Rate Limiting
Prevent over-surveying:
- Maximum surveys per customer per period
- Organization-wide daily limits
- Per loan officer limits

## Tracking & Analytics

### Delivery Metrics
Monitor your distribution:
- Sent count
- Open rate
- Click rate
- Completion rate

### Response Analysis
Analyze response patterns:
- Average response time
- Completion by template
- Drop-off points in survey
        `,
      },
      {
        id: "responses",
        title: "Managing Responses",
        slug: "responses",
        description: "Review and act on survey responses",
        tags: ["surveys", "responses", "workflow"],
        content: `
# Managing Responses

Learn how to handle survey responses effectively.

## Viewing Responses

### Response Feed
Access responses from multiple locations:
- **Dashboard**: Recent responses widget
- **Reviews**: Full response list with filters
- **Notifications**: Instant alerts

### Response Details
Each response includes:
- Customer information
- Survey answers
- Sentiment analysis
- Response timestamp
- Assigned loan officer

## Approval Workflow

### Auto-Approval Rules
Configure automatic approval:
- 5-star reviews: Auto-approve and publish
- 4-star reviews: Auto-approve (optional)
- Below 4 stars: Require manual review

### Manual Review Process
1. View pending reviews in **Reviews** > **Pending**
2. Read the full response
3. Choose action:
   - **Approve**: Publish to testimonials
   - **Edit & Approve**: Modify before publishing
   - **Reject**: Remove from queue
   - **Flag**: Mark for follow-up

## Response Actions

### Publishing
Approved reviews can be:
- Added to your profile testimonials
- Shared on social media
- Exported for marketing

### Responding
Best practices for responses:
- Thank the customer for feedback
- Address specific points mentioned
- Personalize your response
- Be professional and concise

### Follow-Up
For negative feedback:
1. Alert appropriate team member
2. Document the issue
3. Schedule follow-up contact
4. Track resolution

## Analytics

### Response Metrics
Track your response performance:
- Average rating over time
- NPS trend analysis
- Common themes in feedback
- Response time to negative reviews
        `,
      },
    ],
  },
  {
    id: "analytics",
    title: "Analytics & Reporting",
    slug: "analytics",
    description: "Understand your metrics and generate reports",
    icon: "BarChart3",
    articles: [
      {
        id: "metrics",
        title: "Understanding Metrics",
        slug: "metrics",
        description: "Learn about key performance metrics",
        tags: ["analytics", "metrics", "nps"],
        content: `
# Understanding Metrics

RepWell tracks several key metrics to measure customer satisfaction and team performance.

## Net Promoter Score (NPS)

### What is NPS?
NPS measures customer loyalty on a scale from -100 to +100.

### How It's Calculated
Based on the question: "How likely are you to recommend us?"
- **Promoters (9-10)**: Loyal enthusiasts
- **Passives (7-8)**: Satisfied but unenthusiastic
- **Detractors (0-6)**: Unhappy customers

**Formula**: NPS = % Promoters - % Detractors

### NPS Benchmarks
- **Below 0**: Needs improvement
- **0-30**: Good
- **30-50**: Great
- **50-70**: Excellent
- **70+**: World-class

## Customer Satisfaction (CSAT)

### What is CSAT?
CSAT measures satisfaction with specific interactions.

### How It's Calculated
Average of satisfaction ratings (typically 1-5 stars).

### CSAT Benchmarks
- **Below 3.5**: Needs attention
- **3.5-4.0**: Average
- **4.0-4.5**: Good
- **4.5+**: Excellent

## Response Rate

### Definition
Percentage of customers who complete surveys.

### Calculation
(Completed Surveys / Sent Surveys) x 100

### Industry Averages
- Email surveys: 10-30%
- Post-transaction: 20-40%

## Reputation Score

### What is It?
A composite score (0-100) combining multiple metrics.

### Components
- Average rating (40%)
- NPS score (30%)
- Review volume (20%)
- Response rate (10%)

### Score Ranges
- **0-50**: Needs improvement
- **50-70**: Good
- **70-85**: Great
- **85-100**: Excellent

## Trend Analysis

### Time Periods
View metrics across:
- Last 7 days
- Last 30 days
- Last 90 days
- Year-to-date
- Custom range

### Comparisons
Compare metrics:
- vs. previous period
- vs. team average
- vs. organization average
        `,
      },
      {
        id: "dashboards",
        title: "Dashboard Guide",
        slug: "dashboards",
        description: "Navigate and customize your dashboard",
        tags: ["analytics", "dashboard", "overview"],
        content: `
# Dashboard Guide

Learn how to use and customize your RepWell dashboard.

## Dashboard Types

### Loan Officer Dashboard
The default view for loan officers includes:
- **Overview Cards**: Key metrics at a glance
- **Recent Reviews**: Latest customer feedback
- **Rating Trend**: Visual chart of ratings over time
- **NPS Trend**: Net Promoter Score progress
- **Quick Actions**: Common tasks

### Manager Dashboard
Managers see additional sections:
- **Team Overview**: Aggregate team metrics
- **LO Comparison**: Side-by-side performance
- **Leaderboard**: Top performers
- **Alerts**: Issues requiring attention

### Admin Dashboard
Administrators have access to:
- **Organization Metrics**: Company-wide data
- **Branch Comparison**: Location performance
- **System Health**: Integration status
- **User Activity**: Login and usage stats

## Dashboard Components

### Metric Cards
Each card displays:
- Current value
- Comparison to previous period
- Trend indicator (up/down)
- Click for detailed view

### Charts
Interactive visualizations:
- Hover for data points
- Click legends to filter
- Export chart data
- Adjust time range

### Tables
Data tables support:
- Sorting by column
- Filtering by criteria
- Exporting to CSV
- Pagination

## Customization

### Widget Arrangement
Personalize your dashboard:
- Drag widgets to reorder
- Show/hide specific sections
- Save your layout

### Default Time Range
Set your preferred view:
- Last 7 days
- Last 30 days
- Custom default

### Notification Preferences
Control dashboard alerts:
- Enable milestone celebrations
- Configure goal tracking
- Set comparison benchmarks
        `,
      },
      {
        id: "reports",
        title: "Generating Reports",
        slug: "reports",
        description: "Create and export performance reports",
        tags: ["analytics", "reports", "export"],
        content: `
# Generating Reports

Create comprehensive reports for stakeholders and analysis.

## Report Types

### Performance Report
Includes:
- Review volume and ratings
- NPS scores and trends
- Response rates
- Sentiment analysis summary

### Team Report
Covers:
- Individual LO metrics
- Team comparisons
- Leaderboard standings
- Achievement badges

### Campaign Report
Contains:
- Survey distribution stats
- Response rates by campaign
- Completion funnels
- A/B test results (if applicable)

## Creating Reports

### Step 1: Navigate to Reports
1. Click **Analytics** in the sidebar
2. Select **Reports** tab
3. Click **Create Report**

### Step 2: Configure Report
- **Report Type**: Select from templates
- **Date Range**: Choose time period
- **Scope**: Organization, branch, or individual
- **Metrics**: Select which to include

### Step 3: Generate
- Click **Generate Report**
- Preview the results
- Make adjustments if needed

### Step 4: Export
Export options:
- **PDF**: Formatted for printing/sharing
- **CSV**: Raw data for analysis
- **Email**: Send directly to stakeholders

## Scheduled Reports

### Setting Up Automation
1. Go to **Reports** > **Scheduled**
2. Click **New Schedule**
3. Configure:
   - Report template
   - Frequency (daily, weekly, monthly)
   - Recipients
   - Delivery time

### Managing Schedules
- View active schedules
- Edit configuration
- Pause or delete schedules
- View delivery history

## Best Practices

### Report Frequency
- Executive summary: Monthly
- Team performance: Weekly
- Individual metrics: On-demand

### Audience Considerations
- Executives: High-level metrics, trends
- Managers: Team details, comparisons
- LOs: Personal performance, goals
        `,
      },
    ],
  },
  {
    id: "admin",
    title: "Admin Settings",
    slug: "admin",
    description: "Organization and system administration",
    icon: "Settings",
    articles: [
      {
        id: "team",
        title: "Team Management",
        slug: "team",
        description: "Invite and manage team members",
        tags: ["admin", "team", "users", "roles"],
        content: `
# Team Management

Learn how to manage your organization's team members and roles.

## User Roles

### Admin
Full system access:
- Manage all users
- Configure organization settings
- Access billing and subscriptions
- View all data across organization

### Manager
Team oversight capabilities:
- Invite and manage team members
- View team analytics
- Configure surveys and templates
- Access all LO data in their scope

### Loan Officer
Individual contributor access:
- View personal dashboard
- Manage their reviews
- Send surveys to customers
- Update their profile

## Inviting Team Members

### Step 1: Access Team Settings
1. Navigate to **Team** in the sidebar
2. Click **Invite Member**

### Step 2: Enter Details
- **Email Address**: User's email
- **Role**: Select Admin, Manager, or LO
- **Branch** (optional): Assign to location

### Step 3: Send Invitation
- Click **Send Invitation**
- User receives email with signup link
- Link expires after 7 days

## Managing Members

### View Team
The team list shows:
- Name and email
- Role and status
- Last active date
- Actions menu

### Edit Member
Modify member details:
- Change role
- Update branch assignment
- Reset password
- Resend invitation

### Deactivate Member
When someone leaves:
1. Click member's action menu
2. Select **Deactivate**
3. Confirm deactivation

Note: Deactivated users retain their data but cannot log in.

## Branch Structure

### Creating Branches
1. Go to **Settings** > **Branches**
2. Click **Add Branch**
3. Enter branch details:
   - Name
   - Address
   - Contact information

### Assigning Members
- Assign during invitation
- Update existing member's branch
- View branch roster

## Access Control

### Role Permissions
Review what each role can access:
- Dashboard data scope
- Settings access
- Team management
- Billing access

### Data Visibility
Control who sees what:
- LOs see only their data
- Managers see their team
- Admins see everything
        `,
      },
      {
        id: "organization",
        title: "Organization Settings",
        slug: "organization",
        description: "Configure organization-wide settings",
        tags: ["admin", "organization", "settings"],
        content: `
# Organization Settings

Configure settings that apply to your entire organization.

## General Settings

### Organization Profile
- **Name**: Your company name
- **Logo**: Upload organization logo
- **Description**: About your organization
- **Website**: Company website URL

### Contact Information
- **Primary Email**: Main contact email
- **Support Email**: Customer support address
- **Phone**: Contact number
- **Address**: Physical address

## Branding

### Survey Branding
Customize survey appearance:
- Upload logo
- Set primary colors
- Customize button styles
- Add custom CSS (advanced)

### Email Branding
Customize email templates:
- Header logo
- Footer content
- Color scheme
- Social links

### Profile Pages
Public profile customization:
- Organization banner
- Featured testimonials
- Team display options

## Workflow Settings

### Review Publishing
Reviews publish automatically after machine screening:
- Screened reviews go live immediately at any rating
- Flagged reviews are quarantined for human release
- Live reviews are only removed through a dispute

### Notification Defaults
Organization-wide defaults:
- New review notifications
- Weekly digest settings
- Alert thresholds

### Survey Defaults
Default survey settings:
- Default template
- Reminder timing
- Thank you page content

## Security Settings

### Password Policy
Set requirements:
- Minimum length
- Complexity rules
- Expiration period

### Session Management
Configure sessions:
- Session timeout
- Concurrent sessions
- Remember me duration

### API Access
Manage API keys:
- View active keys
- Create new keys
- Revoke access
        `,
      },
      {
        id: "billing",
        title: "Billing & Subscription",
        slug: "billing",
        description: "Manage your subscription and billing",
        tags: ["admin", "billing", "subscription"],
        content: `
# Billing & Subscription

Manage your RepWell subscription and billing details.

## Subscription Plans

### Free Plan
Perfect for getting started:
- 1 loan officer
- Basic surveys
- Limited analytics
- Email support

### Pro Plan
For growing teams:
- Up to 25 loan officers
- All survey features
- Full analytics suite
- Priority support
- API access

### Enterprise Plan
For large organizations:
- Unlimited users
- Custom integrations
- Dedicated support
- SLA guarantees
- Advanced security

## Managing Subscription

### View Current Plan
1. Go to **Settings** > **Billing**
2. View your current plan details:
   - Plan name
   - User count
   - Renewal date
   - Monthly/annual billing

### Upgrade Plan
To upgrade:
1. Click **Upgrade Plan**
2. Select new plan
3. Review pricing
4. Confirm upgrade

### Downgrade Plan
To downgrade:
1. Click **Change Plan**
2. Select new plan
3. Review limitations
4. Confirm at end of billing period

## Billing Details

### Payment Methods
Add and manage payment:
- Credit/debit cards
- Bank transfer (Enterprise)
- View saved methods
- Set default payment

### Invoices
Access billing history:
- View all invoices
- Download PDF invoices
- Filter by date range
- Email invoice copies

### Billing Contacts
Set up billing notifications:
- Primary billing email
- CC additional contacts
- Configure invoice delivery

## Usage & Limits

### Current Usage
Monitor your usage:
- Active users count
- Surveys sent this period
- Storage used
- API calls

### Usage Alerts
Set up alerts for:
- Approaching user limit
- Survey volume spikes
- Storage warnings

## FAQ

### When am I billed?
Subscriptions are billed at the start of each billing period (monthly or annually).

### Can I get a refund?
Contact support within 30 days for refund requests.

### What happens if I exceed limits?
You'll receive warnings before hitting limits. Contact sales for custom plans.
        `,
      },
    ],
  },
  {
    id: "integrations",
    title: "Integrations",
    slug: "integrations",
    description: "Connect RepWell with other tools",
    icon: "Puzzle",
    articles: [
      {
        id: "webhooks",
        title: "Webhook Integration",
        slug: "webhooks",
        description: "Set up webhooks for automation",
        tags: ["integrations", "webhooks", "automation"],
        content: `
# Webhook Integration

Connect external systems to automatically trigger actions in RepWell.

## What are Webhooks?

Webhooks are HTTP callbacks that notify RepWell when events occur in your other systems. Use them to:
- Automatically send surveys when loans close
- Sync contact information from your CRM
- Trigger workflows based on external events

## Setting Up Webhooks

### Step 1: Get Your Webhook URL
1. Go to **Settings** > **Integrations**
2. Click **Webhooks** tab
3. Copy your unique webhook URL

### Step 2: Configure Your System
In your LOS or CRM:
1. Find webhook or integration settings
2. Add your RepWell webhook URL
3. Select events to send
4. Save configuration

### Step 3: Test the Connection
1. Send a test event from your system
2. Check **Webhook Logs** in RepWell
3. Verify event received successfully

## Supported Events

### loan.closed
Triggered when a loan closes:
\`\`\`json
{
  "event": "loan.closed",
  "data": {
    "customer_email": "customer@email.com",
    "customer_first_name": "John",
    "customer_last_name": "Doe",
    "user_email": "lo@company.com",
    "closed_date": "2024-01-15"
  }
}
\`\`\`

### contact.created
When a new contact is added:
\`\`\`json
{
  "event": "contact.created",
  "data": {
    "email": "contact@email.com",
    "first_name": "Jane",
    "last_name": "Smith",
    "phone": "555-1234"
  }
}
\`\`\`

## Outbound Webhooks

Outbound webhooks send RepWell events to an endpoint you control. Use them for Zapier Catch Hook URLs, middleware, data warehouses, or internal workflow services.

### Outbound events

- \`review.published\`
- \`review.negative\`
- \`review.responded\`
- \`survey.completed\`
- \`contact.created\`

### Delivery envelope

Each outbound delivery uses this JSON envelope:

\`\`\`json
{
  "id": "evt_123",
  "type": "review.published",
  "created_at": "2026-07-08T12:00:00.000Z",
  "organization_id": "org_123",
  "data": {
    "review_id": "rev_123",
    "rating": 5,
    "customer_name": "Jordan Lee"
  }
}
\`\`\`

RepWell includes these headers:

| Header | Description |
|---|---|
| \`X-RepWell-Event\` | Event type, such as \`review.published\` |
| \`X-RepWell-Delivery\` | Unique delivery ID |
| \`X-RepWell-Signature\` | \`sha256=\` plus the HMAC-SHA256 digest of the raw body |

### Verify signatures

Use the endpoint signing secret shown when you create the outbound endpoint. The secret is only displayed once.

\`\`\`ts
import { createHmac, timingSafeEqual } from "crypto";

export function verifyRepWellSignature(
  rawBody: Buffer,
  signatureHeader: string,
  secret: string
) {
  const expected =
    "sha256=" + createHmac("sha256", secret).update(rawBody).digest("hex");

  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(signatureHeader);

  return (
    expectedBuffer.length === receivedBuffer.length &&
    timingSafeEqual(expectedBuffer, receivedBuffer)
  );
}
\`\`\`

## Security

### Signature Verification
All webhooks include a signature header:
- Header: \`X-RepWell-Signature\`
- Algorithm: HMAC-SHA256
- Verify before processing

### IP Allowlisting
Restrict webhook sources:
1. Go to **Settings** > **Security**
2. Add allowed IP addresses
3. Save configuration

## Troubleshooting

### Common Issues
- **Event not received**: Check webhook URL is correct
- **Signature mismatch**: Verify secret key
- **Missing data**: Ensure all required fields are sent

### Webhook Logs
View recent webhook activity:
- Received events
- Processing status
- Error messages
- Retry attempts
        `,
      },
      {
        id: "google-business",
        title: "Google Business Profile",
        slug: "google-business",
        description: "Connect your Google Business profile",
        tags: ["integrations", "google", "reviews"],
        content: `
# Google Business Profile Integration

Sync your Google Business reviews and manage your Google presence from RepWell.

## Overview

The Google Business integration allows you to:
- View Google reviews alongside internal reviews
- Reply to Google reviews from RepWell
- Track Google rating trends
- Get alerts for new Google reviews

## Connecting Your Account

### Step 1: Start Connection
1. Go to **Settings** > **Integrations**
2. Click **Google Business** card
3. Click **Connect Account**

### Step 2: Authorize Access
1. Sign in to Google with your business account
2. Select the Google Business profile to connect
3. Grant RepWell permission to access reviews

### Step 3: Configure Settings
- **Sync Frequency**: How often to check for new reviews
- **Notifications**: Alert settings for Google reviews
- **Response Approval**: Require approval before posting

## Managing Google Reviews

### Viewing Reviews
Google reviews appear in your review feed:
- Marked with Google icon
- Show star rating and text
- Include reviewer name (if public)

### Responding to Reviews
Reply to Google reviews:
1. Open the review
2. Type your response
3. Click **Post to Google**

Note: Responses post to Google after approval (if enabled).

### Review Alerts
Configure alerts for:
- Any new Google review
- Reviews below threshold
- Response reminders

## Analytics

### Google Metrics
Track your Google performance:
- Average Google rating
- Review volume trend
- Response rate
- Rating distribution

### Comparison
Compare Google to other sources:
- Google vs internal surveys
- Rating trends over time
- Volume by source

## Troubleshooting

### Connection Issues
- Ensure you're using the account that manages the business
- Check that the business is verified
- Try disconnecting and reconnecting

### Missing Reviews
- Reviews may take up to 24 hours to sync
- Check sync status in settings
- Manually trigger sync if needed
        `,
      },
      {
        id: "api",
        title: "Public API",
        slug: "api",
        description: "Use the RepWell API for custom integrations",
        tags: ["integrations", "api", "developers"],
        content: `
# Public API

Build custom integrations with the RepWell API.

## Getting Started

### API Access
API access is available on Pro and Enterprise plans.

### Authentication
Use API keys for authentication:
1. Go to **Settings** > **API**
2. Click **Generate New Key**
3. Copy and securely store the key

### Base URL
\`\`\`
https://api.repwell.com/v1
\`\`\`

## Authentication

Include your API key in the header:
\`\`\`
Authorization: Bearer YOUR_API_KEY
\`\`\`

## Endpoints

### Get Reviews
\`\`\`
GET /reviews
\`\`\`

Query parameters:
- \`limit\`: Number of results (default: 50)
- \`offset\`: Pagination offset
- \`start_date\`: Filter by date
- \`end_date\`: Filter by date
- \`rating\`: Filter by rating

### Get Metrics
\`\`\`
GET /metrics
\`\`\`

Query parameters:
- \`period\`: 7d, 30d, 90d, ytd
- \`user_id\`: Filter by LO

### Send Survey
\`\`\`
POST /surveys/send
\`\`\`

Request body:
\`\`\`json
{
  "customer_email": "customer@email.com",
  "customer_first_name": "John",
  "customer_last_name": "Doe",
  "user_id": "lo_123",
  "template_id": "template_abc"
}
\`\`\`

## Rate Limits

- Standard: 1,000 requests/hour
- Enterprise: Custom limits available

Rate limit headers:
- \`X-RateLimit-Limit\`
- \`X-RateLimit-Remaining\`
- \`X-RateLimit-Reset\`

## Error Handling

### Error Response Format
\`\`\`json
{
  "error": {
    "code": "invalid_request",
    "message": "Missing required parameter: customer_email"
  }
}
\`\`\`

### Common Error Codes
- \`400\`: Bad request
- \`401\`: Unauthorized
- \`403\`: Forbidden
- \`404\`: Not found
- \`429\`: Rate limited
- \`500\`: Server error

## SDKs

Official SDKs available:
- TypeScript/JavaScript
- Python
- Ruby

## Support

For API support:
- Documentation: docs.repwell.com/api
- Email: api-support@repwell.com
        `,
      },
      {
        id: "zapier",
        title: "Zapier & Automation",
        slug: "zapier",
        description: "Connect RepWell to Zapier and other tools using webhooks and the REST API",
        tags: ["integrations", "zapier", "automation", "webhooks", "api"],
        content: `
# Zapier & Automation

RepWell has a native Zapier app for RepWell triggers and create actions. The app is pending Zapier directory publication, so it is available by invite link until listing approval. You can also use **Webhooks by Zapier** with RepWell outbound endpoints today.

## How it works

- **Native RepWell app:** Authenticate with a RepWell API key. Zapier sends it as \`X-API-Key\`.
- **RepWell triggers:** \`review.published\`, \`review.negative\`, \`review.responded\`, \`survey.completed\`, and \`contact.created\`.
- **RepWell actions:** \`create_contact\` and \`trigger_survey\`.
- **Fallback:** Use **Webhooks by Zapier** to catch outbound RepWell events or call RepWell REST endpoints directly.

## Set up the native RepWell app

1. Open the RepWell Zapier invite link while directory publication is pending.
2. Choose RepWell as the trigger or action app.
3. Paste a scoped RepWell API key when Zapier asks you to connect.
4. Pick a trigger or action, map the fields, test the Zap, and turn it on.

### Native triggers

| Trigger | Event |
|---|---|
| New Review | \`review.published\` |
| Negative Review | \`review.negative\` |
| Review Response | \`review.responded\` |
| Survey Completed | \`survey.completed\` |
| New Contact | \`contact.created\` |

### Native actions

| Action | RepWell endpoint |
|---|---|
| Create Contact | \`POST /api/v1/contacts\` |
| Trigger Survey | \`POST /api/v1/surveys\` |

## Send RepWell events to Zapier

1. In Zapier, create a Zap with the **Webhooks by Zapier → Catch Hook** trigger and copy the generated URL.
2. In RepWell, go to **Settings → Webhooks** and add an endpoint with that URL.
3. Choose which events to send.
4. Save, then send a test event to confirm Zapier receives the payload.

See the [Webhooks guide](/docs/integrations/webhooks) for the full event list and payload format.

## Trigger RepWell actions from Zapier

1. Add a **Webhooks by Zapier → Custom Request** action to your Zap.
2. Point it at the relevant RepWell REST API endpoint.
3. Add an \`X-API-Key\` header using a key from **Settings → API**.
4. Map fields from the previous step into the request body.

See [API Authentication](/docs/developers/authentication) to create and use API keys.

## Example automations

- **CRM deal closed → send a survey:** Catch the CRM event in Zapier, then call the RepWell API to send a review request.
- **New review → Slack:** Send a RepWell new-review webhook to Zapier, then post to a Slack channel.
- **Negative review → email the team:** Send a \`review.negative\` event to Zapier, then send an email via Gmail.

## Best practices

- Verify the webhook signature on incoming events (see the Webhooks guide).
- Store your API key as a Zapier secret; never hard-code it.
- Test each Zap with sample data before turning it on.
        `,
      },
    ],
  },
  {
    id: "developers",
    title: "Developers",
    slug: "developers",
    description: "API integration guides for developers",
    icon: "Code2",
    articles: [
      {
        id: "quickstart",
        title: "Quick Start Guide",
        slug: "quickstart",
        description: "Get started with the RepWell API in minutes",
        tags: ["developers", "api", "quickstart"],
        content: `
# Quick Start Guide

Get up and running with the RepWell API in minutes.

## Prerequisites

Before you begin, make sure you have:
- A RepWell account with API access enabled
- At least one survey template configured
- Team members added to your organization

## Step 1: Get Your API Key

Create an API key from your dashboard:
1. Go to **Settings** > **API Keys**
2. Click **Generate New Key**
3. Copy and securely store the key

## Step 2: Make Your First Request

Test your API key by listing your surveys:

\`\`\`bash
curl -X GET "https://api.repwell.com/v1/surveys" \\
  -H "Authorization: Bearer rw_live_xxxxx" \\
  -H "Content-Type: application/json"
\`\`\`

## Step 3: Create a Survey

Send a survey to a customer:

\`\`\`bash
curl -X POST "https://api.repwell.com/v1/surveys" \\
  -H "Authorization: Bearer rw_live_xxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "template_id": "your-template-id",
    "customer_email": "customer@example.com",
    "customer_name": "John Doe",
    "user_id": "your-user-id"
  }'
\`\`\`

## Step 4: Get Reviews

Fetch reviews for your organization:

\`\`\`bash
curl -X GET "https://api.repwell.com/v1/reviews?status=published" \\
  -H "Authorization: Bearer rw_live_xxxxx"
\`\`\`

## Response Format

All API responses follow a consistent format:

\`\`\`json
{
  "success": true,
  "data": { ... },
  "pagination": {
    "page": 1,
    "page_size": 25,
    "total": 142,
    "total_pages": 6
  },
  "meta": {
    "request_id": "req_abc123",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
\`\`\`

## Error Handling

Errors include a code and message to help you debug:

\`\`\`json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": [
      {
        "field": "customer_email",
        "message": "Invalid email format"
      }
    ]
  }
}
\`\`\`

## Next Steps

- Learn about [Authentication](/docs/developers/authentication) and API key scopes
- Explore the [API Reference](/developers/api) for all available endpoints
        `,
      },
      {
        id: "authentication",
        title: "Authentication",
        slug: "authentication",
        description: "Secure your API requests with API keys and scoped permissions",
        tags: ["developers", "api", "authentication", "security"],
        content: `
# Authentication

The RepWell API uses API keys to authenticate requests. Each key can have specific permissions to control access to different resources.

## API Key Format

RepWell uses prefixed API keys to distinguish environments:

- **Production keys** start with \`rw_live_\` — use these for production environments
- **Test keys** start with \`rw_test_\` — use these for development and testing

## Making Authenticated Requests

Include your API key in the \`Authorization\` header:

\`\`\`bash
curl -X GET "https://api.repwell.com/v1/surveys" \\
  -H "Authorization: Bearer rw_live_xxxxx" \\
  -H "Content-Type: application/json"
\`\`\`

## Security Best Practices

Keep your API keys secure:
- Never expose API keys in client-side code or public repositories
- Rotate keys periodically and immediately if compromised
- Use environment variables to store keys securely
- Grant only the minimum required permissions

## Permission Scopes

When creating an API key, you can specify which scopes it should have for fine-grained access control:

| Scope | Description |
|---|---|
| \`surveys:read\` | List and view surveys |
| \`surveys:write\` | Create and update surveys |
| \`reviews:read\` | List and view reviews |
| \`reviews:write\` | Update reviews and respond to them |
| \`branches:read\` | List and view branches |
| \`branches:write\` | Create, update, and delete branches |
| \`users:read\` | List organization users |
| \`users:write\` | Invite new users |
| \`organization:read\` | View organization settings |
| \`organization:write\` | Update organization settings |
| \`webhooks:trigger\` | Trigger webhook events |
| \`admin\` | Full access to all resources |

## Rate Limiting

API requests are rate limited per key. The limits are included in response headers:

| Header | Description |
|---|---|
| \`X-RateLimit-Limit\` | Maximum requests per hour |
| \`X-RateLimit-Remaining\` | Requests remaining in window |
| \`X-RateLimit-Reset\` | Unix timestamp when window resets |

If you exceed the rate limit, you will receive a \`429 Too Many Requests\` response. Wait until the reset time before making more requests.

## Next Steps

- Follow the [Quick Start Guide](/docs/developers/quickstart) to make your first API call
- Explore the [API Reference](/developers/api) for all available endpoints
        `,
      },
      {
        id: "webhooks",
        title: "Webhooks",
        slug: "webhooks",
        description: "Receive real-time notifications and trigger surveys from external systems",
        tags: ["developers", "api", "webhooks", "automation"],
        content: `
# Webhooks

Use webhooks to trigger surveys from your CRM or business system. When a transaction closes or a milestone is reached, send a webhook to RepWell to automatically send a survey to your customer.

## Webhook Endpoint

Send POST requests to trigger surveys:

\`\`\`
POST https://api.repwell.com/api/webhooks/survey-trigger
\`\`\`

Include your API key in the \`Authorization\` header or as a \`secret_key\` parameter in the request body.

## Authentication

Authenticate webhook requests using your API key:

\`\`\`bash
curl -X POST "https://api.repwell.com/api/webhooks/survey-trigger" \\
  -H "Authorization: Bearer rw_live_xxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "customer": {
      "email": "customer@example.com",
      "name": "John Doe"
    },
    "professional": {
      "email": "pro@company.com"
    }
  }'
\`\`\`

## Webhook Payload

### survey.trigger

Trigger a new survey to be sent:

\`\`\`json
{
  "event": "survey.trigger",
  "customer": {
    "email": "customer@example.com",
    "name": "John Doe",
    "phone": "+15551234567"
  },
  "professional": {
    "email": "pro@company.com",
    "name": "Jane Smith"
  },
  "transaction": {
    "type": "purchase",
    "close_date": "2024-01-15"
  }
}
\`\`\`

## Required Fields

- **\`customer.email\`** or **\`customer.phone\`** — at least one contact method is required
- **\`professional.email\`** — used to match the survey to a team member

## Response & Retry Logic

| Status | Meaning |
|---|---|
| \`200 OK\` | Survey queued successfully |
| \`400 Bad Request\` | Invalid payload — check required fields |
| \`401 Unauthorized\` | Invalid or missing API key |
| \`429 Too Many Requests\` | Rate limit exceeded |

## Success Response

\`\`\`json
{
  "success": true,
  "data": {
    "survey_id": "surv_abc123",
    "status": "queued",
    "scheduled_at": "2024-01-15T10:30:00Z"
  },
  "meta": {
    "request_id": "req_xyz789"
  }
}
\`\`\`

## Outbound Webhooks

RepWell can also send signed event notifications to your application. Create an outbound endpoint in **Settings → Webhooks**, choose the events to send, and copy the signing secret when it is shown.

### Events

| Event | When it fires |
|---|---|
| \`review.published\` | A review is published |
| \`review.negative\` | A negative review is detected or published |
| \`review.responded\` | A review response is recorded |
| \`survey.completed\` | A customer completes a survey |
| \`contact.created\` | A contact is created |

### Envelope

\`\`\`json
{
  "id": "evt_123",
  "type": "review.published",
  "created_at": "2026-07-08T12:00:00.000Z",
  "organization_id": "org_123",
  "data": {
    "review_id": "rev_123",
    "rating": 5,
    "customer_name": "Jordan Lee"
  }
}
\`\`\`

### Headers

| Header | Description |
|---|---|
| \`X-RepWell-Event\` | Event type |
| \`X-RepWell-Delivery\` | Unique delivery ID |
| \`X-RepWell-Signature\` | \`sha256=\` plus HMAC-SHA256 of the raw request body |

### Signature verification

\`\`\`ts
import { createHmac, timingSafeEqual } from "crypto";

export function verifyRepWellSignature(
  rawBody: Buffer,
  signatureHeader: string,
  secret: string
) {
  const expected =
    "sha256=" + createHmac("sha256", secret).update(rawBody).digest("hex");

  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(signatureHeader);

  return (
    expectedBuffer.length === receivedBuffer.length &&
    timingSafeEqual(expectedBuffer, receivedBuffer)
  );
}
\`\`\`

## Next Steps

- Learn about [Authentication](/docs/developers/authentication) and API key scopes
- Explore the [API Reference](/developers/api) for all available endpoints
        `,
      },
    ],
  },
  {
    id: "faq",
    title: "FAQ",
    slug: "faq",
    description: "Frequently asked questions",
    icon: "HelpCircle",
    articles: [
      {
        id: "general",
        title: "General Questions",
        slug: "general",
        description: "Common questions about RepWell",
        tags: ["faq", "general"],
        content: `
# General Questions

Answers to frequently asked questions about RepWell.

## Account & Access

### How do I reset my password?
1. Go to the login page
2. Click "Forgot password"
3. Enter your email
4. Check your inbox for reset link
5. Create a new password

### Can I change my email address?
Yes, go to **Settings** > **Profile** > **Email** to update your email address. You'll need to verify the new email.

### How do I delete my account?
Contact support at support@repwell.com to request account deletion. Note that this action is permanent.

## Surveys

### How long do survey links stay active?
Survey links expire after 30 days by default. This can be configured in organization settings.

### Can customers take the same survey twice?
By default, no. Each survey link is unique and single-use. Contact support if you need exceptions.

### Why isn't my survey sending?
Check these common issues:
- Customer email is valid
- You haven't hit sending limits
- The customer isn't on the do-not-contact list

## Reviews

### How do I get more reviews?
- Send surveys promptly after transactions
- Use automated reminders
- Make surveys short and easy
- Ask at the right moment (within 3 days)

### Can I edit a customer's review?
You can make minor edits (typos, formatting) during approval, but substantial changes require customer consent.

### Why did a review disappear?
Possible reasons:
- Customer requested removal
- Review violated guidelines
- Admin removed during moderation

## Technical

### What browsers are supported?
RepWell works on:
- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)

### Is there a mobile app?
There is no native mobile app yet. RepWell is a fully responsive web app, so you can use it in any mobile browser and add it to your home screen for quick access.

### How secure is my data?
We use:
- 256-bit SSL encryption
- SOC 2 compliant infrastructure
- Regular security audits
- Role-based access control
        `,
      },
      {
        id: "troubleshooting",
        title: "Troubleshooting",
        slug: "troubleshooting",
        description: "Solutions to common problems",
        tags: ["faq", "troubleshooting", "help"],
        content: `
# Troubleshooting

Solutions to common issues in RepWell.

## Login Issues

### "Invalid credentials" error
- Verify you're using the correct email
- Check caps lock isn't on
- Try resetting your password

### "Account locked" message
Your account may be locked after multiple failed attempts. Wait 30 minutes or contact support.

### Not receiving password reset email
- Check spam/junk folder
- Verify email address is correct
- Try requesting reset again
- Contact support if issue persists

## Survey Issues

### Surveys not sending
1. Check customer email validity
2. Verify sending limits aren't reached
3. Ensure customer isn't on do-not-contact list
4. Check for service outages

### Customer can't access survey
- Confirm link hasn't expired (30 days)
- Check link wasn't already used
- Try resending the survey
- Have customer clear browser cache

### Survey shows "already completed"
Each survey link is single-use. If the customer needs to retake:
1. Send a new survey invitation
2. Contact support for special cases

## Dashboard Issues

### Data not loading
- Refresh the page
- Clear browser cache
- Try a different browser
- Check internet connection

### Metrics showing zero
- Verify data exists for selected period
- Check filters aren't too restrictive
- Wait for new data to process

### Charts not displaying
- Update to a supported browser
- Disable browser extensions
- Enable JavaScript

## Integration Issues

### Webhook not receiving events
- Verify webhook URL is correct
- Check sending system's configuration
- Review webhook logs for errors
- Test with a manual event

### Google sync not working
- Reconnect your Google account
- Verify business ownership
- Check for Google service issues

## Performance Issues

### Slow page loading
- Check your internet connection
- Clear browser cache
- Disable browser extensions
- Contact support if persistent

### Export timing out
- Reduce date range
- Filter to fewer records
- Try during off-peak hours

## Contact Support

If you can't resolve your issue:
- Email: support@repwell.com
- Live chat: Available in-app
- Phone: See contact page
        `,
      },
    ],
  },
];

// Flatten all articles for search
export function getAllArticles(): (DocArticle & { section: string; sectionTitle: string })[] {
  return docSections.flatMap((section) =>
    section.articles.map((article) => ({
      ...article,
      section: section.slug,
      sectionTitle: section.title,
    }))
  );
}

// Get article by slug
export function getArticle(
  sectionSlug: string,
  articleSlug: string
): (DocArticle & { section: string; sectionTitle: string }) | null {
  const section = docSections.find((s) => s.slug === sectionSlug);
  if (!section) return null;

  const article = section.articles.find((a) => a.slug === articleSlug);
  if (!article) return null;

  return {
    ...article,
    section: section.slug,
    sectionTitle: section.title,
  };
}

// Get section by slug
export function getSection(slug: string): DocSection | null {
  return docSections.find((s) => s.slug === slug) || null;
}
