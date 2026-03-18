'use client';

import { useDroppable } from '@dnd-kit/core';
import { motion } from 'framer-motion';

interface DropZoneProps {
  parentId: string;
  index: number;
}

export function DropZone({ parentId, index }: DropZoneProps) {
  const id = `drop-zone:${parentId}:${index}`;
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`relative flex items-center justify-center transition-all duration-200 ${
        isOver ? 'h-12' : 'h-6'
      }`}
    >
      <div
        className={`h-0.5 w-full transition-colors duration-150 ${
          isOver ? 'bg-primary' : 'bg-primary/30'
        }`}
      />
      <motion.span
        animate={{ scale: isOver ? 1 : 0.8, opacity: isOver ? 1 : 0 }}
        transition={{ duration: 0.15 }}
        className="absolute rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground"
      >
        Drop here
      </motion.span>
    </div>
  );
}
