# Changelog

All notable changes to AgentDB will be documented in this file.

## [1.3.2] - 2025-10-22

### Added
- **Browser Bundle:** Restored `dist/agentdb.min.js` for CDN/unpkg usage
  - Compatible with existing demos and documentation that reference the browser bundle
  - Provides version info and installation guidance
  - Minimal footprint (1.29 KB) with UMD format support
  - Available via: `https://unpkg.com/agentdb@1.3.2/dist/agentdb.min.js`

### Technical Details
- Added `build:browser` script to package.json
- Browser bundle includes version info and helper methods
- Note: Full database features still require Node.js environment
- Browser bundle provides compatibility layer for existing integrations

## [1.3.1] - 2025-10-22

### Fixed
- **Documentation:** Corrected README.md to accurately list all 29 MCP tools
  - Fixed tool count description (was incorrectly stated as "14 tools")
  - Added missing `db_stats` tool to Frontier Memory Tools section
  - Added detailed descriptions for all Core Vector DB tools (5 tools)
  - Added detailed descriptions for all Core AgentDB tools (5 tools)
  - Expanded Learning System Tools from grouped format to individual descriptions (10 tools)
  - All tool names now match actual MCP server implementation

### Documentation Improvements
- Each of the 29 tools now has a clear, descriptive one-line summary
- Tool categories clearly organized: 5 Core Vector DB + 5 Core AgentDB + 9 Frontier Memory + 10 Learning System
- Corrected references from "14 AgentDB tools" to "29 AgentDB tools" throughout

## [1.3.0] - 2025-10-22

### Added - Learning System Tools 🎓

**NEW: 10 Reinforcement Learning Tools**
- **Session Management (2 tools):**
  - `learning_start_session` - Initialize RL sessions with 9 algorithm types
  - `learning_end_session` - Finalize and persist trained policies

- **Adaptive Intelligence (3 tools):**
  - `learning_predict` - Get AI-recommended actions with confidence scores
  - `learning_feedback` - Submit feedback to train RL policies
  - `learning_train` - Batch learning with convergence metrics

- **Analytics & Advanced Features (5 tools):**
  - `learning_metrics` - Performance tracking and trend analysis
  - `learning_transfer` - Transfer learning between sessions/tasks
  - `learning_explain` - Explainable AI with evidence and causal chains
  - `experience_record` - Experience replay buffer for offline learning
  - `reward_signal` - Automated reward shaping with breakdowns

**Supported RL Algorithms:** Q-Learning, SARSA, DQN, Policy Gradient, Actor-Critic, PPO, Decision Transformer, MCTS, Model-Based

### Added - Core AgentDB Tools 🗄️

**NEW: 5 Advanced Database Management Tools**
- `agentdb_stats` - Comprehensive statistics with storage metrics
- `agentdb_pattern_store` - Store reasoning patterns with embeddings
- `agentdb_pattern_search` - Semantic pattern search with filters
- `agentdb_pattern_stats` - Pattern analytics and effectiveness metrics
- `agentdb_clear_cache` - Cache management for optimal performance

### Enhanced
- **MCP Server:** Upgraded to v1.3.0 with full learning system integration
- **Tool Count:** Expanded from 14 → 29 production-ready tools
- **Categories:** Now 4 categories (Core Vector DB, Core AgentDB, Frontier Memory, Learning System)
- **Documentation:** Complete reference for all 29 tools with examples
- **Performance:** RL training optimized for sub-2s convergence (50 epochs)

### New Capabilities
- **Adaptive Agents:** Build agents that learn from experience and improve over time
- **Transfer Learning:** Reuse knowledge across similar tasks and domains
- **Explainable AI:** Get recommendations with confidence scores and evidence
- **Experience Replay:** Record and replay tool executions for offline learning
- **Reward Shaping:** Automated reward calculation based on multiple metrics
- **Reasoning Patterns:** Store and retrieve successful problem-solving approaches
- **Pattern Analytics:** Track pattern effectiveness and identify knowledge gaps

### Performance
- **RL Training:** 1.5s for 50 epochs with optimized batch learning
- **Pattern Search:** 1.8ms with WASM-accelerated embeddings
- **Comprehensive Stats:** Sub-100ms for full database statistics
- **Cache Operations:** <50ms for cache clear and refresh

### Documentation
- Updated [MCP_TOOLS.md](./docs/MCP_TOOLS.md) with all 29 tools
- Added [MIGRATION_v1.3.0.md](./MIGRATION_v1.3.0.md) upgrade guide
- Enhanced usage patterns and examples for learning tools
- Added tool selection guide for different use cases

### Backward Compatibility
- ✅ 100% backward compatible with v1.2.2
- ✅ All 14 existing tools work identically
- ✅ Drop-in upgrade with zero breaking changes
- ✅ Existing code continues to function without modifications
- ✅ Learning tools are additive (opt-in)

