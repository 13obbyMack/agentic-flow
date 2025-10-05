# 🤖 Agentic Flow

[![npm version](https://img.shields.io/npm/v/agentic-flow.svg)](https://www.npmjs.com/package/agentic-flow)
[![npm downloads](https://img.shields.io/npm/dm/agentic-flow.svg)](https://www.npmjs.com/package/agentic-flow)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![rUv](https://img.shields.io/badge/by-rUv-purple.svg)](https://github.com/ruvnet/)

**Production-ready AI agent orchestration with 66+ specialized agents, 213 MCP tools, and multi-model routing (Anthropic, OpenRouter, Gemini, ONNX).**

---

## 📖 Introduction

Agentic Flow is a framework for running AI agents at scale with intelligent cost optimization. It runs any Claude Code agent through the [Claude Agent SDK](https://docs.claude.com/en/api/agent-sdk), automatically routing tasks to the cheapest model that meets quality requirements.

**Key Capabilities:**
- ✅ **66 Specialized Agents** - Pre-built experts for coding, research, review, testing, DevOps
- ✅ **213 MCP Tools** - Memory, GitHub, neural networks, sandboxes, workflows, payments
- ✅ **Multi-Model Router** - Anthropic, OpenRouter (100+ models), Gemini, ONNX (free local)
- ✅ **Cost Optimization** - 85-99% savings with DeepSeek, Llama, Gemini vs Claude
- ✅ **Standalone Proxy** - Use Gemini/OpenRouter with Claude Code at 85% cost savings

**Built On:**
- [Claude Agent SDK](https://docs.claude.com/en/api/agent-sdk) by Anthropic
- [Claude Flow](https://github.com/ruvnet/claude-flow) - 101 MCP tools
- [Flow Nexus](https://github.com/ruvnet/flow-nexus) - 96 cloud tools
- [OpenRouter](https://openrouter.ai) - 100+ LLM models
- [Agentic Payments](https://www.npmjs.com/package/agentic-payments) - Multi-agent payments

---

## 🚀 Quick Start

### Option 1: CLI Agent Execution (Fastest)

Run specialized agents for coding, research, testing, and more:

```bash
# Install globally
npm install -g agentic-flow

# Run with Claude (Anthropic)
export ANTHROPIC_API_KEY=sk-ant-...
npx agentic-flow --agent coder --task "Build a REST API with authentication"

# Run with OpenRouter (99% cost savings)
export OPENROUTER_API_KEY=sk-or-v1-...
npx agentic-flow --agent coder --task "Build REST API" --model "meta-llama/llama-3.1-8b-instruct"

# Run with Gemini (free tier)
export GOOGLE_GEMINI_API_KEY=AIza...
npx agentic-flow --agent coder --task "Build REST API" --provider gemini

# List all 66 available agents
npx agentic-flow --list
```

**Available Agents:**
- `coder`, `reviewer`, `tester`, `planner`, `researcher`
- `backend-dev`, `mobile-dev`, `ml-developer`, `cicd-engineer`
- `pr-manager`, `code-review-swarm`, `release-manager`
- `perf-analyzer`, `production-validator`, `system-architect`
- And 50+ more...

---

### Option 2: MCP Tools (Direct Access)

Access 213 MCP tools for memory, swarms, GitHub, neural networks, and cloud sandboxes:

```bash
# Start all MCP servers (213 tools) - stdio transport
npx agentic-flow mcp start

# List all available tools
npx agentic-flow mcp list

# Check server status
npx agentic-flow mcp status

# Use tools in any agent automatically
export ENABLE_CLAUDE_FLOW_SDK=true
npx agentic-flow --agent coder --task "Store config in memory using memory_store"
```

**MCP Transports:**
- **stdio** (default): Standard input/output for Claude Desktop integration
- **HTTP/SSE** (new): HTTP server with Server-Sent Events for web apps

```bash
# Start HTTP/SSE server on port 8080
npm run mcp:http
# Endpoints:
# - HTTP: http://localhost:8080/mcp
# - SSE: http://localhost:8080/sse
# - Health: http://localhost:8080/health

# Start stdio server (default)
npm run mcp:stdio
```

**MCP Tool Categories:**
- **Agentic Flow** (6 tools): Agent execution, creation, optimization, model selection
- **Claude Flow SDK** (6 tools): In-process memory and swarm coordination
- **Claude Flow** (101 tools): Neural networks, GitHub, workflows, performance, DAA
- **Flow Nexus** (96 tools): E2B sandboxes, distributed swarms, templates, storage
- **Agentic Payments** (10 tools): Payment authorization, Ed25519 signatures, consensus

---

### Option 3: Standalone Proxy (NEW in v1.1.11)

Use Gemini or OpenRouter with Claude Code at 85-90% cost savings:

```bash
# Terminal 1: Start proxy server
export GOOGLE_GEMINI_API_KEY=your-key-here
npx agentic-flow proxy

# Terminal 2: Use Claude Code with proxy
export ANTHROPIC_BASE_URL=http://localhost:3000
export ANTHROPIC_API_KEY=sk-ant-proxy-dummy-key
claude  # Now uses Gemini instead of Anthropic!

# Or use OpenRouter (90% savings)
npx agentic-flow proxy --provider openrouter --model "openai/gpt-4o-mini"
```

**Features:**
- ✅ MCP tools work through proxy (all 213 tools)
- ✅ Compatible with Claude Code official CLI
- ✅ Future Cursor IDE support (waiting for ANTHROPIC_BASE_URL)
- ✅ 85-90% cost savings vs direct Anthropic API

**Cost Savings:**
| Provider | Model | Cost per 1M tokens | Savings |
|----------|-------|-------------------|---------|
| Anthropic | Claude Sonnet 4.5 | $3.00 | Baseline |
| Gemini (proxy) | gemini-2.0-flash | $0.00 (free tier) | **100%** |
| OpenRouter (proxy) | gpt-4o-mini | $0.15 | **95%** |
| OpenRouter (proxy) | deepseek-v3 | $0.014 | **99.5%** |

📚 **See [Standalone Proxy Guide](docs/STANDALONE_PROXY_GUIDE.md) for details**

---

## 📚 Tutorial: Agent Execution

### 1. Basic Agent Usage

**What it does:** Runs a specialized agent with Claude SDK and all 213 MCP tools.

**When to use:** Quick tasks that need one expert (code review, API generation, testing).

```bash
# Code generation
npx agentic-flow --agent coder --task "Create a REST API with OAuth2 authentication"

# Security review
npx agentic-flow --agent reviewer --task "Review this code for security vulnerabilities"

# Test generation
npx agentic-flow --agent tester --task "Write comprehensive tests for this API"
```

**Technical Details:**
- Uses Claude Agent SDK's `query()` function
- Automatically loads agent's system prompt from `.claude/agents/`
- All 213 MCP tools available via `mcpServers` configuration
- Streams output in real-time with `--stream` flag

---

### 2. Multi-Agent Swarms

**What it does:** Runs 3 agents in parallel for complex workflows.

**When to use:** Multi-faceted tasks requiring research + coding + analysis.

```bash
# Set environment variables
export TOPIC="API security best practices"
export DIFF="feat: add OAuth2 authentication"
export DATASET="API response times last 30 days"

# Run parallel swarm (researcher + code-reviewer + data-analyst)
npx agentic-flow
```

**Technical Details:**
- Spawns 3 agents concurrently: `researcher`, `code-review`, `data-analyst`
- Agents coordinate via Claude Flow memory tools
- Each agent has access to all 213 MCP tools
- Results aggregated and returned together

---

### 3. Cost Optimization with OpenRouter

**What it does:** Uses OpenRouter models for 90-99% cost savings vs Claude.

**When to use:** Development, testing, or budget-conscious production workloads.

```bash
# Ultra-low cost with Llama 3.1 8B (99% savings)
export OPENROUTER_API_KEY=sk-or-v1-...
npx agentic-flow --agent coder --task "Build REST API" --model "meta-llama/llama-3.1-8b-instruct"

# Balanced cost/quality with DeepSeek (97% savings)
npx agentic-flow --agent coder --task "Production code" --model "deepseek/deepseek-chat-v3.1"

# Fast responses with Gemini (95% savings)
npx agentic-flow --agent researcher --task "Analyze trends" --model "google/gemini-2.5-flash-preview"
```

**Technical Details:**
- Proxy auto-starts on port 3000 when OpenRouter model detected
- Translates Anthropic Messages API ↔ OpenAI Chat Completions API
- All 213 MCP tools work through proxy
- No code changes needed - transparent to Claude SDK

**Cost Comparison:**
```
Task: Generate 100K tokens (200 functions)

Anthropic Claude Sonnet 4.5: $1.80
DeepSeek V3 (OpenRouter):    $0.028  (98% savings)
Llama 3.1 8B (OpenRouter):   $0.011  (99% savings)
```

---

### 4. Free Local Inference with ONNX

**What it does:** Runs agents completely offline with zero API costs.

**When to use:** Privacy-sensitive data, air-gapped environments, development without API costs.

```bash
# Auto-downloads Phi-4 model (~4.9GB one-time)
npx agentic-flow --agent coder --task "Build REST API" --provider onnx

# Privacy-first routing (auto-selects ONNX)
npx agentic-flow --agent researcher --task "Analyze medical records" --privacy high --local-only
```

**Technical Details:**
- Uses Microsoft Phi-4 (INT4 quantized) via ONNX Runtime
- CPU: ~6 tokens/sec, GPU: 60-300 tokens/sec
- 100% offline after model download
- Limited to 6 in-SDK tools (no subprocess MCP servers)
- Zero API costs forever

---

### 5. Model Optimization (Auto-Select Best Model)

**What it does:** Automatically picks optimal model based on task complexity and priorities.

**When to use:** You want best quality/cost/speed balance without manual selection.

```bash
# Let optimizer choose (balanced quality vs cost)
npx agentic-flow --agent coder --task "Build REST API" --optimize

# Optimize for lowest cost
npx agentic-flow --agent coder --task "Simple function" --optimize --priority cost

# Optimize for highest quality
npx agentic-flow --agent reviewer --task "Security audit" --optimize --priority quality

# Set budget cap ($0.001 per task max)
npx agentic-flow --agent coder --task "Code cleanup" --optimize --max-cost 0.001
```

**Technical Details:**
- Analyzes agent requirements (coder needs 85+ quality score)
- Evaluates task complexity via keyword analysis
- Scores 10+ models across quality, cost, speed, privacy
- Returns recommendation with reasoning

**Optimization Priorities:**
- `quality` - Best results (70% quality, 20% speed, 10% cost)
- `balanced` - Default mix (40% quality, 40% cost, 20% speed)
- `cost` - Cheapest (70% cost, 20% quality, 10% speed)
- `speed` - Fastest (70% speed, 20% quality, 10% cost)
- `privacy` - Local-only (ONNX models, zero cloud API calls)

---

## 📚 Tutorial: MCP Tools

### What are MCP Tools?

MCP (Model Context Protocol) tools extend agent capabilities beyond text generation. They provide:
- **Memory** - Persistent storage across sessions
- **GitHub** - Repository operations, PR management, code review
- **Sandboxes** - Isolated execution environments in the cloud
- **Neural Networks** - Training, inference, model management
- **Workflows** - Event-driven automation with message queues
- **Payments** - Multi-agent payment authorization

### Starting MCP Servers

**stdio Transport (default for Claude Desktop):**
```bash
# Start all 213 tools (4 servers)
npx agentic-flow mcp start

# Start specific server
npx agentic-flow mcp start claude-flow      # 101 tools
npx agentic-flow mcp start flow-nexus       # 96 tools (requires registration)
npx agentic-flow mcp start agentic-payments # 10 tools

# List all tools
npx agentic-flow mcp list

# Check status
npx agentic-flow mcp status

# Stop servers
npx agentic-flow mcp stop
```

**HTTP/SSE Transport (new for web applications):**
```bash
# Start HTTP/SSE MCP server on port 8080
npm run mcp:http

# Or manually:
node dist/mcp/fastmcp/servers/http-sse.js

# Server provides 3 endpoints:
# - http://localhost:8080/mcp (MCP protocol)
# - http://localhost:8080/sse (Server-Sent Events)
# - http://localhost:8080/health (health check)
```

**When to use each transport:**
- **stdio**: Claude Desktop, Cursor IDE, command-line tools
- **HTTP/SSE**: Web apps, browser extensions, REST APIs, mobile apps

### Using MCP Tools in Agents

**Automatic (Recommended):**
```bash
# Tools available automatically when ENABLE_CLAUDE_FLOW_SDK=true
export ENABLE_CLAUDE_FLOW_SDK=true
npx agentic-flow --agent coder --task "Store config in memory_store"
```

**Manual (Advanced):**
```javascript
import { query } from '@anthropic-ai/claude-agent-sdk';

const result = await query({
  prompt: 'Store API key in memory',
  options: {
    mcpServers: {
      'claude-flow-sdk': {
        command: 'npx',
        args: ['claude-flow', 'mcp', 'start'],
        env: { ENABLE_CLAUDE_FLOW_SDK: 'true' }
      }
    }
  }
});
```

### MCP Tool Categories

**1. Memory & Storage (claude-flow-sdk)**
- `memory_store` - Store persistent key-value data
- `memory_retrieve` - Retrieve stored data
- `memory_search` - Search memory by pattern
- `memory_list` - List all stored keys
- `memory_delete` - Delete stored data

**2. Swarm Coordination (claude-flow)**
- `swarm_init` - Initialize multi-agent swarm
- `agent_spawn` - Create specialized agents
- `task_orchestrate` - Distribute work across agents
- `swarm_status` - Monitor swarm health
- `coordination_sync` - Synchronize agent state

**3. GitHub Integration (claude-flow)**
- `github_repo_analyze` - Repository analysis
- `github_pr_manage` - PR lifecycle management
- `github_code_review` - Automated code review
- `github_issue_track` - Issue triage and tracking
- `github_workflow_auto` - CI/CD automation

**4. Cloud Sandboxes (flow-nexus)**
- `sandbox_create` - Isolated execution environments
- `sandbox_execute` - Run code in sandbox
- `sandbox_upload` - Upload files to sandbox
- `sandbox_status` - Check sandbox health
- `sandbox_delete` - Cleanup sandbox

**5. Neural Networks (claude-flow)**
- `neural_train` - Train models with WASM acceleration
- `neural_predict` - Run inference
- `neural_patterns` - Analyze cognitive patterns
- `neural_status` - Model metrics

**6. Workflows (flow-nexus)**
- `workflow_create` - Event-driven automation
- `workflow_execute` - Run workflow with message queues
- `workflow_status` - Monitor execution
- `workflow_agent_assign` - Optimal agent assignment

**7. Payments (agentic-payments)**
- `create_active_mandate` - Payment authorization with spend caps
- `sign_mandate` - Ed25519 cryptographic signing
- `verify_mandate` - Signature verification
- `verify_consensus` - Multi-agent Byzantine consensus

---

## 📚 Tutorial: Standalone Proxy

### What is the Standalone Proxy?

The standalone proxy lets you use **cheaper models** (Gemini, OpenRouter) with tools that expect the **Anthropic API** (Claude Code, future Cursor).

**How it works:**
1. Proxy server translates Anthropic API ↔ Gemini/OpenRouter API
2. Claude Code sends requests to proxy instead of Anthropic
3. Proxy forwards to cheaper provider and translates responses
4. MCP tools work seamlessly through proxy

### Setup: Gemini Proxy (85% savings)

```bash
# Terminal 1: Start Gemini proxy
export GOOGLE_GEMINI_API_KEY=your-key-here
npx agentic-flow proxy

# Proxy starts on http://localhost:3000
# Instructions displayed for configuring Claude Code

# Terminal 2: Configure Claude Code to use proxy
export ANTHROPIC_BASE_URL=http://localhost:3000
export ANTHROPIC_API_KEY=sk-ant-proxy-dummy-key  # Any value works

# Now use Claude Code normally
claude

# Or run agent directly
claude --agent coder --task "Build REST API"
```

**Cost Savings:**
- Gemini free tier: 100% savings vs Anthropic
- All MCP tools work through proxy
- Real-time streaming supported

### Setup: OpenRouter Proxy (90-99% savings)

```bash
# Terminal 1: Start OpenRouter proxy
export OPENROUTER_API_KEY=sk-or-v1-...
npx agentic-flow proxy --provider openrouter --model "openai/gpt-4o-mini"

# Terminal 2: Use Claude Code
export ANTHROPIC_BASE_URL=http://localhost:3000
export ANTHROPIC_API_KEY=sk-ant-proxy-dummy-key
claude --agent coder --task "Build web scraper"
```

**Popular OpenRouter Models:**
- `openai/gpt-4o-mini` - $0.15/1M tokens (95% savings)
- `deepseek/deepseek-chat-v3.1` - $0.014/1M tokens (99.5% savings)
- `meta-llama/llama-3.3-70b-instruct` - $0.30/1M tokens (90% savings)

### Proxy Command Reference

```bash
# Start Gemini proxy (default)
npx agentic-flow proxy

# Start OpenRouter proxy
npx agentic-flow proxy --provider openrouter

# Custom port
npx agentic-flow proxy --port 8080

# Specific model
npx agentic-flow proxy --provider openrouter --model "anthropic/claude-3.5-sonnet"

# Help
npx agentic-flow proxy --help
```

### How MCP Tools Work Through Proxy

**Technical Implementation:**

1. **Tool Schema Forwarding**
   - Anthropic format: `{ name, description, input_schema }`
   - OpenRouter format: `{ type: 'function', function: {...} }`
   - Gemini format: `{ functionDeclarations: [{...}] }`

2. **Schema Cleaning for Gemini**
   - Removes unsupported fields: `$schema`, `additionalProperties`
   - Recursively cleans nested objects

3. **Response Conversion**
   - OpenRouter: `tool_calls` → `tool_use`
   - Gemini: `functionCall` → `tool_use`

**Example:**
```bash
# MCP tools work automatically through proxy
export ENABLE_CLAUDE_FLOW_SDK=true
export ANTHROPIC_BASE_URL=http://localhost:3000
export ANTHROPIC_API_KEY=sk-ant-proxy-dummy-key

# memory_store MCP tool works with Gemini (85% cost savings)
npx agentic-flow --agent coder --task "Store API config in memory_store"
```

---

## 📚 Tutorial: Deployment Options

### Local Development (Best for Prototyping)

**What it does:** Runs agents directly on your machine with full MCP tool access.

**When to use:** Development, testing, debugging, low-cost experimentation.

```bash
# Install globally
npm install -g agentic-flow

# Run locally
export ANTHROPIC_API_KEY=sk-ant-...
npx agentic-flow --agent coder --task "Build REST API"
```

**Benefits:**
- ✅ All 213 MCP tools work
- ✅ Fast iteration (<500ms warm start)
- ✅ Free infrastructure (API costs only)
- ✅ Full filesystem access
- ✅ Git integration

**Requirements:**
- Node.js ≥18.0.0
- 2GB RAM minimum (4GB for swarms)
- macOS, Linux, or Windows

---

### Docker Containers (Best for Production)

**What it does:** Packages agents in containers for Kubernetes, ECS, Cloud Run.

**When to use:** CI/CD pipelines, production deployments, reproducible environments.

```bash
# Build image
docker build -t agentic-flow .

# Run agent in container
docker run --rm \
  -e ANTHROPIC_API_KEY=sk-ant-... \
  agentic-flow \
  --agent researcher \
  --task "Analyze cloud patterns"

# Run with OpenRouter (99% cost savings)
docker run --rm \
  -e OPENROUTER_API_KEY=sk-or-v1-... \
  agentic-flow \
  --agent coder \
  --task "Build API" \
  --model "meta-llama/llama-3.1-8b-instruct"
```

**Benefits:**
- ✅ All 213 MCP tools work
- ✅ Reproducible builds
- ✅ Works on Kubernetes, ECS, Cloud Run, Fargate
- ✅ Process isolation
- ✅ CI/CD integration

**Orchestration Examples:**

**Kubernetes Job:**
```yaml
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
```

**GitHub Actions:**
```yaml
- name: AI Code Review
  run: |
    docker run -e ANTHROPIC_API_KEY=${{ secrets.ANTHROPIC_API_KEY }} \
      agentic-flow:latest \
      --agent code-review \
      --task "${{ github.event.pull_request.diff }}"
```

---

### Cloud Sandboxes (Best for Scale)

**What it does:** Isolated E2B sandboxes with auto-scaling and cloud-native features.

**When to use:** Production scale, multi-tenant workloads, distributed processing.

```javascript
// Requires Flow Nexus registration (https://flow-nexus.ruv.io)
const { flowNexus } = require('flow-nexus');

// 1. Login
await flowNexus.login({ email: 'user@example.com', password: '***' });

// 2. Create sandbox
const sandbox = await flowNexus.sandboxCreate({
  template: 'node',
  name: 'agent-execution',
  env_vars: { ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY }
});

// 3. Execute agent with all 213 MCP tools
const result = await flowNexus.sandboxExecute({
  sandbox_id: sandbox.id,
  code: `
    const { query } = require('@anthropic-ai/claude-agent-sdk');
    await query({ prompt: "Analyze API security", options: { mcpServers: {...} } });
  `
});

// 4. Cleanup
await flowNexus.sandboxDelete({ sandbox_id: sandbox.id });
```

**Benefits:**
- ✅ All 213 MCP tools work
- ✅ Auto-scaling (1 to 100+ sandboxes)
- ✅ Multi-language templates (Node, Python, React, Next.js)
- ✅ Real-time streaming
- ✅ Pay-per-use (10 credits/hour ≈ $1/hour)

---

## 📊 Cost Analysis

### Monthly Costs for 100 Daily Code Reviews

| Provider | Model | Cost per Review | Monthly Total | Savings |
|----------|-------|----------------|---------------|---------|
| Anthropic | Claude Sonnet 4.5 | $0.08 | **$240** | Baseline |
| DeepSeek (OpenRouter) | deepseek-chat-v3.1 | $0.012 | **$36** | **85%** |
| Llama (OpenRouter) | llama-3.1-8b | $0.003 | **$9** | **96%** |
| Gemini (Proxy) | gemini-2.0-flash | $0.00 (free tier) | **$0** | **100%** |
| ONNX (Local) | phi-4 | $0.00 | **$0** | **100%** |

**Real Savings:**
- **$204/month** switching to DeepSeek
- **$231/month** switching to Llama 3.1
- **$240/month** using Gemini free tier or ONNX

---

## 🛠️ Configuration

### Environment Variables

```bash
# Required (choose one provider)
export ANTHROPIC_API_KEY=sk-ant-...        # For Claude models
export OPENROUTER_API_KEY=sk-or-v1-...     # For OpenRouter models
export GOOGLE_GEMINI_API_KEY=AIza...        # For Gemini models

# MCP Tools (optional)
export ENABLE_CLAUDE_FLOW_SDK=true          # Enable in-SDK MCP tools

# Proxy (optional)
export ANTHROPIC_BASE_URL=http://localhost:3000  # For proxy usage

# Model Selection (optional)
export COMPLETION_MODEL=meta-llama/llama-3.1-8b-instruct  # Override default

# Execution (optional)
export ENABLE_STREAMING=true                # Enable real-time streaming
export HEALTH_PORT=8080                     # Health check port
```

### Configuration File (.env)

```bash
# .env file (auto-loaded)
ANTHROPIC_API_KEY=sk-ant-...
OPENROUTER_API_KEY=sk-or-v1-...
GOOGLE_GEMINI_API_KEY=AIza...
ENABLE_CLAUDE_FLOW_SDK=true
COMPLETION_MODEL=deepseek/deepseek-chat-v3.1
```

---

## 📚 Complete Agent List

### Core Development (5 agents)
- `coder` - Implementation specialist
- `reviewer` - Code review and QA
- `tester` - Comprehensive testing
- `planner` - Strategic planning
- `researcher` - Research and analysis

### Specialized Development (8 agents)
- `backend-dev` - REST/GraphQL APIs
- `mobile-dev` - React Native
- `ml-developer` - Machine learning
- `system-architect` - Architecture design
- `cicd-engineer` - CI/CD pipelines
- `api-docs` - API documentation
- `production-validator` - Deployment checks
- `base-template-generator` - Boilerplate generation

### GitHub Integration (10 agents)
- `pr-manager` - PR lifecycle
- `code-review-swarm` - Multi-agent review
- `issue-tracker` - Issue management
- `release-manager` - Release coordination
- `workflow-automation` - GitHub Actions
- `repo-architect` - Repository structure
- `multi-repo-swarm` - Multi-repo coordination
- `sync-coordinator` - Cross-repo sync
- `project-board-sync` - Project boards
- `swarm-pr`, `swarm-issue` - Issue/PR swarms

### Performance & Analysis (3 agents)
- `perf-analyzer` - Bottleneck detection
- `performance-benchmarker` - Benchmarking
- `code-analyzer` - Code quality

### Swarm Coordinators (5 agents)
- `hierarchical-coordinator` - Tree structure
- `mesh-coordinator` - Peer-to-peer
- `adaptive-coordinator` - Dynamic topology
- `swarm-memory-manager` - Memory sync
- `collective-intelligence-coordinator` - Hive mind

### Consensus & Distributed (6 agents)
- `byzantine-coordinator` - Byzantine fault tolerance
- `raft-manager` - Raft consensus
- `gossip-coordinator` - Gossip protocol
- `crdt-synchronizer` - CRDT sync
- `quorum-manager` - Quorum management
- `security-manager` - Security protocols

### SPARC Methodology (6 agents)
- `sparc-coord` - SPARC orchestration
- `sparc-coder` - TDD implementation
- `specification` - Requirements analysis
- `pseudocode` - Algorithm design
- `architecture` - System design
- `refinement` - Iterative improvement

### Testing (2 agents)
- `tdd-london-swarm` - Mock-driven TDD
- `production-validator` - Deployment validation

### Planning (4 agents)
- `goal-planner` - GOAP planning
- `code-goal-planner` - Code-centric planning
- `task-orchestrator` - Task coordination
- `smart-agent` - Intelligent spawning

### Specialized (7+ agents)
- `migration-planner` - Code migration
- `swarm-init` - Topology optimization
- `memory-coordinator` - Cross-session memory
- And 20+ more...

**Total: 66+ agents** | Use `npx agentic-flow --list` to see all

---

## 🔗 Links & Resources

- **📦 NPM Package**: [npmjs.com/package/agentic-flow](https://www.npmjs.com/package/agentic-flow)
- **🐙 GitHub**: [github.com/ruvnet/agentic-flow](https://github.com/ruvnet/agentic-flow)
- **📖 Documentation**: [docs/](docs/)
- **🤖 Claude Agent SDK**: [docs.claude.com/en/api/agent-sdk](https://docs.claude.com/en/api/agent-sdk)
- **⚡ Claude Flow**: [github.com/ruvnet/claude-flow](https://github.com/ruvnet/claude-flow)
- **☁️ Flow Nexus**: [github.com/ruvnet/flow-nexus](https://github.com/ruvnet/flow-nexus)
- **🔀 OpenRouter**: [openrouter.ai](https://openrouter.ai)

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

**Deploy AI agents in seconds. Scale to thousands. Pay only for what you use.** 🚀

```bash
npx agentic-flow --agent coder --task "Your task here"
```
