"use client";

import { ChatCircle, CursorClick } from "@phosphor-icons/react";
import { IconContainer } from "@/components/shared";

interface MessagesEmptyStateProps {
  type: "no-conversations" | "no-selection" | "no-search-results";
}

export function MessagesEmptyState({ type }: MessagesEmptyStateProps) {
  if (type === "no-conversations") {
    return (
      <div className="text-center px-8 max-w-sm">
        <IconContainer size="xl" bg="soft" className="mx-auto mb-4 bg-repwell-sage-100/60 dark:bg-repwell-teal-300/15">
          <ChatCircle className="h-7 w-7 text-repwell-teal-300 dark:text-repwell-sage-200" />
        </IconContainer>
        <h3 className="text-sm font-semibold text-heading mb-1">
          No conversations yet
        </h3>
        <p className="text-xs text-repwell-teal-300/60 leading-relaxed">
          Conversations will appear here when customers reply to your SMS
          messages. Send a review request via SMS to get started.
        </p>
      </div>
    );
  }

  if (type === "no-search-results") {
    return (
      <div className="text-center px-8 max-w-sm">
        <h3 className="text-sm font-semibold text-heading mb-1">
          No results found
        </h3>
        <p className="text-xs text-repwell-teal-300/60">
          Try searching with a different phone number or keyword.
        </p>
      </div>
    );
  }

  // no-selection
  return (
    <div className="text-center px-8 max-w-sm">
      <IconContainer size="xl" bg="soft" className="mx-auto mb-4 bg-repwell-sage-100/60 dark:bg-repwell-teal-300/15">
        <CursorClick className="h-7 w-7 text-repwell-teal-300 dark:text-repwell-sage-200" />
      </IconContainer>
      <h3 className="text-sm font-semibold text-heading mb-1">
        Select a conversation
      </h3>
      <p className="text-xs text-repwell-teal-300/60 leading-relaxed">
        Choose a conversation from the list to view messages and reply.
        Use <kbd className="px-1 py-0.5 bg-repwell-sage-100/60 dark:bg-repwell-teal-300/15 rounded text-[10px] font-mono">↑</kbd>{" "}
        <kbd className="px-1 py-0.5 bg-repwell-sage-100/60 dark:bg-repwell-teal-300/15 rounded text-[10px] font-mono">↓</kbd> to
        navigate, <kbd className="px-1 py-0.5 bg-repwell-sage-100/60 dark:bg-repwell-teal-300/15 rounded text-[10px] font-mono">Esc</kbd> to
        deselect.
      </p>
    </div>
  );
}