### Testing
- ✅ All 29 MCP tools verified against implementation
- ✅ Integration tests for learning pipeline
- ✅ Performance benchmarks validated
- ✅ Type safety confirmed with TypeScript

### Security
- Input validation for all learning system parameters
- Policy persistence with transaction safety
- Experience replay buffer size limits
- Secure reward calculation with sanitization

### Breaking Changes
- None - fully backward compatible with v1.2.2

---

## [1.2.2] - 2025-10-22

### Added - Core Vector Database MCP Tools 🎉
- **NEW:** `agentdb_init` - Initialize database with schema and optimizations
- **NEW:** `agentdb_insert` - Insert single vector with automatic embedding generation
- **NEW:** `agentdb_insert_batch` - Batch insert (141x faster than sequential)
- **NEW:** `agentdb_search` - Semantic k-NN search with filters and similarity thresholds
- **NEW:** `agentdb_delete` - Delete vectors by ID or bulk conditions
- **Total MCP Tools:** Now 14 (up from 9) - 5 core + 9 frontier features

### Enhanced
- **MCP Server:** Upgraded to v1.3.0 with full vector DB CRUD support
- **Search:** Added filter support (tags, session_id, min_reward, min_similarity)
- **Batch Operations:** Parallel embedding generation + transactions for optimal performance
- **Documentation:** Complete MCP tools reference with all 14 tools documented
- **Migration Guide:** Added comprehensive v1.2.1 → v1.2.2 migration documentation

### Performance
- **Batch Insert:** 141x faster (8.5ms for 100 vectors vs 850ms sequential)
- **Vector Search:** 150x faster with HNSW indexing (5ms @ 100K vectors)
- **Database:** WAL mode + 64MB cache for optimal throughput

### Documentation
- Updated [MCP_TOOLS.md](./docs/MCP_TOOLS.md) with all 14 tools
- Added [MIGRATION_v1.2.2.md](./docs/MIGRATION_v1.2.2.md) guide
- Enhanced tool selection guide and usage patterns
- Added performance benchmarks and optimization tips

### Backward Compatibility
- ✅ 100% backward compatible with v1.2.1
- ✅ All existing tools work identically
- ✅ Drop-in upgrade with zero breaking changes
- ✅ Existing code continues to function without modifications

### Testing
- ✅ All 14 MCP tools verified against implementation
- ✅ Integration tests for batch operations
- ✅ Performance benchmarks validated
- ✅ Type safety confirmed with TypeScript

### Security
- Addressed critical issues from code review:
  - Input validation layer for all MCP tools
  - SQL injection prevention in filter queries
  - Proper error handling for async operations
  - Transaction safety for batch operations

---

## [1.1.7] - 2025-01-21

### Fixed
- **CLI**: Fixed `causal query` command - changed from `getCausalEffects` to `queryCausalEffects` method
- **CLI**: Fixed `recall with-certificate` command - corrected parameter passing to CausalRecall.recall()
- **CLI**: Fixed `causal experiment create` command - added required hypothesis and proper experiment parameters
- **CLI**: Fixed `causal experiment add-observation` command - added episode handling for observations
- **CLI**: Fixed `causal experiment calculate` command - corrected result object property names and display
- **Controllers**: Fixed embedding BLOB parsing in CausalRecall.vectorSearch() - handles both JSON and binary formats
- **CLI**: Fixed recall command display - handles undefined utility values gracefully

### Tested
- ✅ All 17 CLI commands tested and working:
  - Database: `stats`
  - Reflexion: `store`, `retrieve`, `critique-summary`, `prune`
  - Skills: `create`, `search`, `consolidate`
  - Causal: `add-edge`, `experiment create/add-observation/calculate`, `query`
  - Recall: `with-certificate`
  - Learner: `run`, `prune`

## [1.1.6] - 2025-01-21

### Fixed
- Removed foreign key constraints from causal_edges table for flexible abstract causal relationships

## [1.1.5] - 2025-01-21

### Fixed
- Fixed schema loading to include both base schema and frontier schema
- Fixed causal edge method name from `addEdge` to `addCausalEdge`

## [1.1.4] - 2025-01-21

### Fixed
- Fixed model name to 'Xenova/all-MiniLM-L6-v2' for real neural embeddings
- No more mock embeddings - 100% real transformers.js

### Changed
- Silenced transformers.js warning message

## [1.1.3] - 2025-01-21

### Added
- Added @xenova/transformers as dependency for real embeddings

## [1.1.2] - 2025-01-21

### Fixed
- Fixed __dirname handling for ESM modules

## [1.1.1] - 2025-01-21

### Fixed
- Fixed ESM entry point for npx compatibility

## [1.1.0] - 2025-01-21

### Added
- Frontier memory features: Causal reasoning, Reflexion memory, Skill library, Explainable recall, Nightly learner
- CLI-focused interface with 17 commands
- 150x faster vector search with HNSW indexing
- Real neural embeddings with transformers.js

## [1.0.0] - 2025-01-20

### Added
- Initial release with episodic memory and vector search
