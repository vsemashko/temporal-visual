/**
 * Script to send signals to running workflows
 *
 * Usage:
 *   npx tsx scripts/send-signal.ts <workflow-id> <signal-name> [signal-data]
 *
 * Examples:
 *   npx tsx scripts/send-signal.ts test-workflow-123 managerApproval '{"approved": true}'
 *   npx tsx scripts/send-signal.ts order-456 cancelOrder
 */

import { Connection, Client } from "@temporalio/client";

interface SignalConfig {
  workflowId: string;
  signalName: string;
  signalData: any;
  temporalAddress: string;
  namespace: string;
}

async function sendSignal(config: SignalConfig) {
  console.log("\n📡 Sending Signal to Workflow\n");
  console.log("Configuration:");
  console.log(`  Workflow ID: ${config.workflowId}`);
  console.log(`  Signal Name: ${config.signalName}`);
  console.log(`  Signal Data: ${JSON.stringify(config.signalData, null, 2)}`);
  console.log(`  Temporal Address: ${config.temporalAddress}`);
  console.log(`  Namespace: ${config.namespace}\n`);

  try {
    // Connect to Temporal server
    console.log("Connecting to Temporal server...");
    const connection = await Connection.connect({
      address: config.temporalAddress,
    });
    console.log("✅ Connected successfully\n");

    // Create client
    const client = new Client({
      connection,
      namespace: config.namespace,
    });

    // Get workflow handle
    const handle = client.workflow.getHandle(config.workflowId);

    // Send signal
    console.log(`Sending signal "${config.signalName}"...`);
    await handle.signal(config.signalName, config.signalData);

    console.log("✅ Signal sent successfully!\n");
    console.log("View workflow status:");
    console.log(
      `http://localhost:8080/namespaces/${config.namespace}/workflows/${config.workflowId}\n`
    );
  } catch (error: any) {
    console.error("\n❌ Failed to send signal:\n");
    console.error(`Error: ${error.message}`);

    if (error.cause) {
      console.error(`Cause: ${error.cause.message}`);
    }

    console.error("\n");
    console.error("Common issues:");
    console.error("  - Workflow ID doesn't exist");
    console.error("  - Workflow already completed");
    console.error("  - Signal name doesn't match workflow definition");
    console.error("  - Temporal server not reachable\n");

    process.exit(1);
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2 || args[0] === "--help" || args[0] === "-h") {
    console.log(`
Temporal Signal Sender

Usage:
  npx tsx scripts/send-signal.ts <workflow-id> <signal-name> [signal-data]

Arguments:
  workflow-id   ID of the running workflow (required)
  signal-name   Name of the signal to send (required)
  signal-data   JSON string of signal payload (optional, default: undefined)

Environment Variables:
  TEMPORAL_ADDRESS   Temporal server address (default: localhost:7233)
  TEMPORAL_NAMESPACE Temporal namespace (default: default)

Examples:
  # Send approval signal with data
  npx tsx scripts/send-signal.ts test-workflow-123 managerApproval '{"approved": true, "comments": "Looks good"}'

  # Send simple signal without data
  npx tsx scripts/send-signal.ts order-456 cancelOrder

  # Send signal to production workflow
  TEMPORAL_ADDRESS=prod.temporal.io:7233 npx tsx scripts/send-signal.ts wf-789 retry

Common Signals:
  - managerApproval: Approval workflow example
  - cancelOrder: Cancel order processing
  - retry: Retry failed operation
  - updateData: Update workflow state
    `);
    process.exit(0);
  }

  const workflowId = args[0];
  const signalName = args[1];
  const signalDataJson = args[2];

  let signalData: any = undefined;
  if (signalDataJson) {
    try {
      signalData = JSON.parse(signalDataJson);
    } catch (error) {
      console.error("❌ Invalid JSON for signal data:", signalDataJson);
      console.error("Please provide valid JSON string");
      process.exit(1);
    }
  }

  const config: SignalConfig = {
    workflowId,
    signalName,
    signalData,
    temporalAddress: process.env.TEMPORAL_ADDRESS || "localhost:7233",
    namespace: process.env.TEMPORAL_NAMESPACE || "default",
  };

  await sendSignal(config);
}

main().catch((error) => {
  console.error("Unexpected error:", error);
  process.exit(1);
});
