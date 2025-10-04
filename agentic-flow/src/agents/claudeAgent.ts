// Generic agent that uses .claude/agents definitions
import { query } from "@anthropic-ai/claude-agent-sdk";
import { logger } from "../utils/logger.js";
import { withRetry } from "../utils/retry.js";
import { AgentDefinition } from "../utils/agentLoader.js";
import { claudeFlowSdkServer } from "../mcp/claudeFlowSdkServer.js";

export async function claudeAgent(
  agent: AgentDefinition,
  input: string,
  onStream?: (chunk: string) => void,
  modelOverride?: string
) {
  const startTime = Date.now();
  logger.info('Starting Claude agent', {
    agent: agent.name,
    input: input.substring(0, 100),
    model: modelOverride || 'default'
  });

  return withRetry(async () => {
    // Quad MCP server setup: in-SDK + claude-flow + flow-nexus + agentic-payments
    const result = query({
      prompt: input,
      options: {
        systemPrompt: agent.systemPrompt,
        model: modelOverride, // Support custom models like OpenRouter
        permissionMode: 'bypassPermissions', // Auto-approve all tool usage for Docker automation
        mcpServers: {
          // In-SDK server: 6 basic tools (memory + swarm)
          'claude-flow-sdk': claudeFlowSdkServer,

          // Full MCP server: 101 tools via subprocess (neural, analysis, workflow, github, daa, system)
          'claude-flow': {
            command: 'npx',
            args: ['claude-flow@alpha', 'mcp', 'start'],
            env: {
              ...process.env,
              MCP_AUTO_START: 'true'
            }
          },

          // Flow Nexus MCP server: 96 cloud tools (sandboxes, swarms, neural, workflows)
          'flow-nexus': {
            command: 'npx',
            args: ['flow-nexus@latest', 'mcp', 'start'],
            env: {
              ...process.env,
              FLOW_NEXUS_AUTO_START: 'true'
            }
          },

          // Agentic Payments MCP server: Payment authorization and multi-agent consensus
          'agentic-payments': {
            command: 'npx',
            args: ['-y', 'agentic-payments', 'mcp'],
            env: {
              ...process.env,
              AGENTIC_PAYMENTS_AUTO_START: 'true'
            }
          }
        }
        // allowedTools: removed to enable ALL tools from all servers
      }
    });

    let output = '';
    for await (const msg of result) {
      if (msg.type === 'assistant') {
        const chunk = msg.message.content?.map((c: any) => c.type === 'text' ? c.text : '').join('') || '';
        output += chunk;

        if (onStream && chunk) {
          onStream(chunk);
        }
      }
    }

    const duration = Date.now() - startTime;
    logger.info('Claude agent completed', {
      agent: agent.name,
      duration,
      outputLength: output.length
    });

    return { output, agent: agent.name };
  });
}
