"use client";

import { useState } from "react";
import { CheckCircle, PaperPlaneTilt, SpinnerGap } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitPrivateFeedback } from "@/lib/video-testimonials/public-actions";
import { Panel, firstName } from "./testimonial-shell";

/** Low-path thank-you screen: gracious thanks plus optional private feedback. */
export function LowPathThankYou({
  token,
  customerFirst,
  professionalName,
  buttonStyle,
}: {
  token: string;
  customerFirst: string;
  professionalName: string;
  buttonStyle?: React.CSSProperties;
}) {
  const proFirst = firstName(professionalName);
  const [feedback, setFeedback] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    const text = feedback.trim();
    if (!text || sending) return;

    setSending(true);
    setError(null);
    try {
      const result = await submitPrivateFeedback(token, text);
      if (result.success) {
        setSent(true);
      } else {
        setError(result.error || "We could not send your feedback. Please try again.");
      }
    } catch (err) {
      console.error("Error sending private feedback:", err);
      setError("We could not send your feedback. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-1 animate-fade-in-up flex-col justify-center">
      <div className="text-center">
        <h1 className="text-balance font-display text-4xl tracking-tight text-repwell-teal-500">
          Thank you, {customerFirst}.
        </h1>
        <p className="mx-auto mt-4 max-w-sm font-sans text-base leading-relaxed text-repwell-teal-400">
          Your video is on its way to {professionalName}. We&apos;re grateful you took the time
          to share it.
        </p>
      </div>

      <Panel className="mx-auto mt-8 w-full max-w-md p-6 text-left">
        {sent ? (
          <div className="flex flex-col items-center py-2 text-center">
            <CheckCircle weight="fill" className="h-9 w-9 text-repwell-sage-200" />
            <p className="mt-3 font-sans text-sm font-medium text-repwell-teal-500">
              Sent privately to {proFirst}.
            </p>
            <p className="mt-1 font-sans text-xs text-repwell-teal-300">
              Thank you for being honest. It helps more than you know.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <Label
                htmlFor="privateFeedback"
                className="font-sans text-sm font-medium text-repwell-teal-500"
              >
                Anything {proFirst} could have done better?
              </Label>
              <p className="mt-1 font-sans text-xs text-repwell-teal-300">
                Optional. This goes privately to {proFirst}, never published anywhere.
              </p>
            </div>
            <Textarea
              id="privateFeedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={4}
              maxLength={2000}
              placeholder="Share as much or as little as you like"
              className="font-sans"
            />
            {error && <p className="font-sans text-xs text-[#c47c7c]">{error}</p>}
            <Button
              type="button"
              className="gap-2"
              style={buttonStyle}
              disabled={!feedback.trim() || sending}
              onClick={handleSend}
            >
              {sending ? (
                <>
                  <SpinnerGap className="h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <PaperPlaneTilt weight="fill" className="h-4 w-4" />
                  Send privately
                </>
              )}
            </Button>
          </div>
        )}
      </Panel>

      <p className="mt-6 text-center font-sans text-xs text-repwell-teal-300">
        You&apos;re all done. Feel free to close this page.
      </p>
    </div>
  );
}
