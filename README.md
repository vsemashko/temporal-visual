# Temporal Visual IDE

A browser-based visual workflow editor for Temporal with AI-powered assistance. Design, generate, and deploy Temporal workflows using a drag-and-drop interface with integrated LLM agents via LiteLLM.

## Features

- **Visual Workflow Design**: Drag-and-drop interface powered by React Flow
- **Code Generation**: Automatically generate TypeScript workflow and activity code
- **Hot Reload**: Instant feedback with file-watching worker that auto-restarts
- **AI Assistant**: LLM-powered workflow generation and optimization via LiteLLM
- **Dev/Prod Configs**: Easy environment-based timeout configuration
- **Monaco Editor**: Full VS Code editor for code customization
- **Type Safe**: Complete TypeScript implementation

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Next.js Frontend (localhost:3000)                         │
│  ├── React Flow Canvas (Visual Editor)                     │
│  ├── Monaco Code Editor                                    │
│  └── AI Assistant Panel (LiteLLM Integration)             │
└─────────────────┬───────────────────────────────────────────┘
                  │
        ┌─────────┴──────────┬──────────────────┐
        │                    │                  │
┌───────▼────────┐  ┌───────▼────────┐  ┌──────▼──────┐
│  File System   │  │ Temporal Worker│  │  LiteLLM    │
│  workflows/    │  │ (Hot Reload)   │  │  Proxy      │
│  ├─definitions/│  │  - tsx watch   │  │  :4000      │
│  ├─activities/ │  │  - Auto-restart│  └─────────────┘
│  ├─metadata/   │  └────────┬───────┘
│  └─config/     │           │
└────────────────┘  ┌────────▼────────┐
                    │ Temporal Server │
                    │    :7233        │
                    └─────────────────┘
```

## Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- (Optional) OpenAI or Anthropic API keys for AI features

### 1. Clone and Install

```bash
# Clone repository
git clone <repository-url>
cd temporal-visual

# Install frontend dependencies
npm install

# Install worker dependencies
cd worker
npm install
cd ..
```

### 2. Configure Environment

```bash
# Copy environment files
cp .env.example .env
cp worker/.env.example worker/.env

# Edit .env and add your API keys (optional for AI features)
# OPENAI_API_KEY=sk-...
# ANTHROPIC_API_KEY=sk-ant-...
```

### 3. Start Infrastructure

```bash
# Start Temporal Server, UI, and LiteLLM Proxy
docker-compose up -d

# Wait for services to be ready (~30 seconds)
# Temporal UI: http://localhost:8080
# LiteLLM Proxy: http://localhost:4000
```

### 4. Start Development

```bash
# Terminal 1: Start Next.js frontend
npm run dev
# Opens http://localhost:3000

# Terminal 2: Start Temporal worker with hot reload
npm run worker:dev
```

### 5. Build Your First Workflow

1. Open http://localhost:3000
2. Drag nodes from the palette onto the canvas
3. Connect nodes to define workflow flow
4. Configure node properties in the right panel
5. Click "Generate & Deploy" to create TypeScript code
6. Watch the worker auto-reload and pick up changes!

## Project Structure

```
temporal-visual/
├── app/                        # Next.js app directory
│   ├── api/                   # API routes
│   │   ├── workflows/         # Workflow CRUD operations
│   │   └── ai/               # LLM integration
│   ├── globals.css           # Global styles
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Main editor page
├── components/
│   ├── workflow/             # Workflow editor components
│   │   ├── nodes/           # Custom React Flow nodes
│   │   ├── WorkflowEditor.tsx
│   │   ├── NodePalette.tsx
│   │   ├── PropertyPanel.tsx
│   │   └── WorkflowToolbar.tsx
│   ├── ai/                   # AI assistant components
│   │   └── AIAssistant.tsx
│   └── ui/                   # Reusable UI components
├── lib/
│   ├── codegen.ts            # Code generation engine
│   ├── store.ts              # Zustand state management
│   ├── types.ts              # TypeScript definitions
│   └── utils.ts              # Utility functions
├── workflows/                 # Generated workflows storage
│   ├── definitions/          # Generated TypeScript workflows
│   ├── activities/           # Generated activity implementations
│   ├── metadata/             # Visual editor state (JSON)
│   └── config/               # Dev/prod configuration
├── worker/                    # Temporal worker
│   ├── src/
│   │   └── worker.ts         # Worker with hot reload
│   └── package.json
├── litellm/                   # LiteLLM proxy configuration
│   ├── Dockerfile
│   ├── config.yaml
│   └── docker-compose.yml
├── docker-compose.yml         # Full stack orchestration
├── package.json
└── README.md
```

## Node Types

### Start Node
- Entry point for the workflow
- Every workflow must have exactly one start node

### Activity Node
- Represents a Temporal activity (business logic)
- Configurable:
  - Activity name
  - Timeout
  - Retry policy
  - Heartbeat timeout

### Decision Node
- Conditional branching (if/else)
- Has two outputs: "true" and "false"
- Condition is evaluated in generated code

### Parallel Node
- Execute multiple branches concurrently
- Uses `Promise.all()` in generated code

### Signal Node
- Wait for external signal
- Configurable timeout

### Timer Node
- Delay/sleep for specified duration
- Uses Temporal's `sleep()` function

### End Node
- Workflow completion
- Returns result to caller

## Development vs Production

The system supports environment-based configuration for seamless development and production deployment.

### Development Mode

```typescript
// workflows/config/index.ts (development)
{
  activityTimeout: "5s",      // Fast feedback
  workflowTimeout: "1m",      // Quick iteration
  retryAttempts: 1,           // Fail fast
  heartbeatTimeout: "2s"
}
```

**Benefits:**
- Quick feedback loop (< 2 seconds)
- Fast failure detection
- Rapid iteration

### Production Mode

```typescript
// workflows/config/index.ts (production)
{
  activityTimeout: "5m",      // Realistic timeouts
  workflowTimeout: "24h",     // Long-running workflows
  retryAttempts: 3,           // Resilient execution
  heartbeatTimeout: "30s"
}
```

**Toggle:**
```bash
# Development
npm run worker:dev

