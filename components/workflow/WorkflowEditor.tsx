"use client";

import { useCallback, useRef, DragEvent, useState, useEffect } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  Connection,
  NodeTypes,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { useWorkflowStore } from "@/lib/store";
import { NodePalette } from "./NodePalette";
import { PropertyPanel } from "./PropertyPanel";
import { WorkflowToolbar } from "./WorkflowToolbar";
import { AIAssistant } from "@/components/ai/AIAssistant";
import {
  ActivityNode,
  DecisionNode,
  ParallelNode,
  SignalNode,
  TimerNode,
  StartNode,
  EndNode,
} from "./nodes";
import { WorkflowNodeData } from "@/lib/types";
import { useAutoSave } from "@/lib/hooks/useAutoSave";
import { useKeyboardShortcuts } from "@/lib/hooks/useKeyboardShortcuts";
import { useToast } from "@/components/ui/toast";

const nodeTypes: NodeTypes = {
  activity: ActivityNode,
  decision: DecisionNode,
  parallel: ParallelNode,
  signal: SignalNode,
  timer: TimerNode,
  start: StartNode,
  end: EndNode,
};

let nodeId = 1;
const getId = () => `node_${nodeId++}`;

export function WorkflowEditor() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();
  const [showAI, setShowAI] = useState(true);
  const { addToast } = useToast();

  const nodes = useWorkflowStore((state) => state.nodes);
  const edges = useWorkflowStore((state) => state.edges);
  const selectedNodeId = useWorkflowStore((state) => state.selectedNodeId);
  const onNodesChange = useWorkflowStore((state) => state.onNodesChange);
  const onEdgesChange = useWorkflowStore((state) => state.onEdgesChange);
  const setEdges = useWorkflowStore((state) => state.setEdges);
  const setNodes = useWorkflowStore((state) => state.setNodes);
  const addNode = useWorkflowStore((state) => state.addNode);
  const setSelectedNodeId = useWorkflowStore((state) => state.setSelectedNodeId);
  const deleteNode = useWorkflowStore((state) => state.deleteNode);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || null;

  // Auto-save functionality
  const { loadAutoSave, clearAutoSave, getLastSaveTime } = useAutoSave(nodes, edges, {
    interval: 30000, // Auto-save every 30 seconds
    enabled: true,
  });

  // Check for auto-saved workflow on mount
  useEffect(() => {
    const saved = loadAutoSave();
    const lastSave = getLastSaveTime();

    if (saved && saved.nodes.length > 1) {
      // More than just start node
      const shouldRestore = window.confirm(
        `Found auto-saved workflow from ${new Date(lastSave!).toLocaleString()}. Restore it?`
      );

      if (shouldRestore) {
        setNodes(saved.nodes);
        setEdges(saved.edges);
        addToast("Workflow restored from auto-save", "success");
        clearAutoSave();
      }
    }
  }, []);

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: "s",
      ctrlKey: true,
      callback: (e) => {
        e.preventDefault();
        // Trigger save via custom event
        window.dispatchEvent(new CustomEvent("workflow-save"));
        addToast("Workflow saved (Ctrl+S)", "success");
      },
    },
    {
      key: "Delete",
      callback: (e) => {
        if (selectedNodeId) {
          deleteNode(selectedNodeId);
          addToast("Node deleted", "info");
        }
      },
    },
    {
      key: "Escape",
      callback: () => {
        setSelectedNodeId(null);
      },
    },
  ]);

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges(addEdge(params, edges));
    },
    [edges, setEdges]
  );

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData("application/reactflow");
      if (!type || !reactFlowWrapper.current) {
        return;
      }

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode = {
        id: getId(),
        type,
        position,
        data: getDefaultNodeData(type),
      };

      addNode(newNode);
    },
    [screenToFlowPosition, addNode]
  );

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: any) => {
      setSelectedNodeId(node.id);
    },
    [setSelectedNodeId]
  );

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, [setSelectedNodeId]);

  return (
    <div className="flex h-full w-full">
      <NodePalette />

      <div className="flex-1 flex flex-col">
        <WorkflowToolbar />

        <div ref={reactFlowWrapper} className="flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            fitView
          >
            <Background />
            <Controls />
            <MiniMap />
          </ReactFlow>
        </div>
      </div>

      <div className="w-96 h-full flex flex-col border-l">
        <div className="flex border-b">
          <button
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
              showAI ? "bg-primary text-primary-foreground" : "bg-background hover:bg-accent"
            }`}
            onClick={() => setShowAI(true)}
          >
            AI Assistant
          </button>
          <button
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
              !showAI ? "bg-primary text-primary-foreground" : "bg-background hover:bg-accent"
            }`}
            onClick={() => setShowAI(false)}
          >
            Properties
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          {showAI ? (
            <AIAssistant />
          ) : (
            <PropertyPanel selectedNode={selectedNode} />
          )}
        </div>
      </div>
    </div>
  );
}

function getDefaultNodeData(type: string): WorkflowNodeData {
  switch (type) {
    case "activity":
      return {
        label: "New Activity",
        activityName: "myActivity",
        timeout: "5m",
        retryPolicy: { maxAttempts: 3 },
      };
    case "decision":
      return {
        label: "Decision",
        condition: "result.success",
      };
    case "parallel":
      return {
        label: "Parallel",
        branches: 2,
      };
    case "signal":
      return {
        label: "Wait for Signal",
        signalName: "approvalSignal",
      };
    case "timer":
      return {
        label: "Sleep",
        duration: "10s",
      };
    case "start":
      return { label: "Start" };
    case "end":
      return { label: "End" };
    default:
      return { label: "Node" };
  }
}
