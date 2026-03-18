'use client';

import React, { useCallback, useState } from 'react';
import {
  useSelectedBlockId,
  setSelectedBlockId,
  useSelectedMainTab,
} from '../editor/editor-context';
import { useCurrentBlockId } from '../editor/editor-block';
import { TuneMenu } from './tune-menu';

interface EditorBlockWrapperProps {
  children: React.ReactNode;
}

export function EditorBlockWrapper({ children }: EditorBlockWrapperProps) {
  const blockId = useCurrentBlockId();
  const selectedBlockId = useSelectedBlockId();
  const mainTab = useSelectedMainTab();
  const [hovered, setHovered] = useState(false);

  const isPreview = mainTab === 'preview';
  const isSelected = blockId !== null && blockId === selectedBlockId;

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setHovered(true);
    },
    []
  );

  const handleMouseLeave = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setHovered(false);
    },
    []
  );

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (blockId) {
        setSelectedBlockId(blockId);
      }
    },
    [blockId]
  );

  // In preview mode: no chrome at all
  if (isPreview) {
    return <div>{children}</div>;
  }

  // Determine outline style
  let outlineStyle: string | undefined;
  let outlineColor: string | undefined;

  if (isSelected) {
    outlineStyle = '2px solid';
    outlineColor = 'rgb(59, 130, 246)'; // blue-500
  } else if (hovered) {
    outlineStyle = '1px dashed';
    outlineColor = 'rgb(156, 163, 175)'; // gray-400
  }

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      style={{
        position: 'relative',
        cursor: 'pointer',
        outline: outlineStyle ? `${outlineStyle} ${outlineColor}` : undefined,
        outlineOffset: outlineStyle ? '-1px' : undefined,
      }}
    >
      {isSelected && <TuneMenu />}
      {children}
    </div>
  );
}
