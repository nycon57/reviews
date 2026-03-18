'use client';

import React, { Fragment } from 'react';
import { EditorBlock } from '../editor/editor-block';
import { useCurrentBlockId } from '../editor/editor-block';
import { AddBlockButton } from './add-block-menu';
import { DropZone } from '../dnd/drop-zone';
import { useDragState } from '../dnd/editor-dnd-context';

interface EditorChildrenIdsProps {
  childrenIds: string[];
}

export function EditorChildrenIds({ childrenIds }: EditorChildrenIdsProps) {
  const { isDragging } = useDragState();
  const parentBlockId = useCurrentBlockId() ?? 'root';

  if (childrenIds.length === 0) {
    if (isDragging) {
      return <DropZone parentId={parentBlockId} index={0} />;
    }
    return <AddBlockButton placeholder />;
  }

  return (
    <>
      {childrenIds.map((childId, index) => (
        <Fragment key={childId}>
          {index === 0 && (
            isDragging
              ? <DropZone parentId={parentBlockId} index={0} />
              : <AddBlockButton insertAtIndex={0} />
          )}
          <EditorBlock id={childId} />
          {isDragging
            ? <DropZone parentId={parentBlockId} index={index + 1} />
            : <AddBlockButton insertAtIndex={index + 1} />
          }
        </Fragment>
      ))}
    </>
  );
}
