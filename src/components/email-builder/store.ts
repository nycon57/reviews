import { create } from "zustand";
import type { EmailDocument, BlockNode, BlockType } from "@/lib/email-builder/types";
import { DEFAULT_DOCUMENT_SETTINGS } from "@/lib/email-builder/types";
import { BLOCK_REGISTRY } from "@/lib/email-builder/block-definitions";

interface HistoryEntry {
  document: EmailDocument;
  subject: string;
  previewText: string;
}

interface EditorState {
  // Document state
  document: EmailDocument;
  subject: string;
  previewText: string;
  templateId: string | null;
  templateName: string;
  isDirty: boolean;

  // Selection
  selectedBlockId: string | null;

  // History
  past: HistoryEntry[];
  future: HistoryEntry[];

  // Actions
  setDocument: (doc: EmailDocument) => void;
  loadTemplate: (opts: {
    id: string | null;
    name: string;
    subject: string;
    previewText: string;
    document: EmailDocument;
  }) => void;
  addBlock: (type: BlockType, afterId?: string, parentId?: string) => void;
  removeBlock: (id: string) => void;
  updateBlockProps: (id: string, props: Record<string, unknown>) => void;
  moveBlock: (activeId: string, overId: string) => void;
  selectBlock: (id: string | null) => void;
  setSubject: (subject: string) => void;
  setPreviewText: (text: string) => void;
  setTemplateName: (name: string) => void;
  updateSettings: (settings: Partial<EmailDocument["settings"]>) => void;

  // Undo/redo
  undo: () => void;
  redo: () => void;
}

