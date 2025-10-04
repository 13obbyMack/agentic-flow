# 🤖 Agentic Flow

**Deploy autonomous AI agents that complete long-running tasks while you sleep.**

Stop babysitting AI. Deploy specialized agents that handle complex workflows end-to-end - code reviews, API generation, data analysis, security audits. They work independently, use the right tools, collaborate when needed, and report results. Run heavy tasks on cheap models, scale to hundreds of agents without infrastructure overhead, or go completely offline. Real agents doing real work at a fraction of the cost.

Built on **[Claude Agent SDK](https://docs.claude.com/en/api/agent-sdk)** by Anthropic, powered by **[Claude Flow](https://github.com/ruvnet/claude-flow)** (101 MCP tools), **[Flow Nexus](https://github.com/ruvnet/flow-nexus)** (96 cloud tools), **[OpenRouter](https://openrouter.ai)** (100+ LLM models), **[Agentic Payments](https://www.npmjs.com/package/agentic-payments)** (payment authorization), and **ONNX Runtime** (free local CPU or GPU inference).

[![npm version](https://img.shields.io/npm/v/agentic-flow.svg)](https://www.npmjs.com/package/agentic-flow)
[![npm downloads](https://img.shields.io/npm/dm/agentic-flow.svg)](https://www.npmjs.com/package/agentic-flow)
[![npm total downloads](https://img.shields.io/npm/dt/agentic-flow.svg)](https://www.npmjs.com/package/agentic-flow)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![rUv](https://img.shields.io/badge/by-rUv-purple.svg)](https://github.com/ruvnet/)
[![Agentic Engineering](https://img.shields.io/badge/Agentic-Engineering-orange.svg)](https://github.com/ruvnet/agentic-flow#-agent-types)

---

## Why Agentic Flow?

**The Problem:** You need agents that actually complete tasks, not chatbots that need constant supervision. Long-running workflows - migrating codebases, generating documentation, analyzing datasets - shouldn't require you to sit there clicking "continue."

**What True Agentic Systems Need:**
- **Autonomy** - Agents that plan, execute, and recover from errors without hand-holding
- **Persistence** - Tasks that run for hours, even when you're offline
- **Collaboration** - Multiple agents coordinating on complex work
- **Tool Access** - Real capabilities: file systems, APIs, databases, not just text generation
- **Cost Control** - Run cheap models for grunt work, expensive ones only when needed

**What You Get:**

- **150+ Specialized Agents** - Researcher, coder, reviewer, tester, architect - each with domain expertise and tool access
- **Multi-Agent Swarms** - Deploy 3, 10, or 100 agents that collaborate via shared memory to complete complex projects
- **Long-Running Tasks** - Agents persist through hours-long operations: full codebase refactors, comprehensive audits, dataset processing
- **213 MCP Tools** - Agents have real capabilities: GitHub operations, neural network training, workflow automation, memory persistence
- **Intelligent Cost Routing** - $0.0003 per code review with OpenRouter vs $0.08 with Claude. Save $2,400/month on 100 daily reviews
- **Deploy Anywhere** - Same agentic capabilities locally, in Docker/Kubernetes, or cloud sandboxes

**Real Agentic Use Cases:**
- **Overnight Code Migration** - Deploy a swarm to migrate a 50K line codebase from JavaScript to TypeScript while you sleep
- **Continuous Security Audits** - Agents monitor repos, analyze PRs, and flag vulnerabilities 24/7
- **Automated API Development** - One agent designs schema, another implements endpoints, a third writes tests - all coordinated
- **Data Pipeline Processing** - Agents process TBs of data across distributed sandboxes, checkpoint progress, and recover from failures

> **True autonomy at commodity prices.** Your agents work independently on long-running tasks, coordinate when needed, and cost pennies per hour instead of dollars.

### Built on Industry Standards

- **[Claude Agent SDK](https://docs.claude.com/en/api/agent-sdk)** - Anthropic's official SDK for building AI agents
- **[Claude Flow](https://github.com/ruvnet/claude-flow)** - 101 MCP tools for orchestration, memory, GitHub, neural networks
- **[Flow Nexus](https://github.com/ruvnet/flow-nexus)** - 96 cloud tools for sandboxes, distributed swarms, workflows
- **[OpenRouter](https://openrouter.ai)** - Access to 100+ LLM models at 99% cost savings (Llama, DeepSeek, Gemini, etc.)
- **[Agentic Payments](https://www.npmjs.com/package/agentic-payments)** - Multi-agent payment authorization with Ed25519 cryptography
- **[ONNX Runtime](https://onnxruntime.ai)** - Free local CPU/GPU inference with Microsoft Phi-4

---

## 🚀 Quick Start

### Local Installation (Recommended for Development)

```bash
# Global installation
npm install -g agentic-flow

# Or use directly with npx (no installation)
npx agentic-flow --help

# Set your API key
export ANTHROPIC_API_KEY=sk-ant-...
```

### Your First Agent (Local Execution)

```bash
# Run locally with full 203 MCP tool access (Claude)
npx agentic-flow \
  --agent researcher \
  --task "Analyze microservices architecture trends in 2025"

# Run with OpenRouter for 99% cost savings
export OPENROUTER_API_KEY=sk-or-v1-...
npx agentic-flow \
  --agent coder \
  --task "Build a REST API with authentication" \
  --model "meta-llama/llama-3.1-8b-instruct"

# The agent executes on your machine, uses all MCP tools, and terminates
```

### Multi-Agent Swarm (Local)

```bash
# 3 agents work in parallel on your machine
export TOPIC="API security best practices"
export DIFF="feat: add OAuth2 authentication"
export DATASET="API response times last 30 days"

npx agentic-flow  # Spawns: researcher + code-reviewer + data-analyst
```

**Local Benefits:**
- ✅ All 203 MCP tools work (full subprocess support)
- ✅ Fast iteration and debugging
- ✅ No cloud costs during development
- ✅ Full access to local filesystem and resources

### Docker Deployment (Production)

```bash
# Build container
docker build -f deployment/Dockerfile -t agentic-flow .

# Run agent with Claude (Anthropic)
docker run --rm \
  -e ANTHROPIC_API_KEY=sk-ant-... \
  agentic-flow \
  --agent researcher \
  --task "Analyze cloud patterns"

# Run agent with OpenRouter (99% cost savings)
docker run --rm \
  -e OPENROUTER_API_KEY=sk-or-v1-... \
  agentic-flow \
  --agent coder \
  --task "Build REST API" \
  --model "meta-llama/llama-3.1-8b-instruct"
```

**Container Benefits:**
- ✅ All 203 MCP tools work (full subprocess support)
- ✅ OpenRouter proxy auto-starts in container
- ✅ Reproducible builds and deployments
- ✅ Works on Kubernetes, ECS, Cloud Run, Fargate
- ✅ Isolated execution environment

---

## ✨ Key Features

### 🔄 Ephemeral Architecture
- **On-Demand Spawning** - Agents created only when needed
- **Automatic Cleanup** - Terminate after task completion
- **Stateless Execution** - No persistent state between runs
- **Cost-Optimized** - Pay only for actual compute time

### 🤖 Multi-Model Router with ONNX Local Inference
- **Intelligent Provider Routing** - Automatic selection between Anthropic, OpenRouter, and ONNX based on task requirements
- **100% Free Local Inference** - ONNX Runtime CPU/GPU execution with Microsoft Phi-4 (zero API costs)
- **Privacy-First Processing** - GDPR/HIPAA-compliant local processing for sensitive workloads
- **Cost Optimization** - Route privacy tasks to free ONNX, complex reasoning to cloud APIs
- **Rule-Based Routing** - Automatic provider selection based on privacy, cost, and performance
- **GPU Acceleration Ready** - CPU inference at 6 tokens/sec, GPU capable of 60-300 tokens/sec
- **Zero-Cost Agents** - Run agents entirely offline with local ONNX models

### 💻 Local Development (Full Features)
- **Native Execution** - Run directly on macOS, Linux, Windows
- **All 203 MCP Tools** - Full subprocess support, no restrictions
- **Fast Iteration** - Instant feedback, no cold starts
- **Persistent Memory** - Claude Flow memory persists across runs
- **File System Access** - Full access to local files and directories
- **Git Integration** - Direct GitHub operations and repository management
- **Zero Cloud Costs** - Free during development

### 🐳 Container Deployment (Production Ready)
- **Docker Support** - Complete feature set for ECS, Cloud Run, Kubernetes
- **All 203 MCP Tools** - Full subprocess support in containers
- **Reproducible Builds** - Same environment across dev/staging/prod
- **Orchestration Ready** - Works with Kubernetes Jobs, ECS Tasks, Cloud Run
- **Health Checks Built-in** - `/health` endpoint for load balancers
- **Resource Controls** - CPU/memory limits via container configs

### ☁️ Cloud Sandboxes (Scalable Execution)
- **Flow Nexus E2B Sandboxes** - Fully isolated execution environments
- **All 203 MCP Tools** - Complete tool access in cloud sandboxes
- **Multi-Language Templates** - Node.js, Python, React, Next.js
- **Real-Time Streaming** - Live output and monitoring
- **Auto-Scaling** - Spin up 1 to 100+ sandboxes on demand
- **Pay-Per-Use** - Only pay for actual sandbox runtime (≈$1/hour)

### 🤖 Intelligent Agents
- **150+ Pre-Built Specialists** - Researchers, coders, testers, reviewers, architects
- **Swarm Coordination** - Agents collaborate via shared memory
- **Tool Access** - 200+ MCP tools for GitHub, neural networks, workflows
- **Custom Agents** - Define your own in YAML with system prompts

### 📊 Observability
- **Real-Time Streaming** - See agent output as it happens
- **Structured Logging** - JSON logs for aggregation and analysis
- **Performance Metrics** - Track agent duration, tool usage, token consumption
- **Health Checks** - Built-in healthcheck endpoint for orchestrators

---

## 🚀 Deployment Options

### 💻 Local Execution (Best for Development)

**Full-featured, all 203 MCP tools work:**

```bash
# Install globally
npm install -g agentic-flow

# Set API key
export ANTHROPIC_API_KEY=sk-ant-...

# Run any agent locally
npx agentic-flow --agent coder --task "Build REST API"

# Multi-agent swarm (3 agents in parallel)
npx agentic-flow  # Uses TOPIC, DIFF, DATASET env vars
```

**Why Local Development?**
- ✅ **All 203 MCP Tools**: Full subprocess support (claude-flow, flow-nexus, agentic-payments)
- ✅ **Fast Iteration**: No cold starts, instant feedback
- ✅ **Free**: No cloud costs during development
- ✅ **File Access**: Direct access to local filesystem
- ✅ **Git Integration**: Full GitHub operations
- ✅ **Memory Persistence**: Claude Flow memory persists across runs
- ✅ **Easy Debugging**: Standard Node.js debugging tools work

**System Requirements:**
- Node.js ≥18.0.0
- npm or pnpm
- 2GB RAM minimum (4GB recommended for swarms)
- macOS, Linux, or Windows

---

### 🎯 Flow Nexus Cloud Sandboxes (Best for Production Scale)
```javascript
// Create isolated sandbox and execute agent with full MCP tool access
const { query } = require('@anthropic-ai/claude-agent-sdk');

// 1. Login to Flow Nexus
await flowNexus.login({ email: 'user@example.com', password: 'secure' });

// 2. Create E2B sandbox with Node.js template
const sandbox = await flowNexus.sandboxCreate({
  template: 'node',
  name: 'agent-execution',
  env_vars: { ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY }
});

// 3. Execute agent in sandbox with all 203 MCP tools
const result = await flowNexus.sandboxExecute({
  sandbox_id: sandbox.id,
  code: `
    const { query } = require('@anthropic-ai/claude-agent-sdk');
    const result = await query({
      prompt: "Analyze API security patterns",
      options: {
        mcpServers: { /* all 3 MCP servers available */ }
      }
    });
    console.log(result);
  `
});

// 4. Automatic cleanup
await flowNexus.sandboxDelete({ sandbox_id: sandbox.id });
```

**Why Flow Nexus?**
- ✅ Full 203 MCP tool support (all subprocess servers work)
- ✅ Persistent memory across sandbox instances
- ✅ Multi-language templates (Node.js, Python, React, Next.js)
- ✅ Real-time output streaming
- ✅ Secure process isolation
- ✅ Pay-per-use pricing (10 credits/hour)

---

### 🐳 Docker Containers (Best for Production Deployments)

**Full 203 MCP tool support in containers:**

```bash
# Build image
docker build -t agentic-flow .

# Run single agent
docker run --rm \
  -e ANTHROPIC_API_KEY=sk-ant-... \
  agentic-flow \
  --agent researcher \
  --task "Analyze microservices patterns"

# Multi-agent swarm in container
docker run --rm \
  -e ANTHROPIC_API_KEY=sk-ant-... \
  -e TOPIC="API security" \
  -e DIFF="feat: auth" \
  -e DATASET="logs.json" \
  agentic-flow
```

**Why Docker?**
- ✅ **All 203 MCP Tools**: Full subprocess support
- ✅ **Production Ready**: Works on Kubernetes, ECS, Cloud Run, Fargate
- ✅ **Reproducible**: Same environment everywhere
- ✅ **Isolated**: Process isolation and security
- ✅ **Orchestration**: Integrates with container orchestrators
- ✅ **CI/CD**: Perfect for automated workflows

**Container Orchestration Examples:**

```yaml
# Kubernetes Job
apiVersion: batch/v1
kind: Job
metadata:
  name: code-review
spec:
  template:
    spec:
      containers:
      - name: agent
        image: agentic-flow:latest
        args: ["--agent", "code-review", "--task", "Review PR #123"]
        env:
        - name: ANTHROPIC_API_KEY
          valueFrom:
            secretKeyRef:
              name: anthropic
              key: api-key
      restartPolicy: Never

# GitHub Actions
- name: AI Code Review
  run: |
    docker run -e ANTHROPIC_API_KEY=${{ secrets.ANTHROPIC_API_KEY }} \
      agentic-flow:latest \
      --agent code-review \
      --task "${{ github.event.pull_request.diff }}"

# AWS ECS Task Definition
{
  "family": "agentic-flow-task",
  "containerDefinitions": [{
    "name": "agent",
    "image": "agentic-flow:latest",
    "command": ["--agent", "researcher", "--task", "$(TASK)"],
    "environment": [
      {"name": "ANTHROPIC_API_KEY", "value": "from-secrets-manager"}
    ]
  }]
}
```

### 🔓 ONNX Local Inference (Free Offline AI)

**Run agents completely offline with zero API costs:**

```bash
# Auto-downloads Phi-4 model (~4.9GB one-time download)
npx agentic-flow \
  --agent coder \
  --task "Build a REST API" \
  --provider onnx

# Router auto-selects ONNX for privacy-sensitive tasks
npx agentic-flow \
  --agent researcher \
  --task "Analyze confidential medical records" \
  --privacy high \
  --local-only
```

**ONNX Capabilities:**
- ✅ 100% free local inference (Microsoft Phi-4 model)
- ✅ Privacy: All processing stays on your machine
- ✅ Offline: No internet required after model download
- ✅ Performance: ~6 tokens/sec CPU, 60-300 tokens/sec GPU
- ✅ Auto-download: Model fetches automatically on first use
- ✅ Quantized: INT4 optimization for efficiency (~4.9GB total)
- ⚠️ Limited to 6 in-SDK tools (no subprocess MCP servers)
- 📚 See [docs](docs/ONNX_INTEGRATION.md) for full capabilities

---

## 🎯 Use Cases & Costs

| Use Case | Agent Type | Execution Time | Local Cost | Docker Cost | Flow Nexus Cost |
|----------|-----------|----------------|------------|-------------|-----------------|
| **Code Review** | `code-review` | 15-45s | Free* | Self-hosted | 0.13-0.38 credits |
| **API Testing** | `tester` | 10-30s | Free* | Self-hosted | 0.08-0.25 credits |
| **Documentation** | `api-docs` | 20-60s | Free* | Self-hosted | 0.17-0.50 credits |
| **Data Analysis** | `data-analyst` | 30-90s | Free* | Self-hosted | 0.25-0.75 credits |
| **Security Audit** | `reviewer` | 45-120s | Free* | Self-hosted | 0.38-1.00 credits |
| **Microservice Generation** | `backend-dev` | 60-180s | Free* | Self-hosted | 0.50-1.50 credits |
| **Performance Analysis** | `perf-analyzer` | 20-60s | Free* | Self-hosted | 0.17-0.50 credits |

*Local: Free infrastructure, Claude API costs only ($0.003-0.015 per input 1K tokens, $0.015-0.075 per output 1K tokens)
Flow Nexus: 10 credits/hour sandbox (≈$1/hour) + Claude API costs. 1 credit ≈ $0.10.
Docker: Infrastructure costs (AWS/GCP/Azure) + Claude API costs.*

**Recommendation by Scenario:**
- **Development/Testing**: Use **Local** - free, fast, full tools
- **CI/CD Pipelines**: Use **Docker** - reproducible, isolated
- **Production Scale**: Use **Flow Nexus** - auto-scaling, cloud-native

---

## 🤖 Agent Types

### Core Development Agents
- **`coder`** - Implementation specialist for writing clean, efficient code
- **`reviewer`** - Code review and quality assurance
- **`tester`** - Comprehensive testing with 90%+ coverage
- **`planner`** - Strategic planning and task decomposition
- **`researcher`** - Deep research and information gathering

### Specialized Agents
- **`backend-dev`** - REST/GraphQL API development
- **`mobile-dev`** - React Native mobile apps
- **`ml-developer`** - Machine learning model creation
- **`system-architect`** - System design and architecture
- **`cicd-engineer`** - CI/CD pipeline creation
- **`api-docs`** - OpenAPI/Swagger documentation

### Swarm Coordinators
- **`hierarchical-coordinator`** - Tree-based leadership
- **`mesh-coordinator`** - Peer-to-peer coordination
- **`adaptive-coordinator`** - Dynamic topology switching
- **`swarm-memory-manager`** - Cross-agent memory sync

### GitHub Integration
- **`pr-manager`** - Pull request lifecycle management
- **`code-review-swarm`** - Multi-agent code review
- **`issue-tracker`** - Intelligent issue management
- **`release-manager`** - Automated release coordination
- **`workflow-automation`** - GitHub Actions specialist

### Performance & Analysis
- **`perf-analyzer`** - Performance bottleneck detection
- **`production-validator`** - Deployment readiness checks
- **`tdd-london-swarm`** - Test-driven development

*Use `npx agentic-flow --list` to see all 150+ agents*

---

## 📋 Commands

### MCP Server Management (Direct Tool Access)

```bash
# Start all MCP servers (213 tools)
npx agentic-flow mcp start

# Start specific MCP server
npx agentic-flow mcp start claude-flow      # 101 tools
npx agentic-flow mcp start flow-nexus       # 96 cloud tools
npx agentic-flow mcp start agentic-payments # Payment tools

# List all available MCP tools (213 total)
npx agentic-flow mcp list

# Check MCP server status
npx agentic-flow mcp status

# Stop MCP servers
npx agentic-flow mcp stop [server]
```

**MCP Servers Available:**
- **claude-flow** (101 tools): Neural networks, GitHub integration, workflows, DAA, performance
- **flow-nexus** (96 tools): E2B sandboxes, distributed swarms, templates, cloud storage
- **agentic-payments** (10 tools): Payment authorization, Ed25519 signatures, consensus
- **claude-flow-sdk** (6 tools): In-process memory and swarm coordination

### Basic Operations (Works Locally, Docker, Cloud)

```bash
# List all available agents (150+ total)
npx agentic-flow --list

# Run specific agent (local execution)
npx agentic-flow --agent <name> --task "<description>"

# Enable real-time streaming
npx agentic-flow --agent coder --task "Build API" --stream

# Run parallel mode (3 agents simultaneously)
npx agentic-flow  # Requires TOPIC, DIFF, DATASET env vars
```

### Environment Configuration

```bash
# Required
export ANTHROPIC_API_KEY=sk-ant-...

# Agent mode (optional)
export AGENT=researcher
export TASK="Your task description"

# Parallel mode (optional)
export TOPIC="research topic"
export DIFF="code changes"
export DATASET="data to analyze"

# Options
export ENABLE_STREAMING=true
export HEALTH_PORT=8080
```

### Docker Deployment

```bash
# Build image
docker build -t agentic-flow .

# Run agent in container
docker run --rm \
  -e ANTHROPIC_API_KEY=sk-ant-... \
  agentic-flow \
  --agent researcher \
  --task "Analyze cloud patterns"

# Run with streaming
docker run --rm \
  -e ANTHROPIC_API_KEY=sk-ant-... \
  -e ENABLE_STREAMING=true \
  agentic-flow \
  --agent coder --task "Build REST API" --stream
```

---

---

## 🎛️ Using the Multi-Model Router

### Quick Start with Router

```javascript
import { ModelRouter } from 'agentic-flow/router';

// Initialize router (auto-loads configuration)
const router = new ModelRouter();

// Use default provider (Anthropic)
const response = await router.chat({
  model: 'claude-3-5-sonnet-20241022',
  messages: [{ role: 'user', content: 'Your prompt here' }]
});

console.log(response.content[0].text);
console.log(`Cost: $${response.metadata.cost}`);
```

### Available Providers

The router supports multiple LLM providers with automatic fallback:

**Anthropic (Cloud)**
- Models: Claude 3.5 Sonnet, Claude 3.5 Haiku, Claude 3 Opus
- Cost: $0.003/1K input tokens, $0.015/1K output tokens
- Best for: Complex reasoning, advanced coding, long conversations

**OpenRouter (Multi-Model Gateway)**
- Models: 100+ models from multiple providers
- Cost: $0.002-0.10/1K tokens (varies by model)
- Best for: Cost optimization, model diversity, fallback

**ONNX Runtime (Free Local)**
- Models: Microsoft Phi-4-mini-instruct (INT4 quantized)
- Cost: **$0.00** (100% free)
- Best for: Privacy-sensitive data, offline operation, zero-cost development

**Ollama (Local Server - Coming Soon)**
- Models: Any Ollama-supported model
- Cost: Free (requires local Ollama server)
- Best for: Local development with larger models

**LiteLLM (Gateway - Coming Soon)**
- Models: Unified API for 100+ providers
- Cost: Varies by provider
- Best for: Multi-cloud deployments

**Configuration Example:**
```json
// router.config.json
{
  "defaultProvider": "anthropic",
  "fallbackChain": ["anthropic", "onnx", "openrouter"],
  "providers": {
    "anthropic": {
      "apiKey": "sk-ant-...",
      "models": { "default": "claude-3-5-sonnet-20241022" }
    },
    "openrouter": {
      "apiKey": "sk-or-...",
      "baseUrl": "https://openrouter.ai/api/v1",
      "models": { "default": "anthropic/claude-3.5-sonnet" }
    },
    "onnx": {
      "modelPath": "./models/phi-4/.../model.onnx",
      "executionProviders": ["cpu"],
      "localInference": true
    }
  }
}
```

### OpenRouter Integration (99% Cost Savings)

Access 100+ LLM models through OpenRouter for dramatic cost savings while maintaining full functionality:

```bash
# Set OpenRouter API key
export OPENROUTER_API_KEY=sk-or-v1-...

# Use any OpenRouter model (proxy auto-starts)
npx agentic-flow \
  --agent coder \
  --task "Build REST API" \
  --model "meta-llama/llama-3.1-8b-instruct"

# Or force OpenRouter mode
export USE_OPENROUTER=true
npx agentic-flow --agent coder --task "Build REST API"
```

**Popular OpenRouter Models:**
- `meta-llama/llama-3.1-8b-instruct` - 99% cost savings, excellent coding
- `deepseek/deepseek-chat-v3.1` - Superior code generation at 97% savings
- `google/gemini-2.5-flash-preview-09-2025` - Fastest responses, 95% savings
- `anthropic/claude-3.5-sonnet` - Full Claude via OpenRouter

**Cost Comparison:**
| Provider | Model | Input (1K tokens) | Output (1K tokens) | Savings |
|----------|-------|-------------------|-------------------|---------|
| Anthropic Direct | Claude 3.5 Sonnet | $0.003 | $0.015 | Baseline |
| OpenRouter | Llama 3.1 8B | $0.00003 | $0.00006 | **99%** |
| OpenRouter | DeepSeek V3.1 | $0.00014 | $0.00028 | **97%** |
| OpenRouter | Gemini 2.5 Flash | $0.000075 | $0.0003 | **95%** |

**How It Works:**
1. Detects OpenRouter model (contains "/") or USE_OPENROUTER=true
2. Auto-starts integrated proxy server on port 3000
3. Translates Anthropic Messages API ↔ OpenAI Chat Completions API
4. Claude Agent SDK transparently uses OpenRouter via ANTHROPIC_BASE_URL
5. Full MCP tool support (all 203 tools work)

**Environment Variables:**
```bash
# Required for OpenRouter
export OPENROUTER_API_KEY=sk-or-v1-...

# Optional configuration
export USE_OPENROUTER=true              # Force OpenRouter usage
export COMPLETION_MODEL=meta-llama/...  # Default OpenRouter model
export PROXY_PORT=3000                  # Proxy server port
```

### Free ONNX Local Inference

Run agents with **zero API costs** using local ONNX models:

```javascript
// CPU Inference (6 tokens/sec, 100% free)
const router = new ModelRouter();
const onnxProvider = router.providers.get('onnx');

const response = await onnxProvider.chat({
  model: 'phi-4',
  messages: [{ role: 'user', content: 'Analyze this sensitive data...' }],
  maxTokens: 100
});

console.log(response.content[0].text);
console.log(`Cost: $${response.metadata.cost}`);  // $0.00
console.log(`Latency: ${response.metadata.latency}ms`);
console.log(`Privacy: 100% local processing`);
```

### Privacy-Based Routing

Automatically route privacy-sensitive workloads to free local ONNX inference:

```javascript
// Configure privacy routing in router.config.json
{
  "routing": {
    "mode": "rule-based",
    "rules": [
      {
        "condition": { "privacy": "high", "localOnly": true },
        "action": { "provider": "onnx" },
        "reason": "Privacy-sensitive tasks use free ONNX local models"
      }
    ]
  }
}

// Router automatically uses ONNX for privacy workloads
const response = await router.chat({
  model: 'any-model',
  messages: [{ role: 'user', content: 'Process medical records...' }],
  metadata: { privacy: 'high', localOnly: true }
});

// Routed to ONNX automatically (zero cost, 100% local)
console.log(response.metadata.provider);  // "onnx-local"
```

### GPU Acceleration

Enable GPU acceleration for 10-50x performance boost:

```json
// router.config.json
{
  "providers": {
    "onnx": {
      "executionProviders": ["cuda"],  // or ["dml"] for Windows
      "gpuAcceleration": true,
      "modelPath": "./models/phi-4/...",
      "maxTokens": 100
    }
  }
}
```

**Performance Comparison:**
- CPU: 6 tokens/sec (free)
- GPU (CUDA): 60-300 tokens/sec (free)
- Cloud API: Variable (costs $0.002-0.003/request)

### Zero-Cost Agent Execution

Run agents entirely offline with local ONNX models:

```bash
# Use ONNX provider for free inference
npx agentic-flow \
  --agent researcher \
  --task "Analyze this privacy-sensitive data" \
  --provider onnx \
  --local-only

# Result: $0.00 cost, 100% local processing
```

### Cost Comparison

| Workload Type | Provider | Cost per Request | Privacy | Performance |
|---------------|----------|------------------|---------|-------------|
| **Privacy-Sensitive** | ONNX (CPU) | **$0.00** | 100% local | 6 tokens/sec |
| **Privacy-Sensitive** | ONNX (GPU) | **$0.00** | 100% local | 60-300 tokens/sec |
| **Complex Reasoning** | Anthropic Claude | $0.003 | Cloud | Fast |
| **General Tasks** | OpenRouter | $0.002 | Cloud | Variable |

**Example Monthly Costs (1000 requests/day):**
- 100% ONNX: **$0** (free local inference)
- 50% ONNX, 50% cloud: **$30-45** (50% savings)
- 100% cloud APIs: **$60-90**

---

## 🔧 MCP Tools (213 Total)

Agentic Flow integrates with **four MCP servers** providing 213 tools total:

### Direct MCP Access

You can now directly manage MCP servers via the CLI:

```bash
# Start all MCP servers
npx agentic-flow mcp start

# List all 213 available tools
npx agentic-flow mcp list

# Check server status
npx agentic-flow mcp status

# Start specific server
npx agentic-flow mcp start claude-flow
```

**How It Works:**
1. **Automatic** (Recommended): Agents automatically access all 213 tools when you run tasks
2. **Manual**: Use `npx agentic-flow mcp <command>` for direct server management
3. **Integrated**: All tools work seamlessly whether accessed automatically or manually

### Tool Breakdown

### Core Orchestration (claude-flow - 101 tools)

| Category | Tools | Capabilities |
|----------|-------|--------------|
| **Swarm Management** | 12 | Initialize, spawn, coordinate multi-agent swarms |
| **Memory & Storage** | 10 | Persistent memory with TTL and namespaces |
| **Neural Networks** | 12 | Training, inference, WASM-accelerated computation |
| **GitHub Integration** | 8 | PR management, code review, repository analysis |
| **Performance** | 11 | Metrics, bottleneck detection, optimization |
| **Workflow Automation** | 9 | Task orchestration, CI/CD integration |
| **Dynamic Agents** | 7 | Runtime agent creation and coordination |
| **System Utilities** | 8 | Health checks, diagnostics, feature detection |

### Cloud Platform (flow-nexus - 96 tools)

| Category | Tools | Capabilities |
|----------|-------|--------------|
| **☁️ E2B Sandboxes** | 12 | Isolated execution environments (Node, Python, React) |
| **☁️ Distributed Swarms** | 8 | Cloud-based multi-agent deployment |
| **☁️ Neural Training** | 10 | Distributed model training clusters |
| **☁️ Workflows** | 9 | Event-driven automation with message queues |
| **☁️ Templates** | 8 | Pre-built project templates and marketplace |
| **☁️ Challenges** | 6 | Coding challenges with leaderboards |
| **☁️ User Management** | 7 | Authentication, profiles, credit management |
| **☁️ Storage** | 5 | Cloud file storage with real-time sync |

### Payment Authorization (agentic-payments - MCP tools)

Multi-agent payment infrastructure for autonomous AI commerce:

| Category | Tools | Capabilities |
|----------|-------|--------------|
| **💳 Active Mandates** | MCP | Create spending limits, time windows, merchant restrictions |
| **🔐 Ed25519 Signatures** | MCP | Cryptographic transaction signing (<1ms verification) |
| **🤝 Multi-Agent Consensus** | MCP | Byzantine fault-tolerant transaction approval |
| **📊 Payment Tracking** | MCP | Authorization to settlement lifecycle monitoring |
| **🛡️ Security** | MCP | Spend caps, revocation, audit trails |

**Use Cases:**
- E-commerce: AI shopping agents with weekly budgets
- Finance: Robo-advisors executing trades within portfolios
- Enterprise: Multi-agent procurement with consensus approval
- Accounting: Automated AP/AR with policy-based workflows

**Protocols:**
- **AP2**: Agent Payments Protocol with Ed25519 signatures
- **ACP**: Agentic Commerce Protocol (Stripe-compatible)
- **MCP**: Natural language interface for AI assistants

### In-Process Tools (claude-flow-sdk - 6 tools)

Fast, zero-latency tools running in-process:
- `memory_store`, `memory_retrieve`, `memory_list`
- `swarm_init`, `agent_spawn`, `coordination_sync`

---

## ⚡ FastMCP Integration (New)

Agentic Flow now supports **[FastMCP](https://github.com/QuantGeekDev/fastmcp)**, a modern TypeScript framework for building high-performance MCP servers with:

- **Dual Transport**: stdio (local/subprocess) + HTTP streaming (cloud/network)
- **Type Safety**: Full TypeScript + Zod schema validation
- **Progress Reporting**: Real-time execution feedback
- **Authentication**: JWT, API keys, OAuth 2.0 support
- **Rate Limiting**: Built-in abuse prevention

### POC Server (Phase 0 - Completed ✅)

Basic stdio server with 2 tools to validate fastmcp integration:

```bash
# Test the POC server
npm run test:fastmcp

# Or run directly
npm run mcp:fastmcp-poc
```

### Using with Claude Code

Add to your MCP config (`~/.config/claude/mcp.json`):

```json
{
  "mcpServers": {
    "fastmcp-poc": {
      "command": "node",
      "args": ["/path/to/agentic-flow/dist/mcp/fastmcp/servers/poc-stdio.js"]
    }
  }
}
```

### Available FastMCP Tools (POC)

| Tool | Description | Status |
|------|-------------|--------|
| `memory_store` | Store value in persistent memory | ✅ Working |
| `memory_retrieve` | Retrieve value from memory | ✅ Working |

**Coming Soon (Phase 1):**
- Migration of 6 claude-flow-sdk tools to fastmcp
- HTTP streaming transport with authentication
- Direct in-process execution (no execSync)
- Comprehensive test suite

**Documentation:**
- [FastMCP Implementation Plan](docs/mcp/fastmcp-implementation-plan.md) - 10-week migration strategy
- [FastMCP POC Integration](docs/mcp/fastmcp-poc-integration.md) - Usage and testing guide

---

## 🔍 Deployment Comparison

| Feature | Local | Docker | Flow Nexus Sandboxes | ONNX Local |
|---------|-------|--------|----------------------|------------|
| **MCP Tools Available** | 203 (100%) | 203 (100%) | 203 (100%) | 6 (3%) |
| **Setup Complexity** | Low | Medium | Medium | Low |
| **Cold Start Time** | <500ms | <2s | <2s | ~2s (first load) |
| **Cost (Development)** | Free* | Free* | $1/hour | $0 (100% free) |
| **Cost (Production)** | Free* | Infra costs | $1/hour | $0 (100% free) |
| **Privacy** | Local | Local | Cloud | 100% Offline |
| **Scaling** | Manual | Orchestrator | Automatic | Manual |
| **Best For** | Dev/Testing | CI/CD/Prod | Cloud-Scale | Privacy/Offline |

*Free infrastructure, Claude API costs only

---

## 📦 Advanced Deployment Patterns

### ☁️ Flow Nexus Cloud Sandboxes (Scalable Production)

**Best for cloud-native, auto-scaling workloads:**

```javascript
// Full-featured agent execution in isolated E2B sandboxes
import { flowNexus } from 'flow-nexus';

// Setup: One-time authentication
await flowNexus.login({
  email: process.env.FLOW_NEXUS_EMAIL,
  password: process.env.FLOW_NEXUS_PASSWORD
});

// Deploy: Create sandbox and execute
async function deployAgent(task) {
  // 1. Create isolated sandbox
  const sandbox = await flowNexus.sandboxCreate({
    template: 'node', // or 'python', 'react', 'nextjs'
    name: `agent-${Date.now()}`,
    env_vars: {
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY
    },
    install_packages: ['@anthropic-ai/claude-agent-sdk'],
    timeout: 3600 // 1 hour max
  });

  // 2. Execute agent with ALL 203 MCP tools
  const result = await flowNexus.sandboxExecute({
    sandbox_id: sandbox.id,
    code: `
      const { query } = require('@anthropic-ai/claude-agent-sdk');
      const result = await query({
        prompt: "${task}",
        options: {
          permissionMode: 'bypassPermissions',
          mcpServers: {
            'claude-flow-sdk': /* 6 tools */,
            'claude-flow': /* 101 tools */,
            'flow-nexus': /* 96 tools */
          }
        }
      });
      console.log(JSON.stringify(result));
    `,
    language: 'javascript',
    capture_output: true
  });

  // 3. Cleanup (automatic after timeout)
  await flowNexus.sandboxDelete({ sandbox_id: sandbox.id });

  return result;
}
```

**Why Flow Nexus is Recommended:**
- ✅ **Full MCP Support**: All 203 tools work (subprocess servers supported)
- ✅ **Persistent Memory**: Claude Flow memory persists across sandboxes
- ✅ **Security**: Complete process isolation per sandbox
- ✅ **Multi-Language**: Node.js, Python, React, Next.js templates
- ✅ **Real-Time**: Live output streaming and monitoring
- ✅ **Cost-Effective**: Pay per use (10 credits/hour ≈ $1/hour)

**Flow Nexus Pricing:**
| Resource | Cost | Notes |
|----------|------|-------|
| Sandbox (hourly) | 10 credits | ≈ $1/hour per sandbox |
| Storage | 1 credit/GB/month | Files and environment data |
| Credits Package | $10 = 100 credits | 10+ hours of sandbox time |

---

### 🐳 Container Platforms (Production Orchestration)

#### Docker (ECS, Cloud Run, Fargate, Kubernetes)

```dockerfile
FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
CMD ["npm", "start", "--", "--agent", "${AGENT}", "--task", "${TASK}"]
```

**Best Practices:**
- Use multi-stage builds for smaller images
- Enable health checks for orchestrators
- Set resource limits (CPU/memory)
- All 203 MCP tools available (subprocess servers work)
- Use secrets managers for API keys

#### Kubernetes

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: agentic-flow-job
spec:
  template:
    spec:
      containers:
      - name: agent
        image: agentic-flow:latest
        args: ["--agent", "researcher", "--task", "$(TASK)"]
        env:
        - name: ANTHROPIC_API_KEY
          valueFrom:
            secretKeyRef:
              name: anthropic-secret
              key: api-key
      restartPolicy: Never
```

**Best Practices:**
- Use Jobs for ephemeral executions
- Set activeDeadlineSeconds for timeouts
- Use node selectors for cost optimization
- Implement PodDisruptionBudgets
- All 203 MCP tools available

### 💡 ONNX Local Inference - Extended Configuration

**Advanced ONNX setup with router integration:**

```javascript
// router.config.json - Auto-route privacy tasks to ONNX
{
  "routing": {
    "rules": [
      {
        "condition": { "privacy": "high", "localOnly": true },
        "action": { "provider": "onnx" }
      },
      {
        "condition": { "cost": "free" },
        "action": { "provider": "onnx" }
      }
    ]
  },
  "providers": {
    "onnx": {
      "modelPath": "./models/phi-4/model.onnx",
      "maxTokens": 2048,
      "temperature": 0.7
    }
  }
}
```

**Performance Benchmarks:**
| Metric | CPU (Intel i7) | GPU (NVIDIA RTX 3060) |
|--------|---------------|----------------------|
| Tokens/sec | ~6 | 60-300 |
| First Token | ~2s | ~500ms |
| Model Load | ~3s | ~2s |
| Memory Usage | ~2GB | ~3GB |
| Cost | $0 | $0 |

**Use Cases:**
- ✅ Privacy-sensitive data processing
- ✅ Offline/air-gapped environments
- ✅ Cost-conscious development
- ✅ Compliance requirements (HIPAA, GDPR)
- ✅ Prototype/testing without API costs

**Documentation:**
- [ONNX Integration Guide](docs/ONNX_INTEGRATION.md)
- [ONNX CLI Usage](docs/ONNX_CLI_USAGE.md)
- [ONNX vs Claude Quality Analysis](docs/ONNX_VS_CLAUDE_QUALITY.md)
  const sandbox = await flowNexus.sandboxCreate({
    template: 'node',
    env_vars: { ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY }
  });

  const result = await flowNexus.sandboxExecute({
    sandbox_id: sandbox.id,
    code: `/* Full agent code with all 203 tools */`
  });

  await flowNexus.sandboxDelete({ sandbox_id: sandbox.id });

  return { statusCode: 200, body: JSON.stringify(result) };
};
```

---

## 📊 Architecture

### Ephemeral Agent Lifecycle

```
1. REQUEST → Agent definition loaded from YAML
2. SPAWN → Agent initialized with system prompt + tools
3. EXECUTE → Task processed using Claude SDK + MCP tools
4. STREAM → Real-time output (optional)
5. COMPLETE → Result returned to caller
6. TERMINATE → Agent process exits, memory released
```

**Key Characteristics:**
- **Cold Start**: <2s (includes MCP server initialization)
- **Warm Start**: <500ms (MCP servers cached)
- **Memory Usage**: 100-200MB per agent
- **Concurrent Agents**: Limited only by host resources

### Multi-Agent Coordination

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Researcher │────▶│   Memory    │◀────│ Code Review │
│   Agent     │     │   Storage   │     │   Agent     │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │    Data     │
                    │   Analyst   │
                    └─────────────┘
```

**Coordination via:**
- Shared memory (in-process or external)
- Claude Flow MCP tools
- File system (for batch jobs)
- Message queues (for async workflows)

---

## 🔍 Advanced Usage

### Custom Agent Definition

Create `.claude/agents/custom/my-agent.md`:

```markdown
---
name: my-agent
description: Custom agent for specific tasks
---

# System Prompt

You are a specialized agent for [your use case].

## Capabilities
- [List capabilities]

## Guidelines
- [Execution guidelines]
```

### Programmatic API

```javascript
import { query } from '@anthropic-ai/claude-agent-sdk';
import { getAgent } from 'agentic-flow/utils';

const agent = getAgent('researcher');
const result = await query({
  prompt: 'Analyze AI trends',
  options: {
    systemPrompt: agent.systemPrompt,
    permissionMode: 'bypassPermissions'
  }
});

console.log(result.output);
```

### Flow Nexus Integration

Requires registration for cloud features:

```bash
# Register account
npx agentic-flow --agent flow-nexus-auth \
  --task "Register with email: user@example.com"

# Login
npx agentic-flow --agent flow-nexus-auth \
  --task "Login with email: user@example.com, password: ***"

# Create cloud sandbox
npx agentic-flow --agent flow-nexus-sandbox \
  --task "Create Node.js sandbox and execute: console.log('Hello')"
```

---

## 📈 Performance & Scaling

### Benchmarks

| Metric | Result |
|--------|--------|
| **Cold Start** | <2s (including MCP initialization) |
| **Warm Start** | <500ms (cached MCP servers) |
| **Agent Spawn** | 75 agents loaded in <2s |
| **Tool Discovery** | 203 tools accessible in <1s |
| **Memory Footprint** | 100-200MB per agent process |
| **Concurrent Agents** | 10+ on t3.small, 100+ on c6a.xlarge |
| **Token Efficiency** | 32% reduction via swarm coordination |

### Cost Analysis - ONNX vs Cloud APIs

| Provider | Model | Tokens/sec | Cost per 1M tokens | Monthly (100K tasks) |
|----------|-------|------------|-------------------|---------------------|
| ONNX Local | Phi-4 | 6-300 | $0 | $0 |
| OpenRouter | Llama 3.1 8B | API | $0.06 | $6 |
| OpenRouter | DeepSeek | API | $0.14 | $14 |
| Claude | Sonnet 3.5 | API | $3.00 | $300 |

**ONNX Savings:** Up to $3,600/year for typical development workloads

---

## 🛠️ Development

### Build from Source

```bash
# Clone repository
git clone https://github.com/ruvnet/agentic-flow.git
cd agentic-flow

# Install dependencies
npm install

# Build TypeScript
npm run build

# Test locally
node dist/cli.js --help
```

### Testing

```bash
# Run all tests
npm test

# Test specific agent
node dist/cli.js --agent researcher --task "Test task"

# Validate MCP tools
npm run validate
```

### Adding Custom Agents

1. Create agent definition: `.claude/agents/custom/my-agent.md`
2. Define system prompt and capabilities
3. Test: `npx agentic-flow --agent my-agent --task "Test"`
4. Deploy: `npm run build && docker build -t my-agents .`

---

## 🔗 Links

- **Documentation**: [docs/](docs/)
- **GitHub**: [github.com/ruvnet/agentic-flow](https://github.com/ruvnet/agentic-flow)
- **npm Package**: [npmjs.com/package/agentic-flow](https://www.npmjs.com/package/agentic-flow)
- **Claude Agent SDK**: [docs.claude.com/en/api/agent-sdk](https://docs.claude.com/en/api/agent-sdk)
- **Flow Nexus Platform**: [github.com/ruvnet/flow-nexus](https://github.com/ruvnet/flow-nexus)

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Setup
1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Make changes and add tests
4. Ensure tests pass: `npm test`
5. Commit: `git commit -m "feat: add amazing feature"`
6. Push: `git push origin feature/amazing-feature`
7. Open Pull Request

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

Built with:
- [Claude Agent SDK](https://docs.claude.com/en/api/agent-sdk) by Anthropic
- [Claude Flow](https://github.com/ruvnet/claude-flow) - 101 MCP tools
- [Flow Nexus](https://github.com/ruvnet/flow-nexus) - 96 cloud tools
- [Model Context Protocol](https://modelcontextprotocol.io) by Anthropic

---

## 💬 Support

- **Documentation**: See [docs/](docs/) folder
- **Issues**: [GitHub Issues](https://github.com/ruvnet/agentic-flow/issues)
- **Discussions**: [GitHub Discussions](https://github.com/ruvnet/agentic-flow/discussions)

---

**Deploy ephemeral AI agents in seconds. Scale to thousands. Pay only for what you use.** 🚀

```bash
npx agentic-flow --agent researcher --task "Your task here"
```
