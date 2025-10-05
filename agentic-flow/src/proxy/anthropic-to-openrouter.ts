// Anthropic to OpenRouter Proxy Server
// Converts Anthropic API format to OpenRouter format
import express, { Request, Response, NextFunction } from 'express';
import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import { logger } from '../utils/logger.js';
import { getInstructionsForModel, formatInstructions } from './provider-instructions.js';

interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string | Array<{ type: string; text?: string; [key: string]: any }>;
}

interface AnthropicRequest {
  model?: string;
  messages: AnthropicMessage[];
  max_tokens?: number;
  temperature?: number;
  system?: string;
  stream?: boolean;
  [key: string]: any;
}

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIRequest {
  model: string;
  messages: OpenAIMessage[];
  max_tokens?: number;
  temperature?: number;
  stream?: boolean;
  [key: string]: any;
}

export class AnthropicToOpenRouterProxy {
  private app: express.Application;
  private openrouterApiKey: string;
  private openrouterBaseUrl: string;
  private defaultModel: string;

  constructor(config: {
    openrouterApiKey: string;
    openrouterBaseUrl?: string;
    defaultModel?: string;
  }) {
    this.app = express();
    this.openrouterApiKey = config.openrouterApiKey;
    this.openrouterBaseUrl = config.openrouterBaseUrl || 'https://openrouter.ai/api/v1';
    this.defaultModel = config.defaultModel || 'meta-llama/llama-3.1-8b-instruct';

    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    // Parse JSON bodies
    this.app.use(express.json({ limit: '50mb' }));

    // Logging middleware
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      logger.debug('Proxy request', {
        method: req.method,
        path: req.path,
        headers: Object.keys(req.headers)
      });
      next();
    });
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({ status: 'ok', service: 'anthropic-to-openrouter-proxy' });
    });

    // Anthropic Messages API → OpenRouter Chat Completions
    this.app.post('/v1/messages', async (req: Request, res: Response) => {
      try {
        const anthropicReq: AnthropicRequest = req.body;

        // Convert Anthropic format to OpenAI format
        const openaiReq = this.convertAnthropicToOpenAI(anthropicReq);

        logger.info('Converting Anthropic request to OpenRouter', {
          anthropicModel: anthropicReq.model,
          openaiModel: openaiReq.model,
          messageCount: openaiReq.messages.length,
          apiKeyPresent: !!this.openrouterApiKey,
          apiKeyPrefix: this.openrouterApiKey?.substring(0, 10)
        });

        // Forward to OpenRouter
        const response = await fetch(`${this.openrouterBaseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.openrouterApiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://github.com/ruvnet/agentic-flow',
            'X-Title': 'Agentic Flow'
          },
          body: JSON.stringify(openaiReq)
        });

        if (!response.ok) {
          const error = await response.text();
          logger.error('OpenRouter API error', { status: response.status, error });
          return res.status(response.status).json({
            error: {
              type: 'api_error',
              message: error
            }
          });
        }

        // Handle streaming vs non-streaming
        if (anthropicReq.stream) {
          // Stream response
          res.setHeader('Content-Type', 'text/event-stream');
          res.setHeader('Cache-Control', 'no-cache');
          res.setHeader('Connection', 'keep-alive');

          const reader = response.body?.getReader();
          if (!reader) {
            throw new Error('No response body');
          }

          const decoder = new TextDecoder();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const anthropicChunk = this.convertOpenAIStreamToAnthropic(chunk);
            res.write(anthropicChunk);
          }

          res.end();
        } else {
          // Non-streaming response
          const openaiRes = await response.json();
          const anthropicRes = this.convertOpenAIToAnthropic(openaiRes);

          logger.info('Proxy response sent', {
            model: anthropicRes.model,
            usage: anthropicRes.usage
          });

          res.json(anthropicRes);
        }
      } catch (error: any) {
        logger.error('Proxy error', { error: error.message, stack: error.stack });
        res.status(500).json({
          error: {
            type: 'proxy_error',
            message: error.message
          }
        });
      }
    });

    // Fallback for other Anthropic API endpoints
    this.app.use((req: Request, res: Response) => {
      logger.warn('Unsupported endpoint', { path: req.path, method: req.method });
      res.status(404).json({
        error: {
          type: 'not_found',
          message: `Endpoint ${req.path} not supported by proxy`
        }
      });
    });
  }

  private convertAnthropicToOpenAI(anthropicReq: AnthropicRequest): OpenAIRequest {
    const messages: OpenAIMessage[] = [];

    // Get model-specific tool instructions
    const modelId = anthropicReq.model || this.defaultModel;
    const provider = this.extractProvider(modelId);
    const instructions = getInstructionsForModel(modelId, provider);
    const toolInstructions = formatInstructions(instructions);

    // Add system message with optimized tool instructions
    let systemContent = toolInstructions;
    if (anthropicReq.system) {
      systemContent += '\n\n' + anthropicReq.system;
    }

    messages.push({
      role: 'system',
      content: systemContent
    });

    // Override model - if request has a Claude model, use defaultModel instead
    const requestedModel = anthropicReq.model || '';
    const shouldOverrideModel = requestedModel.startsWith('claude-') || !requestedModel;
    const finalModel = shouldOverrideModel ? this.defaultModel : requestedModel;

    // Convert Anthropic messages to OpenAI format
    for (const msg of anthropicReq.messages) {
      let content: string;

      if (typeof msg.content === 'string') {
        content = msg.content;
      } else if (Array.isArray(msg.content)) {
        // Extract text from content blocks
        content = msg.content
          .filter(block => block.type === 'text')
          .map(block => block.text)
          .join('\n');
      } else {
        content = '';
      }

      messages.push({
        role: msg.role as 'user' | 'assistant',
        content
      });
    }

    return {
      model: finalModel,
      messages,
      max_tokens: anthropicReq.max_tokens,
      temperature: anthropicReq.temperature,
      stream: anthropicReq.stream
    };
  }

  private parseStructuredCommands(text: string): {
    cleanText: string;
    toolUses: any[]
  } {
    const toolUses: any[] = [];
    let cleanText = text;

    // Parse file_write commands
    const fileWriteRegex = /<file_write path="([^"]+)">([\s\S]*?)<\/file_write>/g;
    let match;
    while ((match = fileWriteRegex.exec(text)) !== null) {
      toolUses.push({
        type: 'tool_use',
        id: `tool_${Date.now()}_${toolUses.length}`,
        name: 'Write',
        input: {
          file_path: match[1],
          content: match[2].trim()
        }
      });
      cleanText = cleanText.replace(match[0], `[File written: ${match[1]}]`);
    }

    // Parse file_read commands
    const fileReadRegex = /<file_read path="([^"]+)"\/>/g;
    while ((match = fileReadRegex.exec(text)) !== null) {
      toolUses.push({
        type: 'tool_use',
        id: `tool_${Date.now()}_${toolUses.length}`,
        name: 'Read',
        input: {
          file_path: match[1]
        }
      });
      cleanText = cleanText.replace(match[0], `[Reading file: ${match[1]}]`);
    }

    // Parse bash commands
    const bashRegex = /<bash_command>([\s\S]*?)<\/bash_command>/g;
    while ((match = bashRegex.exec(text)) !== null) {
      toolUses.push({
        type: 'tool_use',
        id: `tool_${Date.now()}_${toolUses.length}`,
        name: 'Bash',
        input: {
          command: match[1].trim()
        }
      });
      cleanText = cleanText.replace(match[0], `[Executing: ${match[1].trim()}]`);
    }

    return { cleanText: cleanText.trim(), toolUses };
  }

  private convertOpenAIToAnthropic(openaiRes: any): any {
    const choice = openaiRes.choices?.[0];
    if (!choice) {
      throw new Error('No choices in OpenAI response');
    }

    const rawText = choice.message?.content || choice.text || '';

    // Parse structured commands from model's response
    const { cleanText, toolUses } = this.parseStructuredCommands(rawText);

    // Build content array with text and tool uses
    const contentBlocks: any[] = [];

    if (cleanText) {
      contentBlocks.push({
        type: 'text',
        text: cleanText
      });
    }

    // Add tool uses
    contentBlocks.push(...toolUses);

    return {
      id: openaiRes.id || `msg_${Date.now()}`,
      type: 'message',
      role: 'assistant',
      model: openaiRes.model,
      content: contentBlocks.length > 0 ? contentBlocks : [
        {
          type: 'text',
          text: rawText
        }
      ],
      stop_reason: this.mapFinishReason(choice.finish_reason),
      usage: {
        input_tokens: openaiRes.usage?.prompt_tokens || 0,
        output_tokens: openaiRes.usage?.completion_tokens || 0
      }
    };
  }

  private convertOpenAIStreamToAnthropic(chunk: string): string {
    // Convert OpenAI SSE format to Anthropic SSE format
    const lines = chunk.split('\n').filter(line => line.trim());
    const anthropicChunks: string[] = [];

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') {
          anthropicChunks.push('event: message_stop\ndata: {}\n\n');
          continue;
        }

        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices?.[0]?.delta;

          if (delta?.content) {
            anthropicChunks.push(
              `event: content_block_delta\ndata: ${JSON.stringify({
                type: 'content_block_delta',
                delta: { type: 'text_delta', text: delta.content }
              })}\n\n`
            );
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
    }

    return anthropicChunks.join('');
  }

  private extractProvider(modelId: string): string {
    // Extract provider from model ID (e.g., "openai/gpt-4" -> "openai")
    const parts = modelId.split('/');
    return parts.length > 1 ? parts[0] : '';
  }

  private mapFinishReason(reason?: string): string {
    const mapping: Record<string, string> = {
      'stop': 'end_turn',
      'length': 'max_tokens',
      'content_filter': 'stop_sequence',
      'function_call': 'tool_use'
    };
    return mapping[reason || 'stop'] || 'end_turn';
  }

  public start(port: number): void {
    this.app.listen(port, () => {
      logger.info('Anthropic to OpenRouter proxy started', {
        port,
        openrouterBaseUrl: this.openrouterBaseUrl,
        defaultModel: this.defaultModel
      });
      console.log(`\n✅ Anthropic Proxy running at http://localhost:${port}`);
      console.log(`   OpenRouter Base URL: ${this.openrouterBaseUrl}`);
      console.log(`   Default Model: ${this.defaultModel}\n`);
    });
  }
}

// CLI entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  const port = parseInt(process.env.PORT || '3000');
  const openrouterApiKey = process.env.OPENROUTER_API_KEY;

  if (!openrouterApiKey) {
    console.error('❌ Error: OPENROUTER_API_KEY environment variable required');
    process.exit(1);
  }

  const proxy = new AnthropicToOpenRouterProxy({
    openrouterApiKey,
    openrouterBaseUrl: process.env.ANTHROPIC_PROXY_BASE_URL,
    defaultModel: process.env.COMPLETION_MODEL || process.env.REASONING_MODEL
  });

  proxy.start(port);
}
