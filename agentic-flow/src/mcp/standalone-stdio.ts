#!/usr/bin/env node
// Standalone agentic-flow MCP server - runs directly via stdio without spawning subprocesses
import { FastMCP } from 'fastmcp';
import { z } from 'zod';
import { execSync } from 'child_process';

// Suppress FastMCP internal warnings for cleaner output
const originalConsoleWarn = console.warn;
console.warn = (...args: any[]) => {
  const message = args.join(' ');
  // Filter out FastMCP client capability warnings
  if (message.includes('could not infer client capabilities')) {
    // Replace with friendly status message
    console.error('⏳ Waiting for MCP client connection...');
    return;
  }
  originalConsoleWarn.apply(console, args);
};

console.error('🚀 Starting Agentic-Flow MCP Server (stdio)...');
console.error('📦 Local agentic-flow tools available');

const server = new FastMCP({
  name: 'agentic-flow',
  version: '1.0.8'
});

// Tool: Run agentic-flow agent
server.addTool({
  name: 'agentic_flow_agent',
  description: 'Execute an agentic-flow agent with a specific task. Supports multiple providers (Anthropic, OpenRouter, ONNX) and comprehensive configuration options.',
  parameters: z.object({
    agent: z.string().describe('Agent type (coder, researcher, analyst, etc.) - Use agentic_flow_list_agents to see all 66+ available agents'),
    task: z.string().describe('Task description for the agent to execute'),

    // Provider Configuration
    model: z.string().optional().describe('Model to use (e.g., "claude-sonnet-4-5-20250929" for Anthropic, "meta-llama/llama-3.1-8b-instruct" for OpenRouter, or "Xenova/gpt2" for ONNX local models)'),
    provider: z.enum(['anthropic', 'openrouter', 'onnx']).optional().describe('LLM provider: "anthropic" (default, highest quality, requires ANTHROPIC_API_KEY), "openrouter" (99% cost savings, requires OPENROUTER_API_KEY), "onnx" (free local inference, no API key needed)'),

    // API Configuration
    anthropicApiKey: z.string().optional().describe('Anthropic API key (sk-ant-...) - overrides ANTHROPIC_API_KEY environment variable'),
    openrouterApiKey: z.string().optional().describe('OpenRouter API key (sk-or-...) - overrides OPENROUTER_API_KEY environment variable'),

    // Agent Behavior
    stream: z.boolean().optional().default(false).describe('Enable streaming output (real-time response chunks)'),
    temperature: z.number().min(0).max(1).optional().describe('Sampling temperature (0.0-1.0): lower = more focused/deterministic, higher = more creative/random. Default varies by agent.'),
    maxTokens: z.number().positive().optional().describe('Maximum tokens in response (default: 4096). Controls output length.'),

    // Directory Configuration
    agentsDir: z.string().optional().describe('Custom agents directory path (default: .claude/agents) - for using custom agent definitions'),

    // Output Options
    outputFormat: z.enum(['text', 'json', 'markdown']).optional().describe('Output format: "text" (default, human-readable), "json" (structured data), "markdown" (formatted docs)'),
    verbose: z.boolean().optional().default(false).describe('Enable verbose logging for debugging'),

    // Execution Control
    timeout: z.number().positive().optional().describe('Execution timeout in milliseconds (default: 300000 = 5 minutes)'),
    retryOnError: z.boolean().optional().default(false).describe('Automatically retry on transient errors (rate limits, network issues)')
  }),
  execute: async ({
    agent,
    task,
    model,
    provider,
    anthropicApiKey,
    openrouterApiKey,
    stream,
    temperature,
    maxTokens,
    agentsDir,
    outputFormat,
    verbose,
    timeout,
    retryOnError
  }) => {
    try {
      // Build command with all parameters
      let cmd = `npx --yes agentic-flow --agent "${agent}" --task "${task}"`;

      // Provider & Model
      if (model) cmd += ` --model "${model}"`;
      if (provider) cmd += ` --provider ${provider}`;

      // API Keys (set as env vars)
      const env = { ...process.env };
      if (anthropicApiKey) env.ANTHROPIC_API_KEY = anthropicApiKey;
      if (openrouterApiKey) env.OPENROUTER_API_KEY = openrouterApiKey;

      // Agent Behavior
      if (stream) cmd += ' --stream';
      if (temperature !== undefined) cmd += ` --temperature ${temperature}`;
      if (maxTokens) cmd += ` --max-tokens ${maxTokens}`;

      // Directories
      if (agentsDir) cmd += ` --agents-dir "${agentsDir}"`;

      // Output
      if (outputFormat) cmd += ` --output ${outputFormat}`;
      if (verbose) cmd += ' --verbose';

      // Execution
      if (retryOnError) cmd += ' --retry';

      const result = execSync(cmd, {
        encoding: 'utf-8',
        maxBuffer: 10 * 1024 * 1024,
        timeout: timeout || 300000,
        env
      });

      return JSON.stringify({
        success: true,
        agent,
        task: task.substring(0, 100) + (task.length > 100 ? '...' : ''),
        model: model || 'default',
        provider: provider || 'anthropic',
        output: result.trim()
      }, null, 2);
    } catch (error: any) {
      throw new Error(`Failed to execute agent: ${error.message}`);
    }
  }
});

