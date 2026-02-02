"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  getSocialConnections,
  publishToSocial,
  schedulePost,
} from "@/lib/social-graphics/publish-actions";
import { generateCaption } from "@/lib/social-graphics/caption-actions";
import {
  PLATFORM_LABELS,
  PLATFORM_CHAR_LIMITS,
  type SocialConnection,
  type SocialPlatform,
} from "@/lib/social-graphics/types";

interface PublishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  graphicId: string;
  renderUrl: string | null;
  orgName: string;
  reviewText?: string | null;
  customerName?: string | null;
  rating?: number;
}

type Mode = "publish" | "schedule";

export function PublishDialog({
  open,
  onOpenChange,
  graphicId,
  renderUrl,
  orgName,
  reviewText,
  customerName,
  rating,
}: PublishDialogProps) {
  const [connections, setConnections] = useState<SocialConnection[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [caption, setCaption] = useState("");
  const [mode, setMode] = useState<Mode>("publish");
  const [scheduledFor, setScheduledFor] = useState("");
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect -- reset state on dialog open */
  useEffect(() => {
    if (open) {
      void getSocialConnections().then((res) => {
        if (res.success) setConnections(res.data);
      });
      setSuccess(false);
      setError(null);
    }
  }, [open]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
  };

  const handleGenerateCaption = useCallback(async () => {
    setGenerating(true);
    const platform = selectedPlatforms[0] ?? "facebook";
    const result = await generateCaption({
      reviewText,
      customerName,
      rating,
      platform,
      orgName,
    });
    if (result.success) setCaption(result.data);
    else setError(result.error);
    setGenerating(false);
  }, [selectedPlatforms, reviewText, customerName, rating, orgName]);

  const handleSubmit = useCallback(async () => {
    if (selectedPlatforms.length === 0) {
      setError("Select at least one platform");
      return;
    }
    if (!renderUrl) {
      setError("Export the graphic first before publishing");
      return;
    }

    setLoading(true);
    setError(null);

    const result =
      mode === "schedule"
        ? await schedulePost({
            graphicId,
            platforms: selectedPlatforms,
            caption,
            scheduledFor,
          })
        : await publishToSocial({
            graphicId,
            platforms: selectedPlatforms,
            caption,
          });

    if (result.success) {
      setSuccess(true);
    } else {
      setError(result.error);
    }
    setLoading(false);
  }, [selectedPlatforms, renderUrl, mode, graphicId, caption, scheduledFor]);

  const activePlatform = selectedPlatforms[0] as SocialPlatform | undefined;
  const charLimit = activePlatform ? PLATFORM_CHAR_LIMITS[activePlatform] : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {success ? "Published!" : "Publish to Social Media"}
          </DialogTitle>
        </DialogHeader>

        {success ? (
          <div className="py-6 text-center">
            <p className="text-sm text-muted-foreground">
              {mode === "schedule"
                ? "Post scheduled successfully."
                : "Post published successfully."}
            </p>
            <Button
              className="mt-4"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-4 py-2">
              {!renderUrl && (
                <div className="rounded-md bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
                  Export the graphic first to enable publishing.
                </div>
              )}

              {/* Platform selection */}
              <div>
                <label className="text-sm font-medium">Platforms</label>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {connections.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      No connected accounts. Connect accounts in Settings.
                    </p>
                  ) : (
                    connections.map((c) => (
                      <Button
                        key={c.id}
                        variant={
                          selectedPlatforms.includes(c.platform)
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={() => togglePlatform(c.platform)}
                      >
                        {PLATFORM_LABELS[c.platform] ?? c.platform}
                        {c.account_name ? ` (${c.account_name})` : ""}
                      </Button>
                    ))
                  )}
                </div>
              </div>

              {/* Caption */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Caption</label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleGenerateCaption}
                    disabled={generating}
                  >
                    {generating ? "Generating..." : "AI Generate"}
                  </Button>
                </div>
                <textarea
                  className="mt-1.5 w-full rounded-md border bg-background px-3 py-2 text-sm"
                  rows={4}
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Write a caption for your post..."
                />
                {charLimit && (
                  <p
                    className={`mt-1 text-xs ${caption.length > charLimit ? "text-destructive" : "text-muted-foreground"}`}
                  >
                    {caption.length}/{charLimit}
                  </p>
                )}
              </div>

              {/* Mode toggle */}
              <div className="flex gap-2">
                <Button
                  variant={mode === "publish" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMode("publish")}
                >
                  Publish Now
                </Button>
                <Button
                  variant={mode === "schedule" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMode("schedule")}
                >
                  Schedule
                </Button>
              </div>

              {mode === "schedule" && (
                <Input
                  type="datetime-local"
                  value={scheduledFor}
                  onChange={(e) => setScheduledFor(e.target.value)}
                />
              )}

              {/* Preview thumbnail */}
              {renderUrl && (
                <div>
                  <label className="text-sm font-medium">Preview</label>
                  <img
                    src={renderUrl}
                    alt="Graphic preview"
                    className="mt-1.5 max-h-40 rounded-md border"
                  />
                </div>
              )}

              {error && (
                <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                onClick={handleSubmit}
                disabled={loading || !renderUrl || selectedPlatforms.length === 0}
              >
                {loading
                  ? "Publishing..."
                  : mode === "schedule"
                    ? "Schedule Post"
                    : "Publish"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
