"use client";

import { useEffect, useState } from "react";
import {
  ArrowsClockwise,
  ArrowsOut,
  FloppyDisk,
  MagnifyingGlassMinus,
  MagnifyingGlassPlus,
  Play,
  ArrowCounterClockwise,
  ArrowClockwise,
  CaretLeft,
  SpinnerGap,
} from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { CampaignStatus } from "@/lib/campaigns/types";

interface WorkflowToolbarProps {
  campaignName: string;
  campaignStatus: CampaignStatus;
  readOnly?: boolean;
  isDirty: boolean;
  isSaving: boolean;
  canUndo: boolean;
  canRedo: boolean;
  canActivate: boolean;
  validationMessage?: string;
  onBack: () => void;
  onRename: (nextName: string) => void;
  onSave: () => void;
  onActivate: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onAutoLayout: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomFit: () => void;
}

const STATUS_VARIANT: Record<CampaignStatus, "default" | "secondary" | "success" | "outline" | "subtle"> = {
  draft: "secondary",
  active: "success",
  paused: "outline",
  completed: "default",
  archived: "subtle",
};

export function WorkflowToolbar({
  campaignName,
  campaignStatus,
  readOnly = false,
  isDirty,
  isSaving,
  canUndo,
  canRedo,
  canActivate,
  validationMessage,
  onBack,
  onRename,
  onSave,
  onActivate,
  onUndo,
  onRedo,
  onAutoLayout,
  onZoomIn,
  onZoomOut,
  onZoomFit,
}: WorkflowToolbarProps) {
  const [draftName, setDraftName] = useState(campaignName);

  useEffect(() => {
    setDraftName(campaignName);
  }, [campaignName]);

  const flushDraftName = () => {
    const nextName = draftName.trim();
    if (nextName && nextName !== campaignName) {
      onRename(nextName);
    } else {
      setDraftName(campaignName);
    }
  };

  const handleSave = () => {
    flushDraftName();
    onSave();
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-card px-4 py-3">
      <div className="flex min-w-[260px] items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onBack} aria-label="Back to campaigns">
          <CaretLeft className="h-4 w-4" />
        </Button>
        <Input
          value={draftName}
          onChange={(event) => setDraftName(event.target.value)}
          onBlur={flushDraftName}
          className="h-9 max-w-[260px]"
          disabled={readOnly}
          aria-label="Campaign name"
        />
        <Badge variant={STATUS_VARIANT[campaignStatus]} className="capitalize">
          {campaignStatus}
        </Badge>
        {isDirty ? (
          <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
            Unsaved
          </Badge>
        ) : null}
      </div>

      <div className="flex items-center gap-1 rounded-lg border bg-background p-1">
        <Button variant="ghost" size="icon" onClick={onUndo} disabled={!canUndo || readOnly} aria-label="Undo">
          <ArrowCounterClockwise className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onRedo} disabled={!canRedo || readOnly} aria-label="Redo">
          <ArrowClockwise className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onAutoLayout} disabled={readOnly} aria-label="Auto layout">
          <ArrowsClockwise className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onZoomOut} aria-label="Zoom out">
          <MagnifyingGlassMinus className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onZoomIn} aria-label="Zoom in">
          <MagnifyingGlassPlus className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onZoomFit} aria-label="Zoom to fit">
          <ArrowsOut className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          className="gap-2"
          onClick={handleSave}
          disabled={readOnly || isSaving || !isDirty}
        >
          {isSaving ? <SpinnerGap className="h-4 w-4 animate-spin" /> : <FloppyDisk className="h-4 w-4" />}
          Save Draft
        </Button>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button
                  className="gap-2"
                  onClick={onActivate}
                  disabled={readOnly || isSaving || !canActivate}
                >
                  <Play className="h-4 w-4" />
                  Activate
                </Button>
              </span>
            </TooltipTrigger>
            {!canActivate && validationMessage ? (
              <TooltipContent>{validationMessage}</TooltipContent>
            ) : null}
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