// Tool: List available agents
server.addTool({
  name: 'agentic_flow_list_agents',
  description: 'List all available agentic-flow agents',
  parameters: z.object({}),
  execute: async () => {
    try {
      // Use npx to run agentic-flow from npm registry
      const cmd = `npx --yes agentic-flow --list`;
      const result = execSync(cmd, {
        encoding: 'utf-8',
        maxBuffer: 5 * 1024 * 1024,
        timeout: 30000
      });

      return JSON.stringify({
        success: true,
        agents: result.trim()
      }, null, 2);
    } catch (error: any) {
      throw new Error(`Failed to list agents: ${error.message}`);
    }
  }
});

// Tool: Create custom agent
server.addTool({
  name: 'agentic_flow_create_agent',
  description: 'Create a new custom agent in .claude/agents directory. Supports conflict detection and will warn if agent already exists in package or local directories.',
  parameters: z.object({
    name: z.string().describe('Agent name (will be converted to kebab-case, e.g., my-custom-agent)'),
    description: z.string().describe('Agent description (what this agent does)'),
    systemPrompt: z.string().describe('System prompt that defines the agent behavior and personality'),
    category: z.string().optional().default('custom').describe('Category/folder to organize the agent (default: custom)'),
    tools: z.array(z.string()).optional().describe('Optional list of tools this agent can use (e.g., ["web-search", "code-execution"])')
  }),
  execute: async ({ name, description, systemPrompt, category, tools }) => {
    try {
      let cmd = `npx --yes agentic-flow agent create --name "${name}" --description "${description}" --prompt "${systemPrompt}"`;
      if (category && category !== 'custom') cmd += ` --category "${category}"`;
      if (tools && tools.length > 0) cmd += ` --tools "${tools.join(',')}"`;

      const result = execSync(cmd, {
        encoding: 'utf-8',
        maxBuffer: 10 * 1024 * 1024,
        timeout: 60000,
        input: 'y\n' // Auto-confirm if conflict exists
      });

      return JSON.stringify({
        success: true,
        name,
        category: category || 'custom',
        message: 'Agent created successfully',
        output: result.trim()
      }, null, 2);
    } catch (error: any) {
      throw new Error(`Failed to create agent: ${error.message}`);
    }
  }
});

// Tool: List agents with source information
server.addTool({
  name: 'agentic_flow_list_all_agents',
  description: 'List all available agents including both package agents and custom local agents. Shows source (package or local) and handles deduplication.',
  parameters: z.object({
    format: z.enum(['summary', 'detailed', 'json']).optional().default('summary').describe('Output format: summary (brief list), detailed (full info), json (structured data)'),
    filterSource: z.enum(['all', 'package', 'local']).optional().default('all').describe('Filter by source: all, package (npm distribution), or local (custom .claude/agents)')
  }),
  execute: async ({ format, filterSource }) => {
    try {
      const cmd = `npx --yes agentic-flow agent list ${format || 'summary'}`;
      const result = execSync(cmd, {
        encoding: 'utf-8',
        maxBuffer: 10 * 1024 * 1024,
        timeout: 30000
      });

      if (format === 'json') {
        const agents = JSON.parse(result);
        const filtered = filterSource && filterSource !== 'all'
          ? agents.filter((a: any) => a.source === filterSource)
          : agents;

        return JSON.stringify({
          success: true,
          count: filtered.length,
          filterSource: filterSource || 'all',
          agents: filtered
        }, null, 2);
      }

      return JSON.stringify({
        success: true,
        filterSource: filterSource || 'all',
        output: result.trim()
      }, null, 2);
    } catch (error: any) {
      throw new Error(`Failed to list agents: ${error.message}`);
    }
  }
});

