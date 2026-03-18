"use client";

import { SlidersHorizontal, ArrowLineRight } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

interface ToggleInspectorButtonProps {
  isOpen: boolean;
  onClick: () => void;
}

export function ToggleInspectorButton({
  isOpen,
  onClick,
}: ToggleInspectorButtonProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      aria-label={isOpen ? "Close inspector" : "Open inspector"}
    >
      {isOpen ? <ArrowLineRight size={18} /> : <SlidersHorizontal size={18} />}
    </Button>
  );
}
