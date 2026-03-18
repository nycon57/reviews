'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Plus } from '@phosphor-icons/react';

interface DividerButtonProps {
  onClick: () => void;
}

/**
 * A thin divider line between blocks that reveals a "+" button when
 * the user's mouse is near it — mirroring the Waypoint proximity
 * detection pattern.
 */
export function DividerButton({ onClick }: DividerButtonProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      const distance = Math.abs(e.clientY - midY);
      setVisible(distance < 40);
    },
    []
  );

  const handleMouseLeave = useCallback(() => {
    setVisible(false);
  }, []);

  useEffect(() => {
    const el = ref.current?.parentElement;
    if (!el) return;
    el.addEventListener('mousemove', handleMouseMove);
    el.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      el.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [handleMouseMove, handleMouseLeave]);

  return (
    <div
      ref={ref}
      className="relative flex items-center justify-center"
      style={{ height: 4 }}
    >
      <div
        className="transition-opacity duration-200"
        style={{ opacity: visible ? 1 : 0 }}
      >
        <button
          type="button"
          className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white shadow-sm hover:bg-blue-600 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          aria-label="Add block"
        >
          <Plus size={14} weight="bold" />
        </button>
      </div>
    </div>
  );
}
