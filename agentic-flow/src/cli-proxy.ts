#!/usr/bin/env node
/**
 * Agentic Flow - Standalone CLI with integrated OpenRouter proxy
 * Usage: npx agentic-flow-proxy --agent coder --task "Create code" --openrouter
 */

import "dotenv/config";
import { AnthropicToOpenRouterProxy } from "./proxy/anthropic-to-openrouter.js";
import { logger } from "./utils/logger.js";
import { parseArgs } from "./utils/cli.js";
import { getAgent, listAgents } from "./utils/agentLoader.js";
import { claudeAgent } from "./agents/claudeAgent.js";
import { directApiAgent } from "./agents/directApiAgent.js";
import { handleMCPCommand } from "./utils/mcpCommands.js";
import { handleConfigCommand } from "./cli/config-wizard.js";
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(readFileSync(resolve(__dirname, '../package.json'), 'utf-8'));
const VERSION = packageJson.version;

class AgenticFlowCLI {
  private proxyServer: any = null;
  private proxyPort: number = 3000;

  async start() {
    const options = parseArgs();

    if (options.help) {
      this.printHelp();
      process.exit(0);
    }

    if (options.mode === 'list') {
      this.listAgents();
      process.exit(0);
    }

    if (options.mode === 'config') {
      // Handle config wizard
      const configArgs = process.argv.slice(3); // Skip 'node', 'cli-proxy.js', 'config'
      await handleConfigCommand(configArgs);
      process.exit(0);
    }

    if (options.mode === 'mcp') {
      // Run standalone MCP server directly
      const { spawn } = await import('child_process');
      const { resolve, dirname } = await import('path');
      const { fileURLToPath } = await import('url');

      const __filename = fileURLToPath(import.meta.url);
      const __dirname = dirname(__filename);
      const serverPath = resolve(__dirname, './mcp/standalone-stdio.js');

      const proc = spawn('node', [serverPath], {
        stdio: 'inherit'
      });

      proc.on('exit', (code) => {
        process.exit(code || 0);
      });

      // Handle termination signals
      process.on('SIGINT', () => proc.kill('SIGINT'));
      process.on('SIGTERM', () => proc.kill('SIGTERM'));
      return;
    }

    // Determine if we should use OpenRouter
    const useOpenRouter = this.shouldUseOpenRouter(options);

    try {
      // Start proxy if needed
      if (useOpenRouter) {
        await this.startProxy();
      }

      // Run agent
      await this.runAgent(options, useOpenRouter);

      logger.info('Execution completed successfully');
      process.exit(0);
    } catch (err: unknown) {
      logger.error('Execution failed', { error: err });
      console.error(err);
      process.exit(1);
    }
  }

  private shouldUseOpenRouter(options: any): boolean {
    // Don't use OpenRouter if ONNX is explicitly requested
    if (options.provider === 'onnx' || process.env.USE_ONNX === 'true' || process.env.PROVIDER === 'onnx') {
      return false;
    }

    // Use OpenRouter if:
    // 1. Provider is explicitly set to openrouter
    // 2. Model parameter contains "/" (e.g., "meta-llama/llama-3.1-8b-instruct")
    // 3. USE_OPENROUTER env var is set
    // 4. OPENROUTER_API_KEY is set and ANTHROPIC_API_KEY is not
    if (options.provider === 'openrouter' || process.env.PROVIDER === 'openrouter') {
      return true;
    }

    if (options.model?.includes('/')) {
      return true;
    }

    if (process.env.USE_OPENROUTER === 'true') {
      return true;
    }

    if (process.env.OPENROUTER_API_KEY && !process.env.ANTHROPIC_API_KEY) {
      return true;
    }

    return false;
  }

