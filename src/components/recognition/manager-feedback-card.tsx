"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ManagerFeedback,
  FEEDBACK_TYPE_CONFIG,
  formatRecognitionDate,
} from "@/types/recognition.types";
import { deleteManagerFeedback } from "@/lib/recognition/actions";
import {
  DotsThree as MoreHorizontal,
  Trash as Trash2,
  Lock,
  Chats as MessageSquare,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { FEEDBACK_ICONS } from "./constants";

interface ManagerFeedbackCardProps {
  feedback: ManagerFeedback;
  currentUserId?: string;
  onDelete?: (id: string) => void;
}

export function ManagerFeedbackCard({
  feedback,
  currentUserId,
  onDelete,
}: ManagerFeedbackCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isOwner = currentUserId === feedback.fromUserId;
  const config = FEEDBACK_TYPE_CONFIG[feedback.type];
  const Icon = FEEDBACK_ICONS[config.icon] || MessageSquare;

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteManagerFeedback(feedback.id);
    if (result.success) {
      onDelete?.(feedback.id);
    }
    setIsDeleting(false);
    setShowDeleteDialog(false);
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={feedback.fromUser?.avatarUrl} />
                <AvatarFallback>
                  {feedback.fromUser?.name?.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {feedback.fromUser?.name || "Unknown"}
                  </span>
                  <span className="text-muted-foreground">gave feedback to</span>
                  <span className="font-medium">
                    {feedback.toUser?.name || "Unknown"}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">
                    {formatRecognitionDate(feedback.createdAt)}
                  </span>
                  {feedback.isPrivate && (
                    <Badge variant="outline" className="text-xs h-5">
                      <Lock className="h-3 w-3 mr-1" />
                      Private
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className={cn("gap-1", config.color, config.bgColor)}
              >
                <Icon className="h-3 w-3" />
                {config.label}
              </Badge>
              {isOwner && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => setShowDeleteDialog(true)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <h4 className="font-medium mb-2">{feedback.subject}</h4>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {feedback.content}
          </p>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Feedback</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this feedback? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
