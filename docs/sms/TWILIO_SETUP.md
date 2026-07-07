# Twilio Setup Guide for RepWell SMS

Step-by-step guide for configuring Twilio as the SMS provider for RepWell's review request and consent management system.

---

## 1. Create a Twilio Account

1. Sign up at [twilio.com](https://www.twilio.com/try-twilio)
2. Verify your email and phone number
3. **Upgrade to a paid account** (required for production SMS and 10DLC registration)
4. Note your **Account SID** and **Auth Token** from the Twilio Console dashboard

## 2. ISV Program (Direct CSP) — Optional

If operating as a SaaS platform sending on behalf of multiple organizations:

1. Apply for the [Twilio ISV Partner Program](https://www.twilio.com/en-us/isv) (Direct CSP)
2. Benefits: subaccount management, volume pricing, shared short codes
3. Application requires: company details, use case description, estimated monthly volume
4. Approval typically takes 1-2 weeks

## 3. Environment Variables

Set these in your `.env.local` (development) and production environment:

```bash
# Required — Twilio account credentials
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here

# Required — Encryption key for storing org-specific Twilio tokens
# Generate with: openssl rand -hex 32
SMS_ENCRYPTION_KEY=your_64_char_hex_key_here

# Required for OTP-based double opt-in
TWILIO_VERIFY_SERVICE_SID=VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

> **Security note:** Never commit these values to source control. Use your hosting provider's secrets management (e.g., Vercel Environment Variables, AWS Secrets Manager).

## 4. Create a Messaging Service

A Messaging Service pools phone numbers and provides intelligent routing.

1. Go to **Twilio Console > Messaging > Services**
2. Click **Create Messaging Service**
3. Name it (e.g., "RepWell Production")
4. Under **Sender Pool**, add your purchased phone numbers
5. Configure **Integration**:
   - Incoming Messages: set webhook URL to `https://your-domain.com/api/sms/inbound`
   - Status Callback URL: `https://your-domain.com/api/sms/status`
6. Copy the **Messaging Service SID** (starts with `MG`)

## 5. Create a Verify Service

The Verify Service handles OTP delivery for double opt-in consent verification.

1. Go to **Twilio Console > Verify > Services**
2. Click **Create new**
3. Configure:
   - **Friendly Name**: "RepWell Consent Verification"
   - **Code Length**: 6 (default)
   - **Delivery Channels**: Enable SMS (optionally enable Voice as fallback)
4. Under **Settings**:
   - **Custom Code**: Leave disabled (Twilio generates secure random codes)
   - **Token Expiry**: 10 minutes (default, recommended)
   - **Max Attempts**: 5 (Twilio enforces this per verification)
5. Copy the **Verify Service SID** (starts with `VA`) and set it as `TWILIO_VERIFY_SERVICE_SID`

### How Verify Works in RepWell

1. User submits phone number for double opt-in
2. `ConsentService.initiateDoubleOptIn()` calls Twilio Verify to send a 6-digit OTP
3. Consent record is set to "pending" in the `sms_consent` table
4. User enters the OTP code in the web UI
5. `ConsentService.confirmDoubleOptIn()` validates the code via Twilio Verify
6. On success, consent transitions to "opted_in"

### Verify Pricing

- **$0.05** per successful verification
- **$0.0083** per SMS sent (charged regardless of verification outcome)
- Volume discounts available at higher tiers

## 6. Purchase Phone Numbers

Phone numbers can be purchased through the RepWell dashboard UI:

1. Go to **Settings > SMS > Phone Numbers**
2. Click **Add Phone Number**
3. Select area code and number type (local or toll-free)
4. The dashboard calls Twilio's API to purchase and configure the number

Alternatively, purchase directly in the Twilio Console:
1. Go to **Phone Numbers > Manage > Buy a Number**
2. Search by area code or capabilities
3. Purchase and add to your Messaging Service sender pool

### Number Types

| Type | Monthly Cost | Use Case |
|------|-------------|----------|
| Local | ~$1.15/mo | Best for personalized LO-level messaging |
| Toll-Free | ~$2.15/mo | Higher throughput, no 10DLC required |
| Short Code | ~$1,000/mo | High-volume, branded campaigns |

## 7. 10DLC Registration

Required for local number A2P (Application-to-Person) messaging in the US.

The RepWell dashboard provides a registration wizard:

1. Go to **Settings > SMS > Registration**
2. **Step 1 — Brand Registration**: Enter business details (EIN, address, website)
3. **Step 2 — Campaign Registration**: Describe your use case, sample messages, opt-in flow
4. Wait for TCR (The Campaign Registry) approval (typically 1-5 business days)

### Trust Scores

| Score | Throughput | Notes |
|-------|-----------|-------|
| Low | 2,000 msgs/day | New brands, limited history |
| Medium | 10,000 msgs/day | Established businesses |
| High | Unlimited | Verified brands with strong reputation |

> **Toll-free numbers** do not require 10DLC registration but need separate toll-free verification.

## 8. Webhook Configuration

RepWell uses two webhook endpoints:

### Inbound Messages (for keyword handling)
- **URL**: `https://your-domain.com/api/sms/inbound`
- **Method**: POST
- Set on your Messaging Service or individual phone numbers
- Handles: STOP, START, HELP, YES keywords

### Status Callbacks (for delivery tracking)
- **URL**: `https://your-domain.com/api/sms/status`
- **Method**: POST
- Set on your Messaging Service under Integration
- Receives: queued, sent, delivered, undelivered, failed status updates

### Webhook Security

RepWell validates all inbound webhooks using Twilio's request signature validation (`X-Twilio-Signature` header). Ensure your webhook URLs use HTTPS.

## 9. Subaccount Strategy (Future Enhancement)

For multi-tenant isolation, Twilio subaccounts can provide:

- **Credential isolation**: Each org gets its own SID/token pair
- **Billing separation**: Per-org usage tracking and invoicing
- **Number isolation**: Phone numbers scoped to subaccounts
- **Independent rate limits**: Per-subaccount throughput

Current architecture supports this via the `sms_settings` table, which stores per-org encrypted Twilio credentials. Full subaccount provisioning automation is planned for a future release.

## 10. Billing & Pricing Tiers for ISVs

### Standard Twilio Pricing (Pay-as-you-go)

| Item | Cost |
|------|------|
| Outbound SMS (local) | $0.0079/segment |
| Outbound SMS (toll-free) | $0.0079/segment |
| Inbound SMS | $0.0079/segment |
| Phone number (local) | $1.15/month |
| Phone number (toll-free) | $2.15/month |
| Verify SMS | $0.05/verification + $0.0083/SMS |
| 10DLC campaign fee | $10/campaign/month |

### ISV Volume Pricing

Contact Twilio sales for ISV-specific pricing tiers. Typical discounts:
- 10-25% at 100K+ messages/month
- 25-40% at 1M+ messages/month
- Custom rates for 10M+ messages/month

### RepWell Credit System

RepWell uses an internal credit system that maps to Twilio costs:
- 1 credit = 1 SMS segment
- Credit packs are purchased in advance
- Overage billing available per org settings
- See `src/lib/sms/credits/` for implementation details

---

## Troubleshooting

### Common Issues

| Error | Cause | Fix |
|-------|-------|-----|
| `21408` | SMS permission not enabled | Enable SMS in Twilio Console > Messaging |
| `21610` | Recipient opted out | Cannot override; respect opt-out per TCPA |
| `30007` | Carrier filtering | Ensure 10DLC registration is complete |
| `63038` | Campaign suspended | Check TCR status in registration dashboard |
| `VerifyServiceNotConfiguredError` | Missing env var | Set `TWILIO_VERIFY_SERVICE_SID` |
| `60202` | Max send attempts | Wait for cooldown (10 min default) |
| `60203` | Max check attempts | User must request a new OTP code |

### Verifying Credentials

Use the RepWell settings page or test directly:

```bash
curl -X GET "https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID.json" \
  -u "$TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN"
```

A successful response confirms your credentials are valid.
