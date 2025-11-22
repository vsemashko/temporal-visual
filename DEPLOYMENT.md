# Production Deployment Guide

Complete guide for deploying the Temporal Visual IDE to production environments.

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Infrastructure Setup](#infrastructure-setup)
3. [Environment Configuration](#environment-configuration)
4. [Database Setup](#database-setup)
5. [Worker Deployment](#worker-deployment)
6. [Frontend Deployment](#frontend-deployment)
7. [Monitoring & Observability](#monitoring--observability)
8. [Security Considerations](#security-considerations)
9. [Scaling Strategy](#scaling-strategy)
10. [Troubleshooting](#troubleshooting)

---

## Pre-Deployment Checklist

- [ ] Temporal Server configured and running
- [ ] PostgreSQL database setup (not SQLite)
- [ ] LiteLLM proxy configured with production API keys
- [ ] Environment variables configured
- [ ] SSL/TLS certificates obtained
- [ ] Monitoring tools installed
- [ ] Backup strategy defined
- [ ] Rollback plan documented

---

## Infrastructure Setup

### Required Components

```
┌─────────────────────────────────────────────────────────┐
│                    Load Balancer                         │
│                   (nginx/cloudflare)                     │
└─────────────────────────────────────────────────────────┘
         │                              │
    ┌────▼─────┐                   ┌───▼────┐
    │ Frontend │                   │ Worker │
    │ (Next.js)│                   │ Pool   │
    └────┬─────┘                   └───┬────┘
         │                             │
    ┌────▼────────────────────────────▼────┐
    │         Temporal Server               │
    │    (Self-Hosted or Temporal Cloud)    │
    └──────────────┬────────────────────────┘
                   │
    ┌──────────────▼───────────────┐
    │      PostgreSQL Cluster       │
    │    (Primary + Read Replicas)  │
    └──────────────────────────────┘
```

### Minimum Requirements

**Frontend Server:**
- 2 CPU cores
- 4 GB RAM
- 20 GB SSD
- Node.js 20+

**Worker Server:**
- 4 CPU cores
- 8 GB RAM
- 50 GB SSD
- Node.js 20+

**Temporal Server:**
- Follow [Temporal's production deployment guide](https://docs.temporal.io/self-hosted-guide/production-checklist)
- Or use [Temporal Cloud](https://temporal.io/cloud)

---

## Environment Configuration

### Frontend (.env.production)

```bash
# Application
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://api.yourcompany.com

# Temporal
TEMPORAL_ADDRESS=temporal.yourcompany.com:7233
TEMPORAL_NAMESPACE=production
TEMPORAL_TASK_QUEUE=temporal-visual-prod

# LiteLLM
LITELLM_PROXY_URL=https://litellm.yourcompany.com
LITELLM_API_KEY=your-secure-api-key

# LLM Providers (for LiteLLM)
OPENAI_API_KEY=sk-prod-...
ANTHROPIC_API_KEY=sk-ant-prod-...

# Monitoring
SENTRY_DSN=https://...@sentry.io/...
LOG_LEVEL=info

# Security
SESSION_SECRET=your-secure-session-secret
ALLOWED_ORIGINS=https://yourcompany.com
```

### Worker (.env.production)

```bash
NODE_ENV=production
TEMPORAL_ADDRESS=temporal.yourcompany.com:7233
TEMPORAL_NAMESPACE=production
TEMPORAL_TASK_QUEUE=temporal-visual-prod

# Versioning
GIT_COMMIT=${GIT_COMMIT}
BUILD_NUMBER=${BUILD_NUMBER}

# Monitoring
SENTRY_DSN=https://...@sentry.io/...
```

### LiteLLM (litellm/config.production.yaml)

```yaml
model_list:
  - model_name: gpt-4-turbo
    litellm_params:
      model: openai/gpt-4-turbo-preview
      api_key: os.environ/OPENAI_API_KEY

  - model_name: claude-3-sonnet
    litellm_params:
      model: anthropic/claude-3-sonnet-20240229
      api_key: os.environ/ANTHROPIC_API_KEY

general_settings:
  master_key: ${LITELLM_MASTER_KEY}  # Use environment variable
  database_url: postgresql://user:pass@postgres:5432/litellm

  # Production settings
  max_parallel_requests: 1000
  timeout: 600
  enable_cost_tracking: true
  set_verbose: false  # Reduce logging in production

  # Security
  allowed_origins: ["https://yourcompany.com"]

litellm_settings:
  num_retries: 3
  request_timeout: 600
  fallback_models: ["gpt-3.5-turbo"]  # Fallback if primary fails
```

---

## Database Setup

### PostgreSQL Configuration

```sql
-- Create database
CREATE DATABASE temporal_visual_prod;

-- Create user
CREATE USER temporal_visual WITH PASSWORD 'secure_password';

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE temporal_visual_prod TO temporal_visual;

-- Enable required extensions
\c temporal_visual_prod
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### Connection Pooling

Use PgBouncer for connection pooling:

```ini
[databases]
temporal_visual = host=postgres-server port=5432 dbname=temporal_visual_prod

[pgbouncer]
listen_addr = *
listen_port = 6432
auth_type = md5
auth_file = /etc/pgbouncer/userlist.txt
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 25
```

---

## Worker Deployment

### Docker Deployment

```dockerfile
# Dockerfile.worker
FROM node:20-alpine

WORKDIR /app

# Copy worker files
COPY worker/package*.json ./worker/
COPY workflows ./workflows/

# Install dependencies
RUN cd worker && npm ci --only=production

# Copy source
COPY worker/src ./worker/src
COPY worker/tsconfig.json ./worker/

# Build
RUN cd worker && npm run build

# Run
CMD ["node", "worker/dist/worker.js"]
```

### Kubernetes Deployment

```yaml
# worker-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: temporal-visual-worker
  labels:
    app: temporal-visual
    component: worker
spec:
  replicas: 3  # Scale based on load
  selector:
    matchLabels:
      app: temporal-visual
      component: worker
  template:
    metadata:
      labels:
        app: temporal-visual
        component: worker
    spec:
      containers:
      - name: worker
        image: your-registry/temporal-visual-worker:latest
        env:
        - name: NODE_ENV
          value: "production"
        - name: TEMPORAL_ADDRESS
          value: "temporal.default.svc.cluster.local:7233"
        - name: GIT_COMMIT
          value: "${GIT_COMMIT}"
        resources:
          requests:
            memory: "2Gi"
            cpu: "1000m"
          limits:
            memory: "4Gi"
            cpu: "2000m"
        livenessProbe:
          exec:
            command:
            - node
            - -e
            - "process.exit(0)"
          initialDelaySeconds: 30
          periodSeconds: 10
```

### Systemd Service

```ini
# /etc/systemd/system/temporal-visual-worker.service
[Unit]
Description=Temporal Visual Worker
After=network.target

[Service]
Type=simple
User=temporal
WorkingDirectory=/opt/temporal-visual
Environment=NODE_ENV=production
ExecStart=/usr/bin/node worker/dist/worker.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

---

## Frontend Deployment

### Build Production Bundle

```bash
# Install dependencies
npm ci --only=production

# Build
npm run build

# Start
npm start
```

### Docker Deployment

```dockerfile
# Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/next.config.mjs ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
```

### Nginx Configuration

```nginx
upstream frontend {
    server frontend1:3000;
    server frontend2:3000;
    server frontend3:3000;
}

server {
    listen 443 ssl http2;
    server_name yourcompany.com;

    ssl_certificate /etc/ssl/certs/yourcompany.crt;
    ssl_certificate_key /etc/ssl/private/yourcompany.key;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Health check endpoint
    location /api/health {
        proxy_pass http://frontend;
        access_log off;
    }
}
```

---

## Monitoring & Observability

### Health Check Endpoints

```bash
# Application health
curl https://yourcompany.com/api/health

# System status
curl https://yourcompany.com/api/status
```

### Metrics to Monitor

**Application Metrics:**
- Request rate and latency
- Error rate
- Workflow generation success rate
- LLM API call count and latency

**Worker Metrics:**
- Active workflows
- Task queue depth
- Worker restarts
- Activity success/failure rate

**Infrastructure Metrics:**
- CPU and memory usage
- Disk I/O
- Network throughput
- Database connections

### Logging Strategy

```typescript
// lib/logger.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development'
    ? { target: 'pino-pretty' }
    : undefined,
  redact: ['password', 'apiKey', 'token'],  // Security
});
```

### Alerts

Set up alerts for:
- Worker crashes (> 3 in 5 minutes)
- High error rate (> 5% of requests)
- LLM API failures
- Temporal connection failures
- High response time (> 2 seconds p95)
- Disk space < 20%

---

## Security Considerations

### Network Security

```bash
# Firewall rules (iptables example)
# Allow HTTPS only
iptables -A INPUT -p tcp --dport 443 -j ACCEPT

# Allow Temporal (internal network only)
iptables -A INPUT -p tcp --dport 7233 -s 10.0.0.0/8 -j ACCEPT

# Deny all other incoming
iptables -A INPUT -j DROP
```

### API Key Management

Use secrets manager (AWS Secrets Manager, HashiCorp Vault, etc.):

```typescript
// lib/secrets.ts
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

export async function getSecret(secretName: string) {
  const client = new SecretsManagerClient({ region: "us-east-1" });
  const response = await client.send(
    new GetSecretValueCommand({ SecretId: secretName })
  );
  return JSON.parse(response.SecretString!);
}
```

### Authentication

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token');

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Verify token
  // ...

  return NextResponse.next();
}
```

### Rate Limiting

```typescript
// lib/rate-limit.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"),
});

export async function checkRateLimit(identifier: string) {
  const { success } = await ratelimit.limit(identifier);
  return success;
}
```

---

## Scaling Strategy

### Horizontal Scaling

**Frontend:**
- Deploy multiple instances behind load balancer
- Use Redis for session storage
- Enable connection pooling

**Workers:**
- Scale based on task queue depth
- Use Temporal's Worker Versioning for zero-downtime deployments
- Auto-scaling based on CPU/memory

### Vertical Scaling

Upgrade instance types when:
- CPU consistently > 70%
- Memory consistently > 80%
- High disk I/O wait times

### Caching Strategy

```typescript
// lib/cache.ts
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export async function cacheWorkflow(id: string, data: any) {
  await redis.setex(`workflow:${id}`, 3600, JSON.stringify(data));
}

export async function getWorkflow(id: string) {
  const data = await redis.get(`workflow:${id}`);
  return data ? JSON.parse(data) : null;
}
```

---

## Troubleshooting

### Common Issues

**1. Worker Not Picking Up Tasks**

```bash
# Check worker logs
journalctl -u temporal-visual-worker -f

# Verify Temporal connection
temporal workflow list --namespace production

# Check task queue
temporal task-queue describe --task-queue temporal-visual-prod
```

**2. High Memory Usage**

```bash
# Monitor Node.js heap
node --max-old-space-size=4096 worker/dist/worker.js

# Enable heap snapshot
kill -USR2 <worker-pid>
```

**3. LLM API Timeouts**

```yaml
# Increase timeout in litellm config
litellm_settings:
  request_timeout: 900  # 15 minutes
  num_retries: 5
```

**4. Workflow Generation Fails**

Check validation:
```bash
curl -X POST https://yourcompany.com/api/workflows/validate \
  -H "Content-Type: application/json" \
  -d @workflow.json
```

---

## Rollback Procedure

### Quick Rollback

```bash
# Kubernetes
kubectl rollout undo deployment/temporal-visual-worker
kubectl rollout undo deployment/temporal-visual-frontend

# Docker
docker service update --rollback temporal-visual-worker
docker service update --rollback temporal-visual-frontend

# Systemd
systemctl stop temporal-visual-worker
git checkout <previous-commit>
npm ci && npm run build
systemctl start temporal-visual-worker
```

### Database Rollback

```sql
-- If schema migration fails
BEGIN;

-- Restore from backup
pg_restore -d temporal_visual_prod backup.dump

-- Verify
SELECT COUNT(*) FROM workflows;

COMMIT;
```

---

## Maintenance

### Regular Tasks

**Daily:**
- Review error logs
- Check disk space
- Monitor API costs (LLM)

**Weekly:**
- Review metrics and alerts
- Update dependencies (security patches)
- Database vacuum and analyze

**Monthly:**
- Review and optimize queries
- Clean up old workflow metadata
- Update documentation
- Security audit

### Backup Strategy

```bash
#!/bin/bash
# backup.sh

# Database backup
pg_dump -h postgres -U temporal_visual temporal_visual_prod | \
  gzip > backups/db-$(date +%Y%m%d).sql.gz

# Workflows backup
tar -czf backups/workflows-$(date +%Y%m%d).tar.gz workflows/

# Rotate old backups (keep 30 days)
find backups/ -name "*.gz" -mtime +30 -delete
```

---

## Resources

- [Temporal Production Deployment](https://docs.temporal.io/self-hosted-guide/production-checklist)
- [Next.js Production Checklist](https://nextjs.org/docs/deployment)
- [LiteLLM Production Guide](https://docs.litellm.ai/docs/proxy/deploy)
- [PostgreSQL Performance Tuning](https://wiki.postgresql.org/wiki/Performance_Optimization)

---

## Support

For production support:
- Create GitHub issue with `[production]` tag
- Email: support@yourcompany.com
- Slack: #temporal-visual-support
