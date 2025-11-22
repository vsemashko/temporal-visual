# Example Workflows

This directory contains example workflows that you can import into the Visual Temporal IDE to learn and experiment.

## Available Examples

### 1. Order Processing (`order-processing.json`)
A simple e-commerce order processing workflow demonstrating sequential activities.

**Flow:**
```
Start → Validate Order → Process Payment → Ship Order → End
```

**Concepts:**
- Sequential activity execution
- Timeout configuration
- Retry policies
- Basic workflow structure

**Use cases:**
- E-commerce order fulfillment
- Payment processing pipelines
- Sequential task execution

---

### 2. Approval Workflow (`approval-workflow.json`)
Document processing that waits for manager approval using Temporal signals.

**Flow:**
```
Start → Process Document → Wait for Approval (Signal) → Finalize Document → End
```

**Concepts:**
- Signal handling
- Long-running workflows (24h timeout)
- Human-in-the-loop processes
- Event-driven workflows

**Use cases:**
- Document approval systems
- Purchase order approvals
- Any workflow requiring human interaction

---

### 3. Conditional Workflow (`conditional-workflow.json`)
User registration with conditional email sending based on verification status.

**Flow:**
```
Start → Create User → Decision (Email Verified?)
                         ├─ Yes → Send Welcome Email → End
                         └─ No  → Send Verification Email → End
```

**Concepts:**
- Decision nodes (if/else branching)
- Conditional logic
- Multiple execution paths
- Data-driven routing

**Use cases:**
- User onboarding
- Conditional notifications
- Multi-path workflows
- Business rule implementations

---

### 4. Parallel Processing (`parallel-processing.json`)
Data pipeline that processes tasks concurrently for better performance.

**Flow:**
```
Start → Fetch Data → Parallel Processing
                      ├─ Transform Data ─┐
                      ├─ Enrich Data ────┤→ Store Results → End
                      └─ Validate Data ──┘
```

**Concepts:**
- Parallel execution with Promise.all()
- Concurrent task processing
- Performance optimization
- Data pipeline patterns

**Use cases:**
- ETL pipelines
- Batch processing
- Data transformation
- Concurrent API calls

---

## How to Use Examples

### Via UI
1. Open the Temporal Visual IDE (http://localhost:3000)
2. Click the **Import** button in the toolbar
3. Select an example JSON file
4. The workflow will load onto the canvas
5. Click **Generate & Deploy** to create TypeScript code

### Via Command Line
```bash
# Copy example to clipboard and import via UI
cat examples/order-processing.json
```

## Modifying Examples

Feel free to modify these examples:
1. **Import** an example workflow
2. **Edit** node properties (timeouts, retry policies, names)
3. **Add** new nodes by dragging from the palette
4. **Connect** nodes to change the flow
5. **Export** your modified version for reuse

## Creating Your Own Examples

After building a workflow:
1. Click **Export** in the toolbar
2. Save the JSON file
3. Share it with your team or contribute back!

## Example Activity Implementations

When you generate code from these examples, you'll get activity stubs. Here's sample implementations:

```typescript
// Order Processing Activities
export async function validateOrder(orderId: string) {
  // Validate order exists and has required fields
  return { isValid: true, orderId };
}

export async function processPayment(orderId: string) {
  // Process payment via payment gateway
  return { success: true, transactionId: "txn_123" };
}

export async function shipOrder(orderId: string) {
  // Create shipping label and notify warehouse
  return { trackingNumber: "TRACK123" };
}
```

## Learning Path

We recommend exploring examples in this order:
1. **Order Processing** - Learn basics
2. **Conditional Workflow** - Understand branching
3. **Parallel Processing** - Master concurrency
4. **Approval Workflow** - Handle signals

## Testing Examples

To test a generated workflow:

```typescript
// test-workflow.ts
import { Connection, Client } from '@temporalio/client';

async function run() {
  const connection = await Connection.connect({
    address: 'localhost:7233'
  });
  const client = new Client({ connection });

  const handle = await client.workflow.start('myWorkflow', {
    taskQueue: 'temporal-visual',
    workflowId: 'test-' + Date.now(),
    args: [{ /* your input */ }],
  });

  console.log('Workflow started:', handle.workflowId);
  const result = await handle.result();
  console.log('Result:', result);
}

run().catch(console.error);
```

Run it:
```bash
npx tsx test-workflow.ts
```

## Contributing Examples

Have a great workflow example? Submit a PR with:
- JSON file with descriptive name
- Update this README with description
- Sample activity implementations
- Use case documentation

## Resources

- [Temporal Documentation](https://docs.temporal.io)
- [TypeScript SDK Guide](https://docs.temporal.io/typescript)
- [Getting Started Guide](../GETTING_STARTED.md)
- [Main README](../README.md)
