"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SidebarButtonProps {
  label: string;
  onClick: () => void;
  active?: boolean;
}

export function SidebarButton({ label, onClick, active }: SidebarButtonProps) {
  return (
    <Button
      variant="ghost"
      className={cn(
        "w-full justify-start text-left text-sm font-normal",
        active && "bg-accent text-accent-foreground"
      )}
      onClick={onClick}
    >
      {label}
    </Button>
  );
}
