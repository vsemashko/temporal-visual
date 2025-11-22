import { Node, Edge } from "@xyflow/react";
import { WorkflowNodeData, ActivityNodeData } from "./types";

export interface ValidationError {
  type: "error" | "warning";
  message: string;
  nodeId?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

export function validateWorkflow(
  nodes: Node<WorkflowNodeData>[],
  edges: Edge[]
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Check for start node
  const startNodes = nodes.filter((n) => n.type === "start");
  if (startNodes.length === 0) {
    errors.push({
      type: "error",
      message: "Workflow must have at least one Start node",
    });
  } else if (startNodes.length > 1) {
    errors.push({
      type: "error",
      message: "Workflow can only have one Start node",
    });
  }

  // Check for end node
  const endNodes = nodes.filter((n) => n.type === "end");
  if (endNodes.length === 0) {
    warnings.push({
      type: "warning",
      message: "Workflow should have at least one End node",
    });
  }

  // Check for isolated nodes (no connections)
  nodes.forEach((node) => {
    const hasIncoming = edges.some((e) => e.target === node.id);
    const hasOutgoing = edges.some((e) => e.source === node.id);

    if (!hasIncoming && node.type !== "start") {
      warnings.push({
        type: "warning",
        message: `Node "${node.data.label}" has no incoming connections`,
        nodeId: node.id,
      });
    }

    if (!hasOutgoing && node.type !== "end") {
      warnings.push({
        type: "warning",
        message: `Node "${node.data.label}" has no outgoing connections`,
        nodeId: node.id,
      });
    }
  });

  // Validate activity nodes
  nodes
    .filter((n) => n.type === "activity")
    .forEach((node) => {
      const data = node.data as ActivityNodeData;

      if (!data.activityName || data.activityName.trim() === "") {
        errors.push({
          type: "error",
          message: `Activity "${data.label}" must have an activity name`,
          nodeId: node.id,
        });
      }

      // Check for valid activity name (no spaces, valid identifier)
      if (data.activityName && !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(data.activityName)) {
        errors.push({
          type: "error",
          message: `Activity name "${data.activityName}" must be a valid JavaScript identifier`,
          nodeId: node.id,
        });
      }

      // Check timeout format
      if (data.timeout && !isValidDuration(data.timeout)) {
        errors.push({
          type: "error",
          message: `Invalid timeout format "${data.timeout}". Use format like "5s", "10m", "1h"`,
          nodeId: node.id,
        });
      }
    });

  // Validate decision nodes
  nodes
    .filter((n) => n.type === "decision")
    .forEach((node) => {
      const outgoingEdges = edges.filter((e) => e.source === node.id);

      if (outgoingEdges.length < 2) {
        warnings.push({
          type: "warning",
          message: `Decision node "${node.data.label}" should have at least 2 outgoing paths`,
          nodeId: node.id,
        });
      }
    });

  // Check for cycles (infinite loops)
  if (hasCycles(nodes, edges)) {
    warnings.push({
      type: "warning",
      message: "Workflow contains cycles which may cause infinite loops",
    });
  }

  // Check for unreachable nodes
  const reachableNodes = getReachableNodes(nodes, edges);
  nodes.forEach((node) => {
    if (!reachableNodes.has(node.id) && node.type !== "start") {
      warnings.push({
        type: "warning",
        message: `Node "${node.data.label}" is unreachable from Start`,
        nodeId: node.id,
      });
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

function isValidDuration(duration: string): boolean {
  // Valid formats: 5s, 10m, 1h, 2d
  return /^\d+[smhd]$/.test(duration);
}

function hasCycles(nodes: Node<WorkflowNodeData>[], edges: Edge[]): boolean {
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function dfs(nodeId: string): boolean {
    visited.add(nodeId);
    recursionStack.add(nodeId);

    const outgoingEdges = edges.filter((e) => e.source === nodeId);
    for (const edge of outgoingEdges) {
      if (!visited.has(edge.target)) {
        if (dfs(edge.target)) {
          return true;
        }
      } else if (recursionStack.has(edge.target)) {
        return true; // Cycle detected
      }
    }

    recursionStack.delete(nodeId);
    return false;
  }

  for (const node of nodes) {
    if (!visited.has(node.id)) {
      if (dfs(node.id)) {
        return true;
      }
    }
  }

  return false;
}

function getReachableNodes(
  nodes: Node<WorkflowNodeData>[],
  edges: Edge[]
): Set<string> {
  const reachable = new Set<string>();
  const startNodes = nodes.filter((n) => n.type === "start");

  if (startNodes.length === 0) {
    return reachable;
  }

  const queue = [startNodes[0].id];
  reachable.add(startNodes[0].id);

  while (queue.length > 0) {
    const current = queue.shift()!;
    const outgoingEdges = edges.filter((e) => e.source === current);

    for (const edge of outgoingEdges) {
      if (!reachable.has(edge.target)) {
        reachable.add(edge.target);
        queue.push(edge.target);
      }
    }
  }

  return reachable;
}

export function getValidationSummary(result: ValidationResult): string {
  if (result.isValid && result.warnings.length === 0) {
    return "✅ Workflow is valid";
  }

  const parts: string[] = [];

  if (result.errors.length > 0) {
    parts.push(`${result.errors.length} error(s)`);
  }

  if (result.warnings.length > 0) {
    parts.push(`${result.warnings.length} warning(s)`);
  }

  return parts.join(", ");
}
