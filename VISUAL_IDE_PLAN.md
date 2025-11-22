# Visual Temporal Workflow IDE - Architecture & Implementation Plan

## Executive Summary

This document outlines a comprehensive plan for building a browser-based visual IDE for editing Temporal workflows with integrated LLM agents. The solution leverages existing open-source tools rather than building from scratch, ensuring rapid development and maintainability.

## Core Design Principles

1. **Reuse Over Reinvention**: Leverage proven open-source libraries
2. **File-Based Workflows**: Store workflows as code for version control and hot reload
3. **Dev/Prod Parity**: Easy configuration switching between development and production
4. **Agentic Integration**: LLM-powered workflow assistance via LiteLLM
5. **Type Safety**: Full TypeScript implementation throughout

---

## Technology Stack

### Frontend (Visual IDE)

#### Primary Visual Editor: React Flow (xyflow)
- **Why**: Industry-leading open-source library for node-based UIs
- **Features**:
  - Drag-and-drop workflow building
  - Customizable nodes and edges
  - Built-in zoom, pan, and selection
  - Ready-made templates (Workflow Editor, AI Workflow Editor)
- **Package**: `@xyflow/react`
- **License**: MIT

#### Code Editor: Monaco Editor
- **Why**: Same editor that powers VS Code, proven and feature-rich
- **Features**:
  - Syntax highlighting for TypeScript
  - IntelliSense and autocomplete
  - Error detection and validation
  - Diff viewer for changes
- **Package**: `@monaco-editor/react`
- **Use Case**: Edit activity code, workflow configurations, and see generated TypeScript

#### UI Framework: Next.js + React 19
- **Why**:
  - Server-side rendering for performance
  - API routes for backend integration
  - Built-in TypeScript support
  - Hot reload during development
- **Styling**: Tailwind CSS + shadcn/ui (used in React Flow templates)

### Backend (Temporal Workers)

#### Workflow Engine: Temporal TypeScript SDK
- **Package**: `@temporalio/worker`, `@temporalio/client`, `@temporalio/workflow`
- **Version**: Latest stable
- **Features**:
  - Durable execution
  - Built-in retry and timeout handling
  - Worker versioning support

#### Hot Reload: Nodemon / tsx
- **Primary**: `tsx --watch` (recommended for 2025)
- **Fallback**: `nodemon` with TypeScript
- **Configuration**: Watch workflow files directory for changes
- **Restart**: Automatic worker restart on file changes

#### LLM Integration: LiteLLM Proxy
- **Why**:
  - Unified API for 100+ LLM providers
  - OpenAI-compatible endpoints
  - Cost tracking and rate limiting
  - Load balancing across providers
- **Package**: `litellm` (Python proxy server)
- **Client**: OpenAI SDK (TypeScript) pointing to LiteLLM proxy

### Storage & Configuration

#### Workflow Storage: File-Based (TypeScript Files)
```
workflows/
├── definitions/          # Generated workflow TypeScript files
│   ├── workflow_001.ts
│   └── workflow_002.ts
├── activities/          # Generated activity TypeScript files
│   ├── activity_001.ts
│   └── activity_002.ts
├── metadata/           # Visual editor metadata (JSON)
│   ├── workflow_001.json
│   └── workflow_002.json
└── config/
    ├── dev.config.ts   # Development timeouts (small)
    └── prod.config.ts  # Production timeouts (adequate)
```

#### Configuration Management
- **Environment Variables**: `.env` files for dev/prod
- **Config Files**: Separate timeout and retry policies
- **Version Control**: All workflows in Git

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      Browser (Next.js App)                      │
│                                                                 │
│  ┌────────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  React Flow    │  │ Monaco       │  │  AI Assistant    │  │
│  │  Visual Editor │←→│ Code Editor  │←→│  Panel           │  │
│  │                │  │              │  │  (LLM Chat)      │  │
│  └────────┬───────┘  └──────┬───────┘  └────────┬─────────┘  │
│           │                  │                    │             │
│           └──────────────────┴────────────────────┘             │
│                              │                                  │
│                      ┌───────▼────────┐                        │
│                      │   API Routes   │                        │
│                      └───────┬────────┘                        │
└──────────────────────────────┼─────────────────────────────────┘
                               │
                    ┌──────────┴──────────┐
                    │                     │
        ┌───────────▼──────────┐   ┌─────▼──────────┐
        │  File System         │   │  LiteLLM Proxy │
        │  (Workflows Dir)     │   │  (Port 4000)   │
        │                      │   └────────────────┘
        │  - definitions/      │           │
        │  - activities/       │      ┌────▼─────┐
        │  - metadata/         │      │ OpenAI   │
        │  - config/           │      │ Anthropic│
        └───────────┬──────────┘      │ etc...   │
                    │                 └──────────┘
        ┌───────────▼──────────┐
        │  Temporal Worker     │
        │  (TypeScript)        │
        │                      │
        │  - tsx --watch       │
        │  - Hot Reload        │
        │  - Auto-restart      │
        └───────────┬──────────┘
                    │
        ┌───────────▼──────────┐
        │  Temporal Server     │
        │  (Docker/Cloud)      │
        └──────────────────────┘