  private async startProxy(): Promise<void> {
    const openrouterKey = process.env.OPENROUTER_API_KEY;

    if (!openrouterKey) {
      console.error('❌ Error: OPENROUTER_API_KEY required for OpenRouter models');
      console.error('Set it in .env or export OPENROUTER_API_KEY=sk-or-v1-xxxxx');
      process.exit(1);
    }

    logger.info('Starting integrated OpenRouter proxy');

    const defaultModel = process.env.COMPLETION_MODEL ||
                        process.env.REASONING_MODEL ||
                        'meta-llama/llama-3.1-8b-instruct';

    const proxy = new AnthropicToOpenRouterProxy({
      openrouterApiKey: openrouterKey,
      openrouterBaseUrl: process.env.ANTHROPIC_PROXY_BASE_URL,
      defaultModel
    });

    // Start proxy in background
    proxy.start(this.proxyPort);
    this.proxyServer = proxy;

    // Set ANTHROPIC_BASE_URL to proxy
    process.env.ANTHROPIC_BASE_URL = `http://localhost:${this.proxyPort}`;

    console.log(`🔗 Proxy Mode: OpenRouter`);
    console.log(`🔧 Proxy URL: http://localhost:${this.proxyPort}`);
    console.log(`🤖 Default Model: ${defaultModel}\n`);

    // Wait for proxy to be ready
    await new Promise(resolve => setTimeout(resolve, 1500));
  }

  private async runAgent(options: any, useOpenRouter: boolean): Promise<void> {
    const agentName = options.agent || process.env.AGENT || '';
    const task = options.task || process.env.TASK || '';

    if (!agentName) {
      console.error('❌ Error: --agent required');
      this.printHelp();
      process.exit(1);
    }

    if (!task) {
      console.error('❌ Error: --task required');
      this.printHelp();
      process.exit(1);
    }

    // Check for API key (unless using ONNX)
    const isOnnx = options.provider === 'onnx' || process.env.USE_ONNX === 'true' || process.env.PROVIDER === 'onnx';
    if (!isOnnx && !useOpenRouter && !process.env.ANTHROPIC_API_KEY) {
      console.error('\n❌ Error: ANTHROPIC_API_KEY is required\n');
      console.error('Please set your API key:');
      console.error('  export ANTHROPIC_API_KEY=sk-ant-xxxxx\n');
      console.error('Or use alternative providers:');
      console.error('  --provider openrouter  (requires OPENROUTER_API_KEY)');
      console.error('  --provider onnx        (free local inference)\n');
      process.exit(1);
    }

    if (!isOnnx && useOpenRouter && !process.env.OPENROUTER_API_KEY) {
      console.error('\n❌ Error: OPENROUTER_API_KEY is required for OpenRouter\n');
      console.error('Please set your API key:');
      console.error('  export OPENROUTER_API_KEY=sk-or-v1-xxxxx\n');
      console.error('Or use alternative providers:');
      console.error('  --provider anthropic  (requires ANTHROPIC_API_KEY)');
      console.error('  --provider onnx       (free local inference)\n');
      process.exit(1);
    }

    const agent = getAgent(agentName);
    if (!agent) {
      const available = listAgents();
      console.error(`\n❌ Agent '${agentName}' not found.\n`);
      console.error('Available agents:');
      available.slice(0, 20).forEach(a => {
        console.error(`  • ${a.name}: ${a.description.substring(0, 80)}...`);
      });
      if (available.length > 20) {
        console.error(`  ... and ${available.length - 20} more (use --list to see all)`);
      }
      process.exit(1);
    }

    console.log(`\n🤖 Agent: ${agent.name}`);
    console.log(`📝 Description: ${agent.description}\n`);
    console.log(`🎯 Task: ${task}\n`);

    if (useOpenRouter) {
      const model = options.model || process.env.COMPLETION_MODEL || 'meta-llama/llama-3.1-8b-instruct';
      console.log(`🔧 Provider: OpenRouter (via proxy)`);
      console.log(`🔧 Model: ${model}\n`);
    } else if (options.provider === 'onnx' || process.env.USE_ONNX === 'true' || process.env.PROVIDER === 'onnx') {
      console.log(`🔧 Provider: ONNX Local (Phi-4-mini)`);
      console.log(`💾 Free local inference - no API costs`);
      if (process.env.ONNX_OPTIMIZED === 'true') {
        console.log(`⚡ Optimizations: Context pruning, prompt optimization`);
      }
      console.log('');
    }

    console.log('⏳ Running...\n');

    const streamHandler = options.stream ? (chunk: string) => process.stdout.write(chunk) : undefined;

    // Use directApiAgent (works without Claude Code installed) instead of claudeAgent (requires Claude Code)
    const result = await directApiAgent(agent, task, streamHandler);

    if (!options.stream) {
      console.log('\n✅ Completed!\n');
      console.log('═══════════════════════════════════════\n');
      console.log(result.output);
      console.log('\n═══════════════════════════════════════\n');
    }

    logger.info('Agent completed', {
      agent: agentName,
      outputLength: result.output.length,
      provider: useOpenRouter ? 'openrouter' : 'anthropic'
    });
  }