# Production
npm run worker:prod
```

## AI Assistant Features

The integrated AI assistant (powered by LiteLLM) provides:

### 1. Workflow Generation
```
User: "Create a workflow for order processing with payment validation and shipping"
AI: [Generates complete workflow with nodes and connections]
```

### 2. Code Assistance
- Activity implementation suggestions
- Error handling recommendations
- Optimization tips

### 3. Debugging Help
- Workflow analysis
- Timeout configuration advice
- Best practices guidance

### 4. Code Review
- Anti-pattern detection
- Performance optimization
- Temporal best practices

## Hot Reload Workflow

The worker uses `tsx --watch` to provide instant feedback:

1. **Edit**: Modify workflow visually or edit generated code
2. **Save**: Click "Generate & Deploy" or save files
3. **Detect**: File watcher detects changes
4. **Reload**: Worker shuts down gracefully
5. **Restart**: New worker starts with updated code
6. **Ready**: Total time < 2 seconds

```bash
# Worker logs
📝 File changed: workflows/definitions/myWorkflow.ts
🔄 Detected file changes, restarting worker...
✅ Worker shutdown complete
🚀 Starting Temporal Worker...
✅ Worker created successfully
```

## Code Generation

### Generated Workflow Example

```typescript
// workflows/definitions/myWorkflow.ts
import { proxyActivities, sleep } from '@temporalio/workflow';
import type * as activities from '../activities';
import { getTimeouts } from '../config';

const { validateOrder, processPayment, shipOrder } = proxyActivities<typeof activities>({
  ...getTimeouts('activity')
});

export async function myWorkflow(input: any): Promise<any> {
  // Workflow started
  const result_node_1 = await validateOrder(input);

  if (result_node_1.isValid) {
    const result_node_2 = await processPayment(input);
    await shipOrder(input);
  } else {
    // Handle invalid order
  }

  // Workflow completed
  return result_node_2;
}
```

### Generated Activities Example

```typescript
// workflows/activities/index.ts
export async function validateOrder(input: any): Promise<any> {
  // TODO: Implement validateOrder
  console.log('Executing validateOrder', input);

  // Your business logic here

  return { success: true, isValid: true };
}

export async function processPayment(input: any): Promise<any> {
  // TODO: Implement processPayment
  console.log('Executing processPayment', input);

  return { success: true };
}
```

## LiteLLM Configuration

### Supported Models

```yaml
# litellm/config.yaml
model_list:
  - model_name: gpt-4-turbo
  - model_name: gpt-3.5-turbo
  - model_name: claude-3-opus
  - model_name: claude-3-sonnet
  - model_name: claude-3-haiku
```

### Cost Tracking

LiteLLM automatically tracks:
- API calls per model
- Token usage
- Estimated costs

Access dashboard: http://localhost:4000/ui

### Rate Limiting

```yaml
general_settings:
  max_parallel_requests: 100
```

## Docker Services

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Restart specific service
docker-compose restart temporal

# Service URLs
# - Temporal Server: localhost:7233
# - Temporal UI: http://localhost:8080
# - LiteLLM Proxy: http://localhost:4000
# - PostgreSQL: localhost:5432
```

## Troubleshooting

### Worker Won't Start

```bash
# Check if Temporal is running
docker-compose ps

# Restart Temporal
docker-compose restart temporal

# Check worker logs
cd worker && npm run dev
```

### AI Assistant Not Responding

```bash
# Check LiteLLM logs
docker-compose logs litellm

# Test LiteLLM directly
curl http://localhost:4000/health

# Verify API keys in .env
```

### Generated Code Not Loading

```bash
# Check file permissions
ls -la workflows/definitions/

# Manually create directory
mkdir -p workflows/definitions workflows/activities

# Restart worker
npm run worker:dev
```

## Deployment

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure production timeouts in `workflows/config/index.ts`
- [ ] Update LiteLLM master key
- [ ] Setup proper database (not SQLite)
- [ ] Configure worker versioning
- [ ] Enable monitoring and logging
- [ ] Setup CI/CD pipeline

### Example Production Deployment

```bash
# Build Next.js
npm run build

# Start production server
npm start

# Start production worker
cd worker && npm run start
```

## Contributing

Contributions welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## License

MIT

## Resources

- [Temporal Documentation](https://docs.temporal.io)
- [React Flow Documentation](https://reactflow.dev)
- [LiteLLM Documentation](https://docs.litellm.ai)
- [Monaco Editor](https://microsoft.github.io/monaco-editor/)

## Support

- GitHub Issues: [Create an issue](../../issues)
- Temporal Community: [community.temporal.io](https://community.temporal.io)
- Discord: [Join Discord](https://discord.gg/temporal)