```

---

## Feature Breakdown

### Phase 1: Core Visual Editor (Weeks 1-2)

#### 1.1 Setup Next.js Application
- [ ] Initialize Next.js 14+ with App Router
- [ ] Install React Flow, Monaco Editor, Tailwind CSS
- [ ] Setup TypeScript configuration
- [ ] Configure ESLint and Prettier

#### 1.2 Implement Visual Workflow Editor
- [ ] Create React Flow canvas with custom nodes:
  - **Activity Node**: Represents a Temporal activity
  - **Decision Node**: Branching logic (if/else)
  - **Parallel Node**: Concurrent execution
  - **Signal Node**: External signal handling
  - **Timer Node**: Sleep/delay activities
- [ ] Implement node connections (edges)
- [ ] Add drag-and-drop from palette
- [ ] Implement zoom, pan, minimap controls
- [ ] Add undo/redo functionality

#### 1.3 Node Property Editor
- [ ] Side panel for node configuration
- [ ] Activity-specific parameters:
  - Input/output types
  - Timeout configuration (dev vs prod)
  - Retry policies
  - Heartbeat settings
- [ ] Validation and error display

### Phase 2: Code Generation & Storage (Week 3)

#### 2.1 Workflow Code Generator
- [ ] Convert React Flow graph to Temporal workflow TypeScript
- [ ] Generate workflow definition files
- [ ] Generate activity stub files
- [ ] Handle control flow (if/else, loops, parallel execution)
- [ ] Generate proper TypeScript types

**Example Generated Workflow:**
```typescript
// workflows/definitions/orderProcessing.ts
import { proxyActivities } from '@temporalio/workflow';
import type * as activities from '../activities';
import { getTimeouts } from '../config';

const { validateOrder, chargePayment, shipOrder } = proxyActivities<typeof activities>({
  ...getTimeouts('activity') // Dev: 5s, Prod: 5m
});

export async function orderWorkflow(orderId: string): Promise<void> {
  const isValid = await validateOrder(orderId);

  if (!isValid) {
    throw new Error('Invalid order');
  }

  await chargePayment(orderId);
  await shipOrder(orderId);
}
```

#### 2.2 Activity Code Templates
- [ ] Generate activity skeleton files
- [ ] Support Monaco inline editing
- [ ] Allow custom implementation
- [ ] Type checking and validation

#### 2.3 Metadata Storage
- [ ] Save React Flow state as JSON
- [ ] Store node positions, connections
- [ ] Link metadata to generated code
- [ ] Enable loading and editing existing workflows

### Phase 3: Hot Reload Development Workflow (Week 4)

#### 3.1 File Watcher Setup
- [ ] Configure tsx/nodemon to watch workflows directory
- [ ] Setup auto-restart on file changes
- [ ] Configure fast feedback loop (< 2 seconds)

**Worker Script:**
```json
{
  "scripts": {
    "worker:dev": "tsx watch --clear-screen=false src/worker.ts",
    "worker:prod": "NODE_ENV=production tsx src/worker.ts"
  }
}
```

#### 3.2 Configuration Management
- [ ] Environment-based config loading
- [ ] Dev config: Small timeouts (1-10s)
- [ ] Prod config: Appropriate timeouts (minutes/hours)
- [ ] Easy toggle via environment variable

**Config Example:**
```typescript
// workflows/config/index.ts
const configs = {
  development: {
    activityTimeout: '5s',
    workflowTimeout: '1m',
    retryAttempts: 1
  },
  production: {
    activityTimeout: '5m',
    workflowTimeout: '24h',
    retryAttempts: 3
  }
};

