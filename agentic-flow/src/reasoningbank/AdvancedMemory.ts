/**
 * Advanced Memory System
 *
 * Provides high-level memory operations on top of HybridReasoningBank:
 * - Auto-consolidation (patterns → skills)
 * - Episodic replay (learn from failures)
 * - Causal reasoning (what-if analysis)
 * - Skill composition (combine learned skills)
 *
 * @example
 * ```typescript
 * import { AdvancedMemorySystem } from 'agentic-flow/reasoningbank';
 *
 * const memory = new AdvancedMemorySystem();
 * await memory.autoConsolidate();
 * const failures = await memory.replayFailures('authentication');
 * const insight = await memory.whatIfAnalysis('add caching');
 * ```
 */

import { HybridReasoningBank } from './HybridBackend.js';
import { NightlyLearner } from 'agentdb/controllers';
import { SharedMemoryPool } from '../memory/SharedMemoryPool.js';

export interface FailureAnalysis {
  critique: string;
  whatWentWrong: string[];
  howToFix: string[];
  similarFailures: number;
}

export interface SkillComposition {
  availableSkills: any[];
  compositionPlan: string;
  expectedSuccessRate: number;
}

export class AdvancedMemorySystem {
  private reasoning: HybridReasoningBank;
  private learner: NightlyLearner;
  private pool: SharedMemoryPool;

  constructor(options: { preferWasm?: boolean } = {}) {
    this.reasoning = new HybridReasoningBank(options);
    this.pool = SharedMemoryPool.getInstance();

    const db = this.pool.getDatabase();
    const embedder = this.pool.getEmbedder();
    this.learner = new NightlyLearner(db, embedder);
  }

  /**
   * Auto-consolidation: Turn repeated successes into reusable skills
   *
   * Runs automated pattern discovery to find skills worth extracting
   */
  async autoConsolidate(options: {
    minUses?: number;
    minSuccessRate?: number;
    lookbackDays?: number;
    dryRun?: boolean;
  } = {}): Promise<{
    skillsCreated: number;
    causalEdgesCreated: number;
    patternsAnalyzed: number;
  }> {
    const {
      minUses = 3,
      minSuccessRate = 0.7,
      lookbackDays = 7,
      dryRun = false
    } = options;

    // Use NightlyLearner for causal discovery
    const result = await this.learner.discoverPatterns({
      minUses,
      minSuccessRate,
      lookbackDays,
      dryRun
    });

    return {
      skillsCreated: result.skillsConsolidated || 0,
      causalEdgesCreated: result.causalEdgesCreated || 0,
      patternsAnalyzed: result.episodesAnalyzed || 0
    };
  }

  /**
   * Episodic replay: Learn from failures
   *
   * Retrieves past failures for a task and provides analysis
   */
  async replayFailures(task: string, k: number = 5): Promise<FailureAnalysis[]> {
    const failures = await this.reasoning.retrievePatterns(task, {
      k,
      onlyFailures: true,
      minSimilarity: 0.5
    });

    return failures.map(failure => ({
      critique: failure.critique || 'No critique available',
      whatWentWrong: this.extractErrors(failure),
      howToFix: this.generateFixes(failure),
      similarFailures: failures.length
    }));
  }

  /**
   * Causal reasoning: What-if analysis
   *
   * Analyzes the expected outcome of an action based on causal evidence
   */
  async whatIfAnalysis(action: string) {
    return this.reasoning.whatIfAnalysis(action);
  }

  /**
   * Skill composition: Combine learned skills
   *
   * Finds applicable skills and suggests how to compose them
   */
  async composeSkills(taskType: string, k: number = 5): Promise<SkillComposition> {
    const skills = await this.reasoning.searchSkills(taskType, k);

    return {
      availableSkills: skills,
      compositionPlan: this.planSkillComposition(skills),
      expectedSuccessRate: this.estimateComposedSuccess(skills)
    };
  }

  /**
   * Store a new experience/pattern
   */
  async storeExperience(experience: {
    sessionId: string;
    task: string;
    success: boolean;
    reward: number;
    critique?: string;
    input?: string;
    output?: string;
  }) {
    return this.reasoning.storePattern(experience);
  }

  /**
   * Get memory system statistics
   */
  getStats() {
    return this.reasoning.getStats();
  }

  // Private helper methods

  private extractErrors(failure: any): string[] {
    const critique = failure.critique || '';
    return critique
      .split('\n')
      .filter((line: string) =>
        line.toLowerCase().includes('error') ||
        line.toLowerCase().includes('failed') ||
        line.toLowerCase().includes('wrong')
      )
      .slice(0, 5); // Top 5 errors
  }

  private generateFixes(failure: any): string[] {
    // Simple rule-based fix suggestions
    // In production, could use LLM for more sophisticated analysis
    const fixes: string[] = [];
    const critique = failure.critique?.toLowerCase() || '';

    if (critique.includes('timeout')) {
      fixes.push('Add timeout handling with retry logic');
    }
    if (critique.includes('validation')) {
      fixes.push('Add comprehensive input validation');
    }
    if (critique.includes('null') || critique.includes('undefined')) {
      fixes.push('Add null/undefined checks and default values');
    }
    if (critique.includes('auth')) {
      fixes.push('Verify authentication credentials and permissions');
    }
    if (critique.includes('rate limit')) {
      fixes.push('Implement exponential backoff and rate limiting');
    }

    // Generic fallbacks
    if (fixes.length === 0) {
      fixes.push('Add error handling and logging');
      fixes.push('Validate inputs before processing');
      fixes.push('Add retry logic for transient failures');
    }

    return fixes.slice(0, 3); // Top 3 fixes
  }

  private planSkillComposition(skills: any[]): string {
    if (skills.length === 0) return 'No skills available';
    if (skills.length === 1) return skills[0].name;

    // Create sequential composition plan
    return skills
      .map(s => s.name)
      .join(' → ');
  }

  private estimateComposedSuccess(skills: any[]): number {
    if (skills.length === 0) return 0;

    // Multiply individual success rates (conservative estimate)
    return skills.reduce(
      (acc, skill) => acc * (skill.successRate || 0.5),
      1.0
    );
  }
}
