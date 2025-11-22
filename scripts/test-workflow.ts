/**
 * Test script for executing Temporal workflows
 *
 * Usage:
 *   npx tsx scripts/test-workflow.ts [workflowName] [input]
 *
 * Examples:
 *   npx tsx scripts/test-workflow.ts myWorkflow '{"orderId": "123"}'
 *   npx tsx scripts/test-workflow.ts myWorkflow
 */

import { Connection, Client } from "@temporalio/client";

interface TestConfig {
  workflowName: string;
  input: any;
  taskQueue: string;
  temporalAddress: string;
}

async function testWorkflow(config: TestConfig) {
  console.log("\n🚀 Temporal Workflow Test\n");
  console.log("Configuration:");
  console.log(`  Workflow: ${config.workflowName}`);
  console.log(`  Task Queue: ${config.taskQueue}`);
  console.log(`  Temporal Address: ${config.temporalAddress}`);
  console.log(`  Input: ${JSON.stringify(config.input, null, 2)}\n`);

  try {
    // Connect to Temporal server
    console.log("Connecting to Temporal server...");
    const connection = await Connection.connect({
      address: config.temporalAddress,
    });
    console.log("✅ Connected successfully\n");

    // Create client
    const client = new Client({ connection });

    // Start workflow
    const workflowId = `test-${config.workflowName}-${Date.now()}`;
    console.log(`Starting workflow with ID: ${workflowId}`);

    const handle = await client.workflow.start(config.workflowName, {
      taskQueue: config.taskQueue,
      workflowId,
      args: [config.input],
    });

    console.log("✅ Workflow started successfully\n");
    console.log(`Workflow ID: ${handle.workflowId}`);
    console.log(`Run ID: ${handle.firstExecutionRunId}\n`);

    // Wait for result
    console.log("Waiting for workflow to complete...");
    const result = await handle.result();

    console.log("\n✅ Workflow completed successfully!\n");
    console.log("Result:");
    console.log(JSON.stringify(result, null, 2));
    console.log("\n");

    // Get workflow history
    console.log("Viewing in Temporal UI:");
    console.log(
      `http://localhost:8080/namespaces/default/workflows/${workflowId}\n`
    );

    return result;
  } catch (error: any) {
    console.error("\n❌ Workflow execution failed:\n");
    console.error(`Error: ${error.message}`);

    if (error.cause) {
      console.error(`Cause: ${error.cause.message}`);
      console.error(`Details: ${JSON.stringify(error.cause, null, 2)}`);
    }

    console.error("\n");
    process.exit(1);
  }
}

// Parse command line arguments
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    console.log(`
Temporal Workflow Test Script

Usage:
  npx tsx scripts/test-workflow.ts <workflow-name> [input-json]

Arguments:
  workflow-name  Name of the workflow to execute (required)
  input-json     JSON string of workflow input (optional, default: {})

Environment Variables:
  TEMPORAL_ADDRESS    Temporal server address (default: localhost:7233)
  TEMPORAL_TASK_QUEUE Task queue name (default: temporal-visual)

Examples:
  # Test with default input
  npx tsx scripts/test-workflow.ts myWorkflow

  # Test with custom input
  npx tsx scripts/test-workflow.ts myWorkflow '{"orderId": "ORDER-123"}'

  # Test order processing workflow
  npx tsx scripts/test-workflow.ts myWorkflow '{"orderId": "123", "customerId": "456"}'

  # Test with different Temporal server
  TEMPORAL_ADDRESS=production.temporal.io:7233 npx tsx scripts/test-workflow.ts myWorkflow
    `);
    process.exit(0);
  }

  const workflowName = args[0];
  const inputJson = args[1] || "{}";

  let input: any;
  try {
    input = JSON.parse(inputJson);
  } catch (error) {
    console.error("❌ Invalid JSON input:", inputJson);
    console.error("Please provide valid JSON string");
    process.exit(1);
  }

  const config: TestConfig = {
    workflowName,
    input,
    taskQueue: process.env.TEMPORAL_TASK_QUEUE || "temporal-visual",
    temporalAddress: process.env.TEMPORAL_ADDRESS || "localhost:7233",
  };

  await testWorkflow(config);
}

main().catch((error) => {
  console.error("Unexpected error:", error);
  process.exit(1);
});