export const getTimeouts = (type: string) => {
  const env = process.env.NODE_ENV || 'development';
  return configs[env];
};
```

#### 3.3 Live Reload UI Feedback
- [ ] WebSocket connection to worker
- [ ] Show worker status in UI (running/restarting)
- [ ] Display compilation errors
- [ ] Show workflow execution logs

### Phase 4: LLM Agent Integration (Week 5)

#### 4.1 LiteLLM Proxy Setup
- [ ] Install and configure LiteLLM proxy server
- [ ] Configure API keys for LLM providers
- [ ] Setup OpenAI-compatible endpoint
- [ ] Add rate limiting and cost tracking

**LiteLLM Config:**
```yaml
# litellm-config.yaml
model_list:
  - model_name: gpt-4
    litellm_params:
      model: openai/gpt-4-turbo-preview
      api_key: os.environ/OPENAI_API_KEY

  - model_name: claude-3-opus
    litellm_params:
      model: anthropic/claude-3-opus-20240229
      api_key: os.environ/ANTHROPIC_API_KEY

general_settings:
  master_key: your_secret_key
  database_url: sqlite:///litellm.db
```

#### 4.2 AI Assistant Panel
- [ ] Chat interface for workflow assistance
- [ ] Context-aware suggestions
- [ ] Workflow generation from natural language
- [ ] Activity code completion

**Agent Capabilities:**
- **Workflow Generation**: "Create a workflow that processes orders with payment and shipping"
- **Code Review**: "Review my workflow for error handling issues"
- **Optimization**: "Suggest improvements for parallel execution"
- **Debugging**: "Why is this activity timing out?"

#### 4.3 Agentic Features
- [ ] Auto-generate workflows from descriptions
- [ ] Suggest activity implementations
- [ ] Detect anti-patterns
- [ ] Generate test cases
- [ ] Optimize timeout configurations

### Phase 5: Production Readiness (Week 6)

#### 5.1 Worker Versioning
- [ ] Implement Temporal worker versioning
- [ ] Support multiple workflow versions
- [ ] Gradual rollout mechanism
- [ ] Rollback capability

#### 5.2 Testing & Validation
- [ ] Unit tests for code generation
- [ ] Integration tests for workflows
- [ ] Visual workflow validation
- [ ] Type checking pipeline

#### 5.3 Deployment
- [ ] Docker containerization
- [ ] Production config templates
- [ ] CI/CD pipeline
- [ ] Monitoring and observability

---

## Development Workflow

### Developer Experience

1. **Create Workflow Visually**
   - Drag nodes onto canvas
   - Connect activities in sequence
   - Configure parameters in property panel

2. **AI-Assisted Development**
   - Ask AI to generate workflow structure
   - Get suggestions for activity implementations
   - Review generated code

3. **Edit & Refine**
   - Switch to Monaco editor for custom code
   - Edit activity implementations
   - Adjust configurations

4. **Instant Feedback**
   - Save changes
   - Worker auto-restarts (< 2s)
   - Test workflow execution
   - See results in UI

5. **Production Deployment**
   - Toggle environment to production
   - Review timeout configurations
   - Deploy with appropriate settings
   - Monitor execution

### File Structure

```
temporal-visual/
├── frontend/                    # Next.js application
│   ├── app/
│   │   ├── page.tsx            # Main editor page
│   │   ├── api/                # API routes
│   │   │   ├── workflows/      # Workflow CRUD
│   │   │   ├── generate/       # Code generation
│   │   │   └── ai/             # LLM proxy
│   │   └── layout.tsx
│   ├── components/
│   │   ├── workflow/
│   │   │   ├── WorkflowCanvas.tsx
│   │   │   ├── NodePalette.tsx
│   │   │   ├── PropertyPanel.tsx
│   │   │   └── nodes/          # Custom node types
│   │   ├── editor/
│   │   │   └── MonacoEditor.tsx
│   │   └── ai/
│   │       └── AIAssistant.tsx
│   ├── lib/
│   │   ├── codegen/            # Code generation logic
│   │   └── temporal-client.ts
│   └── public/
├── workflows/                   # Generated & stored workflows
│   ├── definitions/
│   ├── activities/
│   ├── metadata/
│   └── config/
├── worker/                      # Temporal worker
│   ├── src/
│   │   ├── worker.ts           # Main worker file
│   │   ├── loader.ts           # Dynamic workflow loading
│   │   └── activities/         # Base activities
│   └── package.json
├── litellm/                     # LLM proxy
│   ├── config.yaml
│   └── docker-compose.yml
├── docker-compose.yml           # Full stack orchestration
└── package.json
```

---

## Key Technical Decisions

### 1. Why React Flow over n8n/Node-RED?

**Custom Integration**: While n8n and Node-RED are excellent standalone tools, they are:
- Full applications, not embeddable libraries
- Opinionated about data models and execution
- Difficult to integrate with Temporal's programming model

**React Flow** provides:
- Pure UI library - you control the logic
- Easy customization for Temporal concepts
- Better TypeScript integration
- Lighter weight (no server required)

### 2. Why File-Based Storage?

**Benefits**:
- Version control (Git)
- Code review workflows
- Easy backup and restore
- IDE integration (VS Code)
- Hot reload support
- No database dependency

**Drawbacks**:
- File system watching overhead (minimal with modern tools)
- Concurrent edit conflicts (solvable with proper locking)

### 3. Why LiteLLM?

**Advantages**:
- Provider agnostic (switch between OpenAI, Anthropic, etc.)
- Cost tracking out of the box
- Rate limiting and load balancing
- OpenAI-compatible API (easy client integration)
- Active development and community

**Alternatives Considered**:
- Direct OpenAI SDK: Vendor lock-in
- Langchain: Too heavyweight for simple proxy needs

### 4. Development vs Production Timeouts

**Challenge**: Need fast feedback in dev, but realistic timeouts in prod

**Solution**: Environment-based configuration
```typescript
// Development: Quick feedback
activityTimeout: '5s'  // Fail fast to see errors

