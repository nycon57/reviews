'use client';

import React from 'react';
import { ArrowUp, ArrowDown, Copy, Trash } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip';
import {
  useDocument,
  setDocument,
  setSelectedBlockId,
  type TEditorDocument,
} from '../editor/editor-context';
import { useCurrentBlockId } from '../editor/editor-block';
import { cloneDocumentBlock } from './clone-document-block';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function findParentBlockId(
  document: TEditorDocument,
  targetId: string
): string | null {
  for (const [id, block] of Object.entries(document)) {
    const data = block.data as Record<string, unknown>;

    // Check top-level childrenIds (EmailLayout, Container)
    if (Array.isArray(data.childrenIds)) {
      if ((data.childrenIds as string[]).includes(targetId)) {
        return id;
      }
    }

    // Check props.childrenIds (Container)
    const props = data.props as Record<string, unknown> | undefined;
    if (props && Array.isArray(props.childrenIds)) {
      if ((props.childrenIds as string[]).includes(targetId)) {
        return id;
      }
    }

    // Check columns (ColumnsContainer)
    if (props && Array.isArray(props.columns)) {
      for (const col of props.columns as Array<{ childrenIds?: string[] }>) {
        if (Array.isArray(col.childrenIds) && col.childrenIds.includes(targetId)) {
          return id;
        }
      }
    }
  }
  return null;
}

function getChildrenIdsRef(
  document: TEditorDocument,
  parentId: string,
  targetId: string
): { ids: string[]; setIds: (newIds: string[]) => TEditorDocument } | null {
  const parent = document[parentId];
  if (!parent) return null;
  const data = parent.data as Record<string, unknown>;

  // Top-level childrenIds
  if (Array.isArray(data.childrenIds)) {
    const ids = data.childrenIds as string[];
    if (ids.includes(targetId)) {
      return {
        ids,
        setIds: (newIds) => ({
          ...document,
          [parentId]: {
            ...parent,
            data: { ...data, childrenIds: newIds },
          },
        }),
      };
    }
  }

  // props.childrenIds
  const props = data.props as Record<string, unknown> | undefined;
  if (props && Array.isArray(props.childrenIds)) {
    const ids = props.childrenIds as string[];
    if (ids.includes(targetId)) {
      return {
        ids,
        setIds: (newIds) => ({
          ...document,
          [parentId]: {
            ...parent,
            data: {
              ...data,
              props: { ...props, childrenIds: newIds },
            },
          },
        }),
      };
    }
  }

  // columns
  if (props && Array.isArray(props.columns)) {
    const columns = props.columns as Array<{ childrenIds?: string[] }>;
    for (let colIndex = 0; colIndex < columns.length; colIndex++) {
      const col = columns[colIndex];
      const currentIds = Array.isArray(col.childrenIds) ? col.childrenIds : [];
      if (currentIds.includes(targetId)) {
        return {
          ids: currentIds,
          setIds: (newIds) => {
            const newColumns = [...columns];
            newColumns[colIndex] = { ...col, childrenIds: newIds || [] };
            return {
              ...document,
              [parentId]: {
                ...parent,
                data: {
                  ...data,
                  props: { ...props, columns: newColumns },
                },
              },
            };
          },
        };
      }
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// TuneMenu component
// ---------------------------------------------------------------------------

export function TuneMenu() {
  const document = useDocument();
  const blockId = useCurrentBlockId();

  if (!blockId) return null;

  const parentId = findParentBlockId(document, blockId);

  const handleMoveClick = (direction: 'up' | 'down') => {
    if (!parentId) return;
    const ref = getChildrenIdsRef(document, parentId, blockId);
    if (!ref) return;
    const idx = ref.ids.indexOf(blockId);
    if (idx === -1) return;

    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= ref.ids.length) return;

    const newIds = [...ref.ids];
    [newIds[idx], newIds[newIdx]] = [newIds[newIdx], newIds[idx]];
    setDocument(ref.setIds(newIds));
  };

  const handleDuplicateClick = () => {
    if (!parentId) return;
    const ref = getChildrenIdsRef(document, parentId, blockId);
    if (!ref) return;

    const { document: newDoc, blockId: newBlockId } = cloneDocumentBlock(
      document,
      blockId
    );

    if (!newBlockId) return;

    const idx = ref.ids.indexOf(blockId);
    const newIds = [...ref.ids];
    newIds.splice(idx + 1, 0, newBlockId);

    // Rebuild with the cloned blocks + updated parent childrenIds
    const refInNewDoc = getChildrenIdsRef(newDoc, parentId, blockId);
    if (!refInNewDoc) return;
    setDocument(refInNewDoc.setIds(newIds));
    setSelectedBlockId(newBlockId);
  };

  const handleDeleteClick = () => {
    if (!parentId) return;
    const ref = getChildrenIdsRef(document, parentId, blockId);
    if (!ref) return;

    const newIds = ref.ids.filter((id) => id !== blockId);
    const newDoc = ref.setIds(newIds);

    // Remove the block entry itself from document
    const { [blockId]: _removed, ...rest } = newDoc;
    setDocument(rest);
    setSelectedBlockId(null);
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="absolute top-0 -left-14 rounded-full bg-card px-2 py-3 shadow-md z-50 flex flex-col gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => handleMoveClick('up')}
            >
              <ArrowUp size={16} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">Move up</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => handleMoveClick('down')}
            >
              <ArrowDown size={16} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">Move down</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleDuplicateClick}
            >
              <Copy size={16} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">Duplicate</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleDeleteClick}
            >
              <Trash size={16} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">Delete</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
