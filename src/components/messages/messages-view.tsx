"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  getConversations,
  getConversationMessages,
  markConversationRead,
  type ConversationListItem,
  type ConversationMessage,
} from "@/lib/sms/messages/actions";
import { ConversationList } from "./conversation-list";
import { ConversationDetail } from "./conversation-detail";
import { EmptyState } from "./empty-state";

export function MessagesView() {
  const [conversations, setConversations] = React.useState<ConversationListItem[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [messages, setMessages] = React.useState<ConversationMessage[]>([]);
  const [selectedConversation, setSelectedConversation] = React.useState<ConversationListItem | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = React.useState(false);
  const [statusFilter, setStatusFilter] = React.useState("active");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [showMobileDetail, setShowMobileDetail] = React.useState(false);
  const { toast } = useToast();
  const previousUnreadRef = React.useRef<Record<string, number>>({});
  const pollingRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  // Load conversations
  const loadConversations = React.useCallback(async () => {
    const result = await getConversations({
      status: statusFilter,
      search: searchQuery || undefined,
    });
    if (result.success && result.data) {
      // Check for new inbound messages (toast notification)
      const prevUnread = previousUnreadRef.current;
      for (const conv of result.data) {
        const prev = prevUnread[conv.id] ?? 0;
        if (conv.unreadCount > prev && prev >= 0 && Object.keys(prevUnread).length > 0) {
          toast({
            title: "New message",
            description: `New message from ${conv.borrowerPhoneDisplay}`,
          });
        }
      }
      // Update previous unread state
      const newUnread: Record<string, number> = {};
      for (const conv of result.data) {
        newUnread[conv.id] = conv.unreadCount;
      }
      previousUnreadRef.current = newUnread;
      setConversations(result.data);
    }
    setIsLoading(false);
  }, [statusFilter, searchQuery, toast]);

  // Initial load + polling every 15 seconds
  React.useEffect(() => {
    loadConversations();
    pollingRef.current = setInterval(loadConversations, 15000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [loadConversations]);

  // Load messages for selected conversation
  const loadMessages = React.useCallback(async (conversationId: string) => {
    setIsLoadingMessages(true);
    const result = await getConversationMessages(conversationId);
    if (result.success && result.data) {
      setMessages(result.data.messages);
      setSelectedConversation(result.data.conversation);
      // Mark as read
      if (result.data.conversation.unreadCount > 0) {
        await markConversationRead(conversationId);
        // Update local state
        setConversations((prev) =>
          prev.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c))
        );
        previousUnreadRef.current[conversationId] = 0;
      }
    }
    setIsLoadingMessages(false);
  }, []);

  // Poll messages for selected conversation
  React.useEffect(() => {
    if (!selectedId) return;
    loadMessages(selectedId);
    const interval = setInterval(() => loadMessages(selectedId), 15000);
    return () => clearInterval(interval);
  }, [selectedId, loadMessages]);

  // Select a conversation
  const handleSelect = React.useCallback((id: string) => {
    setSelectedId(id);
    setShowMobileDetail(true);
  }, []);

  // Handle message sent (optimistic refresh)
  const handleMessageSent = React.useCallback(() => {
    if (selectedId) {
      loadMessages(selectedId);
    }
    loadConversations();
  }, [selectedId, loadMessages, loadConversations]);

  // Handle conversation update (status change, reassignment)
  const handleConversationUpdated = React.useCallback(() => {
    loadConversations();
    if (selectedId) {
      loadMessages(selectedId);
    }
  }, [loadConversations, loadMessages, selectedId]);

  // Keyboard navigation
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Only handle when not focused on an input
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
        if (e.key === "Escape") {
          target.blur();
        }
        return;
      }

      if (e.key === "Escape") {
        setSelectedId(null);
        setShowMobileDetail(false);
        return;
      }

      if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        e.preventDefault();
        const currentIndex = conversations.findIndex((c) => c.id === selectedId);
        let nextIndex: number;
        if (e.key === "ArrowUp") {
          nextIndex = currentIndex <= 0 ? conversations.length - 1 : currentIndex - 1;
        } else {
          nextIndex = currentIndex >= conversations.length - 1 ? 0 : currentIndex + 1;
        }
        if (conversations[nextIndex]) {
          handleSelect(conversations[nextIndex].id);
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [conversations, selectedId, handleSelect]);

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden bg-background">
      {/* Conversation list panel */}
      <div
        className={cn(
          "w-full md:w-80 lg:w-96 flex-shrink-0 border-r border-border flex flex-col",
          showMobileDetail && "hidden md:flex"
        )}
      >
        <ConversationList
          conversations={conversations}
          selectedId={selectedId}
          isLoading={isLoading}
          statusFilter={statusFilter}
          searchQuery={searchQuery}
          onSelect={handleSelect}
          onStatusFilterChange={setStatusFilter}
          onSearchChange={setSearchQuery}
        />
      </div>

      {/* Conversation detail panel */}
      <div
        className={cn(
          "flex-1 flex flex-col min-w-0",
          !showMobileDetail && "hidden md:flex"
        )}
      >
        <AnimatePresence mode="wait">
          {selectedId && selectedConversation ? (
            <motion.div
              key={selectedId}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col h-full"
            >
              <ConversationDetail
                conversation={selectedConversation}
                messages={messages}
                isLoading={isLoadingMessages}
                onMessageSent={handleMessageSent}
                onConversationUpdated={handleConversationUpdated}
                onBack={() => setShowMobileDetail(false)}
              />
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 flex items-center justify-center"
            >
              <EmptyState
                type={conversations.length === 0 ? "no-conversations" : "no-selection"}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
