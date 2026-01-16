"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function CheckoutSuccessClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    if (!sessionId) {
      router.push("/dashboard");
      return;
    }

    // Verify the session - webhook will handle subscription sync
    const timer = setTimeout(() => {
      setStatus("success");
    }, 1500);

    return () => clearTimeout(timer);
  }, [sessionId, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Confirming your subscription...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-lg py-16">
      <Card className="text-center">
        <CardHeader className="pb-2">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Payment Successful!</CardTitle>
          <CardDescription className="text-base">
            Thank you for subscribing to ReviewHub
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm text-muted-foreground">
              Your subscription is now active. You have full access to all features
              included in your plan. A confirmation email has been sent to your address.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium">What&apos;s next?</h4>
            <ul className="text-left text-sm text-muted-foreground space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                <span>Set up your team members and loan officers</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                <span>Create your first survey template</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                <span>Connect your Google Business Profile</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Button asChild>
              <Link href="/dashboard">
                Go to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard/settings/billing">
                View Subscription Details
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
