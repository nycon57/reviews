"use client";

import { useSearchParams } from "next/navigation";
import {
  CheckCircle,
  EnvelopeSimple as MailX,
  ArrowLeft,
} from "@phosphor-icons/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Suspense } from "react";

function UnsubscribedContent() {
  const searchParams = useSearchParams();
  const action = searchParams.get("action");
  const isResubscribed = action === "resubscribed";

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader variant="plain" className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            {isResubscribed ? (
              <CheckCircle className="h-8 w-8 text-green-600" />
            ) : (
              <MailX className="h-8 w-8 text-muted-foreground" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {isResubscribed
              ? "Welcome Back!"
              : "Unsubscribed Successfully"}
          </CardTitle>
          <CardDescription className="text-base">
            {isResubscribed
              ? "You've been resubscribed to our emails. You'll now receive survey invitations and notifications."
              : "You've been unsubscribed from our email list. You won't receive any more survey invitations or reminder emails from us."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isResubscribed && (
            <p className="text-sm text-muted-foreground text-center">
              Changed your mind? Contact support to resubscribe.
            </p>
          )}
          <div className="flex justify-center">
            <Button variant="outline" asChild>
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Return Home
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function UnsubscribedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="animate-pulse">Loading...</div>
      </div>
    }>
      <UnsubscribedContent />
    </Suspense>
  );
}
