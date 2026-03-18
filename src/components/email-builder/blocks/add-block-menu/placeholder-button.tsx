'use client';

import React from 'react';
import { Plus } from '@phosphor-icons/react';

interface PlaceholderButtonProps {
  onClick: () => void;
}

/**
 * A large placeholder shown when a container has no children.
 * Clicking it opens the add-block menu.
 */
export function PlaceholderButton({ onClick }: PlaceholderButtonProps) {
  return (
    <button
      type="button"
      className="flex h-12 w-full items-center justify-center bg-black/5 hover:bg-black/10 transition-colors rounded"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      aria-label="Add block"
    >
      <Plus size={20} className="text-muted-foreground" />
    </button>
  );
}
