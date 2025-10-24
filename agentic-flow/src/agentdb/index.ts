/**
 * AgentDB Re-exports for Backwards Compatibility
 *
 * This module provides backwards-compatible exports for code that previously
 * used embedded AgentDB controllers. Now proxies to agentdb npm package.
 *
 * @deprecated Import directly from 'agentdb/controllers' for better tree-shaking
 * @since v1.7.0 - Integrated agentdb as proper dependency
 */

// Re-export all controllers from agentdb package
export {
  ReflexionMemory,
  SkillLibrary,
  CausalMemoryGraph,
  CausalRecall,
  NightlyLearner,
  EmbeddingService,
  LearningSystem,
  ReasoningBank
} from 'agentdb/controllers';

// Re-export optimizations
export {
  BatchOperations,
  QueryOptimizer
} from 'agentdb/optimizations';

// For backwards compatibility with existing imports
export * from 'agentdb/controllers';
export * from 'agentdb/optimizations';
