#!/usr/bin/env node
// Standalone agentic-flow MCP server - runs directly via stdio without spawning subprocesses
import { FastMCP } from 'fastmcp';
import { z } from 'zod';
import { execSync } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
  version: '1.0.3'
});

// Tool: Run agentic-flow agent
server.addTool({
  name: 'agentic_flow_agent',
  description: 'Execute an agentic-flow agent with a specific task',
  parameters: z.object({
    agent: z.string().describe('Agent type (coder, researcher, etc.)'),
    task: z.string().describe('Task description for the agent'),
    stream: z.boolean().optional().default(false).describe('Enable streaming output')
  }),
  execute: async ({ agent, task, stream }) => {
    try {
      const cliPath = resolve(__dirname, '../../cli-proxy.js');
      const cmd = `node "${cliPath}" --agent "${agent}" --task "${task}"${stream ? ' --stream' : ''}`;
      const result = execSync(cmd, {
        encoding: 'utf-8',
        maxBuffer: 10 * 1024 * 1024,
        cwd: resolve(__dirname, '../..')
      });

      return JSON.stringify({
        success: true,
        agent,
        task,
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
      const cliPath = resolve(__dirname, '../../cli-proxy.js');
      const cmd = `node "${cliPath}" --mode list`;
      const result = execSync(cmd, {
        encoding: 'utf-8',
        cwd: resolve(__dirname, '../..')
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

console.error('✅ Registered 2 tools: agentic_flow_agent, agentic_flow_list_agents');
console.error('🔌 Starting stdio transport...');

server.start({ transportType: 'stdio' }).then(() => {
  console.error('✅ Agentic-Flow MCP server running on stdio');
  console.error('💡 Ready for MCP client connections (e.g., Claude Desktop)');
}).catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});
