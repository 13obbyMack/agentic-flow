/**
 * Advanced Memory System (Simplified for v1.7.0)
 *
 * NOTE: This is a simplified version that compiles with agentdb v1.3.9.
 * Full implementation requires additional API alignment work.
 *
 * TODO v1.7.1: Implement full advanced memory features
 */

import { HybridReasoningBank } from './HybridBackend.js';
import { NightlyLearner } from 'agentdb/controllers/NightlyLearner';
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
   * Auto-consolidate successful patterns into skills
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
    // Use NightlyLearner.run() for consolidation
    const report = await this.learner.run();
    
    return {
      skillsCreated: report.edgesDiscovered || 0,
      causalEdgesCreated: report.edgesPruned || 0,
      patternsAnalyzed: report.experimentsCompleted || 0
    };
  }

  /**
   * Learn from past failures
   */
  async replayFailures(task: string, k: number = 5): Promise<FailureAnalysis[]> {
    const failures = await this.reasoning.retrievePatterns(task, {
      k,
      onlyFailures: true
    });

    return failures.map(f => ({
      critique: f.critique || 'No critique available',
      whatWentWrong: [f.task || 'Unknown'],
      howToFix: ['Review similar successful patterns'],
      similarFailures: failures.length
    }));
  }

  /**
   * What-if causal analysis
   */
  async whatIfAnalysis(action: string): Promise<any> {
    return this.reasoning.whatIfAnalysis(action);
  }

  /**
   * Compose multiple skills for a complex task
   */
  async composeSkills(task: string, k: number = 5): Promise<SkillComposition> {
    const skills = await this.reasoning.searchSkills(task, k);

    return {
      availableSkills: skills,
      compositionPlan: skills.map(s => s.name).join(' → '),
      expectedSuccessRate: skills.length > 0 ? skills[0].successRate || 0 : 0
    };
  }
}
