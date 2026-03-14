import { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CodeSimple as Code2,
  Key,
  Book,
  Lightning as Zap,
  Shield,
  Clock,
} from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Developer Portal | RepWell API",
  description: "Build integrations with the RepWell API. Access surveys, reviews, profiles, and more programmatically.",
};

const features = [
  {
    icon: Key,
    title: "API Key Authentication",
    description: "Secure API keys with granular permissions and rate limiting",
  },
  {
    icon: Zap,
    title: "RESTful Design",
    description: "Clean, predictable endpoints following REST conventions",
  },
  {
    icon: Shield,
    title: "Scoped Permissions",
    description: "Fine-grained access control for surveys, reviews, and more",
  },
  {
    icon: Clock,
    title: "Rate Limiting",
    description: "Transparent rate limits with clear headers and quotas",
  },
];

const resources = [
  {
    title: "API Reference",
    description: "Interactive documentation for all API endpoints",
    href: "/developers/api",
    icon: Code2,
  },
  {
    title: "Quick Start Guide",
    description: "Get started with the RepWell API in minutes",
    href: "/developers/docs/quickstart",
    icon: Zap,
  },
  {
    title: "Authentication",
    description: "Learn how to authenticate your API requests",
    href: "/developers/docs/authentication",
    icon: Key,
  },
  {
    title: "Webhooks",
    description: "Receive real-time notifications for events",
    href: "/developers/docs/webhooks",
    icon: Book,
  },
];

const codeExample = `curl -X GET "https://api.repwell.com/v1/surveys" \\
  -H "Authorization: Bearer rw_live_xxxxx" \\
  -H "Content-Type: application/json"`;

export default function DevelopersPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center rounded-full border bg-white px-4 py-1.5 text-sm text-muted-foreground">
              <Code2 className="mr-2 h-4 w-4 text-primary" />
              REST API v1
            </div>
            <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
              Build with the{" "}
              <span className="text-primary">RepWell API</span>
            </h1>
            <p className="mb-8 text-lg text-muted-foreground md:text-xl">
              Integrate surveys, reviews, and customer feedback into your applications.
              Powerful API with comprehensive documentation.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/developers/api">
                  View API Reference
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/developers/docs/quickstart">
                  Quick Start Guide
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Code Example */}
      <section className="border-y bg-slate-900 py-12">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl">
            <pre className="overflow-x-auto rounded-lg p-4 text-sm text-slate-100">
              <code>{codeExample}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground">
              Built for Developers
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Everything you need to integrate RepWell into your applications
            </p>
          </div>
          <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div key={feature.title} className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Resources */}
      <section className="bg-slate-100 py-24">
        <div className="container mx-auto px-4">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground">
              Resources
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Everything you need to get started and build your integration
            </p>
          </div>
          <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2">
            {resources.map((resource) => (
              <Card key={resource.title} className="transition-shadow hover:shadow-md">
                <Link href={resource.href}>
                  <CardHeader>
                    <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <resource.icon className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="flex items-center gap-2">
                      {resource.title}
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </CardTitle>
                    <CardDescription>{resource.description}</CardDescription>
                  </CardHeader>
                </Link>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl rounded-2xl bg-primary p-12 text-center text-primary-foreground">
            <h2 className="mb-4 text-3xl font-bold">Ready to Get Started?</h2>
            <p className="mb-8 text-primary-foreground/80">
              Create an API key in your dashboard and start building today.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button asChild variant="secondary" size="lg">
                <Link href="/dashboard/settings/api-keys">
                  Create API Key
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-primary-foreground/20 bg-transparent text-primary-foreground hover:bg-primary-foreground/10">
                <Link href="/developers/api">
                  Explore the API
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
