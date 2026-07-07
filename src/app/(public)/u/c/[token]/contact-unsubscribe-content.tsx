"use client";

import { useState, useCallback, useTransition } from "react";
import Image from "next/image";
import {
  EnvelopeSimple,
  CheckCircle,
  SpinnerGap,
} from "@phosphor-icons/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  type ContactUnsubscribeView,
  unsubscribeContactByToken,
  resubscribeContactByToken,
} from "./actions";

interface Props {
  token: string;
  initial: ContactUnsubscribeView;
}

/**
 * Contact-scoped, org-branded, no-login unsubscribe. Renders one of two live
 * states — subscribed (offer to unsubscribe) or unsubscribed (confirm + inline
 * resubscribe) — driven by the current suppression status.
 */
export function ContactUnsubscribeContent({ token, initial }: Props) {
  const [suppressed, setSuppressed] = useState(initial.suppressed);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const { organization, email } = initial;
  const accent = organization.primaryColor ?? undefined;

  const handleUnsubscribe = useCallback(() => {
    setError(null);
    startTransition(async () => {
      const res = await unsubscribeContactByToken(token);
      if (res.success) setSuppressed(true);
      else setError(res.error ?? "Something went wrong. Please try again.");
    });
  }, [token]);

  const handleResubscribe = useCallback(() => {
    setError(null);
    startTransition(async () => {
      const res = await resubscribeContactByToken(token);
      if (res.success) setSuppressed(false);
      else setError(res.error ?? "Something went wrong. Please try again.");
    });
  }, [token]);

  return (
    <div className="min-h-screen bg-repwell-sage-50 py-12">
      <div className="mx-auto max-w-lg px-4">
        <div className="mb-8 flex flex-col items-center text-center">
          {organization.logoUrl ? (
            <Image
              src={organization.logoUrl}
              alt={organization.name}
              width={140}
              height={40}
              className="mb-2 max-h-12 w-auto object-contain"
              unoptimized
            />
          ) : (
            <span className="font-display text-xl font-semibold text-heading">
              {organization.name}
            </span>
          )}
        </div>

        <Card>
          <CardContent className="py-8">
            {suppressed ? (
              <div className="flex flex-col items-center text-center">
                <div className="rounded-full bg-repwell-sage-100 p-3">
                  <CheckCircle
                    className="h-8 w-8 text-repwell-teal-400"
                    weight="fill"
                  />
                </div>
                <h1 className="mt-4 text-xl font-semibold text-heading">
                  You&apos;ve been unsubscribed
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  {email ? (
                    <>
                      <span className="font-medium text-foreground">{email}</span>{" "}
                      will no longer receive review or testimonial requests from{" "}
                      {organization.name}.
                    </>
                  ) : (
                    <>
                      You will no longer receive review or testimonial requests
                      from {organization.name}.
                    </>
                  )}
                </p>

                <p className="mt-6 text-sm text-muted-foreground">
                  Changed your mind?
                </p>
                <Button
                  variant="outline"
                  className="mt-2"
                  onClick={handleResubscribe}
                  disabled={pending}
                >
                  {pending ? (
                    <>
                      <SpinnerGap className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Resubscribe"
                  )}
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center">
                <div className="rounded-full bg-muted p-3">
                  <EnvelopeSimple className="h-8 w-8 text-muted-foreground" />
                </div>
                <h1 className="mt-4 text-xl font-semibold text-heading">
                  Unsubscribe from emails
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  {email ? (
                    <>
                      Stop sending review and testimonial requests to{" "}
                      <span className="font-medium text-foreground">{email}</span>{" "}
                      from {organization.name}.
                    </>
                  ) : (
                    <>
                      Stop sending review and testimonial requests from{" "}
                      {organization.name}.
                    </>
                  )}
                </p>

                <Button
                  className="mt-8 w-full"
                  onClick={handleUnsubscribe}
                  disabled={pending}
                  style={
                    accent
                      ? { backgroundColor: accent, borderColor: accent }
                      : undefined
                  }
                >
                  {pending ? (
                    <>
                      <SpinnerGap className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <EnvelopeSimple className="mr-2 h-4 w-4" />
                      Unsubscribe
                    </>
                  )}
                </Button>
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="mt-6 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-center text-sm text-destructive"
              >
                {error}
              </div>
            )}
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          This link manages requests from {organization.name} only.
        </p>
      </div>
    </div>
  );
}
