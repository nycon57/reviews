import type { Metadata } from "next";
import Link from "next/link";
import { XCircle, ArrowLeft, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Checkout Cancelled | ReviewHub",
  description: "Your checkout was cancelled. No charges were made.",
};

export default function CheckoutCancelPage() {
  return (
    <div className="container mx-auto max-w-lg py-16">
      <Card className="text-center">
        <CardHeader className="pb-2">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <XCircle className="h-10 w-10 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl">Checkout Cancelled</CardTitle>
          <CardDescription className="text-base">
            No worries - you haven&apos;t been charged
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm text-muted-foreground">
              Your checkout session was cancelled. If you encountered any issues
              or have questions about our plans, please don&apos;t hesitate to reach
              out to our support team.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium">Need help deciding?</h4>
            <ul className="text-left text-sm text-muted-foreground space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-primary">-</span>
                <span>Compare our plans side by side on the pricing page</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">-</span>
                <span>Schedule a demo to see features in action</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">-</span>
                <span>Contact our sales team for custom requirements</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Button asChild>
              <Link href="/pricing">
                <CreditCard className="mr-2 h-4 w-4" />
                View Plans Again
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
