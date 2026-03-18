'use client';

import React, { createContext, memo, useContext } from 'react';
import { CoreEditorBlock } from './core';

// ---------------------------------------------------------------------------
// Block ID context — lets any descendant know which block it belongs to
// ---------------------------------------------------------------------------

const BlockIdContext = createContext<string | null>(null);

export function useCurrentBlockId(): string | null {
  return useContext(BlockIdContext);
}

// ---------------------------------------------------------------------------
// EditorBlock — provides its ID through context then renders via core
// ---------------------------------------------------------------------------

interface EditorBlockProps {
  id: string;
}

export const EditorBlock = memo(function EditorBlock({ id }: EditorBlockProps) {
  return (
    <BlockIdContext.Provider value={id}>
      <CoreEditorBlock id={id} />
    </BlockIdContext.Provider>
  );
});
