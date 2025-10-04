// Direct Anthropic API agent with in-process tool execution (no subprocess)
import Anthropic from '@anthropic-ai/sdk';
import { logger } from '../utils/logger.js';
import { withRetry } from '../utils/retry.js';
import { AgentDefinition } from '../utils/agentLoader.js';
import { execSync } from 'child_process';

// Lazy initialize Anthropic client to allow runtime API key validation
let anthropic: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropic) {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    // Validate API key format
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is required but not set');
    }

    if (!apiKey.startsWith('sk-ant-')) {
      throw new Error(
        `Invalid ANTHROPIC_API_KEY format. Expected format: sk-ant-...\n` +
        `Got: ${apiKey.substring(0, 10)}...\n\n` +
        `Please check your API key at: https://console.anthropic.com/settings/keys`
      );
    }

    anthropic = new Anthropic({ apiKey });
  }

  return anthropic;
}

// Define claude-flow tools as native Anthropic tool definitions
const claudeFlowTools: Anthropic.Tool[] = [
  {
    name: 'memory_store',
    description: 'Store a value in persistent memory with optional namespace and TTL',
    input_schema: {
      type: 'object',
      properties: {
        key: { type: 'string', description: 'Memory key' },
        value: { type: 'string', description: 'Value to store' },
        namespace: { type: 'string', description: 'Memory namespace', default: 'default' },
        ttl: { type: 'number', description: 'Time-to-live in seconds' }
      },
      required: ['key', 'value']
    }
  },
  {
    name: 'memory_retrieve',
    description: 'Retrieve a value from persistent memory',
    input_schema: {
      type: 'object',
      properties: {
        key: { type: 'string', description: 'Memory key' },
        namespace: { type: 'string', description: 'Memory namespace', default: 'default' }
      },
      required: ['key']
    }
  },
  {
    name: 'memory_search',
    description: 'Search for keys matching a pattern in memory',
    input_schema: {
      type: 'object',
      properties: {
        pattern: { type: 'string', description: 'Search pattern (supports wildcards)' },
        namespace: { type: 'string', description: 'Memory namespace to search in' },
        limit: { type: 'number', description: 'Maximum results to return', default: 10 }
      },
      required: ['pattern']
    }
  },
  {
    name: 'swarm_init',
    description: 'Initialize a multi-agent swarm with specified topology',
    input_schema: {
      type: 'object',
      properties: {
        topology: { type: 'string', enum: ['mesh', 'hierarchical', 'ring', 'star'], description: 'Swarm topology' },
        maxAgents: { type: 'number', description: 'Maximum number of agents', default: 8 },
        strategy: { type: 'string', enum: ['balanced', 'specialized', 'adaptive'], description: 'Agent distribution strategy', default: 'balanced' }
      },
      required: ['topology']
    }
  },
  {
    name: 'agent_spawn',
    description: 'Spawn a new agent in the swarm',
    input_schema: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['researcher', 'coder', 'analyst', 'optimizer', 'coordinator'], description: 'Agent type' },
        capabilities: { type: 'array', items: { type: 'string' }, description: 'Agent capabilities' },
        name: { type: 'string', description: 'Custom agent name' }
      },
      required: ['type']
    }
  },
  {
    name: 'task_orchestrate',
    description: 'Orchestrate a complex task across the swarm',
    input_schema: {
      type: 'object',
      properties: {
        task: { type: 'string', description: 'Task description or instructions' },
        strategy: { type: 'string', enum: ['parallel', 'sequential', 'adaptive'], description: 'Execution strategy', default: 'adaptive' },
        priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'], description: 'Task priority', default: 'medium' },
        maxAgents: { type: 'number', description: 'Maximum agents to use for this task' }
      },
      required: ['task']
    }
  },
  {
    name: 'swarm_status',
    description: 'Get current swarm status and metrics',
    input_schema: {
      type: 'object',
      properties: {
        verbose: { type: 'boolean', description: 'Include detailed metrics', default: false }
      }
    }
  }
];

