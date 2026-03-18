'use client';

import React from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { BlockButtonsList } from './buttons';

interface BlocksMenuProps {
  open: boolean;
  onClose: () => void;
  onBlockSelect: (blockType: string) => void;
  children: React.ReactNode;
}

export function BlocksMenu({
  open,
  onClose,
  onBlockSelect,
  children,
}: BlocksMenuProps) {
  const handleSelect = (blockType: string) => {
    onBlockSelect(blockType);
    onClose();
  };

  return (
    <Popover open={open} onOpenChange={(o) => !o && onClose()}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        className="w-80 p-3"
        side="bottom"
        align="center"
        sideOffset={8}
      >
        <div className="grid grid-cols-4 gap-1">
          <BlockButtonsList onSelect={handleSelect} />
        </div>
      </PopoverContent>
    </Popover>
  );
}
