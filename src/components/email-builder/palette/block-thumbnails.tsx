import { cn } from '@/lib/utils';

interface BlockThumbnailProps {
  blockType: string;
  className?: string;
}

export function BlockThumbnail({ blockType, className }: BlockThumbnailProps) {
  return (
    <div className={cn('flex h-14 w-full items-center justify-center rounded bg-muted/50 p-2', className)}>
      {getThumbnailContent(blockType)}
    </div>
  );
}

function getThumbnailContent(blockType: string) {
  switch (blockType) {
    case 'Heading':
      return (
        <div className="flex w-full flex-col gap-1">
          <div className="h-2.5 w-3/4 rounded-sm bg-foreground/60" />
          <div className="h-0.5 w-1/2 rounded-sm bg-foreground/20" />
        </div>
      );
    case 'Text':
      return (
        <div className="flex w-full flex-col gap-1">
          <div className="h-1 w-full rounded-sm bg-foreground/30" />
          <div className="h-1 w-5/6 rounded-sm bg-foreground/30" />
          <div className="h-1 w-2/3 rounded-sm bg-foreground/30" />
        </div>
      );
    case 'Button':
      return (
        <div className="flex w-full justify-center">
          <div className="h-5 w-16 rounded bg-primary/60" />
        </div>
      );
    case 'Image':
      return (
        <div className="flex h-9 w-full items-center justify-center rounded border border-dashed border-foreground/20 bg-foreground/5">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-foreground/30">
            <rect x="1" y="3" width="14" height="10" rx="1" stroke="currentColor" strokeWidth="1.2" />
            <circle cx="5" cy="6.5" r="1.5" stroke="currentColor" strokeWidth="1" />
            <path d="M1 11l3.5-3 3 2.5L11 8l4 5H1v-2z" fill="currentColor" opacity="0.3" />
          </svg>
        </div>
      );
    case 'ColumnsContainer':
      return (
        <div className="flex w-full gap-1">
          <div className="h-8 flex-1 rounded border border-foreground/20 bg-foreground/5" />
          <div className="h-8 flex-1 rounded border border-foreground/20 bg-foreground/5" />
        </div>
      );
    case 'Container':
      return (
        <div className="h-8 w-full rounded border border-dashed border-foreground/25 bg-foreground/5" />
      );
    case 'Header':
      return (
        <div className="flex w-full items-center gap-2">
          <div className="h-3 w-6 rounded-sm bg-foreground/40" />
          <div className="flex flex-1 justify-end gap-1">
            <div className="h-1 w-4 rounded-sm bg-foreground/20" />
            <div className="h-1 w-4 rounded-sm bg-foreground/20" />
          </div>
        </div>
      );
    case 'Footer':
      return (
        <div className="flex w-full flex-col items-center gap-1">
          <div className="h-1 w-12 rounded-sm bg-foreground/20" />
          <div className="flex gap-1">
            <div className="h-2 w-2 rounded-full bg-foreground/20" />
            <div className="h-2 w-2 rounded-full bg-foreground/20" />
            <div className="h-2 w-2 rounded-full bg-foreground/20" />
          </div>
        </div>
      );
    case 'Hero':
      return (
        <div className="flex w-full flex-col gap-1">
          <div className="h-4 w-full rounded-sm bg-foreground/10" />
          <div className="h-1.5 w-2/3 rounded-sm bg-foreground/40" />
          <div className="h-3 w-10 rounded bg-primary/50" />
        </div>
      );
    case 'Divider':
      return (
        <div className="flex w-full items-center py-2">
          <div className="h-px w-full bg-foreground/30" />
        </div>
      );
    case 'Spacer':
      return (
        <div className="flex w-full items-center justify-center">
          <svg width="20" height="16" viewBox="0 0 20 16" className="text-foreground/25">
            <path d="M10 1v14M7 3l3-2 3 2M7 13l3 2 3-2" stroke="currentColor" strokeWidth="1.2" fill="none" />
          </svg>
        </div>
      );
    case 'Avatar':
      return (
        <div className="flex w-full justify-center">
          <div className="h-7 w-7 rounded-full border border-foreground/20 bg-foreground/10" />
        </div>
      );
    case 'Html':
      return (
        <div className="flex w-full items-center justify-center font-mono text-[8px] text-foreground/30">
          {'<html/>'}
        </div>
      );
    case 'Testimonial':
      return (
        <div className="flex w-full flex-col gap-1">
          <div className="text-[10px] leading-none text-foreground/30">&ldquo;</div>
          <div className="h-1 w-full rounded-sm bg-foreground/20" />
          <div className="h-1 w-4/5 rounded-sm bg-foreground/20" />
        </div>
      );
    case 'Stats':
      return (
        <div className="flex w-full justify-around">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex flex-col items-center gap-0.5">
              <div className="h-2 w-4 rounded-sm bg-primary/40" />
              <div className="h-0.5 w-3 rounded-sm bg-foreground/15" />
            </div>
          ))}
        </div>
      );
    case 'FeatureList':
      return (
        <div className="flex w-full flex-col gap-1">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-1">
              <div className="h-1.5 w-1.5 rounded-full bg-primary/50" />
              <div className="h-1 flex-1 rounded-sm bg-foreground/20" />
            </div>
          ))}
        </div>
      );
    case 'Rating':
      return (
        <div className="flex w-full justify-center gap-0.5">
          {[1, 2, 3, 4, 5].map(i => (
            <svg key={i} className="h-2.5 w-2.5 text-foreground/30" viewBox="0 0 12 12" fill="currentColor">
              <path d="M6 1l1.5 3 3.5.5-2.5 2.5.5 3.5L6 9l-3 1.5.5-3.5L1 4.5 4.5 4z" />
            </svg>
          ))}
        </div>
      );
    case 'Callout':
      return (
        <div className="flex w-full items-start gap-1.5 rounded border-l-2 border-primary/50 bg-primary/5 p-1">
          <div className="h-2 w-2 shrink-0 rounded-full bg-primary/40" />
          <div className="flex flex-1 flex-col gap-0.5">
            <div className="h-1 w-full rounded-sm bg-foreground/20" />
            <div className="h-1 w-3/4 rounded-sm bg-foreground/15" />
          </div>
        </div>
      );
    case 'List':
      return (
        <div className="flex w-full flex-col gap-1">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-1">
              <div className="h-0.5 w-0.5 rounded-full bg-foreground/40" />
              <div className="h-1 flex-1 rounded-sm bg-foreground/20" />
            </div>
          ))}
        </div>
      );
    case 'ButtonGroup':
      return (
        <div className="flex w-full justify-center gap-1">
          <div className="h-4 w-10 rounded bg-primary/50" />
          <div className="h-4 w-10 rounded border border-primary/40 bg-transparent" />
        </div>
      );
    case 'Gallery':
      return (
        <div className="grid w-full grid-cols-3 gap-0.5">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-5 rounded-sm bg-foreground/10" />
          ))}
        </div>
      );
    case 'Article':
      return (
        <div className="flex w-full gap-1.5">
          <div className="h-8 w-8 shrink-0 rounded-sm bg-foreground/10" />
          <div className="flex flex-1 flex-col gap-0.5">
            <div className="h-1.5 w-full rounded-sm bg-foreground/40" />
            <div className="h-1 w-full rounded-sm bg-foreground/15" />
            <div className="h-1 w-3/4 rounded-sm bg-foreground/15" />
          </div>
        </div>
      );
    default:
      return (
        <div className="flex h-8 w-full items-center justify-center rounded border border-dashed border-foreground/15 text-[8px] text-foreground/25">
          Block
        </div>
      );
  }
}
