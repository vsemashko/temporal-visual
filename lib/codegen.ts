import { Node, Edge } from "@xyflow/react";
import {
  WorkflowNodeData,
  ActivityNodeData,
  DecisionNodeData,
  TimerNodeData,
  SignalNodeData,
  GeneratedCode,
} from "./types";

export function generateWorkflowCode(
  nodes: Node<WorkflowNodeData>[],
  edges: Edge[]
): GeneratedCode {
  const errors: string[] = [];

  // Find start node
  const startNode = nodes.find((n) => n.type === "start");
  if (!startNode) {
    errors.push("No start node found");
    return { workflowCode: "", activityCode: "", errors };
  }

  // Extract activities
  const activityNodes = nodes.filter((n) => n.type === "activity") as Node<ActivityNodeData>[];
  const activityNames = activityNodes.map((n) => n.data.activityName);

  // Generate workflow code
  const workflowCode = generateWorkflow(nodes, edges, startNode, activityNames);

  // Generate activity stubs
  const activityCode = generateActivities(activityNodes);

  return { workflowCode, activityCode, errors };
}

function generateWorkflow(
  nodes: Node<WorkflowNodeData>[],
  edges: Edge[],
  startNode: Node<WorkflowNodeData>,
  activityNames: string[]
): string {
  const imports = `import { proxyActivities, sleep, condition } from '@temporalio/workflow';
import type * as activities from '../activities';
import { getTimeouts } from '../config';

const { ${activityNames.join(", ")} } = proxyActivities<typeof activities>({
  ...getTimeouts('activity')
});
`;

  const workflowFunction = `export async function myWorkflow(input: any): Promise<any> {
${generateWorkflowBody(nodes, edges, startNode, 1)}
}`;

  return imports + "\n" + workflowFunction;
}

function generateWorkflowBody(
  nodes: Node<WorkflowNodeData>[],
  edges: Edge[],
  currentNode: Node<WorkflowNodeData>,
  indentLevel: number
): string {
  const indent = "  ".repeat(indentLevel);
  let code = "";

  // Process current node
  switch (currentNode.type) {
    case "start":
      code += `${indent}// Workflow started\n`;
      break;

    case "activity":
      const activityData = currentNode.data as ActivityNodeData;
      code += `${indent}const result_${currentNode.id} = await ${activityData.activityName}(input);\n`;
      break;

    case "timer":
      const timerData = currentNode.data as TimerNodeData;
      code += `${indent}await sleep('${timerData.duration}');\n`;
      break;

    case "signal":
      const signalData = currentNode.data as SignalNodeData;
      code += `${indent}await condition(() => false, '${signalData.timeout || "1h"}'); // Wait for signal: ${signalData.signalName}\n`;
      break;

    case "decision":
      const decisionData = currentNode.data as DecisionNodeData;
      const trueEdge = edges.find(
        (e) => e.source === currentNode.id && e.sourceHandle === "true"
      );
      const falseEdge = edges.find(
        (e) => e.source === currentNode.id && e.sourceHandle === "false"
      );

      code += `${indent}if (${decisionData.condition}) {\n`;
      if (trueEdge) {
        const trueNode = nodes.find((n) => n.id === trueEdge.target);
        if (trueNode) {
          code += generateWorkflowBody(nodes, edges, trueNode, indentLevel + 1);
        }
      }
      code += `${indent}} else {\n`;
      if (falseEdge) {
        const falseNode = nodes.find((n) => n.id === falseEdge.target);
        if (falseNode) {
          code += generateWorkflowBody(nodes, edges, falseNode, indentLevel + 1);
        }
      }
      code += `${indent}}\n`;
      return code; // Decision handles its own flow

    case "parallel":
      const parallelEdges = edges.filter((e) => e.source === currentNode.id);
      const parallelNodes = parallelEdges
        .map((e) => nodes.find((n) => n.id === e.target))
        .filter(Boolean);

      code += `${indent}await Promise.all([\n`;
      parallelNodes.forEach((node) => {
        if (node) {
          code += `${indent}  (async () => {\n`;
          code += generateWorkflowBody(nodes, edges, node, indentLevel + 2);
          code += `${indent}  })(),\n`;
        }
      });
      code += `${indent}]);\n`;
      return code; // Parallel handles its own flow

    case "end":
      code += `${indent}// Workflow completed\n`;
      code += `${indent}return result_${findPreviousNode(edges, currentNode.id)};\n`;
      return code; // End terminates the flow
  }

  // Find next node
  const nextEdge = edges.find((e) => e.source === currentNode.id);
  if (nextEdge) {
    const nextNode = nodes.find((n) => n.id === nextEdge.target);
    if (nextNode) {
      code += generateWorkflowBody(nodes, edges, nextNode, indentLevel);
    }
  }

  return code;
}

function findPreviousNode(edges: Edge[], nodeId: string): string {
  const edge = edges.find((e) => e.target === nodeId);
  return edge?.source || "unknown";
}

function generateActivities(activityNodes: Node<ActivityNodeData>[]): string {
  const activities = activityNodes.map((node) => {
    const data = node.data;
    return `export async function ${data.activityName}(input: any): Promise<any> {
  // TODO: Implement ${data.activityName}
  console.log('Executing ${data.activityName}', input);

  // Your business logic here

  return { success: true };
}`;
  });

  return activities.join("\n\n");
}
