'use client';

import { Cube } from '@phosphor-icons/react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PaletteCategory } from './palette-category';
import { BLOCK_BUTTONS } from '../blocks/add-block-menu/buttons';

export const PALETTE_DRAWER_WIDTH = 280;

/** Map BLOCK_BUTTONS PascalCase types to categories */
const CATEGORY_MAP: Record<string, string[]> = {
  Content: ['Heading', 'Text', 'Testimonial', 'Stats', 'FeatureList', 'Callout', 'List', 'Article'],
  Layout: ['ColumnsContainer', 'Container', 'Header', 'Footer', 'Divider', 'Spacer'],
  Media: ['Image', 'Avatar', 'Gallery'],
  Interactive: ['Button', 'ButtonGroup', 'Hero', 'Rating', 'Html'],
};

const CATEGORIES = Object.entries(CATEGORY_MAP).map(([label, types]) => ({
  label,
  blocks: types
    .map(type => BLOCK_BUTTONS.find(b => b.type === type))
    .filter(Boolean) as (typeof BLOCK_BUTTONS)[number][],
}));

interface BlockPaletteDrawerProps {
  isOpen: boolean;
}

export function BlockPaletteDrawer({ isOpen }: BlockPaletteDrawerProps) {
  return (
    <div
      className={`relative h-full shrink-0 overflow-hidden border-r border-border bg-background transition-all duration-300 ${
        isOpen ? 'w-[280px]' : 'w-0 border-r-0'
      }`}
      style={{ minWidth: isOpen ? PALETTE_DRAWER_WIDTH : 0 }}
    >
      <div className="flex h-full w-[280px] flex-col">
        {/* Header */}
        <div className="flex shrink-0 items-center gap-2 border-b border-border px-3 py-2.5">
          <Cube size={16} className="text-muted-foreground" />
          <span className="text-sm font-semibold">Blocks</span>
        </div>

        {/* Categories */}
        <ScrollArea className="flex-1">
          <div className="py-1">
            {CATEGORIES.map((cat, i) => (
              <PaletteCategory
                key={cat.label}
                label={cat.label}
                blocks={cat.blocks}
                defaultOpen={i < 2}
              />
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