// Execute tool calls using claude-flow CLI
async function executeToolCall(toolName: string, toolInput: any): Promise<string> {
  try {
    logger.info('Executing tool', { toolName, input: toolInput });

    switch (toolName) {
      case 'memory_store': {
        const { key, value, namespace = 'default', ttl } = toolInput;
        const cmd = `npx claude-flow@alpha memory store "${key}" "${value}" --namespace "${namespace}"${ttl ? ` --ttl ${ttl}` : ''}`;
        const result = execSync(cmd, { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
        logger.info('Memory stored', { key, namespace });
        return `✅ Stored successfully\n📝 Key: ${key}\n📦 Namespace: ${namespace}\n💾 Size: ${value.length} bytes`;
      }

      case 'memory_retrieve': {
        const { key, namespace = 'default' } = toolInput;
        const cmd = `npx claude-flow@alpha memory retrieve "${key}" --namespace "${namespace}"`;
        const result = execSync(cmd, { encoding: 'utf-8' });
        logger.info('Memory retrieved', { key });
        return `✅ Retrieved:\n${result}`;
      }

      case 'memory_search': {
        const { pattern, namespace, limit = 10 } = toolInput;
        const cmd = `npx claude-flow@alpha memory search "${pattern}"${namespace ? ` --namespace "${namespace}"` : ''} --limit ${limit}`;
        const result = execSync(cmd, { encoding: 'utf-8' });
        return `🔍 Search results:\n${result}`;
      }

      case 'swarm_init': {
        const { topology, maxAgents = 8, strategy = 'balanced' } = toolInput;
        const cmd = `npx claude-flow@alpha swarm init --topology ${topology} --max-agents ${maxAgents} --strategy ${strategy}`;
        const result = execSync(cmd, { encoding: 'utf-8' });
        return `🚀 Swarm initialized:\n${result}`;
      }

      case 'agent_spawn': {
        const { type, capabilities, name } = toolInput;
        const capStr = capabilities ? ` --capabilities "${capabilities.join(',')}"` : '';
        const nameStr = name ? ` --name "${name}"` : '';
        const cmd = `npx claude-flow@alpha agent spawn --type ${type}${capStr}${nameStr}`;
        const result = execSync(cmd, { encoding: 'utf-8' });
        return `🤖 Agent spawned:\n${result}`;
      }

      case 'task_orchestrate': {
        const { task, strategy = 'adaptive', priority = 'medium', maxAgents } = toolInput;
        const maxStr = maxAgents ? ` --max-agents ${maxAgents}` : '';
        const cmd = `npx claude-flow@alpha task orchestrate "${task}" --strategy ${strategy} --priority ${priority}${maxStr}`;
        const result = execSync(cmd, { encoding: 'utf-8' });
        return `⚡ Task orchestrated:\n${result}`;
      }

      case 'swarm_status': {
        const { verbose = false } = toolInput;
        const cmd = `npx claude-flow@alpha swarm status${verbose ? ' --verbose' : ''}`;
        const result = execSync(cmd, { encoding: 'utf-8' });
        return `📊 Swarm status:\n${result}`;
      }

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  } catch (error: any) {
    logger.error('Tool execution failed', { toolName, error: error.message });
    return `❌ Tool execution failed: ${error.message}`;
  }
}

/**
 * Direct API agent using Anthropic SDK with native tool calling
 * Bypasses Claude Agent SDK subprocess issues entirely
 */
export async function directApiAgent(
  agent: AgentDefinition,
  input: string,
  onStream?: (chunk: string) => void
): Promise<{ output: string; agent: string }> {
  const startTime = Date.now();
  logger.info('Starting direct API agent', {
    agent: agent.name,
    input: input.substring(0, 100)
  });

  return withRetry(async () => {
    const messages: Anthropic.MessageParam[] = [
      { role: 'user', content: input }
    ];

    let finalOutput = '';
    let toolUseCount = 0;
    const maxToolUses = 10; // Prevent infinite loops

    // Agentic loop: keep calling API until no more tool uses
    while (toolUseCount < maxToolUses) {
      logger.debug('API call iteration', { toolUseCount, messagesLength: messages.length });

      const client = getAnthropicClient();

      let response;
      try {
        response = await client.messages.create({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 8192,
          system: agent.systemPrompt || 'You are a helpful AI assistant.',
          messages,
          tools: claudeFlowTools
        });
      } catch (error: any) {
        // Enhance authentication errors with helpful guidance
        if (error?.status === 401) {
          const apiKey = process.env.ANTHROPIC_API_KEY;
          throw new Error(
            `❌ Anthropic API authentication failed (401)\n\n` +
            `Your API key is invalid, expired, or lacks permissions.\n` +
            `Current key: ${apiKey?.substring(0, 15)}...\n\n` +
            `Please:\n` +
            `  1. Check your key at: https://console.anthropic.com/settings/keys\n` +
            `  2. Verify it's not expired\n` +
            `  3. Ensure it has proper permissions\n` +
            `  4. Update your .env file with: ANTHROPIC_API_KEY=sk-ant-...\n\n` +
            `Alternative: Use OpenRouter instead (--model "meta-llama/llama-3.1-8b-instruct")\n` +
            `Or use local ONNX (--provider onnx)`
          );
        }
        throw error;
      }

      logger.debug('API response', {
        stopReason: response.stop_reason,
        contentBlocks: response.content.length
      });

      // Process response content
      const toolResults: any[] = [];
      for (const block of response.content) {
        if (block.type === 'text') {
          finalOutput += block.text;
          if (onStream) {
            onStream(block.text);
          }
        } else if (block.type === 'tool_use') {
          toolUseCount++;
          logger.info('Tool use requested', {
            toolName: block.name,
            toolUseId: block.id
          });

          // Execute the tool
          const toolResult = await executeToolCall(block.name, block.input);

          // Collect tool result
          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: toolResult
          });

          logger.debug('Tool result collected', {
            toolUseId: block.id,
            resultLength: toolResult.length
          });
        }
      }

      // If there were tool uses, add assistant message and all tool results
      if (toolResults.length > 0) {
        // Add assistant message with tool uses
        messages.push({
          role: 'assistant',
          content: response.content
        });

        // Add all tool results in one user message
        messages.push({
          role: 'user',
          content: toolResults
        });

        logger.debug('Tool results added to conversation', {
          count: toolResults.length
        });
      }

      // Stop if no tool use or end_turn
      if (response.stop_reason === 'end_turn' || response.content.every(b => b.type === 'text')) {
        // Add final assistant message if it has text
        const textContent = response.content.filter(b => b.type === 'text');
        if (textContent.length > 0 && messages[messages.length - 1].role !== 'assistant') {
          messages.push({
            role: 'assistant',
            content: response.content
          });
        }
        break;
      }
    }

    const duration = Date.now() - startTime;
    logger.info('Direct API agent completed', {
      agent: agent.name,
      duration,
      toolUseCount,
      outputLength: finalOutput.length
    });

    return { output: finalOutput, agent: agent.name };
  });
}
