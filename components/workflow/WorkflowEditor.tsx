"use client";

import { useCallback, useRef, DragEvent, useState } from "react";
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

  const nodes = useWorkflowStore((state) => state.nodes);
  const edges = useWorkflowStore((state) => state.edges);
  const selectedNodeId = useWorkflowStore((state) => state.selectedNodeId);
  const onNodesChange = useWorkflowStore((state) => state.onNodesChange);
  const onEdgesChange = useWorkflowStore((state) => state.onEdgesChange);
  const setEdges = useWorkflowStore((state) => state.setEdges);
  const addNode = useWorkflowStore((state) => state.addNode);
  const setSelectedNodeId = useWorkflowStore((state) => state.setSelectedNodeId);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || null;

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

      {showAI ? (
        <AIAssistant onClose={() => setShowAI(false)} />
      ) : (
        <PropertyPanel selectedNode={selectedNode} />
      )}
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
