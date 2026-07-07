"use client";

import { useCallback, useMemo, useRef } from "react";
import {
  Background,
  BackgroundVariant,
  ConnectionLineType,
  Controls,
  MarkerType,
  MiniMap,
  ReactFlow,
  type Connection,
  type IsValidConnection,
  type OnConnect,
  type ReactFlowInstance,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { cn } from "@/lib/utils";
import { useWorkflowState } from "./hooks/use-workflow-state";
import { WORKFLOW_NODE_DRAG_DATA_KEY } from "./node-palette";
import { TriggerNode } from "./nodes/trigger-node";
import { ActionNode } from "./nodes/action-node";
import { ConditionNode } from "./nodes/condition-node";
import { DelayNode } from "./nodes/delay-node";
import { ExitNode } from "./nodes/exit-node";
import { ABSplitNode } from "./nodes/ab-split-node";
import { WorkflowEdge } from "./edges/workflow-edge";
import { BranchEdge } from "./edges/branch-edge";
import {
  CONNECTION_MATRIX,
  getNodeFamily,
  isWorkflowNodeType,
} from "./lib/workflow-types";

interface ValidationByNode {
  error?: string;
  warning?: string;
}

interface WorkflowCanvasProps {
  readOnly?: boolean;
  validationByNode: Map<string, ValidationByNode>;
  onInit?: (instance: ReactFlowInstance) => void;
}

function getConditionBranchLabel(connection: Connection, variants: Array<{ name: string; weight: number }> = []): {
  label?: string;
  branchType?: "yes" | "no" | "variant";
} {
  if (connection.sourceHandle === "yes") {
    return { label: "Yes", branchType: "yes" };
  }

  if (connection.sourceHandle === "no") {
    return { label: "No", branchType: "no" };
  }

  if (connection.sourceHandle?.startsWith("variant_")) {
    const index = Number(connection.sourceHandle.replace("variant_", ""));
    const variant = variants[index];
    if (variant) {
      return {
        label: `${variant.name} ${variant.weight}%`,
        branchType: "variant",
      };
    }

    return {
      label: "Variant",
      branchType: "variant",
    };
  }

  return {};
}

export function WorkflowCanvas({
  readOnly = false,
  validationByNode,
  onInit,
}: WorkflowCanvasProps) {
  const nodes = useWorkflowState((state) => state.nodes);
  const edges = useWorkflowState((state) => state.edges);
  const onNodesChange = useWorkflowState((state) => state.onNodesChange);
  const onEdgesChange = useWorkflowState((state) => state.onEdgesChange);
  const onConnectStore = useWorkflowState((state) => state.onConnect);
  const addNode = useWorkflowState((state) => state.addNode);
  const selectNode = useWorkflowState((state) => state.selectNode);

  const instanceRef = useRef<ReactFlowInstance | null>(null);

  const nodeTypes = useMemo(
    () => ({
      "trigger-event": TriggerNode,
      "trigger-time": TriggerNode,
      "trigger-manual": TriggerNode,
      "action-email": ActionNode,
      "action-smart": ActionNode,
      "condition-ifelse": ConditionNode,
      "condition-absplit": ABSplitNode,
      "delay-wait": DelayNode,
      "control-exit": ExitNode,
    }),
    []
  );

  const edgeTypes = useMemo(
    () => ({
      workflow: WorkflowEdge,
      branch: BranchEdge,
    }),
    []
  );

  const decoratedNodes = useMemo(() => {
    return nodes.map((node) => {
      const validation = validationByNode.get(node.id);
      return {
        ...node,
        data: {
          ...node.data,
          __validationError: validation?.error,
          __validationWarning: validation?.warning,
        },
      };
    });
  }, [nodes, validationByNode]);

  const isValidConnection = useCallback<IsValidConnection>(
    (connection) => {
      if (!connection.source || !connection.target) {
        return false;
      }

      if (connection.source === connection.target) {
        return false;
      }

      const sourceNode = nodes.find((node) => node.id === connection.source);
      const targetNode = nodes.find((node) => node.id === connection.target);

      if (!sourceNode || !targetNode) {
        return false;
      }

      const sourceFamily = getNodeFamily(sourceNode.type || "");
      const targetFamily = getNodeFamily(targetNode.type || "");

      if (!sourceFamily || !targetFamily) {
        return false;
      }

      const allowedTargets = CONNECTION_MATRIX[sourceFamily];
      if (!allowedTargets.includes(targetFamily)) {
        return false;
      }

      const hasDuplicate = edges.some(
        (edge) =>
          edge.source === connection.source
          && edge.target === connection.target
          && (edge.sourceHandle || null) === (connection.sourceHandle || null)
          && (edge.targetHandle || null) === (connection.targetHandle || null)
      );

      if (hasDuplicate) {
        return false;
      }

      if (sourceFamily !== "condition") {
        const outgoingFromHandle = edges.filter(
          (edge) =>
            edge.source === connection.source
            && (edge.sourceHandle || null) === (connection.sourceHandle || null)
        );

        if (outgoingFromHandle.length >= 1) {
          return false;
        }
      }

      return true;
    },
    [edges, nodes]
  );

  const onConnect = useCallback<OnConnect>(
    (connection) => {
      if (!isValidConnection(connection)) {
        return;
      }

      const sourceNode = nodes.find((node) => node.id === connection.source);
      const sourceFamily = getNodeFamily(sourceNode?.type || "");

      if (sourceFamily === "condition") {
        const variants = Array.isArray(sourceNode?.data?.variants)
          ? (sourceNode.data.variants as Array<{ name: string; weight: number }>)
          : [];
        const branch = getConditionBranchLabel(connection, variants);

        onConnectStore({
          ...connection,
          type: "branch",
          data: branch,
        });
        return;
      }

      onConnectStore({
        ...connection,
        type: "workflow",
      });
    },
    [isValidConnection, nodes, onConnectStore]
  );

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = readOnly ? "none" : "move";
  }, [readOnly]);

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();

      if (readOnly || !instanceRef.current) {
        return;
      }

      const nodeTypeValue = event.dataTransfer.getData(WORKFLOW_NODE_DRAG_DATA_KEY);
      if (!isWorkflowNodeType(nodeTypeValue)) {
        return;
      }

      const position = instanceRef.current.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      addNode(nodeTypeValue, position);
    },
    [addNode, readOnly]
  );

  return (
    <div
      className="relative h-full w-full"
      role="application"
      aria-label="Campaign workflow canvas"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <ReactFlow
        nodes={decoratedNodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={(instance) => {
          instanceRef.current = instance as unknown as ReactFlowInstance;
          onInit?.(instance as unknown as ReactFlowInstance);
          requestAnimationFrame(() => {
            instance.fitView({ duration: 300, padding: 0.2 });
          });
        }}
        onPaneClick={() => selectNode(null)}
        onNodeClick={(_, node) => selectNode(node.id)}
        onSelectionChange={({ nodes: selectedNodes }) => {
          const selectedId = selectedNodes[0]?.id || null;
          selectNode(selectedId);
        }}
        isValidConnection={isValidConnection}
        fitView
        snapToGrid
        snapGrid={[20, 20]}
        defaultEdgeOptions={{
          type: "workflow",
          animated: true,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: "hsl(var(--primary))",
          },
        }}
        connectionLineType={ConnectionLineType.SmoothStep}
        deleteKeyCode={readOnly ? null : ["Backspace", "Delete"]}
        elementsSelectable={!readOnly}
        nodesDraggable={!readOnly}
        nodesConnectable={!readOnly}
        nodesFocusable
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1.5} color="hsl(var(--border))" />
        <MiniMap
          position="bottom-right"
          aria-hidden="true"
          pannable
          zoomable
          style={{ border: "1px solid hsl(var(--border))", borderRadius: 10 }}
        />
        <Controls position="bottom-left" />
      </ReactFlow>

      {nodes.length === 0 ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="rounded-xl border border-dashed bg-background/80 px-6 py-5 text-center shadow-sm backdrop-blur-sm">
            <p className="text-sm font-semibold">Drag a trigger node to start building your workflow</p>
            <p className="mt-1 text-xs text-muted-foreground">Use the node palette on the left.</p>
          </div>
        </div>
      ) : null}

      {readOnly ? (
        <div className="pointer-events-none absolute right-4 top-4 rounded-md bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
          Read-only mode
        </div>
      ) : null}

      <div className={cn("absolute inset-0 pointer-events-none transition-opacity", nodes.length > 0 ? "opacity-0" : "opacity-100")} />
    </div>
  );
}
