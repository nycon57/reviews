import { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Book,
  Clock,
  CodeSimple as Code2,
  Key,
  Lightning as Zap,
  Shield,
} from "@phosphor-icons/react/dist/ssr";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StructuredData } from "@/components/seo/structured-data";

export const metadata: Metadata = {
  title: "Developer Portal | RepWell Public API v2",
  description:
    "Build agent and developer integrations with RepWell's public API v2 for professional profiles, reviews, companies, and machine-readable docs.",
};

const endpoints = [
  {
    method: "GET",
    path: "/api/v2/professionals",
    tier: "Open",
    auth: "No API key",
    description: "Search active professionals by name, industry, location, rating, and sort order.",
  },
  {
    method: "GET",
    path: "/api/v2/professionals/{id}",
    tier: "Keyed",
    auth: "Bearer API key",
    description: "Retrieve a full professional profile with reviews, distribution, and recency stats.",
  },
  {
    method: "GET",
    path: "/api/v2/professionals/{id}/reviews",
    tier: "Keyed",
    auth: "Bearer API key",
    description: "Page through approved reviews for one professional.",
  },
  {
    method: "GET",
    path: "/api/v2/companies",
    tier: "Keyed",
    auth: "Bearer API key",
    description: "List companies with aggregate team reputation metrics.",
  },
  {
    method: "GET",
    path: "/api/v2/companies/{id}",
    tier: "Keyed",
    auth: "Bearer API key",
    description: "Fetch company details and a summarized professional roster.",
  },
  {
    method: "GET",
    path: "/api/v2/reviews",
    tier: "Keyed",
    auth: "Bearer API key",
    description: "Search approved reviews across professionals by keyword, platform, rating, date, and industry.",
  },
];

const featureCards = [
  {
    icon: Zap,
    title: "Open Discovery",
    description: "Search professional summaries without an API key at 60 requests per minute per IP.",
  },
  {
    icon: Key,
    title: "Keyed Detail",
    description: "Use bearer tokens for full profiles, review pagination, company rollups, and cross-review search.",
  },
  {
    icon: Shield,
    title: "Approved Data Only",
    description: "Public responses expose active professionals and approved reviews, not internal dashboard records.",
  },
  {
    icon: Clock,
    title: "Agent Friendly",
    description: "Stable JSON, rate-limit headers, OpenAPI links, and llms.txt help agents discover the contract.",
  },
];

const curlExample = `curl "https://repwell.com/api/v2/professionals?name=jane+smith&industry=mortgage" \\
  -H "Accept: application/json"`;

const pythonExample = `import requests

response = requests.get(
    "https://repwell.com/api/v2/professionals/pro_123/reviews",
    headers={"Authorization": "Bearer rw_live_xxxxx"},
    params={"per_page": 25, "sort_by": "date_desc"},
    timeout=10,
)
response.raise_for_status()
print(response.json())`;

const javascriptExample = `const response = await fetch(
  "https://repwell.com/api/v2/reviews?keyword=responsive&min_rating=4",
  {
    headers: {
      Authorization: \`Bearer \${process.env.REPWELL_API_KEY}\`,
      Accept: "application/json",
    },
  }
);

if (!response.ok) {
  throw new Error(\`RepWell API error: \${response.status}\`);
}

const data = await response.json();`;

const responseExample = `{
  "data": [
    {
      "id": "pro_123",
      "full_name": "Jane Smith",
      "title": "Mortgage Advisor",
      "company_name": "Summit Mortgage",
      "industry": "mortgage",
      "location": "Chicago, IL",
      "average_rating": 4.9,
      "total_reviews": 47,
      "profile_url": "https://repwell.com/pro/jane-smith"
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "per_page": 20,
    "total_pages": 1
  }
}`;

const structuredData = {
  "@context": "https://schema.org",
  "@type": "TechArticle",
  headline: "RepWell Public API v2",
  description:
    "Developer documentation for RepWell public API v2, including open and keyed tiers, endpoints, authentication, rate limits, and examples.",
  about: {
    "@type": "WebAPI",
    name: "RepWell Public API v2",
    documentation: "https://repwell.com/developers",
    termsOfService: "https://repwell.com/terms",
  },
};

function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="overflow-x-auto rounded-lg bg-repwell-teal-500 p-4 text-sm text-repwell-sage-100">
      <code>{code}</code>
    </pre>
  );
}

