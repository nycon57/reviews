import { create } from 'zustand';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TEditorDocument = Record<string, { type: string; data: Record<string, unknown> }>;

type ScreenSize = 'desktop' | 'mobile';
type MainTab = 'editor' | 'preview' | 'html' | 'json';
type SidebarTab = 'block-configuration' | 'styles';

const MAX_HISTORY = 50;

interface EditorState {
  document: TEditorDocument;
  past: TEditorDocument[];
  future: TEditorDocument[];
  selectedBlockId: string | null;
  selectedScreenSize: ScreenSize;
  selectedMainTab: MainTab;
  selectedSidebarTab: SidebarTab;
  inspectorDrawerOpen: boolean;
  paletteDrawerOpen: boolean;
}

// ---------------------------------------------------------------------------
// Default empty document
// ---------------------------------------------------------------------------

const EMPTY_DOC: TEditorDocument = {
  root: {
    type: 'EmailLayout' as const,
    data: {
      backdropColor: '#F5F5F5',
      canvasColor: '#FFFFFF',
      textColor: '#262626',
      fontFamily: 'MODERN_SANS' as const,
      childrenIds: [],
    },
  },
};

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useEditorDocumentStore = create<EditorState>(() => ({
  document: EMPTY_DOC,
  past: [],
  future: [],
  selectedBlockId: null,
  selectedScreenSize: 'desktop',
  selectedMainTab: 'editor',
  selectedSidebarTab: 'block-configuration',
  inspectorDrawerOpen: true,
  paletteDrawerOpen: false,
}));

// ---------------------------------------------------------------------------
// Document selectors & actions
// ---------------------------------------------------------------------------

export function useDocument() {
  return useEditorDocumentStore((s) => s.document);
}

export function setDocument(doc: TEditorDocument) {
  useEditorDocumentStore.setState((s) => ({
    past: [...s.past, s.document].slice(-MAX_HISTORY),
    future: [],
    document: { ...s.document, ...doc },
  }));
}

export function resetDocument(initialDocument?: TEditorDocument) {
  useEditorDocumentStore.setState({
    document: initialDocument ?? EMPTY_DOC,
    past: [],
    future: [],
    selectedBlockId: null,
    selectedScreenSize: 'desktop',
    selectedMainTab: 'editor',
    selectedSidebarTab: 'block-configuration',
    inspectorDrawerOpen: true,
    paletteDrawerOpen: false,
  });
}

// ---------------------------------------------------------------------------
// Selected block
// ---------------------------------------------------------------------------

export function useSelectedBlockId() {
  return useEditorDocumentStore((s) => s.selectedBlockId);
}

export function setSelectedBlockId(id: string | null) {
  useEditorDocumentStore.setState({ selectedBlockId: id });
}

// ---------------------------------------------------------------------------
// Screen size
// ---------------------------------------------------------------------------

export function useSelectedScreenSize() {
  return useEditorDocumentStore((s) => s.selectedScreenSize);
}

export function setSelectedScreenSize(size: ScreenSize) {
  useEditorDocumentStore.setState({ selectedScreenSize: size });
}

// ---------------------------------------------------------------------------
// Main tab
// ---------------------------------------------------------------------------

export function useSelectedMainTab() {
  return useEditorDocumentStore((s) => s.selectedMainTab);
}

export function setSelectedMainTab(tab: MainTab) {
  useEditorDocumentStore.setState({ selectedMainTab: tab });
}

// ---------------------------------------------------------------------------
// Sidebar tab
// ---------------------------------------------------------------------------

export function useSelectedSidebarTab() {
  return useEditorDocumentStore((s) => s.selectedSidebarTab);
}

export function setSidebarTab(tab: SidebarTab) {
  useEditorDocumentStore.setState({ selectedSidebarTab: tab });
}

// ---------------------------------------------------------------------------
// Inspector drawer
// ---------------------------------------------------------------------------

export function useInspectorDrawerOpen() {
  return useEditorDocumentStore((s) => s.inspectorDrawerOpen);
}

export function toggleInspectorDrawerOpen() {
  useEditorDocumentStore.setState((s) => ({
    inspectorDrawerOpen: !s.inspectorDrawerOpen,
  }));
}

// ---------------------------------------------------------------------------
// Palette drawer
// ---------------------------------------------------------------------------

export function usePaletteDrawerOpen() {
  return useEditorDocumentStore((s) => s.paletteDrawerOpen);
}

export function togglePaletteDrawerOpen() {
  useEditorDocumentStore.setState((s) => ({
    paletteDrawerOpen: !s.paletteDrawerOpen,
  }));
}

// ---------------------------------------------------------------------------
// Undo / Redo
// ---------------------------------------------------------------------------

export function useCanUndo() {
  return useEditorDocumentStore((s) => s.past.length > 0);
}

export function useCanRedo() {
  return useEditorDocumentStore((s) => s.future.length > 0);
}

export function undo() {
  useEditorDocumentStore.setState((s) => {
    if (s.past.length === 0) return s;
    const previous = s.past[s.past.length - 1];
    return {
      document: previous,
      past: s.past.slice(0, -1),
      future: [s.document, ...s.future].slice(0, MAX_HISTORY),
    };
  });
}

export function redo() {
  useEditorDocumentStore.setState((s) => {
    if (s.future.length === 0) return s;
    const next = s.future[0];
    return {
      document: next,
      past: [...s.past, s.document].slice(-MAX_HISTORY),
      future: s.future.slice(1),
    };
  });
}
