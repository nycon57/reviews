# RepWell Zapier App

This package contains the RepWell Zapier Platform CLI app. It is intentionally standalone and is not part of the main RepWell Next.js build, lint, or TypeScript pipeline.

## Capabilities

### Triggers

- New Review: `review.published`
- Negative Review: `review.negative`
- Review Response: `review.responded`
- Survey Completed: `survey.completed`
- New Contact: `contact.created`

### Creates

- Create Contact: `POST /api/v1/contacts`
- Trigger Survey: `POST /api/v1/surveys`

## Local Development

```bash
npm install
npm test
npm run validate
```

Set `BASE_URL` to test against a non-production API host. If unset, the app uses `https://repwell.ai`.

## Authentication

The app uses custom auth with a RepWell API key sent as:

```http
X-API-Key: rw_live_...
```

The auth test calls:

```http
GET /api/v1/organization
```

The connection label uses the organization name returned by that endpoint.

## Publishing

Jarrett publishes this externally from a Zapier Platform account:

```bash
npm install
npm run validate
zapier-platform login
zapier-platform register "RepWell"
zapier-platform push
zapier-platform promote
```

The RepWell app is pending Zapier directory publication. Until then, share the private invite link from the Zapier Platform dashboard.
