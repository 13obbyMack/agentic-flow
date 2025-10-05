// Generic agent that uses .claude/agents definitions with multi-provider SDK routing
import { query } from "@anthropic-ai/claude-agent-sdk";
import { logger } from "../utils/logger.js";
import { withRetry } from "../utils/retry.js";
import { AgentDefinition } from "../utils/agentLoader.js";
import { claudeFlowSdkServer } from "../mcp/claudeFlowSdkServer.js";

function getCurrentProvider(): string {
  // Determine provider from environment
  if (process.env.PROVIDER === 'gemini' || process.env.USE_GEMINI === 'true') {
    return 'gemini';
  }
  if (process.env.PROVIDER === 'openrouter' || process.env.USE_OPENROUTER === 'true') {
    return 'openrouter';
  }
  if (process.env.PROVIDER === 'onnx' || process.env.USE_ONNX === 'true') {
    return 'onnx';
  }
  return 'anthropic'; // Default
}

function getModelForProvider(provider: string): {
  model: string;
  apiKey: string;
  baseURL?: string;
} {
  switch (provider) {
    case 'gemini':
      return {
        model: process.env.COMPLETION_MODEL || 'gemini-2.0-flash-exp',
        apiKey: process.env.GOOGLE_GEMINI_API_KEY || process.env.ANTHROPIC_API_KEY || '',
        baseURL: process.env.PROXY_URL || undefined
      };

    case 'openrouter':
      return {
        model: process.env.COMPLETION_MODEL || 'meta-llama/llama-3.1-8b-instruct',
        apiKey: process.env.OPENROUTER_API_KEY || process.env.ANTHROPIC_API_KEY || '',
        baseURL: process.env.PROXY_URL || undefined
      };

    case 'onnx':
      return {
        model: 'onnx-local',
        apiKey: 'local',
        baseURL: process.env.PROXY_URL || undefined
      };

    case 'anthropic':
    default:
      // For anthropic provider, require ANTHROPIC_API_KEY
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        throw new Error('ANTHROPIC_API_KEY is required but not set for Anthropic provider');
      }
      return {
        model: process.env.COMPLETION_MODEL || 'claude-sonnet-4-5-20250929',
        apiKey,
        // No baseURL for direct Anthropic
      };
  }
}

