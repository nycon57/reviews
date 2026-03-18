'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import type { Icon as PhosphorIcon } from '@phosphor-icons/react';

interface BlockButtonProps {
  label: string;
  icon: PhosphorIcon;
  onClick: () => void;
}

export function BlockButton({
  label,
  icon: IconComponent,
  onClick,
}: BlockButtonProps) {
  return (
    <Button
      variant="ghost"
      className="flex flex-col items-center justify-center gap-1 h-auto py-3 px-2 w-full"
      onClick={onClick}
    >
      <div className="flex items-center justify-center w-8 h-8 rounded bg-muted">
        <IconComponent size={20} />
      </div>
      <span className="text-xs font-normal">{label}</span>
    </Button>
  );
}
