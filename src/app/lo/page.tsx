import { Metadata } from "next";
import Link from "next/link";
import { getPublicLOList } from "@/lib/seo/actions";
import { generateLOListingMetadata, getBaseUrl } from "@/lib/seo";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Users, MapPin, ArrowRight } from "lucide-react";

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = getBaseUrl();
  return generateLOListingMetadata(null, baseUrl);
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default async function LOListingPage() {
  const result = await getPublicLOList();

  if (!result.success || !result.data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Unable to load loan officers</p>
      </div>
    );
  }

  const { loanOfficers, organization } = result.data;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight">
              {organization ? `${organization.name} Team` : "Our Loan Officers"}
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Meet our team of experienced mortgage professionals
            </p>
          </div>
        </div>
      </div>

      {/* Loan Officers Grid */}
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        {loanOfficers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Users className="h-16 w-16 text-muted-foreground/50" />
            <p className="mt-4 text-lg text-muted-foreground">
              No loan officers available at this time.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {loanOfficers.map((lo) => {
              const address = lo.address as { city?: string; state?: string } | null;
              const location = address
                ? [address.city, address.state].filter(Boolean).join(", ")
                : [lo.branch, lo.region].filter(Boolean).join(", ");

              return (
                <Link key={lo.id} href={`/lo/${lo.id}`}>
                  <Card className="group h-full transition-all hover:shadow-lg hover:border-primary/50">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-16 w-16 border-2 border-muted">
                          <AvatarImage src={lo.photo_url || undefined} alt={lo.full_name} />
                          <AvatarFallback className="text-lg font-semibold bg-primary/10 text-primary">
                            {getInitials(lo.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h2 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
                            {lo.full_name}
                          </h2>
                          <p className="text-sm text-muted-foreground truncate">
                            {lo.title || "Loan Officer"}
                          </p>
                          {location && (
                            <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              <span className="truncate">{location}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        {lo.average_rating && lo.total_reviews ? (
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span className="font-semibold">
                                {Number(lo.average_rating).toFixed(1)}
                              </span>
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {lo.total_reviews} {lo.total_reviews === 1 ? "review" : "reviews"}
                            </Badge>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">No reviews yet</span>
                        )}
                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t bg-card py-6 mt-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-muted-foreground">
            Powered by ReviewHub - Customer Experience Management
          </p>
        </div>
      </footer>
    </div>
  );
}
