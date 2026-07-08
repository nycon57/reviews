import { getBaseUrl } from "@/lib/seo";

export const revalidate = 86400;

export function GET() {
  const baseUrl = getBaseUrl();
  const body = `# RepWell

RepWell is a review-management platform with a public directory of professionals, organizations, and branches that includes verified customer reviews.

## Directory
- [Public directory](${baseUrl}/directory)

## Profile URL Patterns
- Professional profiles: ${baseUrl}/pro/{slug}
- Organization profiles: ${baseUrl}/org/{slug}
- Branch profiles: ${baseUrl}/branch/{slug}

## Docs
- [Docs](${baseUrl}/docs)

## API
- [API](${baseUrl}/developers/api)

## Security
- [Security](${baseUrl}/security)
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
