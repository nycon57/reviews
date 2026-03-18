'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CaretDown } from '@phosphor-icons/react';
import { PaletteItem } from './palette-item';
import type { Icon } from '@phosphor-icons/react';

interface PaletteCategoryProps {
  label: string;
  blocks: { type: string; label: string; icon: Icon }[];
  defaultOpen?: boolean;
}

export function PaletteCategory({ label, blocks, defaultOpen = false }: PaletteCategoryProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
      >
        {label}
        <motion.span
          animate={{ rotate: isOpen ? 0 : -90 }}
          transition={{ duration: 0.15 }}
        >
          <CaretDown size={12} />
        </motion.span>
      </button>
      <motion.div
        initial={false}
        animate={{
          gridTemplateRows: isOpen ? '1fr' : '0fr',
          opacity: isOpen ? 1 : 0,
        }}
        transition={{ duration: 0.2 }}
        style={{ display: 'grid' }}
      >
        <div className="overflow-hidden">
          <div className="grid grid-cols-2 gap-2 px-3 pb-3">
            {blocks.map(block => (
              <PaletteItem
                key={block.type}
                blockType={block.type}
                label={block.label}
                icon={block.icon}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