  private listAgents(): void {
    const agents = listAgents();
    console.log(`\n📦 Available Agents (${agents.length} total)\n`);

    const grouped = new Map<string, typeof agents>();
    agents.forEach(agent => {
      const parts = agent.filePath.split('/');
      const category = parts[parts.length - 2] || 'other';
      if (!grouped.has(category)) {
        grouped.set(category, []);
      }
      grouped.get(category)!.push(agent);
    });

    Array.from(grouped.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([category, categoryAgents]) => {
        console.log(`\n${category.toUpperCase()}:`);
        categoryAgents.forEach(agent => {
          console.log(`  ${agent.name.padEnd(30)} ${agent.description.substring(0, 80)}`);
        });
      });

    console.log(`\nUsage:`);
    console.log(`  npx agentic-flow --agent <name> --task "Your task"\n`);
  }

  private printHelp(): void {
    console.log(`
🤖 Agentic Flow v${VERSION} - AI Agent Orchestration with OpenRouter Support

USAGE:
  npx agentic-flow [COMMAND] [OPTIONS]

COMMANDS:
  config [subcommand]     Manage environment configuration (interactive wizard)
  mcp <command> [server]  Manage MCP servers (start, stop, status, list)
  --list, -l              List all available agents
  --agent, -a <name>      Run specific agent mode

CONFIG COMMANDS:
  npx agentic-flow config              # Interactive wizard
  npx agentic-flow config set KEY VAL  # Set configuration value
  npx agentic-flow config get KEY      # Get configuration value
  npx agentic-flow config list         # List all configuration
  npx agentic-flow config delete KEY   # Delete configuration value
  npx agentic-flow config reset        # Reset to defaults

MCP COMMANDS:
  npx agentic-flow mcp start [server]    Start MCP server(s)
  npx agentic-flow mcp stop [server]     Stop MCP server(s)
  npx agentic-flow mcp status [server]   Check MCP server status
  npx agentic-flow mcp list              List all available MCP tools

  Available servers: claude-flow, flow-nexus, agentic-payments, all (default)

OPTIONS:
  --task, -t <task>       Task description for agent mode
  --model, -m <model>     Model to use (triggers OpenRouter if contains "/")
  --provider, -p <name>   Provider to use (anthropic, openrouter, onnx)
  --stream, -s            Enable real-time streaming output
  --help, -h              Show this help message

EXAMPLES:
  # MCP Server Management
  npx agentic-flow mcp start              # Start all MCP servers
  npx agentic-flow mcp start claude-flow  # Start specific server
  npx agentic-flow mcp list               # List all 203+ MCP tools
  npx agentic-flow mcp status             # Check server status

  # Agent Execution
  npx agentic-flow --list                 # List all 150+ agents
  npx agentic-flow --agent coder --task "Create Python hello world"
  npx agentic-flow --agent coder --task "Create REST API" --model "meta-llama/llama-3.1-8b-instruct"
  npx agentic-flow --agent coder --task "Create code" --provider onnx

ENVIRONMENT VARIABLES:
  ANTHROPIC_API_KEY       Anthropic API key (for Claude models)
  OPENROUTER_API_KEY      OpenRouter API key (for alternative models)
  USE_OPENROUTER          Set to 'true' to force OpenRouter usage
  COMPLETION_MODEL        Default model for OpenRouter
  AGENTS_DIR              Path to agents directory
  PROXY_PORT              Proxy server port (default: 3000)

OPENROUTER MODELS:
  - meta-llama/llama-3.1-8b-instruct (99% cost savings)
  - deepseek/deepseek-chat-v3.1 (excellent for code)
  - google/gemini-2.5-flash-preview (fastest)
  - See https://openrouter.ai/models for full list

MCP TOOLS (203+ available):
  • claude-flow-sdk: 6 in-process tools (memory, swarm coordination)
  • claude-flow: 101 tools (neural networks, GitHub, workflows, DAA)
  • flow-nexus: 96 cloud tools (sandboxes, distributed swarms, templates)
  • agentic-payments: Payment authorization and multi-agent consensus

For more information: https://github.com/ruvnet/agentic-flow
    `);
  }
}

// Run CLI
const cli = new AgenticFlowCLI();
cli.start();
