"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FeedbackType, FEEDBACK_TYPE_CONFIG } from "@/types/recognition.types";
import { createManagerFeedback, searchUsers } from "@/lib/recognition/actions";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";
import { Search, Plus, Check, Loader2, Send, MessageSquare } from "lucide-react";
import { FEEDBACK_ICONS } from "./constants";

interface GiveFeedbackDialogProps {
  trigger?: React.ReactNode;
  onSuccess?: () => void;
  preselectedUser?: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
}

export function GiveFeedbackDialog({
  trigger,
  onSuccess,
  preselectedUser,
}: GiveFeedbackDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [selectedUser, setSelectedUser] = useState<{
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  } | null>(preselectedUser || null);
  const [feedbackType, setFeedbackType] = useState<FeedbackType>("praise");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [isPrivate, setIsPrivate] = useState(true);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    { id: string; name: string; email: string; avatarUrl?: string }[]
  >([]);
  const [isSearching, setIsSearching] = useState(false);

  const debouncedSearch = useDebounce(searchQuery, 300);

  // Load preselected user
  useEffect(() => {
    if (preselectedUser) {
      setSelectedUser(preselectedUser);
    }
  }, [preselectedUser]);

  // Search users
  const performSearch = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const result = await searchUsers(query);
    if (result.success && result.data) {
      setSearchResults(result.data);
    }
    setIsSearching(false);
  }, []);

  useEffect(() => {
    performSearch(debouncedSearch);
  }, [debouncedSearch, performSearch]);

  const handleSubmit = async () => {
    if (!selectedUser || !subject.trim() || !content.trim()) return;

    setIsSubmitting(true);
    try {
      const result = await createManagerFeedback({
        toUserId: selectedUser.id,
        type: feedbackType,
        subject: subject.trim(),
        content: content.trim(),
        isPrivate,
      });

      if (result.success) {
        // Reset form
        if (!preselectedUser) {
          setSelectedUser(null);
        }
        setFeedbackType("praise");
        setSubject("");
        setContent("");
        setIsPrivate(true);
        setSearchQuery("");
        setOpen(false);
        onSuccess?.();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    if (!preselectedUser) {
      setSelectedUser(null);
    }
    setFeedbackType("praise");
    setSubject("");
    setContent("");
    setIsPrivate(true);
    setSearchQuery("");
    setSearchResults([]);
  };

  const feedbackTypes = Object.entries(FEEDBACK_TYPE_CONFIG) as [
    FeedbackType,
    typeof FEEDBACK_TYPE_CONFIG[FeedbackType]
  ][];

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        setOpen(newOpen);
        if (!newOpen) resetForm();
      }}
    >
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Give Feedback
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Give Feedback</DialogTitle>
          <DialogDescription>
            Provide constructive feedback to help team members grow and develop.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* User Search */}
          <div className="space-y-2">
            <Label>Who is this feedback for?</Label>
            {selectedUser ? (
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={selectedUser.avatarUrl} />
                    <AvatarFallback>
                      {selectedUser.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{selectedUser.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedUser.email}
                    </p>
                  </div>
                </div>
                {!preselectedUser && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedUser(null);
                      setSearchQuery("");
                    }}
                  >
                    Change
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                  {isSearching && (
                    <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                  )}
                </div>
                {searchResults.length > 0 && (
                  <ScrollArea className="h-[150px] rounded-md border">
                    <div className="p-2 space-y-1">
                      {searchResults.map((user) => (
                        <button
                          key={user.id}
                          onClick={() => {
                            setSelectedUser(user);
                            setSearchResults([]);
                          }}
                          className="w-full flex items-center gap-3 rounded-lg p-2 hover:bg-muted transition-colors text-left"
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatarUrl} />
                            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{user.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {user.email}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            )}
          </div>

          {/* Feedback Type Selection */}
          <div className="space-y-2">
            <Label>Feedback Type</Label>
            <div className="grid grid-cols-2 gap-2">
              {feedbackTypes.map(([type, config]) => {
                const Icon = FEEDBACK_ICONS[config.icon] || MessageSquare;
                const isSelected = feedbackType === type;
                return (
                  <button
                    key={type}
                    onClick={() => setFeedbackType(type)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border p-3 text-left transition-all",
                      isSelected
                        ? cn("border-2", config.bgColor, config.color)
                        : "hover:bg-muted"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{config.label}</span>
                    {isSelected && <Check className="h-4 w-4 ml-auto" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              placeholder="Brief summary of the feedback..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={200}
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Feedback Details</Label>
            <Textarea
              id="content"
              placeholder="Provide specific, actionable feedback..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              maxLength={2000}
            />
            <p className="text-xs text-muted-foreground text-right">
              {content.length}/2000
            </p>
          </div>

          {/* Privacy Option */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="private" className="text-sm font-medium">
                Keep Private
              </Label>
              <p className="text-xs text-muted-foreground">
                Only you and the recipient can see this feedback
              </p>
            </div>
            <Switch
              id="private"
              checked={isPrivate}
              onCheckedChange={setIsPrivate}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              !selectedUser ||
              !subject.trim() ||
              !content.trim() ||
              content.length < 10 ||
              isSubmitting
            }
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send Feedback
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
