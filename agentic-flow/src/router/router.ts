// Multi-model router core implementation
import { readFileSync, existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import {
  LLMProvider,
  RouterConfig,
  ChatParams,
  ChatResponse,
  StreamChunk,
  ProviderType,
  RouterMetrics,
  ProviderError
} from './types.js';
import { OpenRouterProvider } from './providers/openrouter.js';
import { AnthropicProvider } from './providers/anthropic.js';
import { ONNXLocalProvider } from './providers/onnx-local.js';

export class ModelRouter {
  private config: RouterConfig;
  private providers: Map<ProviderType, LLMProvider> = new Map();
  private metrics: RouterMetrics;

  constructor(configPath?: string) {
    this.config = this.loadConfig(configPath);
    this.initializeProviders();
    this.metrics = this.initializeMetrics();
  }

  private loadConfig(configPath?: string): RouterConfig {
    const paths = [
      configPath,
      process.env.AGENTIC_FLOW_ROUTER_CONFIG,
      join(homedir(), '.agentic-flow', 'router.config.json'),
      join(process.cwd(), 'router.config.json'),
      join(process.cwd(), 'router.config.example.json')
    ].filter(Boolean) as string[];

    for (const path of paths) {
      if (existsSync(path)) {
        const content = readFileSync(path, 'utf-8');
        const config = JSON.parse(content);

        // Substitute environment variables
        return this.substituteEnvVars(config);
      }
    }

    throw new Error('No router configuration file found');
  }

  private substituteEnvVars(obj: any): any {
    if (typeof obj === 'string') {
      // Replace ${VAR_NAME} with environment variable value
      return obj.replace(/\$\{([^}]+)\}/g, (_, key) => {
        const [varName, defaultValue] = key.split(':-');
        return process.env[varName] || defaultValue || '';
      });
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.substituteEnvVars(item));
    }

    if (obj && typeof obj === 'object') {
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = this.substituteEnvVars(value);
      }
      return result;
    }

    return obj;
  }

  private initializeProviders(): void {
    // Initialize Anthropic
    if (this.config.providers.anthropic) {
      try {
        const provider = new AnthropicProvider(this.config.providers.anthropic);
        this.providers.set('anthropic', provider);
        console.log('✅ Anthropic provider initialized');
      } catch (error) {
        console.error('❌ Failed to initialize Anthropic:', error);
      }
    }

    // Initialize OpenRouter
    if (this.config.providers.openrouter) {
      try {
        const provider = new OpenRouterProvider(this.config.providers.openrouter);
        this.providers.set('openrouter', provider);
        console.log('✅ OpenRouter provider initialized');
      } catch (error) {
        console.error('❌ Failed to initialize OpenRouter:', error);
      }
    }

    // Initialize ONNX Local
    if (this.config.providers.onnx) {
      try {
        const provider = new ONNXLocalProvider({
          modelPath: this.config.providers.onnx.modelPath || './models/phi-4/cpu_and_mobile/cpu-int4-rtn-block-32-acc-level-4/model.onnx',
          executionProviders: this.config.providers.onnx.executionProviders || ['cpu'],
          maxTokens: this.config.providers.onnx.maxTokens || 100,
          temperature: this.config.providers.onnx.temperature || 0.7
        });
        this.providers.set('onnx', provider);
        console.log('✅ ONNX Local provider initialized');
      } catch (error) {
        console.error('❌ Failed to initialize ONNX:', error);
      }
    }

    // TODO: Initialize other providers (OpenAI, Ollama, LiteLLM)
    // Will be implemented in Phase 1
  }

  private initializeMetrics(): RouterMetrics {
    return {
      totalRequests: 0,
      totalCost: 0,
      totalTokens: { input: 0, output: 0 },
      providerBreakdown: {},
      agentBreakdown: {}
    };
  }

  async chat(params: ChatParams, agentType?: string): Promise<ChatResponse> {
    const startTime = Date.now();
    const provider = await this.selectProvider(params, agentType);

    try {
      const response = await provider.chat(params);

      // Update metrics
      this.updateMetrics(provider.name, response, Date.now() - startTime, agentType);

      // Add metadata
      response.metadata = {
        ...response.metadata,
        provider: provider.name,
        latency: Date.now() - startTime
      };

      return response;
    } catch (error) {
      return this.handleProviderError(error as ProviderError, params, agentType);
    }
  }

  async *stream(params: ChatParams, agentType?: string): AsyncGenerator<StreamChunk> {
    const provider = await this.selectProvider(params, agentType);

    if (!provider.stream) {
      throw new Error(`Provider ${provider.name} does not support streaming`);
    }

    try {
      const iterator = provider.stream(params);
      for await (const chunk of iterator) {
        yield chunk;
      }
    } catch (error) {
      throw error;
    }
  }

  private async selectProvider(params: ChatParams, agentType?: string): Promise<LLMProvider> {
    const routingMode = this.config.routing?.mode || 'manual';

    switch (routingMode) {
      case 'manual':
        return this.getDefaultProvider();

      case 'rule-based':
        return this.selectByRules(params, agentType);

      case 'cost-optimized':
        return this.selectByCost(params);

      case 'performance-optimized':
        return this.selectByPerformance(params);

      default:
        return this.getDefaultProvider();
    }
  }

  private getDefaultProvider(): LLMProvider {
    const provider = this.providers.get(this.config.defaultProvider);
    if (!provider) {
      throw new Error(`Default provider ${this.config.defaultProvider} not initialized`);
    }
    return provider;
  }

  private selectByRules(params: ChatParams, agentType?: string): LLMProvider {
    const rules = this.config.routing?.rules || [];

    for (const rule of rules) {
      if (this.matchesRule(rule.condition, params, agentType)) {
        const provider = this.providers.get(rule.action.provider);
        if (provider) {
          console.log(`🎯 Routing via rule: ${rule.reason || 'matched condition'}`);
          return provider;
        }
      }
    }

    return this.getDefaultProvider();
  }

  private matchesRule(condition: any, params: ChatParams, agentType?: string): boolean {
    if (condition.agentType && agentType) {
      if (!condition.agentType.includes(agentType)) {
        return false;
      }
    }

    if (condition.requiresTools !== undefined) {
      if (condition.requiresTools && (!params.tools || params.tools.length === 0)) {
        return false;
      }
    }

    // TODO: Add more condition matching logic

    return true;
  }

  private selectByCost(params: ChatParams): LLMProvider {
    // For now, prefer cheaper providers
    // TODO: Implement actual cost calculation
    const providerOrder: ProviderType[] = ['openrouter', 'anthropic', 'openai'];

    for (const providerType of providerOrder) {
      const provider = this.providers.get(providerType);
      if (provider) {
        console.log(`💰 Cost-optimized routing: selected ${provider.name}`);
        return provider;
      }
    }

    return this.getDefaultProvider();
  }

  private selectByPerformance(params: ChatParams): LLMProvider {
    // For now, use metrics to select fastest provider
    let fastestProvider: LLMProvider | null = null;
    let lowestLatency = Infinity;

    for (const [providerType, provider] of this.providers) {
      const breakdown = this.metrics.providerBreakdown[providerType];
      if (breakdown && breakdown.avgLatency < lowestLatency) {
        lowestLatency = breakdown.avgLatency;
        fastestProvider = provider;
      }
    }

    if (fastestProvider) {
      console.log(`⚡ Performance-optimized routing: selected ${fastestProvider.name}`);
      return fastestProvider;
    }

    return this.getDefaultProvider();
  }

  private async handleProviderError(
    error: ProviderError,
    params: ChatParams,
    agentType?: string
  ): Promise<ChatResponse> {
    console.error(`❌ Provider error from ${error.provider}:`, error.message);

    // Try fallback chain
    const fallbackChain = this.config.fallbackChain || [];

    for (const providerType of fallbackChain) {
      if (providerType === error.provider) continue; // Skip failed provider

      const provider = this.providers.get(providerType);
      if (provider) {
        console.log(`🔄 Falling back to ${provider.name}`);
        try {
          return await provider.chat(params);
        } catch (fallbackError) {
          console.error(`❌ Fallback provider ${provider.name} also failed`);
          continue;
        }
      }
    }

    throw error; // No fallback succeeded
  }

  private updateMetrics(
    providerName: string,
    response: ChatResponse,
    latency: number,
    agentType?: string
  ): void {
    this.metrics.totalRequests++;

    if (response.usage) {
      this.metrics.totalTokens.input += response.usage.inputTokens;
      this.metrics.totalTokens.output += response.usage.outputTokens;
    }

    if (response.metadata?.cost) {
      this.metrics.totalCost += response.metadata.cost;
    }

    // Provider breakdown
    if (!this.metrics.providerBreakdown[providerName]) {
      this.metrics.providerBreakdown[providerName] = {
        requests: 0,
        cost: 0,
        avgLatency: 0,
        errors: 0
      };
    }

    const breakdown = this.metrics.providerBreakdown[providerName];
    breakdown.requests++;
    breakdown.cost += response.metadata?.cost || 0;
    breakdown.avgLatency = (breakdown.avgLatency * (breakdown.requests - 1) + latency) / breakdown.requests;

    // Agent breakdown
    if (agentType) {
      if (!this.metrics.agentBreakdown) {
        this.metrics.agentBreakdown = {};
      }
      if (!this.metrics.agentBreakdown[agentType]) {
        this.metrics.agentBreakdown[agentType] = { requests: 0, cost: 0 };
      }
      this.metrics.agentBreakdown[agentType].requests++;
      this.metrics.agentBreakdown[agentType].cost += response.metadata?.cost || 0;
    }
  }

  getMetrics(): RouterMetrics {
    return { ...this.metrics };
  }

  getConfig(): RouterConfig {
    return { ...this.config };
  }

  getProviders(): Map<ProviderType, LLMProvider> {
    return new Map(this.providers);
  }
}
