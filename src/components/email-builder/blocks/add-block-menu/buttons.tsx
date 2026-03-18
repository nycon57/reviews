'use client';

import React from 'react';
import {
  TextH,
  TextAa,
  CursorClick,
  Image,
  UserCircle,
  Minus,
  ArrowsOutLineVertical,
  Code,
  Columns,
  StackPlus,
  Rows,
  CaretDoubleDown,
  Quotes,
  ChartBar,
  ListChecks,
  Star,
  Info,
  ListBullets,
  SquaresFour,
  FrameCorners,
  GridFour,
  Article,
} from '@phosphor-icons/react';
import { BlockButton } from './block-button';

// ---------------------------------------------------------------------------
// Block definitions for the add-block menu
// ---------------------------------------------------------------------------

export const BLOCK_BUTTONS = [
  {
    label: 'Heading',
    type: 'Heading',
    icon: TextH,
  },
  {
    label: 'Text',
    type: 'Text',
    icon: TextAa,
  },
  {
    label: 'Button',
    type: 'Button',
    icon: CursorClick,
  },
  {
    label: 'Image',
    type: 'Image',
    icon: Image,
  },
  {
    label: 'Avatar',
    type: 'Avatar',
    icon: UserCircle,
  },
  {
    label: 'Divider',
    type: 'Divider',
    icon: Minus,
  },
  {
    label: 'Spacer',
    type: 'Spacer',
    icon: ArrowsOutLineVertical,
  },
  {
    label: 'Html',
    type: 'Html',
    icon: Code,
  },
  {
    label: 'Columns',
    type: 'ColumnsContainer',
    icon: Columns,
  },
  {
    label: 'Container',
    type: 'Container',
    icon: StackPlus,
  },
  {
    label: 'Header',
    type: 'Header',
    icon: Rows,
  },
  {
    label: 'Footer',
    type: 'Footer',
    icon: CaretDoubleDown,
  },
  {
    label: 'Testimonial',
    type: 'Testimonial',
    icon: Quotes,
  },
  {
    label: 'Stats',
    type: 'Stats',
    icon: ChartBar,
  },
  {
    label: 'Feature List',
    type: 'FeatureList',
    icon: ListChecks,
  },
  {
    label: 'Rating',
    type: 'Rating',
    icon: Star,
  },
  {
    label: 'Callout',
    type: 'Callout',
    icon: Info,
  },
  {
    label: 'List',
    type: 'List',
    icon: ListBullets,
  },
  {
    label: 'Button Group',
    type: 'ButtonGroup',
    icon: SquaresFour,
  },
  {
    label: 'Hero',
    type: 'Hero',
    icon: FrameCorners,
  },
  {
    label: 'Gallery',
    type: 'Gallery',
    icon: GridFour,
  },
  {
    label: 'Article',
    type: 'Article',
    icon: Article,
  },
] as const;

// ---------------------------------------------------------------------------
// Rendered block buttons list
// ---------------------------------------------------------------------------

interface BlockButtonsListProps {
  onSelect: (blockType: string) => void;
}

export function BlockButtonsList({ onSelect }: BlockButtonsListProps) {
  return (
    <>
      {BLOCK_BUTTONS.map((btn) => (
        <BlockButton
          key={btn.type}
          label={btn.label}
          icon={btn.icon}
          onClick={() => onSelect(btn.type)}
        />
      ))}
    </>
  );
}
