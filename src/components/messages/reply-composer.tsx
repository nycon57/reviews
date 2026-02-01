"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  PaperPlaneRight as SendIcon,
  CircleNotch as Loader2,
  Warning as AlertCircle,
} from "@phosphor-icons/react";
import { useToast } from "@/hooks/use-toast";
import { sendReply } from "@/lib/sms/messages/actions";
import { calculateSegments } from "@/lib/sms/segment-calculator";

interface ReplyComposerProps {
  conversationId: string;
  isDisabled: boolean;
  onMessageSent: () => void;
}

export function ReplyComposer({
  conversationId,
  isDisabled,
  onMessageSent,
}: ReplyComposerProps) {
  const [body, setBody] = React.useState("");
  const [isSending, setIsSending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  const segmentInfo = React.useMemo(() => calculateSegments(body), [body]);

  // Auto-resize textarea
  React.useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
    }
  }, [body]);

  const handleSend = async () => {
    if (!body.trim() || isSending || isDisabled) return;

    setIsSending(true);
    setError(null);

    const result = await sendReply({
      conversationId,
      body: body.trim(),
    });

    setIsSending(false);

    if (result.success) {
      setBody("");
      onMessageSent();
      // Re-focus the textarea after sending
      textareaRef.current?.focus();
    } else {
      setError(result.error);
      toast({
        title: "Failed to send",
        description: result.error,
        variant: "destructive",
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isDisabled) {
    return (
      <div className="px-4 py-3 border-t border-border bg-background-subtle">
        <p className="text-xs text-repwell-teal-300/60 text-center">
          This conversation is archived. Reopen it to send messages.
        </p>
      </div>
    );
  }

  return (
    <div className="border-t border-border bg-white flex-shrink-0">
      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 text-xs">
          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="p-3">
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={body}
              onChange={(e) => {
                setBody(e.target.value);
                setError(null);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
              className={cn(
                "min-h-[40px] max-h-[160px] resize-none pr-3 text-sm",
                "border-border bg-background-subtle",
                "placeholder:text-repwell-teal-300/50",
                "focus-visible:ring-repwell-teal-300/30"
              )}
              disabled={isSending}
              rows={1}
            />
          </div>

          <Button
            onClick={handleSend}
            disabled={!body.trim() || isSending}
            size="sm"
            className={cn(
              "h-10 w-10 p-0 rounded-lg flex-shrink-0",
              "bg-repwell-teal-300 hover:bg-repwell-teal-400 text-white",
              "disabled:opacity-40"
            )}
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <SendIcon className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Character/segment counter */}
        {body.length > 0 && (
          <div className="flex items-center justify-between mt-1.5 px-1">
            <span className="text-[10px] text-repwell-teal-300/50">
              {segmentInfo.encoding === "UCS-2" && (
                <span className="text-amber-500 mr-1">Unicode</span>
              )}
              {segmentInfo.characterCount} chars
            </span>
            <span
              className={cn(
                "text-[10px]",
                segmentInfo.segments > 1
                  ? "text-amber-500"
                  : "text-repwell-teal-300/50"
              )}
            >
              {segmentInfo.segments} segment{segmentInfo.segments !== 1 ? "s" : ""}
              {segmentInfo.segments > 1 && ` (${segmentInfo.segments} credits)`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
