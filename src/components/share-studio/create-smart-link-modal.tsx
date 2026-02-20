"use client";

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SmartLinkQRCode } from "@/components/share-studio/smart-link-qr-code";
import { cn } from "@/lib/utils";
import {
  LinkSimple,
  ArrowSquareOut,
  Check,
  Copy,
  CircleNotch,
  Warning,
} from "@phosphor-icons/react";
import { shareReviewAsSmartLink } from "@/lib/share-studio/actions";

interface CreateSmartLinkModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reviewId?: string;
  reviewTitle?: string;
  onSuccess?: (slug: string, url: string) => void;
}

type ModalState = "loading" | "success" | "error";

export function CreateSmartLinkModal({
  open,
  onOpenChange,
  reviewId,
  reviewTitle,
  onSuccess,
}: CreateSmartLinkModalProps) {
  const [state, setState] = useState<ModalState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [resultSlug, setResultSlug] = useState("");
  const [copied, setCopied] = useState(false);
  const triggeredRef = useRef(false);

  const fullUrl = resultSlug
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/s/${resultSlug}`
    : "";

  useEffect(() => {
    if (!open) {
      triggeredRef.current = false;
      return;
    }
    if (triggeredRef.current) return;
    triggeredRef.current = true;

    handleCreate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function handleCreate() {
    if (!reviewId) {
      setErrorMessage("No review selected. Please close and try again.");
      setState("error");
      return;
    }

    setState("loading");
    setErrorMessage("");

    try {
      const result = await shareReviewAsSmartLink(reviewId);

      if (!result.success) {
        throw new Error(result.error ?? "Something went wrong");
      }

      if (!result.slug) {
        throw new Error("Smart link was created but no slug was returned");
      }

      setResultSlug(result.slug);
      setState("success");

      const url = `${window.location.origin}/s/${result.slug}`;
      onSuccess?.(result.slug, url);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong");
      setState("error");
    }
  }

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  function handleClose() {
    onOpenChange(false);
    setTimeout(() => {
      setState("loading");
      setErrorMessage("");
      setResultSlug("");
      setCopied(false);
    }, 200);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px]">
        {state === "loading" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CircleNotch className="h-5 w-5 animate-spin text-primary" />
                Creating Smart Link…
              </DialogTitle>
              <DialogDescription>
                Generating a shareable page from this review.
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center justify-center py-8">
              <CircleNotch className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          </>
        )}

        {state === "error" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Warning className="h-5 w-5 text-destructive" />
                Something went wrong
              </DialogTitle>
              <DialogDescription>
                We couldn&apos;t create the Smart Link. You can try again below.
              </DialogDescription>
            </DialogHeader>

            <div className="py-2">
              <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
                <Warning className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  triggeredRef.current = false;
                  handleCreate();
                }}
                className="gap-2"
              >
                <LinkSimple className="h-4 w-4" />
                Try Again
              </Button>
            </DialogFooter>
          </>
        )}

        {state === "success" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-600" weight="bold" />
                Smart Link Created!
              </DialogTitle>
              <DialogDescription>
                Your smart link is live and ready to share.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2">
                <span className="flex-1 truncate text-sm text-foreground">{fullUrl}</span>
                <button
                  type="button"
                  onClick={copyUrl}
                  className={cn(
                    "shrink-0 transition-colors",
                    copied ? "text-green-600" : "text-muted-foreground hover:text-foreground"
                  )}
                  aria-label={copied ? "Copied" : "Copy URL"}
                >
                  {copied ? (
                    <Check className="h-4 w-4" weight="bold" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>

              <SmartLinkQRCode
                url={fullUrl}
                title={reviewTitle}
                className="border border-border"
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-2">
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => window.open(fullUrl, "_blank", "noopener,noreferrer")}
              >
                <ArrowSquareOut className="h-4 w-4" />
                View Link
              </Button>
              <Button onClick={handleClose}>Done</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
