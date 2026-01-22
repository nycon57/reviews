"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, AlertCircle, MailX, Settings } from "lucide-react";
import {
  getEmailPreferencesByToken,
  unsubscribeAllByToken,
} from "@/lib/email-preferences/actions";
import type { EmailPreferencesWithToken } from "@/lib/email-preferences/types";
import Link from "next/link";

export default function UnsubscribePage() {
  const params = useParams();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<EmailPreferencesWithToken | null>(null);
  const [unsubscribed, setUnsubscribed] = useState(false);

  useEffect(() => {
    async function loadPreferences() {
      setLoading(true);
      try {
        const prefs = await getEmailPreferencesByToken(token);
        if (prefs) {
          if (!prefs.is_valid) {
            setError("This unsubscribe link has expired. Please contact support for assistance.");
          } else {
            setPreferences(prefs);
          }
        } else {
          setError("Invalid unsubscribe link. Please check your email for a valid link.");
        }
      } catch {
        setError("An unexpected error occurred. Please try again later.");
      } finally {
        setLoading(false);
      }
    }
    loadPreferences();
  }, [token]);

  async function handleUnsubscribeAll() {
    setProcessing(true);
    setError(null);

    try {
      const result = await unsubscribeAllByToken(token);
      if (result.success) {
        setUnsubscribed(true);
      } else {
        setError(result.error || "Failed to unsubscribe. Please try again.");
      }
    } catch {
      setError("An unexpected error occurred. Please try again later.");
    } finally {
      setProcessing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error && !preferences) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="flex flex-col items-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-red-500" />
            <h2 className="mt-4 text-lg font-semibold">Unable to Process Request</h2>
            <p className="mt-2 text-muted-foreground">{error}</p>
            <Button variant="outline" className="mt-6" asChild>
              <a href="mailto:support@repwell.com">Contact Support</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (unsubscribed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="flex flex-col items-center py-12 text-center">
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
            <h2 className="mt-4 text-xl font-semibold">You&apos;ve Been Unsubscribed</h2>
            <p className="mt-2 text-muted-foreground">
              You will no longer receive marketing or promotional emails from RepWell at{" "}
              <span className="font-medium text-foreground">{preferences?.email}</span>.
            </p>
            <p className="mt-4 text-sm text-muted-foreground">
              Note: You may still receive essential transactional emails like password resets and security alerts.
            </p>
            <div className="mt-6 flex flex-col gap-3 w-full sm:flex-row sm:justify-center">
              <Button variant="outline" asChild>
                <Link href={`/email-preferences/${token}`}>
                  <Settings className="mr-2 h-4 w-4" />
                  Manage Preferences
                </Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/">Return to Home</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-lg px-4">
        {/* Header */}
        <div className="mb-8 text-center">
          <Image
            src="/logo.svg"
            alt="RepWell"
            width={140}
            height={40}
            className="mx-auto mb-4"
          />
        </div>

        <Card>
          <CardContent className="py-8">
            <div className="flex flex-col items-center text-center">
              <div className="rounded-full bg-muted p-3">
                <MailX className="h-8 w-8 text-muted-foreground" />
              </div>
              <h1 className="mt-4 text-xl font-semibold">Unsubscribe from Emails</h1>
              <p className="mt-2 text-muted-foreground">
                You&apos;re about to unsubscribe{" "}
                <span className="font-medium text-foreground">{preferences?.email}</span> from all
                RepWell emails.
              </p>
            </div>

            {error && (
              <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                {error}
              </div>
            )}

            <div className="mt-8 space-y-4">
              <Button
                variant="destructive"
                className="w-full"
                onClick={handleUnsubscribeAll}
                disabled={processing}
              >
                {processing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <MailX className="mr-2 h-4 w-4" />
                    Unsubscribe from All Emails
                  </>
                )}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              <Button variant="outline" className="w-full" asChild>
                <Link href={`/email-preferences/${token}`}>
                  <Settings className="mr-2 h-4 w-4" />
                  Manage Email Preferences
                </Link>
              </Button>
            </div>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              Instead of unsubscribing from everything, you can customize which emails you receive
              by managing your preferences.
            </p>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Having trouble?{" "}
          <a href="mailto:support@repwell.com" className="underline hover:text-foreground">
            Contact Support
          </a>
        </p>
      </div>
    </div>
  );
}