function generateId(): string {
  return crypto.randomUUID?.() ?? `block-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function pushHistory(state: EditorState): Pick<EditorState, "past" | "future"> {
  return {
    past: [
      ...state.past.slice(-49), // keep last 50
      { document: state.document, subject: state.subject, previewText: state.previewText },
    ],
    future: [],
  };
}

function addBlockToList(
  blocks: BlockNode[],
  newBlock: BlockNode,
  afterId?: string,
  parentId?: string
): BlockNode[] {
  // If parentId specified, add inside that container
  if (parentId) {
    return blocks.map((b) => {
      if (b.id === parentId) {
        const children = b.children ? [...b.children, newBlock] : [newBlock];
        return { ...b, children };
      }
      if (b.children) {
        return { ...b, children: addBlockToList(b.children, newBlock, afterId, parentId) };
      }
      return b;
    });
  }

  // Add after specific block
  if (afterId) {
    const idx = blocks.findIndex((b) => b.id === afterId);
    if (idx !== -1) {
      const result = [...blocks];
      result.splice(idx + 1, 0, newBlock);
      return result;
    }
    // Check children
    return blocks.map((b) => {
      if (b.children) {
        return { ...b, children: addBlockToList(b.children, newBlock, afterId) };
      }
      return b;
    });
  }

  // Append to end
  return [...blocks, newBlock];
}

function removeBlockFromList(blocks: BlockNode[], id: string): BlockNode[] {
  return blocks
    .filter((b) => b.id !== id)
    .map((b) => {
      if (b.children) {
        return { ...b, children: removeBlockFromList(b.children, id) };
      }
      return b;
    });
}

function updateBlockInList(
  blocks: BlockNode[],
  id: string,
  props: Record<string, unknown>
): BlockNode[] {
  return blocks.map((b) => {
    if (b.id === id) {
      return { ...b, props: { ...b.props, ...props } };
    }
    if (b.children) {
      return { ...b, children: updateBlockInList(b.children, id, props) };
    }
    return b;
  });
}

function findAndExtractBlock(
  blocks: BlockNode[],
  id: string
): { remaining: BlockNode[]; extracted: BlockNode | null } {
  let extracted: BlockNode | null = null;
  const remaining = blocks
    .filter((b) => {
      if (b.id === id) {
        extracted = b;
        return false;
      }
      return true;
    })
    .map((b) => {
      if (b.children && !extracted) {
        const result = findAndExtractBlock(b.children, id);
        extracted = result.extracted;
        return { ...b, children: result.remaining };
      }
      return b;
    });
  return { remaining, extracted };
}

function insertBlockAtPosition(
  blocks: BlockNode[],
  block: BlockNode,
  targetId: string
): BlockNode[] {
  const idx = blocks.findIndex((b) => b.id === targetId);
  if (idx !== -1) {
    const result = [...blocks];
    result.splice(idx, 0, block);
    return result;
  }
  return blocks.map((b) => {
    if (b.children) {
      return { ...b, children: insertBlockAtPosition(b.children, block, targetId) };
    }
    return b;
  });
}

const DEFAULT_DOCUMENT: EmailDocument = {
  settings: { ...DEFAULT_DOCUMENT_SETTINGS },
  blocks: [],
};

export const useEditorStore = create<EditorState>((set, _get) => ({
  document: DEFAULT_DOCUMENT,
  subject: "",
  previewText: "",
  templateId: null,
  templateName: "Untitled Template",
  isDirty: false,
  selectedBlockId: null,
  past: [],
  future: [],

  setDocument: (doc) =>
    set((state) => ({
      ...pushHistory(state),
      document: doc,
      isDirty: true,
    })),

  loadTemplate: (opts) =>
    set({
      templateId: opts.id,
      templateName: opts.name,
      subject: opts.subject,
      previewText: opts.previewText,
      document: opts.document,
      isDirty: false,
      selectedBlockId: null,
      past: [],
      future: [],
    }),

  addBlock: (type, afterId, parentId) => {
    const def = BLOCK_REGISTRY[type];
    if (!def) return;
    const newBlock: BlockNode = {
      id: generateId(),
      type,
      props: { ...def.defaultProps },
    };
    if (def.isContainer) newBlock.children = [];
    set((state) => ({
      ...pushHistory(state),
      document: {
        ...state.document,
        blocks: addBlockToList(state.document.blocks, newBlock, afterId, parentId),
      },
      selectedBlockId: newBlock.id,
      isDirty: true,
    }));
  },

  removeBlock: (id) =>
    set((state) => ({
      ...pushHistory(state),
      document: {
        ...state.document,
        blocks: removeBlockFromList(state.document.blocks, id),
      },
      selectedBlockId: state.selectedBlockId === id ? null : state.selectedBlockId,
      isDirty: true,
    })),

  updateBlockProps: (id, props) =>
    set((state) => ({
      ...pushHistory(state),
      document: {
        ...state.document,
        blocks: updateBlockInList(state.document.blocks, id, props),
      },
      isDirty: true,
    })),

  moveBlock: (activeId, overId) => {
    if (activeId === overId) return;
    set((state) => {
      const { remaining, extracted } = findAndExtractBlock(
        state.document.blocks,
        activeId
      );
      if (!extracted) return state;
      return {
        ...pushHistory(state),
        document: {
          ...state.document,
          blocks: insertBlockAtPosition(remaining, extracted, overId),
        },
        isDirty: true,
      };
    });
  },

  selectBlock: (id) => set({ selectedBlockId: id }),

  setSubject: (subject) => set({ subject, isDirty: true }),
  setPreviewText: (text) => set({ previewText: text, isDirty: true }),
  setTemplateName: (name) => set({ templateName: name, isDirty: true }),

  updateSettings: (settings) =>
    set((state) => ({
      ...pushHistory(state),
      document: {
        ...state.document,
        settings: { ...state.document.settings, ...settings },
      },
      isDirty: true,
    })),

  undo: () =>
    set((state) => {
      if (state.past.length === 0) return state;
      const prev = state.past[state.past.length - 1];
      return {
        past: state.past.slice(0, -1),
        future: [
          { document: state.document, subject: state.subject, previewText: state.previewText },
          ...state.future,
        ],
        document: prev.document,
        subject: prev.subject,
        previewText: prev.previewText,
        isDirty: true,
      };
    }),

  redo: () =>
    set((state) => {
      if (state.future.length === 0) return state;
      const next = state.future[0];
      return {
        past: [
          ...state.past,
          { document: state.document, subject: state.subject, previewText: state.previewText },
        ],
        future: state.future.slice(1),
        document: next.document,
        subject: next.subject,
        previewText: next.previewText,
        isDirty: true,
      };
    }),
}));