export async function claudeAgent(
  agent: AgentDefinition,
  input: string,
  onStream?: (chunk: string) => void,
  modelOverride?: string
) {
  const startTime = Date.now();
  const provider = getCurrentProvider();

  logger.info('Starting Claude Agent SDK with multi-provider support', {
    agent: agent.name,
    provider,
    input: input.substring(0, 100),
    model: modelOverride || 'default'
  });

  return withRetry(async () => {
    // Get model configuration for the selected provider
    const modelConfig = getModelForProvider(provider);
    const finalModel = modelOverride || modelConfig.model;

    // Configure environment for Claude Agent SDK with proxy routing
    // The SDK internally uses Anthropic client which reads ANTHROPIC_BASE_URL and ANTHROPIC_API_KEY
    const envOverrides: Record<string, string> = {};

    if (provider === 'gemini' && process.env.GOOGLE_GEMINI_API_KEY) {
      // For Gemini: Route through translation proxy
      // Use ANTHROPIC_BASE_URL if already set by CLI, otherwise use env-specific or default
      envOverrides.ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || 'proxy-key'; // Use existing or proxy key
      envOverrides.ANTHROPIC_BASE_URL = process.env.ANTHROPIC_BASE_URL || process.env.GEMINI_PROXY_URL || 'http://localhost:3000';

      logger.info('Using Gemini proxy', {
        proxyUrl: envOverrides.ANTHROPIC_BASE_URL,
        model: finalModel
      });
    } else if (provider === 'openrouter' && process.env.OPENROUTER_API_KEY) {
      // For OpenRouter: Route through translation proxy
      // Use ANTHROPIC_BASE_URL if already set by CLI, otherwise use env-specific or default
      envOverrides.ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || 'proxy-key'; // Use existing or proxy key
      envOverrides.ANTHROPIC_BASE_URL = process.env.ANTHROPIC_BASE_URL || process.env.OPENROUTER_PROXY_URL || 'http://localhost:3000';

      logger.info('Using OpenRouter proxy', {
        proxyUrl: envOverrides.ANTHROPIC_BASE_URL,
        model: finalModel
      });
    } else if (provider === 'onnx') {
      // For ONNX: Local inference (TODO: implement ONNX proxy)
      envOverrides.ANTHROPIC_API_KEY = 'local';
      if (modelConfig.baseURL) {
        envOverrides.ANTHROPIC_BASE_URL = modelConfig.baseURL;
      }
    }
    // For Anthropic provider, use existing ANTHROPIC_API_KEY (no proxy needed)

    logger.info('Multi-provider configuration', {
      provider,
      model: finalModel,
      hasApiKey: !!envOverrides.ANTHROPIC_API_KEY || !!process.env.ANTHROPIC_API_KEY,
      hasBaseURL: !!envOverrides.ANTHROPIC_BASE_URL
    });

    try {
      // MCP server setup - enable in-SDK server and optional external servers
      const mcpServers: any = {};

      // Enable in-SDK MCP server for custom tools
      if (process.env.ENABLE_CLAUDE_FLOW_SDK === 'true') {
        mcpServers['claude-flow-sdk'] = claudeFlowSdkServer;
      }

      // Optional external MCP servers (disabled by default to avoid subprocess failures)
      // Enable by setting ENABLE_CLAUDE_FLOW_MCP=true or ENABLE_FLOW_NEXUS_MCP=true
      if (process.env.ENABLE_CLAUDE_FLOW_MCP === 'true') {
        mcpServers['claude-flow'] = {
          type: 'stdio',
          command: 'npx',
          args: ['claude-flow@alpha', 'mcp', 'start'],
          env: {
            ...process.env,
            MCP_AUTO_START: 'true',
            PROVIDER: provider
          }
        };
      }

      if (process.env.ENABLE_FLOW_NEXUS_MCP === 'true') {
        mcpServers['flow-nexus'] = {
          type: 'stdio',
          command: 'npx',
          args: ['flow-nexus@latest', 'mcp', 'start'],
          env: {
            ...process.env,
            FLOW_NEXUS_AUTO_START: 'true'
          }
        };
      }

      if (process.env.ENABLE_AGENTIC_PAYMENTS_MCP === 'true') {
        mcpServers['agentic-payments'] = {
          type: 'stdio',
          command: 'npx',
          args: ['-y', 'agentic-payments', 'mcp'],
          env: {
            ...process.env,
            AGENTIC_PAYMENTS_AUTO_START: 'true'
          }
        };
      }

      const queryOptions: any = {
        systemPrompt: agent.systemPrompt,
        model: finalModel, // Claude Agent SDK handles model selection
        permissionMode: 'bypassPermissions', // Auto-approve all tool usage for Docker automation
        // Enable all built-in tools by default (Read, Write, Edit, Bash, Glob, Grep, WebFetch, WebSearch)
        // Based on SDK types, allowedTools and disallowedTools control which tools are available
        // If not specified, all tools are enabled by default
        allowedTools: [
          'Read',
          'Write',
          'Edit',
          'Bash',
          'Glob',
          'Grep',
          'WebFetch',
          'WebSearch',
          'NotebookEdit',
          'TodoWrite'
        ],
        // Add MCP servers if configured
        mcpServers: Object.keys(mcpServers).length > 0 ? mcpServers : undefined
      };

      // Add environment overrides if present
      if (Object.keys(envOverrides).length > 0) {
        queryOptions.env = {
          ...process.env,
          ...envOverrides
        };
      }

      const result = query({
        prompt: input,
        options: queryOptions
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
      logger.info('Claude Agent SDK completed', {
        agent: agent.name,
        provider,
        duration,
        outputLength: output.length
      });

      return { output, agent: agent.name };
    } catch (error: any) {
      logger.error('Claude Agent SDK execution failed', {
        provider,
        model: finalModel,
        error: error.message
      });
      throw error;
    }
  });
}
