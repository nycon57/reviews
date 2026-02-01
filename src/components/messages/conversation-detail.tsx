"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft,
  DotsThree as MoreHorizontal,
  Check,
  Checks as CheckCheck,
  Warning as AlertCircle,
  Clock,
  Archive,
  XCircle,
  ArrowClockwise as RotateCcw,
  UserCircle,
} from "@phosphor-icons/react";
import { useToast } from "@/hooks/use-toast";
import {
  updateConversationStatus,
  reassignConversation,
  getTeamMembers,
  type ConversationListItem,
  type ConversationMessage,
  type TeamMember,
} from "@/lib/sms/messages/actions";
import { ReplyComposer } from "./reply-composer";

interface ConversationDetailProps {
  conversation: ConversationListItem;
  messages: ConversationMessage[];
  isLoading: boolean;
  onMessageSent: () => void;
  onConversationUpdated: () => void;
  onBack: () => void;
}

export function ConversationDetail({
  conversation,
  messages,
  isLoading,
  onMessageSent,
  onConversationUpdated,
  onBack,
}: ConversationDetailProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [teamMembers, setTeamMembers] = React.useState<TeamMember[]>([]);
  const [isUpdating, setIsUpdating] = React.useState(false);

  // Auto-scroll to bottom on new messages
  React.useEffect(() => {
    if (scrollRef.current) {
      const el = scrollRef.current;
      // Use requestAnimationFrame to ensure DOM is updated
      requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight;
      });
    }
  }, [messages]);

  // Load team members for assignment dropdown
  React.useEffect(() => {
    getTeamMembers().then((result) => {
      if (result.success && result.data) {
        setTeamMembers(result.data);
      }
    });
  }, []);

  const handleStatusChange = async (status: "active" | "closed" | "archived") => {
    setIsUpdating(true);
    const result = await updateConversationStatus({
      conversationId: conversation.id,
      status,
    });
    setIsUpdating(false);
    if (result.success) {
      toast({ title: `Conversation ${status}` });
      onConversationUpdated();
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
  };

  const handleReassign = async (loId: string | null) => {
    setIsUpdating(true);
    const result = await reassignConversation({
      conversationId: conversation.id,
      loanOfficerId: loId,
    });
    setIsUpdating(false);
    if (result.success) {
      toast({ title: loId ? "Conversation reassigned" : "Assignment removed" });
      onConversationUpdated();
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border flex-shrink-0">
        {/* Mobile back button */}
        <button
          onClick={onBack}
          className="md:hidden flex items-center justify-center h-8 w-8 rounded-lg hover:bg-repwell-sage-100/50 transition-colors"
          aria-label="Back to conversations"
        >
          <ArrowLeft className="h-4 w-4 text-repwell-teal-400" />
        </button>

        <Avatar className="h-9 w-9 flex-shrink-0">
          <AvatarFallback className="bg-repwell-teal-300/10 text-repwell-teal-300 text-xs font-semibold">
            {(conversation.borrowerName ?? conversation.borrowerPhoneDisplay)
              .replace(/[^A-Za-z0-9]/g, "")
              .slice(0, 2)
              .toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-repwell-teal-500 truncate">
            {conversation.borrowerName ?? conversation.borrowerPhoneDisplay}
          </p>
          {conversation.borrowerName && (
            <p className="text-xs text-repwell-teal-300/60">
              {conversation.borrowerPhoneDisplay}
            </p>
          )}
        </div>

        {/* Status badge */}
        <span
          className={cn(
            "px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide",
            conversation.status === "active" && "bg-green-100 text-green-700",
            conversation.status === "closed" && "bg-gray-100 text-gray-600",
            conversation.status === "archived" && "bg-amber-100 text-amber-700"
          )}
        >
          {conversation.status}
        </span>

        {/* Actions menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-repwell-teal-400 hover:text-repwell-teal-500"
              disabled={isUpdating}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {/* Status actions */}
            {conversation.status !== "active" && (
              <DropdownMenuItem onClick={() => handleStatusChange("active")}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reopen conversation
              </DropdownMenuItem>
            )}
            {conversation.status !== "closed" && (
              <DropdownMenuItem onClick={() => handleStatusChange("closed")}>
                <XCircle className="h-4 w-4 mr-2" />
                Close conversation
              </DropdownMenuItem>
            )}
            {conversation.status !== "archived" && (
              <DropdownMenuItem onClick={() => handleStatusChange("archived")}>
                <Archive className="h-4 w-4 mr-2" />
                Archive conversation
              </DropdownMenuItem>
            )}

            {/* Assignment actions */}
            {teamMembers.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <div className="px-2 py-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-repwell-teal-300/60">
                    Assign to
                  </p>
                </div>
                {teamMembers.map((member) => (
                  <DropdownMenuItem
                    key={member.id}
                    onClick={() => handleReassign(member.id)}
                  >
                    <UserCircle className="h-4 w-4 mr-2" />
                    <span className="truncate">{member.fullName}</span>
                    {conversation.assignedLoId === member.id && (
                      <Check className="h-3 w-3 ml-auto text-repwell-teal-300" />
                    )}
                  </DropdownMenuItem>
                ))}
                {conversation.assignedLoId && (
                  <DropdownMenuItem onClick={() => handleReassign(null)}>
                    <XCircle className="h-4 w-4 mr-2" />
                    Remove assignment
                  </DropdownMenuItem>
                )}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Message thread */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <MessageSkeleton key={i} isOutbound={i % 2 === 1} />
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <p className="text-sm font-medium text-repwell-teal-400">
                No messages yet
              </p>
              <p className="text-xs text-repwell-teal-300/60 mt-1">
                Send a message to start the conversation
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg, idx) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                showTimestamp={
                  idx === 0 ||
                  shouldShowTimestamp(messages[idx - 1].createdAt, msg.createdAt)
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* Reply composer */}
      <ReplyComposer
        conversationId={conversation.id}
        isDisabled={conversation.status === "archived"}
        onMessageSent={onMessageSent}
      />
    </>
  );
}

// ── Message Bubble ──────────────────────────────────────────────────

interface MessageBubbleProps {
  message: ConversationMessage;
  showTimestamp: boolean;
}

function MessageBubble({ message, showTimestamp }: MessageBubbleProps) {
  const isOutbound = message.direction === "outbound";

  return (
    <div>
      {showTimestamp && (
        <div className="flex justify-center my-4">
          <span className="text-[10px] text-repwell-teal-300/50 bg-background-subtle px-3 py-1 rounded-full">
            {formatMessageDate(message.createdAt)}
          </span>
        </div>
      )}

      <div
        className={cn(
          "flex",
          isOutbound ? "justify-end" : "justify-start"
        )}
      >
        <div
          className={cn(
            "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
            isOutbound
              ? "bg-repwell-teal-300 text-white rounded-br-md"
              : "bg-background-muted text-repwell-teal-500 rounded-bl-md"
          )}
        >
          <p className="whitespace-pre-wrap break-words">{message.body}</p>

          {/* Status + time */}
          <div
            className={cn(
              "flex items-center gap-1 mt-1",
              isOutbound ? "justify-end" : "justify-start"
            )}
          >
            <span
              className={cn(
                "text-[10px]",
                isOutbound ? "text-white/60" : "text-repwell-teal-300/50"
              )}
            >
              {formatTime(message.sentAt ?? message.createdAt)}
            </span>

            {isOutbound && <DeliveryStatusIcon status={message.status} />}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Delivery Status Icon ────────────────────────────────────────────

function DeliveryStatusIcon({ status }: { status: string }) {
  switch (status) {
    case "delivered":
      return <CheckCheck className="h-3 w-3 text-white/80" />;
    case "sent":
      return <Check className="h-3 w-3 text-white/60" />;
    case "queued":
      return <Clock className="h-3 w-3 text-white/50" />;
    case "failed":
    case "undelivered":
      return <AlertCircle className="h-3 w-3 text-red-300" />;
    default:
      return null;
  }
}

// ── Skeletons ───────────────────────────────────────────────────────

function MessageSkeleton({ isOutbound }: { isOutbound: boolean }) {
  return (
    <div className={cn("flex", isOutbound ? "justify-end" : "justify-start")}>
      <Skeleton
        className={cn("h-12 rounded-2xl", isOutbound ? "w-48" : "w-56")}
      />
    </div>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────

function shouldShowTimestamp(prevDate: string, currentDate: string): boolean {
  const prev = new Date(prevDate);
  const current = new Date(currentDate);
  // Show timestamp if > 30 minutes apart
  return current.getTime() - prev.getTime() > 30 * 60 * 1000;
}

function formatMessageDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isToday) return "Today";
  if (isYesterday) return "Yesterday";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}
