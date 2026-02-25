"use client";

import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type EdgeChange,
  type NodeChange,
  type XYPosition,
} from "@xyflow/react";
import { create } from "zustand";
import { createWorkflowNode } from "../lib/node-registry";
import type {
  WorkflowEdge,
  WorkflowNode,
  WorkflowNodeData,
  WorkflowNodeType,
  WorkflowSnapshot,
} from "../lib/workflow-types";

const HISTORY_LIMIT = 100;
const UPDATE_NODE_DEBOUNCE_MS = 300;
let updateNodeDebounceTimer: ReturnType<typeof setTimeout> | null = null;

function cloneSnapshot(snapshot: WorkflowSnapshot): WorkflowSnapshot {
  return {
    nodes: JSON.parse(JSON.stringify(snapshot.nodes)) as WorkflowNode[],
    edges: JSON.parse(JSON.stringify(snapshot.edges)) as WorkflowEdge[],
  };
}

function createSnapshot(nodes: WorkflowNode[], edges: WorkflowEdge[]): WorkflowSnapshot {
  return cloneSnapshot({ nodes, edges });
}

interface WorkflowState {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  selectedNodeId: string | null;
  undoStack: WorkflowSnapshot[];
  redoStack: WorkflowSnapshot[];
  isDirty: boolean;
  hasLoaded: boolean;
  onNodesChange: (changes: NodeChange<WorkflowNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<WorkflowEdge>[]) => void;
  onConnect: (connection: Connection & Partial<WorkflowEdge>) => void;
  addNode: (type: WorkflowNodeType, position: XYPosition) => void;
  removeNode: (id: string) => void;
  removeEdge: (id: string) => void;
  updateNodeData: (id: string, data: Partial<WorkflowNodeData>) => void;
  selectNode: (id: string | null) => void;
  setNodesAndEdges: (nodes: WorkflowNode[], edges: WorkflowEdge[], markDirty?: boolean) => void;
  setDirty: (dirty: boolean) => void;
  undo: () => void;
  redo: () => void;
  pushUndo: () => void;
  setFromSaved: (nodes: WorkflowNode[], edges: WorkflowEdge[]) => void;
  reset: () => void;
}

export const useWorkflowState = create<WorkflowState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  undoStack: [],
  redoStack: [],
  isDirty: false,
  hasLoaded: false,

  onNodesChange: (changes) => {
    set((state) => ({
      nodes: applyNodeChanges(changes, state.nodes) as WorkflowNode[],
      isDirty: true,
    }));
  },

  onEdgesChange: (changes) => {
    set((state) => ({
      edges: applyEdgeChanges(changes, state.edges) as WorkflowEdge[],
      isDirty: true,
    }));
  },

  onConnect: (connection) => {
    get().pushUndo();

    set((state) => ({
      edges: addEdge(
        {
          ...connection,
          type: connection.type || "workflow",
          animated: true,
        },
        state.edges
      ) as WorkflowEdge[],
      isDirty: true,
      redoStack: [],
    }));
  },

  addNode: (type, position) => {
    get().pushUndo();

    set((state) => ({
      nodes: state.nodes.concat(createWorkflowNode(type, position)),
      isDirty: true,
      redoStack: [],
    }));
  },

  removeNode: (id) => {
    get().pushUndo();

    set((state) => ({
      nodes: state.nodes.filter((node) => node.id !== id),
      edges: state.edges.filter((edge) => edge.source !== id && edge.target !== id),
      selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
      isDirty: true,
      redoStack: [],
    }));
  },

  removeEdge: (id) => {
    get().pushUndo();

    set((state) => ({
      edges: state.edges.filter((edge) => edge.id !== id),
      isDirty: true,
      redoStack: [],
    }));
  },

  updateNodeData: (id, data) => {
    if (updateNodeDebounceTimer) {
      clearTimeout(updateNodeDebounceTimer);
    } else {
      get().pushUndo();
    }

    updateNodeDebounceTimer = setTimeout(() => {
      updateNodeDebounceTimer = null;
    }, UPDATE_NODE_DEBOUNCE_MS);

    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === id
          ? {
              ...node,
              data: {
                ...node.data,
                ...data,
              },
            }
          : node
      ),
      isDirty: true,
      redoStack: [],
    }));
  },

  selectNode: (id) => {
    set({ selectedNodeId: id });
  },

  setNodesAndEdges: (nodes, edges, markDirty = true) => {
    set({
      nodes,
      edges,
      isDirty: markDirty,
      hasLoaded: true,
    });
  },

  setDirty: (dirty) => {
    set({ isDirty: dirty });
  },

  undo: () => {
    const state = get();
    const previous = state.undoStack.at(-1);
    if (!previous) {
      return;
    }

    const current = createSnapshot(state.nodes, state.edges);

    set({
      nodes: previous.nodes,
      edges: previous.edges,
      undoStack: state.undoStack.slice(0, -1),
      redoStack: state.redoStack.concat(cloneSnapshot(current)).slice(-HISTORY_LIMIT),
      selectedNodeId: null,
      isDirty: true,
    });
  },

  redo: () => {
    const state = get();
    const next = state.redoStack.at(-1);
    if (!next) {
      return;
    }

    const current = createSnapshot(state.nodes, state.edges);

    set({
      nodes: next.nodes,
      edges: next.edges,
      redoStack: state.redoStack.slice(0, -1),
      undoStack: state.undoStack.concat(cloneSnapshot(current)).slice(-HISTORY_LIMIT),
      selectedNodeId: null,
      isDirty: true,
    });
  },

  pushUndo: () => {
    const state = get();
    const snapshot = createSnapshot(state.nodes, state.edges);

    set({
      undoStack: state.undoStack.concat(snapshot).slice(-HISTORY_LIMIT),
      redoStack: [],
    });
  },

  setFromSaved: (nodes, edges) => {
    if (updateNodeDebounceTimer) {
      clearTimeout(updateNodeDebounceTimer);
      updateNodeDebounceTimer = null;
    }

    set({
      nodes,
      edges,
      undoStack: [],
      redoStack: [],
      selectedNodeId: null,
      isDirty: false,
      hasLoaded: true,
    });
  },

  reset: () => {
    if (updateNodeDebounceTimer) {
      clearTimeout(updateNodeDebounceTimer);
      updateNodeDebounceTimer = null;
    }

    set({
      nodes: [],
      edges: [],
      selectedNodeId: null,
      undoStack: [],
      redoStack: [],
      isDirty: false,
      hasLoaded: false,
    });
  },
}));

export function useCanUndo(): boolean {
  return useWorkflowState((state) => state.undoStack.length > 0);
}

export function useCanRedo(): boolean {
  return useWorkflowState((state) => state.redoStack.length > 0);
}
