"use client";

import { CaretLeft, List } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ToggleSamplesPanelButtonProps {
  open: boolean;
  onClick: () => void;
}

export function ToggleSamplesPanelButton({
  open,
  onClick,
}: ToggleSamplesPanelButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" onClick={onClick}>
          {open ? <CaretLeft size={18} /> : <List size={18} />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {open ? "Close templates panel" : "Open templates panel"}
      </TooltipContent>
    </Tooltip>
  );
}
