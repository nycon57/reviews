'use client';

import React from 'react';
import { z } from 'zod';
import { Container as BaseContainer } from '@usewaypoint/block-container';
import { ContainerPropsSchema } from './schemas/container-props-schema';
import { EditorChildrenIds } from './editor-children-ids';

type ContainerEditorProps = z.infer<typeof ContainerPropsSchema>;

export function ContainerEditor({ style, props }: ContainerEditorProps) {
  const childrenIds = props?.childrenIds ?? [];

  return (
    <BaseContainer style={style}>
      <EditorChildrenIds childrenIds={childrenIds} />
    </BaseContainer>
  );
}
