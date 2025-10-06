#!/usr/bin/env node
/**
 * Agentic Flow - Standalone CLI with integrated OpenRouter proxy
 * Usage: npx agentic-flow-proxy --agent coder --task "Create code" --openrouter
 */

import dotenv from "dotenv";
import { existsSync, readFileSync } from 'fs';
import { resolve as pathResolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Load .env from current directory, or search up the directory tree
function loadEnvRecursive(startPath: string = process.cwd()): boolean {
  let currentPath = startPath;
  const root = pathResolve('/');

  while (currentPath !== root) {
    const envPath = pathResolve(currentPath, '.env');
    if (existsSync(envPath)) {
      dotenv.config({ path: envPath });
      return true;
    }
    currentPath = pathResolve(currentPath, '..');
  }

  // Fallback to default behavior
  dotenv.config();
  return false;
}

loadEnvRecursive();
import { AnthropicToOpenRouterProxy } from "./proxy/anthropic-to-openrouter.js";
import { logger } from "./utils/logger.js";
import { parseArgs } from "./utils/cli.js";
import { getAgent, listAgents } from "./utils/agentLoader.js";
import { claudeAgent } from "./agents/claudeAgent.js";
import { handleMCPCommand } from "./utils/mcpCommands.js";
import { handleConfigCommand } from "./cli/config-wizard.js";
import { handleAgentCommand } from "./cli/agent-manager.js";
import { ModelOptimizer } from "./utils/modelOptimizer.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(readFileSync(pathResolve(__dirname, '../package.json'), 'utf-8'));
const VERSION = packageJson.version;

class AgenticFlowCLI {
  private proxyServer: any = null;
  private proxyPort: number = 3000;

  async start() {
    const options = parseArgs();

    if (options.version) {
      console.log(`agentic-flow v${VERSION}`);
      process.exit(0);
    }

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

    if (options.mode === 'agent-manager') {
      // Handle agent management commands
      const agentArgs = process.argv.slice(3); // Skip 'node', 'cli-proxy.js', 'agent'
      await handleAgentCommand(agentArgs);
      process.exit(0);
    }

    if (options.mode === 'mcp-manager') {
      // Handle MCP manager commands (add, list, remove, etc.)
      const { spawn } = await import('child_process');
      const { resolve, dirname } = await import('path');
      const { fileURLToPath } = await import('url');

      const __filename = fileURLToPath(import.meta.url);
      const __dirname = dirname(__filename);
      const mcpManagerPath = resolve(__dirname, './cli/mcp-manager.js');

      // Pass all args after 'mcp' to mcp-manager
      const mcpArgs = process.argv.slice(3); // Skip 'node', 'cli-proxy.js', 'mcp'

      const proc = spawn('node', [mcpManagerPath, ...mcpArgs], {
        stdio: 'inherit'
      });

      proc.on('exit', (code) => {
        process.exit(code || 0);
      });

      process.on('SIGINT', () => proc.kill('SIGINT'));
      process.on('SIGTERM', () => proc.kill('SIGTERM'));
      return;
    }

    if (options.mode === 'proxy') {
      // Run standalone proxy server for Claude Code/Cursor
      await this.runStandaloneProxy();
      return;
    }

    if (options.mode === 'claude-code') {
      // Spawn Claude Code with auto-configured proxy
      const { spawn } = await import('child_process');
      const claudeCodePath = pathResolve(__dirname, './cli/claude-code-wrapper.js');

      const proc = spawn('node', [claudeCodePath, ...process.argv.slice(3)], {
        stdio: 'inherit',
        env: process.env as NodeJS.ProcessEnv
      });

      proc.on('exit', (code) => {
        process.exit(code || 0);
      });

      process.on('SIGINT', () => proc.kill('SIGINT'));
      process.on('SIGTERM', () => proc.kill('SIGTERM'));
      return;
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

    // Apply model optimization if requested
    if (options.optimize && options.agent && options.task) {
      const recommendation = ModelOptimizer.optimize({
        agent: options.agent,
        task: options.task,
        priority: options.optimizePriority || 'balanced',
        maxCostPerTask: options.maxCost,
        requiresTools: true // Agents have MCP tools available, so require tool support
      });

      // Display recommendation
      ModelOptimizer.displayRecommendation(recommendation);

      // Apply recommendation to options
      if (!options.provider || options.optimize) {
        options.provider = recommendation.provider;
      }
      if (!options.model || options.optimize) {
        options.model = recommendation.model;
      }

      console.log(`✅ Using optimized model: ${recommendation.modelName}\n`);
    }

    // Determine which provider to use
    const useONNX = this.shouldUseONNX(options);
    const useOpenRouter = this.shouldUseOpenRouter(options);
    const useGemini = this.shouldUseGemini(options);

    // Debug output for provider selection
    if (options.verbose || process.env.VERBOSE === 'true') {
      console.log('\n🔍 Provider Selection Debug:');
      console.log(`  Provider flag: ${options.provider || 'not set'}`);
      console.log(`  Model: ${options.model || 'default'}`);
      console.log(`  Use ONNX: ${useONNX}`);
      console.log(`  Use OpenRouter: ${useOpenRouter}`);
      console.log(`  Use Gemini: ${useGemini}`);
      console.log(`  OPENROUTER_API_KEY: ${process.env.OPENROUTER_API_KEY ? '✓ set' : '✗ not set'}`);
      console.log(`  GOOGLE_GEMINI_API_KEY: ${process.env.GOOGLE_GEMINI_API_KEY ? '✓ set' : '✗ not set'}`);
      console.log(`  ANTHROPIC_API_KEY: ${process.env.ANTHROPIC_API_KEY ? '✓ set' : '✗ not set'}\n`);
    }

    try {
      // Start proxy if needed (ONNX, OpenRouter, or Gemini)
      if (useONNX) {
        console.log('🚀 Initializing ONNX local inference proxy...');
        await this.startONNXProxy(options.model);
      } else if (useOpenRouter) {
        console.log('🚀 Initializing OpenRouter proxy...');
        await this.startOpenRouterProxy(options.model);
      } else if (useGemini) {
        console.log('🚀 Initializing Gemini proxy...');
        await this.startGeminiProxy(options.model);
      } else {
        console.log('🚀 Using direct Anthropic API...\n');
      }

      // Run agent
      await this.runAgent(options, useOpenRouter, useGemini, useONNX);

      logger.info('Execution completed successfully');
      process.exit(0);
    } catch (err: unknown) {
      logger.error('Execution failed', { error: err });
      console.error(err);
      process.exit(1);
    }
  }

  private shouldUseONNX(options: any): boolean {
    // Use ONNX if:
    // 1. Provider is explicitly set to onnx
    // 2. PROVIDER env var is set to onnx
    // 3. USE_ONNX env var is set
    if (options.provider === 'onnx' || process.env.PROVIDER === 'onnx') {
      return true;
    }

    if (process.env.USE_ONNX === 'true') {
      return true;
    }

    return false;
  }

  private shouldUseGemini(options: any): boolean {
    // Use Gemini if:
    // 1. Provider is explicitly set to gemini
    // 2. PROVIDER env var is set to gemini
    // 3. USE_GEMINI env var is set
    // 4. GOOGLE_GEMINI_API_KEY is set and no other provider is specified
    if (options.provider === 'gemini' || process.env.PROVIDER === 'gemini') {
      return true;
    }

    if (process.env.USE_GEMINI === 'true') {
      return true;
    }

    if (process.env.GOOGLE_GEMINI_API_KEY &&
        !process.env.ANTHROPIC_API_KEY &&
        !process.env.OPENROUTER_API_KEY &&
        options.provider !== 'onnx') {
      return true;
    }

    return false;
  }

  private shouldUseOpenRouter(options: any): boolean {
    // Don't use OpenRouter if ONNX or Gemini is explicitly requested
    if (options.provider === 'onnx' || process.env.USE_ONNX === 'true' || process.env.PROVIDER === 'onnx') {
      return false;
    }

    if (options.provider === 'gemini' || process.env.PROVIDER === 'gemini') {
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

    if (process.env.OPENROUTER_API_KEY && !process.env.ANTHROPIC_API_KEY && !process.env.GOOGLE_GEMINI_API_KEY) {
      return true;
    }

    return false;
  }

  private async startOpenRouterProxy(modelOverride?: string): Promise<void> {
    const openrouterKey = process.env.OPENROUTER_API_KEY;

    if (!openrouterKey) {
      console.error('❌ Error: OPENROUTER_API_KEY required for OpenRouter models');
      console.error('Set it in .env or export OPENROUTER_API_KEY=sk-or-v1-xxxxx');
      process.exit(1);
    }

    logger.info('Starting integrated OpenRouter proxy');

    const defaultModel = modelOverride ||
                        process.env.COMPLETION_MODEL ||
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

    // Set dummy ANTHROPIC_API_KEY for proxy (actual auth uses OPENROUTER_API_KEY)
    if (!process.env.ANTHROPIC_API_KEY) {
      process.env.ANTHROPIC_API_KEY = 'sk-ant-proxy-dummy-key';
    }

    console.log(`🔗 Proxy Mode: OpenRouter`);
    console.log(`🔧 Proxy URL: http://localhost:${this.proxyPort}`);
    console.log(`🤖 Default Model: ${defaultModel}\n`);

    // Wait for proxy to be ready
    await new Promise(resolve => setTimeout(resolve, 1500));
  }

  private async startGeminiProxy(modelOverride?: string): Promise<void> {
    const geminiKey = process.env.GOOGLE_GEMINI_API_KEY;

    if (!geminiKey) {
      console.error('❌ Error: GOOGLE_GEMINI_API_KEY required for Gemini models');
      console.error('Set it in .env or export GOOGLE_GEMINI_API_KEY=xxxxx');
      process.exit(1);
    }

    logger.info('Starting integrated Gemini proxy');

    const defaultModel = modelOverride ||
                        process.env.COMPLETION_MODEL ||
                        'gemini-2.0-flash-exp';

    // Import Gemini proxy
    const { AnthropicToGeminiProxy } = await import('./proxy/anthropic-to-gemini.js');

    const proxy = new AnthropicToGeminiProxy({
      geminiApiKey: geminiKey,
      defaultModel
    });

    // Start proxy in background
    proxy.start(this.proxyPort);
    this.proxyServer = proxy;

    // Set ANTHROPIC_BASE_URL to proxy
    process.env.ANTHROPIC_BASE_URL = `http://localhost:${this.proxyPort}`;

    // Set dummy ANTHROPIC_API_KEY for proxy (actual auth uses GOOGLE_GEMINI_API_KEY)
    if (!process.env.ANTHROPIC_API_KEY) {
      process.env.ANTHROPIC_API_KEY = 'sk-ant-proxy-dummy-key';
    }

    console.log(`🔗 Proxy Mode: Google Gemini`);
    console.log(`🔧 Proxy URL: http://localhost:${this.proxyPort}`);
    console.log(`🤖 Default Model: ${defaultModel}\n`);

    // Wait for proxy to be ready
    await new Promise(resolve => setTimeout(resolve, 1500));
  }

  private async startONNXProxy(modelOverride?: string): Promise<void> {
    logger.info('Starting integrated ONNX local inference proxy');

    console.log('🔧 Provider: ONNX Local (Phi-4-mini)');
    console.log('💾 Free local inference - no API costs\n');

    // Import ONNX proxy
    const { AnthropicToONNXProxy } = await import('./proxy/anthropic-to-onnx.js');

    // Use a different port for ONNX to avoid conflicts
    const onnxProxyPort = parseInt(process.env.ONNX_PROXY_PORT || '3001');

    const proxy = new AnthropicToONNXProxy({
      port: onnxProxyPort,
      modelPath: process.env.ONNX_MODEL_PATH,
      executionProviders: process.env.ONNX_EXECUTION_PROVIDERS?.split(',') || ['cpu']
    });

    // Start proxy in background
    await proxy.start();
    this.proxyServer = proxy;

    // Set ANTHROPIC_BASE_URL to ONNX proxy
    process.env.ANTHROPIC_BASE_URL = `http://localhost:${onnxProxyPort}`;

    // Set dummy ANTHROPIC_API_KEY for proxy (local inference doesn't need key)
    if (!process.env.ANTHROPIC_API_KEY) {
      process.env.ANTHROPIC_API_KEY = 'sk-ant-onnx-local-key';
    }

    console.log(`🔗 Proxy Mode: ONNX Local Inference`);
    console.log(`🔧 Proxy URL: http://localhost:${onnxProxyPort}`);
    console.log(`🤖 Model: Phi-4-mini-instruct (ONNX)\n`);

    // Wait for proxy to be ready and model to load
    console.log('⏳ Loading ONNX model... (this may take a moment)\n');
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  private async runStandaloneProxy(): Promise<void> {
    const args = process.argv.slice(3); // Skip 'node', 'cli-proxy.js', 'proxy'

    // Parse proxy arguments
    let provider = 'gemini';
    let port = 3000;
    let model: string | undefined;

    for (let i = 0; i < args.length; i++) {
      if ((args[i] === '--provider' || args[i] === '-p') && args[i + 1]) {
        provider = args[++i];
      } else if ((args[i] === '--port' || args[i] === '-P') && args[i + 1]) {
        port = parseInt(args[++i]);
      } else if ((args[i] === '--model' || args[i] === '-m') && args[i + 1]) {
        model = args[++i];
      } else if (args[i] === '--help' || args[i] === '-h') {
        this.printProxyHelp();
        process.exit(0);
      }
    }

    console.log(`
╔═══════════════════════════════════════════════════════╗
║   Agentic Flow - Standalone Anthropic Proxy Server    ║
╚═══════════════════════════════════════════════════════╝
`);

    if (provider === 'gemini') {
      const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
      if (!apiKey) {
        console.error(`❌ Error: GOOGLE_GEMINI_API_KEY environment variable required

Set it with:
  export GOOGLE_GEMINI_API_KEY=your-key-here
`);
        process.exit(1);
      }

      const finalModel = model || process.env.COMPLETION_MODEL || 'gemini-2.0-flash-exp';

      console.log(`🚀 Starting Gemini → Anthropic Proxy
📍 Port: ${port}
🤖 Model: ${finalModel}
🔗 Gemini API: https://generativelanguage.googleapis.com
`);

      const { AnthropicToGeminiProxy } = await import('./proxy/anthropic-to-gemini.js');
      const proxy = new AnthropicToGeminiProxy({
        geminiApiKey: apiKey,
        defaultModel: finalModel
      });

      proxy.start(port);

      console.log(`✅ Proxy server running!

Configure Claude Code:
  export ANTHROPIC_BASE_URL=http://localhost:${port}
  export ANTHROPIC_API_KEY=sk-ant-proxy-dummy-key
  claude

Cost Savings: ~85% vs direct Anthropic API
`);

    } else if (provider === 'openrouter') {
      const apiKey = process.env.OPENROUTER_API_KEY;
      if (!apiKey) {
        console.error(`❌ Error: OPENROUTER_API_KEY environment variable required

Set it with:
  export OPENROUTER_API_KEY=sk-or-v1-your-key-here

Get your key at: https://openrouter.ai/keys
`);
        process.exit(1);
      }

      const finalModel = model || process.env.COMPLETION_MODEL || 'meta-llama/llama-3.1-8b-instruct';

      console.log(`🚀 Starting OpenRouter → Anthropic Proxy
📍 Port: ${port}
🤖 Model: ${finalModel}
🔗 OpenRouter API: https://openrouter.ai/api/v1
`);

      const { AnthropicToOpenRouterProxy } = await import('./proxy/anthropic-to-openrouter.js');
      const proxy = new AnthropicToOpenRouterProxy({
        openrouterApiKey: apiKey,
        defaultModel: finalModel
      });

      proxy.start(port);

      console.log(`✅ Proxy server running!

Configure Claude Code:
  export ANTHROPIC_BASE_URL=http://localhost:${port}
  export ANTHROPIC_API_KEY=sk-ant-proxy-dummy-key
  claude

Cost Savings: ~90% vs direct Anthropic API
Popular Models:
  - openai/gpt-4o-mini (fast, cheap)
  - anthropic/claude-3.5-sonnet (via OpenRouter)
  - meta-llama/llama-3.1-405b-instruct (OSS)
`);
    } else {
      console.error(`❌ Error: Invalid provider "${provider}". Must be "gemini" or "openrouter"`);
      process.exit(1);
    }

    // Keep process running
    process.on('SIGINT', () => {
      console.log('\n\n👋 Shutting down proxy server...');
      process.exit(0);
    });

    // Keep alive
    await new Promise(() => {});
  }

  private printProxyHelp(): void {
    console.log(`
Agentic Flow - Standalone Anthropic Proxy Server

USAGE:
  npx agentic-flow proxy [OPTIONS]

OPTIONS:
  --provider, -p <provider>   Provider (gemini, openrouter) [default: gemini]
  --port, -P <port>           Port number [default: 3000]
  --model, -m <model>         Model to use (provider-specific)
  --help, -h                  Show this help

ENVIRONMENT VARIABLES:
  GOOGLE_GEMINI_API_KEY       Required for Gemini
  OPENROUTER_API_KEY          Required for OpenRouter
  COMPLETION_MODEL            Default model (optional)

EXAMPLES:
  # Start Gemini proxy
  npx agentic-flow proxy --provider gemini --port 3000

  # Start OpenRouter proxy with GPT-4o-mini
  npx agentic-flow proxy --provider openrouter --model "openai/gpt-4o-mini"

  # Use with Claude Code
  export ANTHROPIC_BASE_URL=http://localhost:3000
  export ANTHROPIC_API_KEY=sk-ant-proxy-dummy-key
  claude
`);
  }

  private async runAgent(options: any, useOpenRouter: boolean, useGemini: boolean, useONNX: boolean = false): Promise<void> {
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

    // Set PROVIDER environment variable if --provider flag is used
    if (options.provider) {
      process.env.PROVIDER = options.provider;
    }

    // Check for API key (unless using ONNX)
    const isOnnx = options.provider === 'onnx' || process.env.USE_ONNX === 'true' || process.env.PROVIDER === 'onnx';

    if (!isOnnx && !useOpenRouter && !useGemini && !process.env.ANTHROPIC_API_KEY) {
      console.error('\n❌ Error: ANTHROPIC_API_KEY is required\n');
      console.error('Please set your API key:');
      console.error('  export ANTHROPIC_API_KEY=sk-ant-xxxxx\n');
      console.error('Or use alternative providers:');
      console.error('  --provider openrouter  (requires OPENROUTER_API_KEY)');
      console.error('  --provider gemini      (requires GOOGLE_GEMINI_API_KEY)');
      console.error('  --provider onnx        (free local inference)\n');
      process.exit(1);
    }

    if (!isOnnx && useOpenRouter && !process.env.OPENROUTER_API_KEY) {
      console.error('\n❌ Error: OPENROUTER_API_KEY is required for OpenRouter\n');
      console.error('Please set your API key:');
      console.error('  export OPENROUTER_API_KEY=sk-or-v1-xxxxx\n');
      console.error('Or use alternative providers:');
      console.error('  --provider anthropic  (requires ANTHROPIC_API_KEY)');
      console.error('  --provider gemini     (requires GOOGLE_GEMINI_API_KEY)');
      console.error('  --provider onnx       (free local inference)\n');
      process.exit(1);
    }

    if (!isOnnx && useGemini && !process.env.GOOGLE_GEMINI_API_KEY) {
      console.error('\n❌ Error: GOOGLE_GEMINI_API_KEY is required for Gemini\n');
      console.error('Please set your API key:');
      console.error('  export GOOGLE_GEMINI_API_KEY=xxxxx\n');
      console.error('Or use alternative providers:');
      console.error('  --provider anthropic   (requires ANTHROPIC_API_KEY)');
      console.error('  --provider openrouter  (requires OPENROUTER_API_KEY)');
      console.error('  --provider onnx        (free local inference)\n');
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
    } else if (useGemini) {
      const model = options.model || 'gemini-2.0-flash-exp';
      console.log(`🔧 Provider: Google Gemini`);
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

    // Use claudeAgent with Claude Agent SDK - handles multi-provider routing
    const result = await claudeAgent(agent, task, streamHandler);

    if (!options.stream) {
      console.log('\n✅ Completed!\n');
      console.log('═══════════════════════════════════════\n');
      console.log(result.output);
      console.log('\n═══════════════════════════════════════\n');
    }

    logger.info('Agent completed', {
      agent: agentName,
      outputLength: result.output.length,
      provider: useOpenRouter ? 'openrouter' : useGemini ? 'gemini' : 'anthropic'
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
  agent <command>         Agent management (list, create, info, conflicts)
  proxy [options]         Run standalone proxy server for Claude Code/Cursor
  claude-code [options]   Spawn Claude Code with auto-configured proxy
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

AGENT COMMANDS:
  npx agentic-flow agent list [format]   List all agents (summary/detailed/json)
  npx agentic-flow agent create          Create new custom agent (interactive)
  npx agentic-flow agent info <name>     Show detailed agent information
  npx agentic-flow agent conflicts       Check for package/local conflicts

OPTIONS:
  --task, -t <task>           Task description for agent mode
  --model, -m <model>         Model to use (triggers OpenRouter if contains "/")
  --provider, -p <name>       Provider to use (anthropic, openrouter, gemini, onnx)
  --stream, -s                Enable real-time streaming output
  --help, -h                  Show this help message

  API CONFIGURATION:
  --anthropic-key <key>       Override ANTHROPIC_API_KEY environment variable
  --openrouter-key <key>      Override OPENROUTER_API_KEY environment variable
  --gemini-key <key>          Override GOOGLE_GEMINI_API_KEY environment variable

  AGENT BEHAVIOR:
  --temperature <0.0-1.0>     Sampling temperature (creativity control)
  --max-tokens <number>       Maximum tokens in response

  DIRECTORY:
  --agents-dir <path>         Custom agents directory (default: .claude/agents)

  OUTPUT:
  --output <text|json|md>     Output format (text/json/markdown)
  --verbose                   Enable verbose logging for debugging

  EXECUTION:
  --timeout <ms>              Execution timeout in milliseconds
  --retry                     Auto-retry on transient errors

  MODEL OPTIMIZATION (NEW!):
  --optimize, -O              Auto-select best model for agent/task based on priorities
  --priority <type>           Optimization priority:
                              • quality   - Best results (Claude Sonnet 4.5, GPT-4o)
                              • balanced  - Mix quality/cost (DeepSeek R1, Gemini 2.5 Flash) [default]
                              • cost      - Cheapest (DeepSeek Chat V3, Llama 3.1 8B)
                              • speed     - Fastest responses (Gemini 2.5 Flash)
                              • privacy   - Local only (ONNX Phi-4, no cloud)
  --max-cost <dollars>        Maximum cost per task (e.g., 0.001 = $0.001/task budget cap)

  Optimization analyzes agent type + task complexity to recommend best model.
  Example savings: DeepSeek R1 costs 85% less than Claude Sonnet 4.5 with similar quality.
  See docs/agentic-flow/benchmarks/MODEL_CAPABILITIES.md for full comparison.

EXAMPLES:
  # MCP Server Management
  npx agentic-flow mcp start              # Start all MCP servers
  npx agentic-flow mcp start claude-flow  # Start specific server
  npx agentic-flow mcp list               # List all 203+ MCP tools
  npx agentic-flow mcp status             # Check server status

  # Proxy Server for Claude Code/Cursor
  npx agentic-flow proxy --provider openrouter --port 3000
  npx agentic-flow proxy --provider gemini --port 3001

  # Claude Code Integration (Auto-start proxy + spawn Claude Code)
  npx agentic-flow claude-code --provider openrouter "Write a Python function"
  npx agentic-flow claude-code --provider gemini "Create a REST API"
  npx agentic-flow claude-code --provider anthropic "Help me debug this code"

  # Agent Execution
  npx agentic-flow --list                 # List all 150+ agents
  npx agentic-flow --agent coder --task "Create Python hello world"
  npx agentic-flow --agent coder --task "Create REST API" --model "meta-llama/llama-3.1-8b-instruct"
  npx agentic-flow --agent coder --task "Create code" --provider onnx

  # Model Optimization (Auto-select best model)
  npx agentic-flow --agent coder --task "Build API" --optimize
  npx agentic-flow --agent coder --task "Build API" --optimize --priority cost
  npx agentic-flow --agent reviewer --task "Security audit" --optimize --priority quality
  npx agentic-flow --agent coder --task "Simple function" --optimize --max-cost 0.001

ENVIRONMENT VARIABLES:
  ANTHROPIC_API_KEY       Anthropic API key (for Claude models)
  OPENROUTER_API_KEY      OpenRouter API key (for alternative models)
  GOOGLE_GEMINI_API_KEY   Google Gemini API key (for Gemini models)
  USE_OPENROUTER          Set to 'true' to force OpenRouter usage
  USE_GEMINI              Set to 'true' to force Gemini usage
  COMPLETION_MODEL        Default model for OpenRouter
  AGENTS_DIR              Path to agents directory
  PROXY_PORT              Proxy server port (default: 3000)

OPENROUTER MODELS (Best Free Tested):
  ✅ deepseek/deepseek-r1-0528:free           (reasoning, 95s/task, RFC validation)
  ✅ deepseek/deepseek-chat-v3.1:free         (coding, 21-103s/task, enterprise-grade)
  ✅ meta-llama/llama-3.3-8b-instruct:free    (versatile, 4.4s/task, fast coding)
  ✅ openai/gpt-4-turbo                       (premium, 10.7s/task, no :free needed)

  All models above support OpenRouter leaderboard tracking via HTTP-Referer headers.
  See https://openrouter.ai/models for full model catalog.

MCP TOOLS (213+ available):
  • agentic-flow: 7 tools (agent execution, creation, management, model optimization)
  • claude-flow: 101 tools (neural networks, GitHub, workflows, DAA)
  • flow-nexus: 96 cloud tools (sandboxes, distributed swarms, templates)
  • agentic-payments: 6 tools (payment authorization, multi-agent consensus)

OPTIMIZATION BENEFITS:
  💰 Cost Savings: 85-98% cheaper models for same quality tasks
  🎯 Smart Selection: Agent-aware (coder needs quality ≥85, researcher flexible)
  📊 10+ Models: Claude, GPT-4o, Gemini, DeepSeek, Llama, ONNX local
  ⚡ Zero Overhead: <5ms decision time, no API calls during optimization

PROXY MODE (Claude Code CLI Integration):
  The OpenRouter proxy allows Claude Code to use alternative models via API translation.

  Terminal 1 - Start Proxy Server:
    npx agentic-flow proxy
    # Or with custom port: PROXY_PORT=8080 npx agentic-flow proxy
    # Proxy runs at http://localhost:3000 by default

  Terminal 2 - Use with Claude Code:
    export ANTHROPIC_BASE_URL="http://localhost:3000"
    export ANTHROPIC_API_KEY="sk-ant-proxy-dummy-key"
    export OPENROUTER_API_KEY="sk-or-v1-xxxxx"

    # Now Claude Code will route through OpenRouter proxy
    claude-code --agent coder --task "Create API"

  Proxy automatically translates Anthropic API calls to OpenRouter format.
  Model override happens automatically: Claude requests → OpenRouter models.

  Benefits for Claude Code users:
  • 85-99% cost savings vs Claude Sonnet 4.5
  • Access to 100+ models (DeepSeek, Llama, Gemini, etc.)
  • Leaderboard tracking on OpenRouter
  • No code changes to Claude Code itself

For more information: https://github.com/ruvnet/agentic-flow
    `);
  }
}

// Run CLI
const cli = new AgenticFlowCLI();
cli.start();
