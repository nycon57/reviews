import { BLOCK_BUTTONS } from '../blocks/add-block-menu/buttons';
import { BlockThumbnail } from '../palette/block-thumbnails';

interface DragOverlayContentProps {
  blockType: string;
}

export function DragOverlayContent({ blockType }: DragOverlayContentProps) {
  const block = BLOCK_BUTTONS.find(b => b.type === blockType);
  const IconComponent = block?.icon;
  const label = block?.label ?? blockType;

  return (
    <div className="flex w-48 flex-col items-center gap-1.5 rounded-lg border border-border bg-background/90 p-3 shadow-lg backdrop-blur-sm">
      <BlockThumbnail blockType={blockType} />
      <div className="flex items-center gap-1">
        {IconComponent && <IconComponent size={12} className="text-muted-foreground" />}
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
      </div>
    </div>
  );
}
