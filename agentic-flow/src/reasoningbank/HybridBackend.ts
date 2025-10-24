/**
 * Hybrid ReasoningBank Backend
 *
 * Combines Rust WASM (compute) + AgentDB TypeScript (storage) for optimal performance:
 * - WASM: 10x faster similarity computation
 * - AgentDB: Persistent SQLite storage with frontier memory
 * - Automatic backend selection based on task requirements
 *
 * @example
 * ```typescript
 * import { HybridReasoningBank } from 'agentic-flow/reasoningbank';
 *
 * const rb = new HybridReasoningBank({ preferWasm: true });
 * await rb.storePattern({ task: '...', success: true, reward: 0.95 });
 * const patterns = await rb.retrievePatterns('similar task', 5);
 * ```
 */

import { SharedMemoryPool } from '../memory/SharedMemoryPool.js';
import { ReflexionMemory, SkillLibrary, CausalRecall } from 'agentdb/controllers';

export interface PatternData {
  sessionId: string;
  task: string;
  input?: string;
  output?: string;
  critique?: string;
  success: boolean;
  reward: number;
  latencyMs?: number;
  tokensUsed?: number;
}

export interface RetrievalOptions {
  k?: number;
  minSimilarity?: number;
  onlySuccesses?: boolean;
  onlyFailures?: boolean;
}

export interface CausalInsight {
  action: string;
  avgReward: number;
  avgUplift: number;
  confidence: number;
  evidenceCount: number;
  recommendation: 'DO_IT' | 'AVOID' | 'NEUTRAL';
}

export class HybridReasoningBank {
  private memory: SharedMemoryPool;
  private reflexion: ReflexionMemory;
  private skills: SkillLibrary;
  private causalRecall: CausalRecall;
  private useWasm: boolean;
  private wasmModule: any = null;

  constructor(options: { preferWasm?: boolean } = {}) {
    // Use shared memory pool for optimal resource usage
    this.memory = SharedMemoryPool.getInstance();
    const db = this.memory.getDatabase();
    const embedder = this.memory.getEmbedder();

    // Initialize AgentDB controllers
    this.reflexion = new ReflexionMemory(db, embedder);
    this.skills = new SkillLibrary(db, embedder);
    this.causalRecall = new CausalRecall(db, embedder);

    // WASM preference (can be toggled runtime)
    this.useWasm = options.preferWasm ?? false;

    // Lazy load WASM module if needed
    if (this.useWasm) {
      this.loadWasmModule();
    }
  }

  private async loadWasmModule() {
    try {
      // Lazy load Rust WASM module
      const wasmPath = '../wasm/reasoningbank/reasoningbank_wasm.js';
      this.wasmModule = await import(wasmPath);
    } catch (error) {
      console.warn('[HybridReasoningBank] WASM module not available, falling back to TypeScript:', error);
      this.useWasm = false;
    }
  }

  /**
   * Store a pattern/experience in ReasoningBank
   *
   * Always stored in AgentDB (persistent SQLite) regardless of WASM preference
   */
  async storePattern(pattern: PatternData): Promise<number> {
    await this.memory.ensureInitialized();

    return this.reflexion.storeEpisode({
      sessionId: pattern.sessionId,
      task: pattern.task,
      input: pattern.input || '',
      output: pattern.output || '',
      critique: pattern.critique || '',
      reward: pattern.reward,
      success: pattern.success,
      latencyMs: pattern.latencyMs || 0,
      tokensUsed: pattern.tokensUsed || 0
    });
  }

  /**
   * Retrieve relevant patterns using hybrid backend
   *
   * - WASM: Fast similarity computation (10x faster)
   * - AgentDB: Hydrate results with full metadata
   */
  async retrievePatterns(query: string, options: RetrievalOptions = {}): Promise<any[]> {
    await this.memory.ensureInitialized();

    const {
      k = 5,
      minSimilarity = 0.7,
      onlySuccesses = false,
      onlyFailures = false
    } = options;

    // Check query cache first
    const cacheKey = `retrieve:${query}:${k}:${minSimilarity}:${onlySuccesses}:${onlyFailures}`;
    const cached = this.memory.getCachedQuery(cacheKey);
    if (cached) return cached;

    if (this.useWasm && this.wasmModule) {
      try {
        // WASM path: Fast similarity computation
        const embedding = await this.memory.getCachedEmbedding(query);
        const wasmResults = this.wasmModule.search_patterns(
          Array.from(embedding),
          k
        );

        // Hydrate results from AgentDB
        const results = await Promise.all(
          wasmResults.map((id: number) => this.reflexion.getEpisode(id))
        );

        // Filter by criteria
        let filtered = results.filter(r => r !== null);
        if (onlySuccesses) filtered = filtered.filter(r => r.success);
        if (onlyFailures) filtered = filtered.filter(r => !r.success);

        // Cache and return
        this.memory.cacheQuery(cacheKey, filtered, 60000);
        return filtered;
      } catch (error) {
        console.warn('[HybridReasoningBank] WASM search failed, falling back to AgentDB:', error);
        // Fall through to AgentDB
      }
    }

    // AgentDB path: TypeScript implementation
    const results = await this.reflexion.retrieveRelevant({
      task: query,
      k,
      minSimilarity,
      onlySuccesses,
      onlyFailures
    });

    this.memory.cacheQuery(cacheKey, results, 60000);
    return results;
  }

