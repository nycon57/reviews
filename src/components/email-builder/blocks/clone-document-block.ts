import type { TEditorDocument } from '../editor/editor-context';

function generateId(): string {
  return crypto.randomUUID?.() ?? `block_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Deep-clones a block and all of its nested children in the document,
 * assigning fresh IDs so the clone is fully independent.
 *
 * Uses an oldId→newId map so that cycles or shared references
 * always resolve to the mapped new ID, never the original.
 *
 * Returns a new document with the cloned block tree merged in,
 * plus the new root block ID.
 */
export function cloneDocumentBlock(
  document: TEditorDocument,
  blockId: string,
  idMap: Map<string, string> = new Map()
): { document: TEditorDocument; blockId: string | null } {
  // If already cloned (cycle or shared reference), return the mapped ID
  if (idMap.has(blockId)) {
    return { document, blockId: idMap.get(blockId)! };
  }

  const block = document[blockId];
  if (!block) {
    console.warn(`[cloneDocumentBlock] Block "${blockId}" not found in document — skipping`);
    return { document, blockId: null };
  }

  // Pre-generate new ID and register in map before recursing (handles cycles)
  const newId = generateId();
  idMap.set(blockId, newId);

  let newDocument: TEditorDocument = { ...document };

  // Deep clone the data, replacing any childrenIds with new cloned IDs
  const clonedData = JSON.parse(JSON.stringify(block.data)) as Record<string, unknown>;

  // Handle childrenIds at the top level (EmailLayout, Container)
  if (Array.isArray(clonedData.childrenIds)) {
    const newChildrenIds: string[] = [];
    for (const childId of clonedData.childrenIds as string[]) {
      const result = cloneDocumentBlock(newDocument, childId, idMap);
      newDocument = { ...newDocument, ...result.document };
      if (result.blockId) newChildrenIds.push(result.blockId);
    }
    clonedData.childrenIds = newChildrenIds;
  }

  // Handle nested props.childrenIds (Container)
  const props = clonedData.props as Record<string, unknown> | undefined;
  if (props && Array.isArray(props.childrenIds)) {
    const newChildrenIds: string[] = [];
    for (const childId of props.childrenIds as string[]) {
      const result = cloneDocumentBlock(newDocument, childId, idMap);
      newDocument = { ...newDocument, ...result.document };
      if (result.blockId) newChildrenIds.push(result.blockId);
    }
    props.childrenIds = newChildrenIds;
  }

  // Handle columns (ColumnsContainer)
  if (props && Array.isArray(props.columns)) {
    const columns = props.columns as Array<{ childrenIds: string[] }>;
    for (const column of columns) {
      if (Array.isArray(column.childrenIds)) {
        const newChildrenIds: string[] = [];
        for (const childId of column.childrenIds) {
          const result = cloneDocumentBlock(newDocument, childId, idMap);
          newDocument = { ...newDocument, ...result.document };
          if (result.blockId) newChildrenIds.push(result.blockId);
        }
        column.childrenIds = newChildrenIds;
      }
    }
  }

  newDocument[newId] = {
    type: block.type,
    data: clonedData,
  };

  return { document: newDocument, blockId: newId };
}