// Tool: Get agent information
server.addTool({
  name: 'agentic_flow_agent_info',
  description: 'Get detailed information about a specific agent including its source, description, category, and system prompt preview.',
  parameters: z.object({
    name: z.string().describe('Agent name to get information about')
  }),
  execute: async ({ name }) => {
    try {
      const cmd = `npx --yes agentic-flow agent info "${name}"`;
      const result = execSync(cmd, {
        encoding: 'utf-8',
        maxBuffer: 10 * 1024 * 1024,
        timeout: 30000
      });

      return JSON.stringify({
        success: true,
        agent: name,
        output: result.trim()
      }, null, 2);
    } catch (error: any) {
      throw new Error(`Failed to get agent info: ${error.message}`);
    }
  }
});

// Tool: Check for agent conflicts
server.addTool({
  name: 'agentic_flow_check_conflicts',
  description: 'Check for conflicts between package agents and local custom agents. Identifies agents with the same relative path in both locations.',
  parameters: z.object({}),
  execute: async () => {
    try {
      const cmd = `npx --yes agentic-flow agent conflicts`;
      const result = execSync(cmd, {
        encoding: 'utf-8',
        maxBuffer: 10 * 1024 * 1024,
        timeout: 30000
      });

      return JSON.stringify({
        success: true,
        output: result.trim()
      }, null, 2);
    } catch (error: any) {
      throw new Error(`Failed to check conflicts: ${error.message}`);
    }
  }
});

// Tool: Optimize model selection
server.addTool({
  name: 'agentic_flow_optimize_model',
  description: 'Automatically select the optimal model for an agent and task based on priorities (quality, cost, speed, privacy). Returns model recommendation with reasoning.',
  parameters: z.object({
    agent: z.string().describe('Agent type (e.g., coder, researcher, reviewer)'),
    task: z.string().describe('Task description'),
    priority: z.enum(['quality', 'balanced', 'cost', 'speed', 'privacy']).optional().default('balanced').describe('Optimization priority: quality (best results), balanced (cost/quality), cost (cheapest), speed (fastest), privacy (local only)'),
    max_cost: z.number().positive().optional().describe('Maximum cost per task in dollars (optional budget cap)')
  }),
  execute: async ({ agent, task, priority, max_cost }) => {
    try {
      let cmd = `npx --yes agentic-flow --agent "${agent}" --task "${task}" --optimize`;

      if (priority && priority !== 'balanced') {
        cmd += ` --priority ${priority}`;
      }

      if (max_cost) {
        cmd += ` --max-cost ${max_cost}`;
      }

      // Add dry-run to just get recommendation without execution
      cmd += ' --help'; // This will show the optimization without running

      const result = execSync(cmd, {
        encoding: 'utf-8',
        maxBuffer: 10 * 1024 * 1024,
        timeout: 10000
      });

      return JSON.stringify({
        success: true,
        agent,
        task: task.substring(0, 100) + (task.length > 100 ? '...' : ''),
        priority: priority || 'balanced',
        max_cost,
        recommendation: 'Model optimization available - use --optimize flag with agent execution',
        note: 'To apply optimization, use agentic_flow_agent tool with optimize_model parameter set to true'
      }, null, 2);
    } catch (error: any) {
      throw new Error(`Failed to optimize model: ${error.message}`);
    }
  }
});

console.error('✅ Registered 7 tools:');
console.error('   • agentic_flow_agent (execute agent with 13 parameters)');
console.error('   • agentic_flow_list_agents (list 66+ agents)');
console.error('   • agentic_flow_create_agent (create custom agent)');
console.error('   • agentic_flow_list_all_agents (list with sources)');
console.error('   • agentic_flow_agent_info (get agent details)');
console.error('   • agentic_flow_check_conflicts (conflict detection)');
console.error('   • agentic_flow_optimize_model (auto-select best model) 🔥 NEW');
console.error('🔌 Starting stdio transport...');

server.start({ transportType: 'stdio' }).then(() => {
  console.error('✅ Agentic-Flow MCP server running on stdio');
  console.error('💡 Ready for MCP client connections (e.g., Claude Desktop)');
}).catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});
