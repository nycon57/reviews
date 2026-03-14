"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Envelope as Mail,
  SpinnerGap as Loader2,
} from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { unifiedResendVerificationEmail } from "@/lib/auth/actions";

export default function VerifyEmailPage() {
  const [isResending, setIsResending] = useState(false);
  const { toast } = useToast();

  const handleResend = async () => {
    setIsResending(true);
    try {
      const result = await unifiedResendVerificationEmail();
      if (result.success) {
        toast({
          title: "Email sent!",
          description: "A new verification email has been sent.",
        });
      } else {
        toast({
          title: "Failed to resend",
          description: result.error || "Please try again.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Card>
      <CardHeader variant="plain" className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Mail className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-2xl">Verify your email</CardTitle>
        <CardDescription>
          We&apos;ve sent you a verification email
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-center text-sm text-muted-foreground">
          Please check your inbox and click the verification link to activate
          your account. The link will expire in 24 hours.
        </p>
        <div className="rounded-lg border bg-muted/50 p-4">
          <h4 className="mb-2 text-sm font-medium">Didn&apos;t receive the email?</h4>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>Check your spam or junk folder</li>
            <li>Make sure you entered the correct email address</li>
            <li>Wait a few minutes and try again</li>
          </ul>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-4">
        <Button
          variant="outline"
          className="w-full"
          onClick={handleResend}
          disabled={isResending}
        >
          {isResending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            "Resend verification email"
          )}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Wrong email?{" "}
          <Link href="/signup" className="text-primary hover:underline">
            Sign up again
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
