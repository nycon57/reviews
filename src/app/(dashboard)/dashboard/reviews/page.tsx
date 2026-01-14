import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Filter, Download } from "lucide-react";

export const metadata = {
  title: "Reviews | ReviewHub",
  description: "View and manage all customer reviews",
};

export default function ReviewsPage() {
  // Mock data - will be replaced with real data from Supabase
  const reviews = [
    {
      id: "1",
      author: "Sarah Johnson",
      email: "sarah.j@email.com",
      rating: 5,
      text: "Excellent service! Made the whole mortgage process smooth and stress-free. Would highly recommend to anyone looking for a great loan officer.",
      date: "2 hours ago",
      source: "survey",
    },
    {
      id: "2",
      author: "Michael Chen",
      email: "m.chen@email.com",
      rating: 5,
      text: "Very professional and responsive. Answered all my questions promptly and made sure I understood every step of the process.",
      date: "5 hours ago",
      source: "survey",
    },
    {
      id: "3",
      author: "Emily Davis",
      email: "emily.d@email.com",
      rating: 4,
      text: "Great experience overall. Quick turnaround on everything. Only minor hiccup was some paperwork delays but everything worked out.",
      date: "1 day ago",
      source: "google",
    },
    {
      id: "4",
      author: "Robert Wilson",
      email: "r.wilson@email.com",
      rating: 5,
      text: "Fantastic experience from start to finish. Couldn't have asked for a better loan officer.",
      date: "2 days ago",
      source: "survey",
    },
  ];

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reviews</h1>
          <p className="text-muted-foreground">
            View and manage all customer reviews
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Reviews list */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">All Reviews</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="flex gap-4 p-4 transition-colors hover:bg-muted/50"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  {review.author
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium">{review.author}</div>
                      <div className="text-sm text-muted-foreground">
                        {review.email}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < review.rating
                                ? "fill-yellow-400 text-yellow-400"
                                : "fill-muted text-muted"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs capitalize">
                        {review.source}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{review.text}</p>
                  <span className="text-xs text-muted-foreground">
                    {review.date}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