// Production: Real-world requirements
activityTimeout: '5m'  // Allow for network delays, retries
```

**Implementation**:
- Single source of truth (config files)
- Environment variable switching
- Clear documentation in UI
- Validation to prevent dev config in prod

---

## Alternative Approaches Considered

### Approach 1: Fork n8n
**Pros**: Full-featured workflow editor out of the box
**Cons**:
- Heavy customization required
- Vue.js codebase (not React)
- Execution model incompatible with Temporal
- **Decision**: Too much coupling, rejected

### Approach 2: Serverless Workflow (swtemporal)
**Pros**: Existing Temporal integration, visual editor
**Cons**:
- Uses Serverless Workflow spec (additional abstraction)
- Less active maintenance
- Limited customization
- **Decision**: Good reference, but build custom is better

### Approach 3: Code-First (No Visual Editor)
**Pros**: Simpler, pure TypeScript
**Cons**:
- No visual representation
- Harder for non-technical users
- Doesn't meet requirements
- **Decision**: Rejected, visual editor is core requirement

---

## Risk Mitigation

### Risk 1: Hot Reload Complexity
**Mitigation**:
- Use proven tools (tsx, nodemon)
- Clear separation between worker and workflow code
- Graceful shutdown handling
- Comprehensive testing

### Risk 2: Code Generation Bugs
**Mitigation**:
- Extensive test suite for generators
- TypeScript validation on generated code
- User ability to edit generated code
- Version control for rollback

### Risk 3: LLM Integration Costs
**Mitigation**:
- LiteLLM cost tracking
- Rate limiting per user
- Use cheaper models for simple tasks (Haiku)
- Cache common queries

### Risk 4: Development/Production Config Mismatch
**Mitigation**:
- Automated validation before deployment
- Clear UI indicators of current mode
- Separate deployment pipelines
- Mandatory review for config changes

---

## Success Metrics

### Developer Experience
- **Workflow Creation Time**: < 5 minutes for simple workflow
- **Hot Reload Speed**: < 2 seconds from save to worker restart
- **Code Generation Accuracy**: > 95% valid TypeScript on first generation
- **AI Assistance Response Time**: < 3 seconds for suggestions

### Technical Performance
- **Editor Load Time**: < 1 second for workflows with < 100 nodes
- **Worker Restart Time**: < 2 seconds
- **LLM Proxy Latency**: < 500ms overhead vs direct API

### Production Readiness
- **Test Coverage**: > 80% for code generation logic
- **Type Safety**: 100% TypeScript, no `any` types
- **Zero-Downtime Deployment**: Worker versioning enabled

---

## Implementation Timeline

### Week 1: Foundation
- Next.js setup
- React Flow integration
- Basic node types
- Canvas operations

### Week 2: Visual Editor Completion
- All node types
- Property panels
- Validation
- UI polish

### Week 3: Code Generation
- Workflow generator
- Activity generator
- Config management
- File I/O

### Week 4: Hot Reload & Testing
- Worker setup
- File watching
- Auto-restart
- Integration tests

### Week 5: LLM Integration
- LiteLLM setup
- AI assistant UI
- Agentic features
- Prompt engineering

### Week 6: Production Readiness
- Worker versioning
- Deployment setup
- Documentation
- Performance optimization

---

## Dependencies & Package List

### Frontend
```json
{
  "dependencies": {
    "next": "^14.2.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@xyflow/react": "^12.0.0",
    "@monaco-editor/react": "^4.7.0",
    "@temporalio/client": "^1.10.0",
    "openai": "^4.0.0",
    "tailwindcss": "^3.4.0",
    "shadcn-ui": "latest",
    "zustand": "^4.5.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "@types/react": "^19.0.0",
    "@types/node": "^20.0.0",
    "eslint": "^8.57.0",
    "prettier": "^3.2.0"
  }
}
```

### Worker
```json
{
  "dependencies": {
    "@temporalio/worker": "^1.10.0",
    "@temporalio/workflow": "^1.10.0",
    "@temporalio/activity": "^1.10.0",
    "dotenv": "^16.4.0",
    "chokidar": "^3.6.0"
  },
  "devDependencies": {
    "tsx": "^4.7.0",
    "nodemon": "^3.0.0",
    "typescript": "^5.4.0"
  }
}
```

### LiteLLM (Python)
```bash
pip install litellm[proxy]
```

---

## References & Sources

### Open Source Visual Editors
- [n8n - Workflow Automation](https://www.activepieces.com/blog/top-10-open-source-workflow-automation-tools-in-2024)
- [Comparing Workflow Tools: Airflow, Prefect, n8n](https://blog.adyog.com/2024/10/01/comparing-workflow-orchestration-tools-airflow-prefect-windmill-n8n-and-more/)
- [n8n vs Node-RED](https://hostadvice.com/blog/ai/automation/n8n-vs-node-red/)

### React Flow / xyflow
- [React Flow Documentation](https://reactflow.dev)
- [React Flow Workflow Editor Template](https://reactflow.dev/ui/templates/workflow-editor)
- [xyflow GitHub](https://github.com/xyflow/xyflow)
- [React Flow Spring 2025 Update](https://xyflow.com/blog/spring-update-2025)

### Temporal Documentation
- [TypeScript SDK Developer Guide](https://docs.temporal.io/develop/typescript)
- [Build Temporal App from Scratch](https://learn.temporal.io/getting_started/typescript/hello_world_in_typescript/)
- [Worker Versioning](https://docs.temporal.io/production-deployment/worker-deployments/worker-versioning)
- [Development vs Production Features](https://docs.temporal.io/evaluate/development-production-features)

### Hot Reload & Development
- [TypeScript Auto-Reload with tsx](https://blog.sivo.it.com/ts-node-development/how-to-watch-and-auto-reload-typescript-node-js-applications/)
- [Temporal Worker Hot Reload](https://learn.temporal.io/getting_started/typescript/first_program_in_typescript/)

### LiteLLM
- [LiteLLM GitHub](https://github.com/BerriAI/litellm)
- [LiteLLM Proxy Documentation](https://docs.litellm.ai/docs/simple_proxy)
- [LiteLLM for Agents](https://www.agentlocker.ai/agent/litellm)

### Monaco Editor
- [Monaco Editor GitHub](https://github.com/microsoft/monaco-editor)
- [Monaco Editor React Wrapper](https://www.npmjs.com/package/@monaco-editor/react)
- [VSCode API for Monaco](https://github.com/CodinGame/monaco-vscode-api)

### Existing Solutions
- [swtemporal - Serverless Workflow + Temporal](https://github.com/tsurdilo/swtemporal)
- [Temporal for VS Code](https://temporal.io/blog/temporal-for-vs-code)

---

## Conclusion

This plan provides a comprehensive, practical approach to building a visual Temporal workflow IDE by:

1. **Reusing proven open-source tools** (React Flow, Monaco, LiteLLM)
2. **Leveraging file-based storage** for hot reload and version control
3. **Supporting rapid development** with small timeouts and instant feedback
4. **Enabling easy productionalization** via environment-based configuration
5. **Integrating LLM agents** for intelligent workflow assistance

The architecture is modular, testable, and follows best practices from both the Temporal and React ecosystems. By building on top of React Flow rather than forking entire applications, we maintain flexibility while benefiting from battle-tested UI components.

**Next Steps**: Review this plan, adjust priorities as needed, and begin Phase 1 implementation.