  /**
   * Learn optimal strategy for a task
   *
   * Combines pattern retrieval with causal analysis
   */
  async learnStrategy(task: string): Promise<{
    patterns: any[];
    causality: CausalInsight;
    confidence: number;
    recommendation: string;
  }> {
    await this.memory.ensureInitialized();

    // Retrieve relevant patterns
    const patterns = await this.retrievePatterns(task, { k: 10, onlySuccesses: true });

    // Get causal insights
    const causalData = await this.causalRecall.query(task, { k: 5, minUplift: 0.1 });

    // Calculate combined confidence
    const patternConf = patterns.length > 0
      ? patterns.reduce((sum, p) => sum + (p.similarity || 0), 0) / patterns.length
      : 0;
    const causalConf = causalData.avgUplift || 0;
    const confidence = 0.6 * patternConf + 0.4 * Math.abs(causalConf);

    // Generate causality insight
    const causality: CausalInsight = {
      action: task,
      avgReward: causalData.avgReward || 0,
      avgUplift: causalData.avgUplift || 0,
      confidence: causalData.confidence || 0,
      evidenceCount: causalData.evidenceCount || 0,
      recommendation: causalConf > 0.1 ? 'DO_IT' : causalConf < -0.1 ? 'AVOID' : 'NEUTRAL'
    };

    // Generate recommendation
    let recommendation = '';
    if (patterns.length === 0) {
      recommendation = 'No prior experience - proceed with caution';
    } else if (causality.recommendation === 'DO_IT') {
      recommendation = `Strong evidence for success (${patterns.length} similar patterns, +${(causalConf * 100).toFixed(1)}% uplift)`;
    } else if (causality.recommendation === 'AVOID') {
      recommendation = `Evidence suggests avoiding (${patterns.length} similar patterns, ${(causalConf * 100).toFixed(1)}% uplift)`;
    } else {
      recommendation = `Moderate confidence (${patterns.length} similar patterns, inconclusive causality)`;
    }

    return {
      patterns,
      causality,
      confidence,
      recommendation
    };
  }

  /**
   * Auto-consolidate successful patterns into skills
   */
  async autoConsolidate(options: {
    minUses?: number;
    minSuccessRate?: number;
    lookbackDays?: number;
  } = {}): Promise<number> {
    await this.memory.ensureInitialized();

    const {
      minUses = 3,
      minSuccessRate = 0.7,
      lookbackDays = 7
    } = options;

    return this.skills.consolidate(minUses, minSuccessRate, lookbackDays);
  }

  /**
   * Get causal "what-if" analysis for an action
   */
  async whatIfAnalysis(action: string): Promise<CausalInsight> {
    await this.memory.ensureInitialized();

    const causal = await this.causalRecall.query(action, { k: 5, minUplift: 0.0 });

    return {
      action,
      avgReward: causal.avgReward || 0,
      avgUplift: causal.avgUplift || 0,
      confidence: causal.confidence || 0,
      evidenceCount: causal.evidenceCount || 0,
      recommendation: (causal.avgUplift || 0) > 0.1 ? 'DO_IT' :
                     (causal.avgUplift || 0) < -0.1 ? 'AVOID' : 'NEUTRAL'
    };
  }

  /**
   * Search for applicable skills
   */
  async searchSkills(taskType: string, k: number = 5) {
    await this.memory.ensureInitialized();
    return this.skills.search(taskType, k);
  }

  /**
   * Get statistics about stored patterns
   */
  getStats() {
    return this.memory.getStats();
  }
}
