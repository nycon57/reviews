'use client';

import { useDraggable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { BlockThumbnail } from './block-thumbnails';
import { insertBlockIntoDocument } from '../blocks/add-block-menu';
import { useEditorDocumentStore, setDocument, setSelectedBlockId } from '../editor/editor-context';
import type { Icon } from '@phosphor-icons/react';

interface PaletteItemProps {
  blockType: string;
  label: string;
  icon: Icon;
}

export function PaletteItem({ blockType, label, icon: IconComponent }: PaletteItemProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${blockType}`,
    data: { fromPalette: true, blockType },
  });

  const handleClick = () => {
    // Prevent click-to-add after a completed drag
    if (isDragging) return;
    // Read imperatively — no need to subscribe every palette item to document changes
    const document = useEditorDocumentStore.getState().document;
    const result = insertBlockIntoDocument(document, blockType, 'root');
    if (result) {
      setDocument(result.newDoc);
      setSelectedBlockId(result.newBlockId);
    }
  };

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={handleClick}
      className={cn(
        'flex cursor-grab flex-col items-center gap-1.5 rounded-lg border border-border bg-background p-2 transition-all hover:scale-[1.02] hover:shadow-sm',
        isDragging && 'opacity-50'
      )}
    >
      <BlockThumbnail blockType={blockType} />
      <div className="flex items-center gap-1">
        <IconComponent size={12} className="text-muted-foreground" />
        <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
      </div>
    </div>
  );
}
