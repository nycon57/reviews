"use client";

import { useState } from "react";
import {
  PencilSimple as Edit3,
  SpinnerGap as Loader2,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { updateVideoAIText } from "@/lib/video-testimonials/actions";

// ============================================================================
// Types
// ============================================================================

interface VideoTranscriptionInfo {
  id: string;
  transcription: string | null;
  transcriptionStatus: string | null;
  aiGeneratedText: string | null;
  keyPhrases: string[] | null;
}

interface VideoFeedbackSectionProps {
  video: VideoTranscriptionInfo;
  canManage: boolean;
}

// ============================================================================
// Component
// ============================================================================

export function VideoFeedbackSection({ video, canManage }: VideoFeedbackSectionProps) {
  const router = useRouter();
  const [isEditingText, setIsEditingText] = useState(false);
  const [editedAiText, setEditedAiText] = useState(video.aiGeneratedText || "");
  const [isSavingText, setIsSavingText] = useState(false);

  const handleSaveAiText = async () => {
    setIsSavingText(true);
    try {
      const result = await updateVideoAIText(video.id, editedAiText);
      if (result.success) {
        toast({ title: "Success", description: "AI text updated successfully" });
        setIsEditingText(false);
        router.refresh();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update AI text",
          variant: "destructive",
        });
      }
    } finally {
      setIsSavingText(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Transcription */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Transcription</CardTitle>
        </CardHeader>
        <CardContent>
          {video.transcriptionStatus === "completed" && video.transcription ? (
            <ScrollArea className="h-[200px]">
              <p className="whitespace-pre-wrap text-sm leading-relaxed">
                {video.transcription}
              </p>
            </ScrollArea>
          ) : video.transcriptionStatus === "processing" ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Transcription in progress...
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              No transcription available
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Generated Text */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base">AI-Generated Review Text</CardTitle>
          {canManage && !isEditingText && video.aiGeneratedText && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditingText(true)}
              className="gap-1.5"
            >
              <Edit3 className="h-3.5 w-3.5" />
              Edit
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isEditingText ? (
            <div className="space-y-3">
              <Textarea
                value={editedAiText}
                onChange={(e) => setEditedAiText(e.target.value)}
                rows={6}
                className="text-sm leading-relaxed"
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsEditingText(false);
                    setEditedAiText(video.aiGeneratedText || "");
                  }}
                  disabled={isSavingText}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveAiText}
                  disabled={isSavingText || editedAiText === video.aiGeneratedText}
                >
                  {isSavingText ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </div>
          ) : video.aiGeneratedText ? (
            <div className="rounded-lg border bg-primary/5 p-4">
              <p className="whitespace-pre-wrap text-sm leading-relaxed">
                {video.aiGeneratedText}
              </p>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              No AI-generated text available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Key Phrases */}
      {video.keyPhrases && video.keyPhrases.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Key Phrases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {video.keyPhrases.map((phrase) => (
                <Badge key={phrase} variant="outline">
                  {phrase}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
