'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { insertBlockIntoDocument } from '../blocks/add-block-menu';
import { useEditorDocumentStore, setDocument, setSelectedBlockId } from '../editor/editor-context';
import { DragOverlayContent } from './drag-overlay-content';

interface DragState {
  isDragging: boolean;
  activeBlockType: string | null;
}

const DragStateContext = createContext<DragState>({
  isDragging: false,
  activeBlockType: null,
});

export function useDragState() {
  return useContext(DragStateContext);
}

export function EditorDndContext({ children }: { children: React.ReactNode }) {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    activeBlockType: null,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const blockType = event.active.data.current?.blockType as string | undefined;
    if (!blockType) return;
    setDragState({ isDragging: true, activeBlockType: blockType });
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const blockType = event.active.data.current?.blockType as string | undefined;
    const overId = event.over?.id as string;

    setDragState({ isDragging: false, activeBlockType: null });

    if (!blockType || !overId?.startsWith('drop-zone:')) return;

    // Parse drop zone: "drop-zone:{parentId}:{index}"
    const parts = overId.split(':');
    const parentId = parts[1];
    const insertAtIndex = parseInt(parts[2], 10);

    if (!parentId || isNaN(insertAtIndex)) return;

    // Read imperatively to avoid subscribing this component to every document change
    const document = useEditorDocumentStore.getState().document;
    const result = insertBlockIntoDocument(document, blockType, parentId, insertAtIndex);
    if (result) {
      setDocument(result.newDoc);
      setSelectedBlockId(result.newBlockId);
    }
  }, []);

  const handleDragCancel = useCallback(() => {
    setDragState({ isDragging: false, activeBlockType: null });
  }, []);

  return (
    <DragStateContext.Provider value={dragState}>
      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        {children}
        <DragOverlay dropAnimation={null}>
          {dragState.activeBlockType ? (
            <DragOverlayContent blockType={dragState.activeBlockType} />
          ) : null}
        </DragOverlay>
      </DndContext>
    </DragStateContext.Provider>
  );
}
