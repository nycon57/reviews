import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Star,
  TrendingUp,
  Users,
  MessageSquare,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { StatsRowSkeleton, ReviewListSkeleton } from "@/components/shared";

export const metadata = {
  title: "Dashboard | ReviewHub",
  description: "Your ReviewHub dashboard overview",
};

export default function DashboardPage() {
  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here&apos;s an overview of your performance.
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Send Survey
        </Button>
      </div>

      {/* Stats cards */}
      <Suspense fallback={<StatsRowSkeleton />}>
        <StatsCards />
      </Suspense>

      {/* Main content grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent reviews */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">Recent Reviews</CardTitle>
            <Button variant="ghost" size="sm">
              View all
            </Button>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<ReviewListSkeleton count={3} />}>
              <RecentReviews />
            </Suspense>
          </CardContent>
        </Card>

        {/* Quick actions */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <QuickActionButton
              icon={<MessageSquare className="h-5 w-5" />}
              title="Send Survey"
              description="Request a review from a customer"
            />
            <QuickActionButton
              icon={<Star className="h-5 w-5" />}
              title="View Reviews"
              description="See all customer feedback"
            />
            <QuickActionButton
              icon={<TrendingUp className="h-5 w-5" />}
              title="Analytics"
              description="Track your performance metrics"
            />
            <QuickActionButton
              icon={<Users className="h-5 w-5" />}
              title="Team"
              description="Manage your team members"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatsCards() {
  // Mock data - will be replaced with real data from Supabase
  const stats = [
    {
      title: "Total Reviews",
      value: "142",
      change: "+12%",
      trend: "up" as const,
      icon: <Star className="h-4 w-4" />,
    },
    {
      title: "Average Rating",
      value: "4.8",
      change: "+0.2",
      trend: "up" as const,
      icon: <TrendingUp className="h-4 w-4" />,
    },
    {
      title: "Response Rate",
      value: "68%",
      change: "-3%",
      trend: "down" as const,
      icon: <MessageSquare className="h-4 w-4" />,
    },
    {
      title: "NPS Score",
      value: "72",
      change: "+5",
      trend: "up" as const,
      icon: <Users className="h-4 w-4" />,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </span>
              <span className="text-muted-foreground">{stat.icon}</span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold">{stat.value}</span>
              <span
                className={`flex items-center text-xs font-medium ${
                  stat.trend === "up" ? "text-green-600" : "text-red-600"
                }`}
              >
                {stat.trend === "up" ? (
                  <ArrowUpRight className="mr-0.5 h-3 w-3" />
                ) : (
                  <ArrowDownRight className="mr-0.5 h-3 w-3" />
                )}
                {stat.change}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function RecentReviews() {
  // Mock data - will be replaced with real data from Supabase
  const reviews = [
    {
      id: "1",
      author: "Sarah Johnson",
      rating: 5,
      text: "Excellent service! Made the whole process smooth and stress-free.",
      date: "2 hours ago",
    },
    {
      id: "2",
      author: "Michael Chen",
      rating: 5,
      text: "Very professional and responsive. Highly recommend!",
      date: "5 hours ago",
    },
    {
      id: "3",
      author: "Emily Davis",
      rating: 4,
      text: "Great experience overall. Quick turnaround on everything.",
      date: "1 day ago",
    },
  ];

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <div
          key={review.id}
          className="flex gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            {review.author
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-medium">{review.author}</span>
              <div className="flex items-center gap-1">
                {Array.from({ length: review.rating }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-3 w-3 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {review.text}
            </p>
            <span className="text-xs text-muted-foreground">{review.date}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function QuickActionButton({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <button className="flex items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <div>
        <div className="font-medium">{title}</div>
        <div className="text-sm text-muted-foreground">{description}</div>
      </div>
    </button>
  );
}
