'use client';

import React from 'react';

interface ReaderBlockWrapperProps {
  children: React.ReactNode;
}

/**
 * A thin wrapper for reader (non-editable) blocks.
 * In read mode there is no interactive chrome, so this simply
 * passes children through. It exists as a consistent counterpart
 * to EditorBlockWrapper so components can be toggled between modes.
 */
export function ReaderBlockWrapper({ children }: ReaderBlockWrapperProps) {
  return <>{children}</>;
}
