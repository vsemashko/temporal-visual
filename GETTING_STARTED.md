# Getting Started with Temporal Visual IDE

This guide will walk you through creating your first visual workflow in under 5 minutes.

## Prerequisites

Ensure you have completed the setup in [README.md](README.md):
- Docker services running (`docker-compose up -d`)
- Frontend running (`npm run dev`)
- Worker running (`npm run worker:dev`)

## Step 1: Open the IDE

Navigate to http://localhost:3000 in your browser. You'll see:

- **Left Panel**: Node Palette with draggable workflow components
- **Center**: Visual workflow canvas
- **Right Panel**: AI Assistant (toggle to Properties panel)
- **Top**: Toolbar with Save, Export, and Generate buttons

## Step 2: Create a Simple Workflow

Let's build an order processing workflow.

### Add Start Node (Already there!)
The canvas comes with a Start node by default.

### Add Activity Nodes

1. Drag an **Activity** node from the palette
2. Drop it below the Start node
3. Click the new node to select it
4. Click "Properties" to configure:
   - **Label**: "Validate Order"
   - **Activity Name**: `validateOrder`
   - **Timeout**: `5m`

5. Repeat for a second Activity:
   - **Label**: "Process Payment"
   - **Activity Name**: `processPayment`
   - **Timeout**: `10m`

6. Add a third Activity:
   - **Label**: "Ship Order"
   - **Activity Name**: `shipOrder`
   - **Timeout**: `5m`

### Add End Node

1. Drag an **End** node from the palette
2. Drop it at the bottom

### Connect the Nodes

1. Hover over the **Start** node
2. Click and drag from the bottom handle
3. Drop on the **Validate Order** node's top handle
4. Repeat to connect:
   - Validate Order → Process Payment
   - Process Payment → Ship Order
   - Ship Order → End

You should now see a linear flow:
```
Start → Validate Order → Process Payment → Ship Order → End
```

## Step 3: Generate Code

1. Click **"View Code"** in the toolbar to preview the generated TypeScript
2. Click **"Generate & Deploy"** to save the workflow files

The IDE will:
- Generate `workflows/definitions/myWorkflow.ts`
- Generate `workflows/activities/index.ts`
- Save metadata to `workflows/metadata/`

## Step 4: Watch Hot Reload

In the worker terminal, you should see:

```
📝 File changed: workflows/definitions/myWorkflow.ts
🔄 Detected file changes, restarting worker...
✅ Worker shutdown complete
🚀 Starting Temporal Worker...
✅ Worker created successfully
```

Your workflow is now deployed!

## Step 5: Test the Workflow (Optional)

Create a simple test client:

```typescript
// test-workflow.ts
import { Connection, Client } from '@temporalio/client';

async function run() {
  const connection = await Connection.connect({ address: 'localhost:7233' });
  const client = new Client({ connection });

  const handle = await client.workflow.start('myWorkflow', {
    taskQueue: 'temporal-visual',
    workflowId: 'order-' + Date.now(),
    args: [{ orderId: '12345' }],
  });

  console.log('Started workflow:', handle.workflowId);
  const result = await handle.result();
  console.log('Result:', result);
}

run().catch(console.error);
```

Run it:
```bash
npx tsx test-workflow.ts
```

## Advanced: Using the AI Assistant

### Generate a Workflow from Description

1. Click the AI Assistant panel (right side)
2. Type: "Create a workflow for user registration with email verification and welcome email"
3. The AI will suggest nodes and connections
4. Review and accept the suggestions

### Get Implementation Help

Ask the AI:
- "How do I implement the validateOrder activity?"
- "What's the best way to handle payment failures?"
- "Suggest retry policies for this workflow"

### Optimize Your Workflow

Ask:
- "Can you optimize this workflow for parallel execution?"
- "What anti-patterns do you see in my current workflow?"

## Common Patterns

### Sequential Processing
```
Start → Activity 1 → Activity 2 → Activity 3 → End
```

### Conditional Branching
```
Start → Activity → Decision
                    ├─ (true) → Activity A → End
                    └─ (false) → Activity B → End
```

### Parallel Execution
```
Start → Parallel → Activity 1 ─┐
                └→ Activity 2 ─┤→ End
                └→ Activity 3 ─┘
```

### Wait for Signal
```
Start → Activity → Signal (wait for approval) → Activity → End
```

### Delayed Execution
```
Start → Activity → Timer (10 minutes) → Activity → End
```

## Next Steps

1. **Customize Activities**: Edit the generated code in `workflows/activities/index.ts`
2. **Add Error Handling**: Use Decision nodes to handle failures
3. **Configure Timeouts**: Adjust for your environment (dev vs prod)
4. **Deploy to Production**: Follow the deployment guide
5. **Monitor**: Use Temporal UI at http://localhost:8080

## Troubleshooting

### "Generate button doesn't work"
- Check browser console for errors
- Ensure all nodes are properly connected
- Verify at least one Start and one End node exist

### "Worker doesn't pick up changes"
- Check worker terminal for errors
- Verify files were created in `workflows/` directories
- Restart worker manually: `npm run worker:dev`

### "AI Assistant not responding"
- Verify LiteLLM is running: `docker-compose ps`
- Check API keys in `.env`
- Test LiteLLM: `curl http://localhost:4000/health`

## Resources

- Full documentation: [README.md](README.md)
- Temporal basics: https://learn.temporal.io
- React Flow docs: https://reactflow.dev
- Example workflows: `examples/` directory

Happy workflow building! 🚀
