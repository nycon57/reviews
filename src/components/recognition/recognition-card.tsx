"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ThumbsUp,
  DotsThree as MoreHorizontal,
  Trash as Trash2,
  User,
  Medal as Award,
} from "@phosphor-icons/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Recognition, formatRecognitionDate, REACTION_EMOJIS } from "@/types/recognition.types";
import { toggleReaction, deleteRecognition } from "@/lib/recognition/actions";
import { cn } from "@/lib/utils";
import { BADGE_ICONS } from "./constants";

interface RecognitionCardProps {
  recognition: Recognition;
  currentUserId?: string;
  onDelete?: (id: string) => void;
  onReactionUpdate?: (id: string, newReaction?: string) => void;
}

export function RecognitionCard({ recognition, currentUserId, onDelete, onReactionUpdate }: RecognitionCardProps) {
  const [isReacting, setIsReacting] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const BadgeIcon = recognition.badge?.icon
    ? BADGE_ICONS[recognition.badge.icon] || Award
    : Award;

  const handleReaction = async (emoji: string) => {
    setIsReacting(true);
    try {
      const result = await toggleReaction(recognition.id, emoji);
      if (result.success) {
        // Determine if this is adding or removing a reaction
        const newReaction = recognition.userReaction === emoji ? undefined : emoji;
        onReactionUpdate?.(recognition.id, newReaction);
      }
    } finally {
      setIsReacting(false);
      setShowReactions(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this recognition?")) return;
    setIsDeleting(true);
    try {
      const result = await deleteRecognition(recognition.id);
      if (result.success) {
        onDelete?.(recognition.id);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const isOwnRecognition = currentUserId === recognition.fromUserId;

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* From User Avatar */}
          <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
            {recognition.isAnonymous ? (
              <AvatarFallback className="bg-muted">
                <User className="h-5 w-5 text-muted-foreground" />
              </AvatarFallback>
            ) : (
              <>
                <AvatarImage src={recognition.fromUser?.avatarUrl} />
                <AvatarFallback className="bg-primary/10 text-primary font-medium">
                  {recognition.fromUser?.name?.charAt(0) || "?"}
                </AvatarFallback>
              </>
            )}
          </Avatar>

          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1 flex-wrap text-sm">
                <span className="font-medium">
                  {recognition.isAnonymous ? "Someone" : recognition.fromUser?.name || "Unknown"}
                </span>
                <span className="text-muted-foreground">recognized</span>
                <span className="font-medium">{recognition.toUser?.name || "Unknown"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatRecognitionDate(recognition.createdAt)}
                </span>
                {isOwnRecognition && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>

            {/* Badge */}
            {recognition.badge && (
              <div className="mt-2">
                <Badge
                  variant="secondary"
                  className="gap-1.5 py-1"
                  style={{
                    backgroundColor: recognition.badge.color
                      ? `${recognition.badge.color}15`
                      : undefined,
                    color: recognition.badge.color || undefined,
                    borderColor: recognition.badge.color
                      ? `${recognition.badge.color}30`
                      : undefined,
                  }}
                >
                  <BadgeIcon className="h-3.5 w-3.5" />
                  {recognition.badge.name}
                  <span className="text-xs opacity-70">+{recognition.badge.points} pts</span>
                </Badge>
              </div>
            )}

            {/* Message */}
            <p className="mt-2 text-sm text-foreground/90">{recognition.message}</p>

            {/* Reactions */}
            <div className="mt-3 flex items-center gap-2">
              {/* Existing reactions */}
              {recognition.reactionCount && recognition.reactionCount > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-sm">
                    {recognition.reactions?.slice(0, 3).map((r) => r.emoji).join("")}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {recognition.reactionCount}
                  </span>
                </div>
              )}

              {/* Reaction button */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-7 gap-1 text-xs",
                    recognition.userReaction && "text-primary"
                  )}
                  onClick={() => {
                    if (recognition.userReaction) {
                      handleReaction(recognition.userReaction);
                    } else {
                      setShowReactions(!showReactions);
                    }
                  }}
                  disabled={isReacting}
                >
                  {recognition.userReaction ? (
                    <span>{recognition.userReaction}</span>
                  ) : (
                    <ThumbsUp className="h-3.5 w-3.5" />
                  )}
                  {!recognition.userReaction && "React"}
                </Button>

                {/* Reaction picker */}
                {showReactions && (
                  <div className="absolute bottom-full left-0 mb-1 flex gap-1 rounded-lg border bg-background p-1.5 shadow-lg">
                    {REACTION_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => handleReaction(emoji)}
                        className="h-7 w-7 rounded hover:bg-muted transition-colors text-base"
                        disabled={isReacting}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
