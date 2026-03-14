"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  ChatText,
  ShieldCheck,
  SpinnerGap as Loader2,
  ArrowRight,
  CheckCircle,
  Star,
  ChartBar,
  VideoCamera,
} from "@phosphor-icons/react";
import { completeSmsSetup, skipSmsSetup } from "@/lib/onboarding/actions";

const SMS_FEATURES = [
  { icon: Star, label: "Send review requests via SMS" },
  { icon: ChartBar, label: "NPS surveys with auto-scoring" },
  { icon: VideoCamera, label: "Video testimonial requests" },
  { icon: ChatText, label: "Two-way SMS conversations" },
];

export function SmsSetupClient({ plan }: { plan: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [tcpaAccepted, setTcpaAccepted] = React.useState(false);
  const [tosAccepted, setTosAccepted] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [skipping, setSkipping] = React.useState(false);

  const canEnable = tcpaAccepted && tosAccepted;
  const creditsIncluded = plan === "enterprise" ? "2,000" : "100";

  const handleEnable = async () => {
    if (!canEnable) return;
    setLoading(true);
    try {
      const result = await completeSmsSetup({ tcpaAccepted, tosAccepted });
      if (result.success) {
        toast({ title: "SMS enabled", description: "SMS has been configured for your organization." });
        router.push(result.redirectTo || "/onboarding/complete");
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "An unexpected error occurred", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    setSkipping(true);
    try {
      const result = await skipSmsSetup();
      if (result.success) {
        router.push(result.redirectTo || "/onboarding/complete");
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "An unexpected error occurred", variant: "destructive" });
    } finally {
      setSkipping(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center space-y-3">
        <div className="mx-auto w-fit rounded-full bg-repwell-sage-100 p-3">
          <ChatText className="h-8 w-8 text-repwell-teal-400" />
        </div>
        <h1 className="text-2xl font-semibold text-repwell-teal-500">Enable SMS Messaging</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Reach your customers where they are. Your {plan} plan includes{" "}
          {creditsIncluded} SMS credits per month.
        </p>
      </div>

      <Card>
        <CardHeader variant="plain">
          <CardTitle>What SMS Enables</CardTitle>
          <CardDescription>Powerful tools to boost engagement and collect more reviews</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {SMS_FEATURES.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3 rounded-lg border p-3">
                <div className="rounded-md bg-repwell-sage-100/50 p-2">
                  <Icon className="h-4 w-4 text-repwell-teal-400" />
                </div>
                <span className="text-sm font-medium">{label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader variant="plain">
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Compliance & Terms
          </CardTitle>
          <CardDescription>SMS messaging requires TCPA compliance acknowledgment</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg border p-4">
            <Checkbox
              id="tcpa"
              checked={tcpaAccepted}
              onCheckedChange={(checked) => setTcpaAccepted(checked === true)}
              className="mt-0.5"
            />
            <Label htmlFor="tcpa" className="text-sm leading-relaxed cursor-pointer">
              I acknowledge that my organization will comply with the Telephone Consumer
              Protection Act (TCPA) and all applicable regulations. SMS messages may only be
              sent to recipients who have provided express written consent, and all messages
              must include opt-out instructions.
            </Label>
          </div>
          <div className="flex items-start gap-3 rounded-lg border p-4">
            <Checkbox
              id="tos"
              checked={tosAccepted}
              onCheckedChange={(checked) => setTosAccepted(checked === true)}
              className="mt-0.5"
            />
            <Label htmlFor="tos" className="text-sm leading-relaxed cursor-pointer">
              I agree to RepWell&apos;s SMS Terms of Service and understand that standard
              messaging rates may apply. Credits are allocated per billing period and overage
              charges may apply based on my plan.
            </Label>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <Button variant="ghost" onClick={handleSkip} disabled={loading || skipping}>
          {skipping && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Skip for Now
        </Button>
        <Button onClick={handleEnable} disabled={!canEnable || loading || skipping}>
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle className="mr-2 h-4 w-4" />
          )}
          Enable SMS
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
