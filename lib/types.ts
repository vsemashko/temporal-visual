import { Node, Edge } from "@xyflow/react";

// Workflow Node Types
export type NodeType = "activity" | "decision" | "parallel" | "signal" | "timer" | "start" | "end";

// Activity Node Data
export interface ActivityNodeData {
  label: string;
  activityName: string;
  parameters?: Record<string, any>;
  timeout?: string;
  retryPolicy?: {
    maxAttempts: number;
    backoff?: string;
  };
  heartbeatTimeout?: string;
  code?: string;
}

// Decision Node Data
export interface DecisionNodeData {
  label: string;
  condition: string;
}

// Parallel Node Data
export interface ParallelNodeData {
  label: string;
  branches: number;
}

// Signal Node Data
export interface SignalNodeData {
  label: string;
  signalName: string;
  timeout?: string;
}

// Timer Node Data
export interface TimerNodeData {
  label: string;
  duration: string;
}

// Union type for all node data
export type WorkflowNodeData =
  | ActivityNodeData
  | DecisionNodeData
  | ParallelNodeData
  | SignalNodeData
  | TimerNodeData
  | { label: string };

export type WorkflowNode = Node<WorkflowNodeData>;
export type WorkflowEdge = Edge;

// Workflow Metadata
export interface WorkflowMetadata {
  id: string;
  name: string;
  description?: string;
  version: string;
  createdAt: string;
  updatedAt: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

// Configuration
export interface WorkflowConfig {
  environment: "development" | "production";
  timeouts: {
    activity: string;
    workflow: string;
  };
  retryPolicy: {
    maxAttempts: number;
    backoff: string;
  };
}

// Code Generation Result
export interface GeneratedCode {
  workflowCode: string;
  activityCode: string;
  errors: string[];
}