export default function DevelopersPage() {
  return (
    <div className="min-h-screen bg-background">
      <StructuredData data={structuredData} />

      <section className="border-b border-border/60 bg-gradient-to-b from-repwell-sage-100/20 to-background py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center rounded-full border border-repwell-teal-300/20 bg-white px-4 py-1.5 text-sm text-repwell-teal-400 shadow-sm">
              <Code2 className="mr-2 h-4 w-4 text-repwell-teal-300" />
              Public API v2
            </div>
            <h1 className="font-display text-4xl font-bold tracking-tight text-repwell-teal-500 sm:text-5xl md:text-6xl">
              Build agent workflows with RepWell reputation data
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-repwell-teal-400 md:text-xl">
              Query professional profiles, approved reviews, company rollups, and review search endpoints with clear open and keyed tiers.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/api/openapi-v2.json">
                  OpenAPI JSON
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/dashboard/organization?tab=api">
                  Create API Key
                </Link>
              </Button>
              <Button asChild variant="ghost" size="lg">
                <Link href="/llms.txt">llms.txt</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {featureCards.map((feature) => (
              <Card key={feature.title}>
                <CardHeader>
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-repwell-teal-300/10">
                    <feature.icon className="h-5 w-5 text-repwell-teal-300" />
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-border/60 bg-repwell-sage-100/10 py-16">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
          <div>
            <Badge variant="secondary">Getting Started</Badge>
            <h2 className="mt-4 font-display text-3xl font-bold text-repwell-teal-500">
              Two tiers, one JSON contract
            </h2>
            <p className="mt-4 text-repwell-teal-400">
              Use the open tier for discovery and a keyed bearer token for richer profile, review, company, and search data.
            </p>
          </div>
          <div className="space-y-4 lg:col-span-2">
            <Card>
              <CardContent className="grid gap-4 p-6 md:grid-cols-2">
                <div>
                  <h3 className="font-semibold text-heading">Base URLs</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Production app base: <code className="rounded bg-muted px-1.5 py-0.5">https://repwell.com/api/v2</code>
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Machine-readable specs: <Link href="/api/openapi-v2.json" className="font-medium text-repwell-teal-300 hover:underline">/api/openapi-v2.json</Link> and <Link href="/api/v2/schema" className="font-medium text-repwell-teal-300 hover:underline">/api/v2/schema</Link>
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-heading">Authentication</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Open endpoints need no key. Keyed endpoints require <code className="rounded bg-muted px-1.5 py-0.5">Authorization: Bearer &lt;key&gt;</code>.
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Manage keys in <Link href="/dashboard/organization?tab=api" className="font-medium text-repwell-teal-300 hover:underline">Workspace API Keys</Link>.
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="grid gap-4 p-6 md:grid-cols-2">
                <div>
                  <h3 className="font-semibold text-heading">Open tier</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    60 requests per minute per IP. Use it for professional discovery and lightweight agent lookup flows.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-heading">Keyed tier</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    300 requests per minute per API key. Use it for detail, reviews, companies, and cross-professional review search.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <Badge variant="secondary">Endpoints</Badge>
            <h2 className="mt-4 font-display text-3xl font-bold text-repwell-teal-500">
              Public API v2 reference
            </h2>
          </div>
          <div className="overflow-hidden rounded-xl border border-border/60">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-repwell-sage-100/30 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Method</th>
                    <th className="px-4 py-3 font-semibold">Endpoint</th>
                    <th className="px-4 py-3 font-semibold">Tier</th>
                    <th className="px-4 py-3 font-semibold">Auth</th>
                    <th className="px-4 py-3 font-semibold">Use</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 bg-card">
                  {endpoints.map((endpoint) => (
                    <tr key={endpoint.path}>
                      <td className="px-4 py-3">
                        <Badge variant="outline">{endpoint.method}</Badge>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-heading">{endpoint.path}</td>
                      <td className="px-4 py-3">{endpoint.tier}</td>
                      <td className="px-4 py-3">{endpoint.auth}</td>
                      <td className="px-4 py-3 text-muted-foreground">{endpoint.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-border/60 bg-repwell-sage-100/10 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <Badge variant="secondary">Examples</Badge>
            <h2 className="mt-4 font-display text-3xl font-bold text-repwell-teal-500">
              Make a request in minutes
            </h2>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>curl</CardTitle>
                <CardDescription>Open-tier professional search</CardDescription>
              </CardHeader>
              <CardContent>
                <CodeBlock code={curlExample} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Response</CardTitle>
                <CardDescription>Paginated professional summaries</CardDescription>
              </CardHeader>
              <CardContent>
                <CodeBlock code={responseExample} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Python</CardTitle>
                <CardDescription>Keyed review pagination</CardDescription>
              </CardHeader>
              <CardContent>
                <CodeBlock code={pythonExample} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>JavaScript</CardTitle>
                <CardDescription>Keyed cross-review search</CardDescription>
              </CardHeader>
              <CardContent>
                <CodeBlock code={javascriptExample} />
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-repwell-teal-300/10">
                  <Book className="h-5 w-5 text-repwell-teal-300" />
                </div>
                <CardTitle>OpenAPI</CardTitle>
                <CardDescription>
                  Generate clients or let agents inspect the schema directly.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline">
                  <Link href="/api/openapi-v2.json">View schema</Link>
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-repwell-teal-300/10">
                  <Code2 className="h-5 w-5 text-repwell-teal-300" />
                </div>
                <CardTitle>Agent Discovery</CardTitle>
                <CardDescription>
                  Give LLM agents a stable entry point for public API docs.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline">
                  <Link href="/llms.txt">Open llms.txt</Link>
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-repwell-teal-300/10">
                  <Key className="h-5 w-5 text-repwell-teal-300" />
                </div>
                <CardTitle>API Keys</CardTitle>
                <CardDescription>
                  Create and rotate keys from the Workspace API section.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild>
                  <Link href="/dashboard/organization?tab=api">Manage keys</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
