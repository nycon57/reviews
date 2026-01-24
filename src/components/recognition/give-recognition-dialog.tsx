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
import {
  Medal as Award,
  MagnifyingGlass as Search,
  Plus,
  Check,
  SpinnerGap as Loader2,
  PaperPlaneRight as Send,
} from "@phosphor-icons/react";
import { RecognitionBadge } from "@/types/recognition.types";
import { createRecognition, searchUsers, getRecognitionBadges } from "@/lib/recognition/actions";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";
import { BADGE_ICONS } from "./constants";

interface GiveRecognitionDialogProps {
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function GiveRecognitionDialog({ trigger, onSuccess }: GiveRecognitionDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [selectedUser, setSelectedUser] = useState<{
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  } | null>(null);
  const [selectedBadge, setSelectedBadge] = useState<RecognitionBadge | null>(null);
  const [message, setMessage] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    { id: string; name: string; email: string; avatarUrl?: string }[]
  >([]);
  const [isSearching, setIsSearching] = useState(false);

  // Badges
  const [badges, setBadges] = useState<RecognitionBadge[]>([]);
  const [isLoadingBadges, setIsLoadingBadges] = useState(true);

  const debouncedSearch = useDebounce(searchQuery, 300);

  // Load badges on open
  useEffect(() => {
    if (open && badges.length === 0) {
      loadBadges();
    }
  }, [open, badges.length]);

  const loadBadges = async () => {
    setIsLoadingBadges(true);
    const result = await getRecognitionBadges();
    if (result.success && result.data) {
      setBadges(result.data);
    }
    setIsLoadingBadges(false);
  };

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
    if (!selectedUser || !message.trim()) return;

    setIsSubmitting(true);
    try {
      const result = await createRecognition({
        toUserId: selectedUser.id,
        badgeId: selectedBadge?.id,
        message: message.trim(),
        isAnonymous,
      });

      if (result.success) {
        // Reset form
        setSelectedUser(null);
        setSelectedBadge(null);
        setMessage("");
        setIsAnonymous(false);
        setSearchQuery("");
        setOpen(false);
        onSuccess?.();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedUser(null);
    setSelectedBadge(null);
    setMessage("");
    setIsAnonymous(false);
    setSearchQuery("");
    setSearchResults([]);
  };

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
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Give Recognition
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Recognize a Colleague</DialogTitle>
          <DialogDescription>
            Show appreciation for great work and celebrate achievements.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* User Search */}
          <div className="space-y-2">
            <Label>Who would you like to recognize?</Label>
            {selectedUser ? (
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={selectedUser.avatarUrl} />
                    <AvatarFallback>{selectedUser.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{selectedUser.name}</p>
                    <p className="text-xs text-muted-foreground">{selectedUser.email}</p>
                  </div>
                </div>
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
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            )}
          </div>

          {/* Badge Selection */}
          <div className="space-y-2">
            <Label>Choose a badge (optional)</Label>
            {isLoadingBadges ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <ScrollArea className="h-[120px]">
                <div className="flex flex-wrap gap-2 p-1">
                  {badges.map((badge) => {
                    const Icon = BADGE_ICONS[badge.icon] || Award;
                    const isSelected = selectedBadge?.id === badge.id;
                    return (
                      <button
                        key={badge.id}
                        onClick={() => setSelectedBadge(isSelected ? null : badge)}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-all",
                          isSelected
                            ? "border-primary bg-primary/10 text-primary"
                            : "hover:bg-muted"
                        )}
                        style={
                          isSelected && badge.color
                            ? {
                                backgroundColor: `${badge.color}15`,
                                borderColor: badge.color,
                                color: badge.color,
                              }
                            : undefined
                        }
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {badge.name}
                        <span className="text-xs opacity-70">+{badge.points}</span>
                        {isSelected && <Check className="h-3.5 w-3.5 ml-0.5" />}
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Share what this person did that deserves recognition..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {message.length}/500
            </p>
          </div>

          {/* Options */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="anonymous" className="text-sm font-medium">
                Post anonymously
              </Label>
              <p className="text-xs text-muted-foreground">
                Your name will be hidden from the recognition
              </p>
            </div>
            <Switch
              id="anonymous"
              checked={isAnonymous}
              onCheckedChange={setIsAnonymous}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedUser || !message.trim() || message.length < 5 || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send Recognition
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
