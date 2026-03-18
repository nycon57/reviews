'use client';

import React from 'react';
import { z } from 'zod';
import { ColumnsContainer as BaseColumnsContainer } from '@usewaypoint/block-columns-container';
import { ColumnsContainerPropsSchema } from './schemas/columns-container-props-schema';
import { EditorChildrenIds } from './editor-children-ids';

type ColumnsContainerEditorProps = z.infer<typeof ColumnsContainerPropsSchema>;

export function ColumnsContainerEditor({
  style,
  props,
}: ColumnsContainerEditorProps) {
  const { columns, ...restProps } = props ?? {
    columns: [
      { childrenIds: [] },
      { childrenIds: [] },
      { childrenIds: [] },
    ],
  };

  const cols = columns
    ? columns.map((col, i) => (
        <EditorChildrenIds key={i} childrenIds={col.childrenIds} />
      ))
    : undefined;

  return (
    <BaseColumnsContainer
      props={restProps}
      columns={cols}
      style={style}
    />
  );
}
