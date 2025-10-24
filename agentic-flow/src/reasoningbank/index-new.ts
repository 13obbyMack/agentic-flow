/**
 * ReasoningBank - Closed-loop memory system for AI agents
 * Based on arXiv:2509.25140 (Google DeepMind)
 *
 * @since v1.7.0 - Integrated AgentDB for optimal performance
 */

// New hybrid backend (recommended for new code)
export { HybridReasoningBank } from './HybridBackend.js';
export { AdvancedMemorySystem } from './AdvancedMemory.js';
export type { PatternData, RetrievalOptions, CausalInsight } from './HybridBackend.js';
export type { FailureAnalysis, SkillComposition } from './AdvancedMemory.js';

// Re-export AgentDB controllers for advanced usage
export { ReflexionMemory } from 'agentdb/controllers/ReflexionMemory';
export { SkillLibrary } from 'agentdb/controllers/SkillLibrary';
export { CausalMemoryGraph } from 'agentdb/controllers/CausalMemoryGraph';
export { CausalRecall } from 'agentdb/controllers/CausalRecall';
export { NightlyLearner } from 'agentdb/controllers/NightlyLearner';
export { EmbeddingService } from 'agentdb/controllers/EmbeddingService';

// Original ReasoningBank implementations (backwards compatibility)
export { retrieveMemories, formatMemoriesForPrompt } from './core/retrieve.js';
export type { RetrievedMemory } from './core/retrieve.js';

export { judgeTrajectory } from './core/judge.js';
export type { Verdict } from './core/judge.js';

export { distillMemories } from './core/distill.js';
export type { DistilledMemory } from './core/distill.js';

export { consolidate, shouldConsolidate } from './core/consolidate.js';
export type { ConsolidationResult } from './core/consolidate.js';

export { mattsParallel, mattsSequential } from './core/matts.js';
export type { MattsResult } from './core/matts.js';

export { computeEmbedding, clearEmbeddingCache } from './utils/embeddings.js';
export { mmrSelection, cosineSimilarity } from './utils/mmr.js';
export { scrubPII, containsPII, scrubMemory } from './utils/pii-scrubber.js';
export { loadConfig } from './utils/config.js';

// Re-export database utilities
import * as db from './db/queries.js';
export { db };
export type {
  ReasoningMemory,
  PatternEmbedding,
  PatternLink,
  TaskTrajectory,
  MattsRun,
  ConsolidationRun,
  Trajectory,
  TrajectoryStep
} from './db/schema.js';

// Original functions (backwards compatibility)
import { loadConfig } from './utils/config.js';
import { retrieveMemories } from './core/retrieve.js';
import { judgeTrajectory } from './core/judge.js';
import { distillMemories } from './core/distill.js';
import { shouldConsolidate as shouldCons, consolidate as cons } from './core/consolidate.js';

export async function initialize(): Promise<void> {
  const config = loadConfig();
  console.log('[ReasoningBank] Initializing...');
  console.log(`[ReasoningBank] Enabled: ${!!process.env.REASONINGBANK_ENABLED}`);
  console.log(`[ReasoningBank] Database: ${process.env.CLAUDE_FLOW_DB_PATH || '.swarm/memory.db'}`);
  console.log(`[ReasoningBank] Embeddings: ${config.embeddings.provider}`);
  console.log(`[ReasoningBank] Retrieval k: ${config.retrieve.k}`);

  try {
    await db.runMigrations();
    console.log(`[ReasoningBank] Database migrated successfully`);
  } catch (error) {
    console.error('[ReasoningBank] Migration error:', error);
    throw new Error('ReasoningBank initialization failed: could not run migrations');
  }

  try {
    const dbConn = db.getDb();
    const tables = dbConn.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'pattern%'").all();
    console.log(`[ReasoningBank] Database OK: ${tables.length} tables found`);
  } catch (error) {
    console.error('[ReasoningBank] Database error:', error);
    throw new Error('ReasoningBank initialization failed: database not accessible');
  }

  console.log('[ReasoningBank] Initialization complete');
}

export async function runTask(options: {
  taskId: string;
  agentId: string;
  query: string;
  domain?: string;
  executeFn: (memories: any[]) => Promise<any>;
}): Promise<{
  verdict: any;
  usedMemories: any[];
  newMemories: string[];
  consolidated: boolean;
}> {
  console.log(`[ReasoningBank] Running task: ${options.taskId}`);
  const memories = await retrieveMemories(options.query, {
    domain: options.domain,
    agent: options.agentId
  });
  console.log(`[ReasoningBank] Retrieved ${memories.length} memories`);
  const trajectory = await options.executeFn(memories);
  const verdict = await judgeTrajectory(trajectory, options.query);
  console.log(`[ReasoningBank] Verdict: ${verdict.label} (${verdict.confidence})`);
  const newMemories = await distillMemories(trajectory, verdict, options.query, {
    taskId: options.taskId,
    agentId: options.agentId,
    domain: options.domain
  });
  console.log(`[ReasoningBank] Distilled ${newMemories.length} new memories`);
  let consolidated = false;
  if (shouldCons()) {
    console.log('[ReasoningBank] Running consolidation...');
    await cons();
    consolidated = true;
  }
  return { verdict, usedMemories: memories, newMemories, consolidated };
}

export const VERSION = '1.7.0';
export const PAPER_URL = 'https://arxiv.org/html/2509.25140v1';
