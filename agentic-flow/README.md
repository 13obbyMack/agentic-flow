# 🤖 Agentic Flow

[![npm version](https://img.shields.io/npm/v/agentic-flow.svg)](https://www.npmjs.com/package/agentic-flow)
[![npm downloads](https://img.shields.io/npm/dm/agentic-flow.svg)](https://www.npmjs.com/package/agentic-flow)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![rUv](https://img.shields.io/badge/by-rUv-purple.svg)](https://github.com/ruvnet/)

**Production-ready AI agent orchestration with 66+ specialized agents, 216 MCP tools, Agent Booster (152x faster edits), and multi-model routing (Anthropic, OpenRouter, Gemini, ONNX).**

---

## 📖 Introduction

I built Agentic Flow to easily switch between alternative low-cost AI models in Claude Code/Agent SDK. For those comfortable using Claude agents and commands, it lets you take what you've created and deploy fully hosted agents for real business purposes. Use Claude Code to get the agent working, then deploy it in your favorite cloud.

Agentic Flow runs Claude Code agents at near zero cost without rewriting a thing. The built-in model optimizer automatically routes every task to the cheapest option that meets your quality requirements—free local models for privacy, OpenRouter for 99% cost savings, Gemini for speed, or Anthropic when quality matters most. It analyzes each task and selects the optimal model from 27+ options with a single flag, reducing API costs dramatically compared to using Claude exclusively.

The system spawns specialized agents on demand through Claude Code's Task tool and MCP coordination. It orchestrates swarms of 66+ pre-built agents (researchers, coders, reviewers, testers, architects) that work in parallel, coordinate through shared memory, and auto-scale based on workload. Transparent OpenRouter and Gemini proxies translate Anthropic API calls automatically—no code changes needed. Local models run direct without proxies for maximum privacy. Switch providers with environment variables, not refactoring.

Extending agent capabilities is effortless. Add custom tools and integrations through the CLI—weather data, databases, search engines, or any external service—without touching config files. Your agents instantly gain new abilities across all projects. Every tool you add becomes available to the entire agent ecosystem automatically, and all operations are logged with full traceability for auditing, debugging, and compliance. This means your agents can connect to proprietary systems, third-party APIs, or internal tools in seconds, not hours.

Define routing rules through flexible policy modes: Strict mode keeps sensitive data offline, Economy mode prefers free models (99% savings), Premium mode uses Anthropic for highest quality, or create custom cost/quality thresholds. The policy defines the rules; the swarm enforces them automatically. Runs local for development, Docker for CI/CD, or Flow Nexus cloud for production scale. Agentic Flow is the framework for autonomous efficiency—one unified runner for every Claude Code agent, self-tuning, self-routing, and built for real-world deployment.

**Key Capabilities:**
- ✅ **ReasoningBank** - Memory system that learns from experience (0% → 100% success, 46% faster)
- ✅ **Claude Code Mode** - Run Claude Code with OpenRouter/Gemini/ONNX (85-99% savings)
- ✅ **Agent Booster** - Local code editing: 85ms vs 13s (152x faster), $0 cost, runs offline
- ✅ **66 Specialized Agents** - Pre-built experts for coding, research, review, testing, DevOps
- ✅ **216 MCP Tools** - Agent Booster (3), Memory, GitHub, neural networks, sandboxes, workflows, payments
- ✅ **Multi-Model Router** - Anthropic, OpenRouter (300+ models), Gemini, ONNX (free local)
- ✅ **Cost Optimization** - DeepSeek at $0.14/M tokens vs Claude at $15/M (99% savings)

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

# Run with  (300+ models, 95% cost savings)
export REQUESTY_API_KEY=sk-...
npx agentic-flow --agent coder --task "Build REST API" --provider requesty

# Run with Gemini (free tier)
export GOOGLE_GEMINI_API_KEY=AIza...
npx agentic-flow --agent coder --task "Build REST API" --provider gemini

# Enable real-time streaming output
npx agentic-flow --agent coder --task "Build REST API" --stream

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

### Option 2: Agent Booster (Fast Code Edits)

For mechanical code changes, use Agent Booster to avoid LLM API calls entirely:

```bash
# Install Agent Booster
npm install -g agent-booster

# Apply code edit (JSON stdin)
echo '{"code":"function add(a,b){return a+b;}","edit":"function add(a,b){if(typeof a!=='\''number'\'')throw new Error();return a+b;}"}' | agent-booster apply --language javascript

# Output: Modified code in 85ms (vs 13s with LLM)
# Cost: $0.00 (vs ~$0.001 with API)
```

**Use Agent Booster MCP tools in Claude Desktop:**

The 3 Agent Booster tools are included in the agentic-flow MCP server:
- `agent_booster_edit_file` - Apply precise code edits to files
- `agent_booster_batch_edit` - Edit multiple files in one operation
- `agent_booster_parse_markdown` - Extract code from AI responses

When confidence is low (<70%), tools automatically suggest LLM fallback. [Learn more](https://github.com/ruvnet/agentic-flow/tree/main/agent-booster)

---

### Option 3: ReasoningBank (Learning Memory System)

**Give your agents a memory that learns from experience:**

```bash
# See demo: Traditional 0% → ReasoningBank 100% success
npx agentic-flow reasoningbank demo

# Initialize memory database
npx agentic-flow reasoningbank init

# Run validation tests (27 tests)
npx agentic-flow reasoningbank test

# Check memory statistics
npx agentic-flow reasoningbank status
```

**What ReasoningBank Does:**
- 📚 Remembers successful strategies from past tasks
- 🧠 Learns from both successes and failures
- ⚡ Improves performance over time (46% faster)
- 🎯 Applies knowledge across similar tasks automatically
- 🔄 Zero manual intervention needed

**Results:**
- Traditional approach: 0% success rate, repeats mistakes
- With ReasoningBank: 100% success after learning, 46% faster execution

[Learn more about ReasoningBank →](src/reasoningbank/README.md)

---

### Option 4: MCP Tools (Direct Access)

Access 216 MCP tools for memory, swarms, GitHub, neural networks, and cloud sandboxes:

```bash
# Start all MCP servers (216 tools) - stdio transport
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

### Option 5: Claude Code Mode with Agent Booster (v1.3.1+)

**Run Claude Code with alternative AI providers + 152x faster code edits!**

Automatically spawns Claude Code with proxy configuration and Agent Booster MCP tools:

```bash
# With Agent Booster (152x faster code edits, $0 cost)
npx agentic-flow claude-code --provider openrouter --agent-booster
npx agentic-flow claude-code --provider gemini --agent-booster

# Interactive mode - Opens Claude Code UI with proxy
npx agentic-flow claude-code --provider openrouter
npx agentic-flow claude-code --provider requesty
npx agentic-flow claude-code --provider gemini

# Non-interactive mode - Execute task and exit
npx agentic-flow claude-code --provider openrouter "Write a Python hello world function"
npx agentic-flow claude-code --provider requesty "Write a Python hello world function"
npx agentic-flow claude-code --provider openrouter --model "deepseek/deepseek-chat" "Create REST API"

# Use specific models
npx agentic-flow claude-code --provider openrouter --model "mistralai/mistral-small"
npx agentic-flow claude-code --provider requesty --model "openai/gpt-4o-mini"
npx agentic-flow claude-code --provider gemini --model "gemini-2.0-flash-exp"

# Local ONNX models (100% free, privacy-focused)
npx agentic-flow claude-code --provider onnx "Analyze this codebase"
```

**Recommended Models:**

| Provider | Model | Cost/M Tokens | Context | Best For |
|----------|-------|---------------|---------|----------|
| OpenRouter | `deepseek/deepseek-chat` (default) | $0.14 | 128k | General tasks, best value |
|  | `deepseek/deepseek-chat` | $0.14 | 128k | 300+ models, unified API |
|  | `openai/gpt-4o-mini` | $0.15 | 128k | OpenAI models via  |
| OpenRouter | `anthropic/claude-3.5-sonnet` | $3.00 | 200k | Highest quality, complex reasoning |
| OpenRouter | `google/gemini-2.0-flash-exp:free` | FREE | 1M | Development, testing (rate limited) |
| Gemini | `gemini-2.0-flash-exp` | FREE | 1M | Fast responses, rate limited |
| ONNX | `phi-4-mini-instruct` | FREE | 128k | Privacy, offline, no API needed |

⚠️ **Note:** Claude Code sends 35k+ tokens in tool definitions. Models with <128k context (like Mistral Small at 32k) will fail with "context length exceeded" errors.

**Agent Booster - Local Code Editing:**

Instead of sending every code edit through expensive LLM APIs, Agent Booster handles mechanical code changes locally using pattern matching and AST analysis. This delivers substantial performance and cost benefits for routine edits:

| Metric | Standard LLM | Agent Booster | Benefit |
|--------|-------------|---------------|---------|
| **Speed** | 13 seconds | 85ms | 152x faster response |
| **Cost** | ~$0.001 per edit | $0.00 | No API charges |
| **Privacy** | Cloud API call | Local execution | Code stays local |

Works well for type annotations, error handling, var→const conversions, and async/await transformations. For complex reasoning or structural refactors, Agent Booster automatically suggests LLM fallback. Runs entirely in-process using Rust/WASM—no external dependencies. Enabled by default, disable with `--no-agent-booster`.

**How it works:**
1. ✅ Auto-starts proxy server in background (OpenRouter/Gemini/ONNX)
2. ✅ Sets `ANTHROPIC_BASE_URL` to proxy endpoint
3. ✅ Configures provider-specific API keys transparently
4. ✅ Loads Agent Booster MCP tools (3 tools for ultra-fast edits)
5. ✅ Spawns Claude Code with environment configured
6. ✅ All Claude SDK features work (tools, memory, MCP, etc.)
7. ✅ Automatic cleanup on exit

**Environment Setup:**

```bash
# OpenRouter (100+ models at 85-99% savings)
export OPENROUTER_API_KEY=sk-or-v1-...

#  (300+ models, unified access)
export REQUESTY_API_KEY=sk-...

# Gemini (FREE tier available)
export GOOGLE_GEMINI_API_KEY=AIza...

# ONNX (local models, no API key needed)
# export ONNX_MODEL_PATH=/path/to/models  # Optional
```

**Full Help:**

```bash
npx agentic-flow claude-code --help
```

**Alternative: Manual Proxy (v1.1.11)**

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
- ✅ MCP tools work through proxy (all 216 tools)
- ✅ Compatible with Claude Code official CLI
- ✅ Context-aware instruction injection (v1.1.13)
- ✅ Model-specific max_tokens optimization
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

# Enable real-time streaming output (see responses token-by-token)
npx agentic-flow --agent coder --task "Build a web scraper" --stream
```

**Technical Details:**
- Uses Claude Agent SDK's `query()` function
- Automatically loads agent's system prompt from `.claude/agents/`
- All 213 MCP tools available via `mcpServers` configuration
- **Streams output in real-time with `--stream` flag** - see responses token-by-token as they're generated

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
# Start all 216 tools (4 servers)
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

### Add Custom MCP Servers (No Code Required) ✨ NEW in v1.2.1

Add your own MCP servers via CLI without editing code—extends agent capabilities in seconds:

```bash
# Add MCP server (Claude Desktop style JSON config)
npx agentic-flow mcp add weather '{"command":"npx","args":["-y","weather-mcp"],"env":{"API_KEY":"xxx"}}'

# Add MCP server (flag-based)
npx agentic-flow mcp add github --npm @modelcontextprotocol/server-github --env "GITHUB_TOKEN=ghp_xxx"

# Add local MCP server
npx agentic-flow mcp add my-tools --local /path/to/server.js

# List configured servers
npx agentic-flow mcp list

# Enable/disable servers
npx agentic-flow mcp enable weather
npx agentic-flow mcp disable weather

# Remove server
npx agentic-flow mcp remove weather

# Test server configuration
npx agentic-flow mcp test weather

# Export/import configurations
npx agentic-flow mcp export ./mcp-backup.json
npx agentic-flow mcp import ./mcp-backup.json
```

**Configuration stored in:** `~/.agentic-flow/mcp-config.json`

**Usage:** Once configured, all enabled MCP servers automatically load in agents. No need to specify which server to use - tools are available by name (e.g., `mcp__weather__get_forecast`).

**Example:** After adding weather MCP:
```bash
npx agentic-flow --agent researcher --task "Get weather forecast for Tokyo"
```

**Popular MCP Servers:**
- `@modelcontextprotocol/server-filesystem` - File system access
- `@modelcontextprotocol/server-github` - GitHub operations
- `@modelcontextprotocol/server-brave-search` - Web search
- `weather-mcp` - Weather data
- `database-mcp` - Database operations

**v1.2.1 Improvements:**
- ✅ CLI routing fixed - `mcp add/list/remove` commands now work correctly
- ✅ Model optimizer filters models without tool support automatically
- ✅ Full compatibility with Claude Desktop config format
- ✅ Test command for validating server configurations
- ✅ Export/import for backing up and sharing configurations

**Documentation:** See [docs/guides/ADDING-MCP-SERVERS-CLI.md](docs/guides/ADDING-MCP-SERVERS-CLI.md) for complete guide.

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

## 📚 Tutorial: Claude Code Integration

### What is Claude Code Integration?

**One command to use Claude Code with any provider** - OpenRouter, Gemini, ONNX, or Anthropic.

No need to manually:
- Start proxy servers
- Export environment variables
- Configure base URLs
- Manage API keys

Just run `npx agentic-flow claude-code --provider <name> "your task"` and everything is handled automatically.

### Quick Examples

```bash
# OpenRouter - 99% cost savings, wide model selection
npx agentic-flow claude-code --provider openrouter \
  "Write a Python function to parse JSON"

# Gemini - FREE tier available, fast responses
npx agentic-flow claude-code --provider gemini \
  "Create a simple REST API with Flask"

# Anthropic - Direct API, highest quality
npx agentic-flow claude-code --provider anthropic \
  "Help me implement OAuth2 authentication"

# ONNX - 100% offline, no API costs
npx agentic-flow claude-code --provider onnx \
  "Write a sorting algorithm"
```

### How It Works

**Behind the scenes:**

1. **Checks if proxy is running** on port 3000 (or custom `--port`)
2. **Auto-starts proxy** if needed (OpenRouter/Gemini/ONNX)
3. **Sets environment variables:**
   ```bash
   ANTHROPIC_BASE_URL=http://localhost:3000
   ANTHROPIC_API_KEY=sk-ant-proxy-dummy
   OPENROUTER_API_KEY=<your-key>  # Or GOOGLE_GEMINI_API_KEY
   ```
4. **Spawns Claude Code** with configured environment
5. **Cleans up proxy** on exit (unless `--keep-proxy`)

### Advanced Options

```bash
# Use specific model
npx agentic-flow claude-code \
  --provider openrouter \
  --model "meta-llama/llama-3.3-70b-instruct" \
  "Write complex code"

# Custom proxy port
npx agentic-flow claude-code \
  --provider gemini \
  --port 8080 \
  "Generate code"

# Keep proxy running for multiple sessions
npx agentic-flow claude-code \
  --provider openrouter \
  --keep-proxy \
  "First task"

# Reuse running proxy (no auto-start)
npx agentic-flow claude-code \
  --provider openrouter \
  --no-auto-start \
  "Second task"
```

### Alternative: Bash Wrapper Script

For frequent use, copy the wrapper script to your PATH:

```bash
# Install wrapper
cp node_modules/agentic-flow/scripts/claude-code ~/bin/
chmod +x ~/bin/claude-code

# Usage - cleaner syntax
claude-code openrouter "Write a function"
claude-code gemini "Create an API"
claude-code anthropic "Debug my code"
```

### Validation

Test that all providers work correctly:

```bash
# Test OpenRouter
npx agentic-flow claude-code --provider openrouter \
  "print hello world in python"

# Test Gemini
npx agentic-flow claude-code --provider gemini \
  "print hello world in python"

# Test Anthropic
npx agentic-flow claude-code --provider anthropic \
  "print hello world in python"
```

**Expected output:** Clean Python code with no XML tags:
```python
print("Hello, World!")
```

### Cost Comparison

| Provider | Cost/Task | Speed | Quality | Free Tier |
|----------|-----------|-------|---------|-----------|
| Anthropic (direct) | $0.015 | Fast | Excellent | No |
| OpenRouter GPT-4o-mini | $0.0001 | Very Fast | Excellent | No |
| Gemini 2.0 Flash | $0.00 | Fastest | Excellent | **Yes** |
| ONNX (local) | $0.00 | Moderate | Good | **Yes** |

**Savings:** 99% with OpenRouter, 100% with Gemini/ONNX

### Troubleshooting

**Proxy won't start:**
```bash
# Check if port is in use
lsof -i :3000

# Use custom port
npx agentic-flow claude-code --provider openrouter --port 3001 "task"
```

**API key not found:**
```bash
# Set key before running
export OPENROUTER_API_KEY=sk-or-v1-xxxxx

# Or inline
OPENROUTER_API_KEY=sk-or-v1-xxxxx \
npx agentic-flow claude-code --provider openrouter "task"
```

**Claude Code not installed:**
```bash
# Install official Claude Code CLI
npm install -g @anthropic-ai/claude-code

# Verify installation
claude --version
```

### Full Guide

See [docs/guides/CLAUDE-CODE-INTEGRATION.md](docs/guides/CLAUDE-CODE-INTEGRATION.md) for:
- Architecture diagrams
- Request flow details
- Custom proxy configuration
- Environment variable presets
- Advanced usage patterns

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
REQUESTY_API_KEY=sk-...
GOOGLE_GEMINI_API_KEY=AIza...
ENABLE_CLAUDE_FLOW_SDK=true
COMPLETION_MODEL=deepseek/deepseek-chat-v3.1
```

** Configuration (v1.3.1+)** ⚠️

.ai provides unified access to 300+ AI models including OpenAI (GPT-4o, GPT-4o-mini), Anthropic, DeepSeek, Meta, Mistral, and more through a single API key.

⚠️ **Current Status**:  provider has integration challenges with Claude SDK agent initialization. **We recommend using OpenRouter instead** for agent-based tasks.

**What Works:**
- ✅ Simple API calls without agents
- ✅ Basic arithmetic and simple tasks
- ✅ Direct API integration via curl/fetch

**Known Limitations:**
- ❌ Hangs during Claude SDK agent initialization with MCP tools
- ❌ Cannot handle full agent execution (coder, reviewer, etc.)
- ⚠️ Tool limit reduced to 10 maximum (vs 213 available)

**Recommended Alternative:**
Use **OpenRouter** for identical cost savings and full agent support:
```bash
# OpenRouter works perfectly with all agents and tools
export OPENROUTER_API_KEY=sk-or-v1-...
npx agentic-flow --agent coder --task "your task" --provider openrouter
npx agentic-flow --agent coder --task "your task" --model "deepseek/deepseek-chat"
```

**If you still want to try :**
```bash
# Get your API key from https://requesty.ai
export REQUESTY_API_KEY=sk-...

# Simple tasks only (no agent mode recommended)
# Use OpenRouter for agent-based work instead
```

**Technical Details:**
- Schema sanitization for array properties
- 60-second timeout protection
- Tool limiting (10 max) to prevent overload
- OpenAI-compatible API format
- Automatic max_tokens optimization (capped at 8192)

**Supported Models (when working):**
- `deepseek/deepseek-chat` - $0.14/M tokens, 128k context
- `openai/gpt-4o-mini` - $0.15/M tokens, 128k context
- 300+ other models available

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
