# Testing Scripts

This directory contains utility scripts for testing and interacting with Temporal workflows.

## Available Scripts

### 1. Test Workflow (`test-workflow.ts`)

Execute a workflow and wait for its result.

```bash
# Basic usage
npx tsx scripts/test-workflow.ts myWorkflow

# With custom input
npx tsx scripts/test-workflow.ts myWorkflow '{"orderId": "123", "amount": 99.99}'

# With environment variables
TEMPORAL_ADDRESS=localhost:7233 npx tsx scripts/test-workflow.ts myWorkflow
```

**Features:**
- Connects to Temporal server
- Starts workflow execution
- Waits for completion
- Displays result
- Shows Temporal UI link for debugging

**Output Example:**
```
🚀 Temporal Workflow Test

Configuration:
  Workflow: myWorkflow
  Task Queue: temporal-visual
  Temporal Address: localhost:7233
  Input: {
    "orderId": "123"
  }

Connecting to Temporal server...
✅ Connected successfully

Starting workflow with ID: test-myWorkflow-1234567890
✅ Workflow started successfully

Workflow ID: test-myWorkflow-1234567890
Run ID: abc123...

Waiting for workflow to complete...

✅ Workflow completed successfully!

Result:
{
  "success": true,
  "orderId": "123"
}

Viewing in Temporal UI:
http://localhost:8080/namespaces/default/workflows/test-myWorkflow-1234567890
```

---

### 2. Send Signal (`send-signal.ts`)

Send signals to running workflows.

```bash
# Send approval signal
npx tsx scripts/send-signal.ts test-workflow-123 managerApproval '{"approved": true}'

# Send simple signal without data
npx tsx scripts/send-signal.ts order-456 cancelOrder

# Send signal to specific namespace
TEMPORAL_NAMESPACE=production npx tsx scripts/send-signal.ts wf-789 retry
```

**Features:**
- Connects to running workflow
- Sends signal with optional data
- Verifies signal delivery
- Shows workflow status link

**Use Cases:**
- Approval workflows (send approval/rejection)
- Order cancellation
- Workflow state updates
- Manual intervention triggers

**Output Example:**
```
📡 Sending Signal to Workflow

Configuration:
  Workflow ID: test-workflow-123
  Signal Name: managerApproval
  Signal Data: {
    "approved": true,
    "comments": "Looks good"
  }
  Temporal Address: localhost:7233
  Namespace: default

Connecting to Temporal server...
✅ Connected successfully

Sending signal "managerApproval"...
✅ Signal sent successfully!

View workflow status:
http://localhost:8080/namespaces/default/workflows/test-workflow-123
```

---

## Environment Variables

Both scripts support these environment variables:

```bash
# Temporal server address
export TEMPORAL_ADDRESS=localhost:7233

# Temporal namespace
export TEMPORAL_NAMESPACE=default

# Task queue for workflows
export TEMPORAL_TASK_QUEUE=temporal-visual
```

---

## Complete Testing Workflow

### Step 1: Generate Workflow Code

1. Design workflow in UI
2. Click "Generate & Deploy"
3. Worker auto-reloads with new code

### Step 2: Test the Workflow

```bash
npx tsx scripts/test-workflow.ts myWorkflow '{"orderId": "ORDER-123"}'
```

### Step 3: Send Signals (if applicable)

```bash
# While workflow is running, send signal
npx tsx scripts/send-signal.ts test-myWorkflow-1234567890 approvalSignal '{"approved": true}'
```

### Step 4: Verify in Temporal UI

Open: http://localhost:8080

Navigate to your workflow to see:
- Execution history
- Event timeline
- Input/output data
- Activity results
- Signal events

---

## Testing Example Workflows

### Order Processing Example

```bash
# Test order processing
npx tsx scripts/test-workflow.ts myWorkflow '{
  "orderId": "ORDER-001",
  "customerId": "CUST-123",
  "items": [
    {"sku": "PROD-A", "quantity": 2}
  ],
  "total": 99.99
}'
```

### Approval Workflow Example

```bash
# Terminal 1: Start workflow
npx tsx scripts/test-workflow.ts myWorkflow '{"documentId": "DOC-123"}'

# Terminal 2: Send approval (while workflow is waiting)
npx tsx scripts/send-signal.ts test-myWorkflow-<ID> managerApproval '{
  "approved": true,
  "approver": "manager@company.com",
  "comments": "Approved"
}'
```

### Parallel Processing Example

```bash
# Test parallel processing
npx tsx scripts/test-workflow.ts myWorkflow '{
  "dataSource": "s3://bucket/data.csv",
  "outputFormat": "parquet",
  "compressionLevel": 9
}'
```

---

## Troubleshooting

### Error: Connection Refused

```
Temporal server is not running.

Solution:
docker-compose up -d temporal
```

### Error: Workflow Not Found

```
Workflow code not generated or worker not running.

Solution:
1. Generate workflow code in UI
2. Start worker: npm run worker:dev
```

### Error: Invalid Signal

```
Signal name doesn't exist in workflow definition.

Solution:
Check workflow code for correct signal name
```

### Error: Workflow Already Completed

```
Cannot send signal to completed workflow.

Solution:
Start a new workflow instance
```

---

## Advanced Usage

### Custom Temporal Server

```bash
# Connect to remote Temporal
TEMPORAL_ADDRESS=temporal.production.company.com:7233 \
TEMPORAL_NAMESPACE=production \
npx tsx scripts/test-workflow.ts orderProcessing '{"orderId": "123"}'
```

### Multiple Workflows in Sequence

```bash
#!/bin/bash
# test-suite.sh

echo "Testing Order Processing..."
npx tsx scripts/test-workflow.ts orderWorkflow '{"orderId": "001"}'

echo "Testing User Registration..."
npx tsx scripts/test-workflow.ts registrationWorkflow '{"email": "user@example.com"}'

echo "All tests completed!"
```

### Query Workflow State

```typescript
// query-workflow.ts
import { Connection, Client } from "@temporalio/client";

async function queryWorkflow(workflowId: string, queryName: string) {
  const connection = await Connection.connect({ address: "localhost:7233" });
  const client = new Client({ connection });

  const handle = client.workflow.getHandle(workflowId);
  const result = await handle.query(queryName);

  console.log("Query result:", result);
}
```

---

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: Test Workflows

on: [push]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Start Temporal
        run: docker-compose up -d temporal

      - name: Install dependencies
        run: npm install && cd worker && npm install

      - name: Start Worker
        run: npm run worker:dev &

      - name: Test Workflows
        run: |
          npx tsx scripts/test-workflow.ts orderWorkflow '{"orderId": "test"}'
          npx tsx scripts/test-workflow.ts registrationWorkflow '{"email": "test@example.com"}'
```

---

## Resources

- [Temporal Testing Guide](https://docs.temporal.io/typescript/testing)
- [Temporal TypeScript SDK](https://typescript.temporal.io)
- [Example Workflows](../examples/README.md)
- [Main README](../README.md)
