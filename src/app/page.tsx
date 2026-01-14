import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Star, BarChart3, MessageSquare, Zap } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Star className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">ReviewHub</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/signup">
              <Button>Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="container mx-auto px-4 py-24 text-center">
          <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Customer Experience
            <br />
            <span className="text-primary">Management Platform</span>
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
            Collect reviews, track satisfaction metrics, and gain AI-powered insights to deliver
            exceptional customer experiences. Built for mortgage professionals.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/signup">
              <Button size="lg">Start Free Trial</Button>
            </Link>
            <Link href="/demo">
              <Button size="lg" variant="outline">
                Watch Demo
              </Button>
            </Link>
          </div>
        </section>

        {/* Features Section */}
        <section className="border-t bg-muted/50 py-24">
          <div className="container mx-auto px-4">
            <h2 className="mb-12 text-center text-3xl font-bold">Everything You Need</h2>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              <FeatureCard
                icon={<Star className="h-8 w-8" />}
                title="Review Collection"
                description="Automated surveys sent at the perfect moment, with reminders to maximize response rates."
              />
              <FeatureCard
                icon={<BarChart3 className="h-8 w-8" />}
                title="Analytics & NPS"
                description="Track NPS, CSAT, and satisfaction trends with real-time dashboards and reports."
              />
              <FeatureCard
                icon={<MessageSquare className="h-8 w-8" />}
                title="AI Insights"
                description="Sentiment analysis and AI-generated summaries reveal what customers really think."
              />
              <FeatureCard
                icon={<Zap className="h-8 w-8" />}
                title="Integrations"
                description="Connect with Google Business, your LOS, and thousands of apps via Zapier."
              />
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} ReviewHub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-6 text-card-foreground">
      <div className="mb-4 text-primary">{icon}</div>
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
