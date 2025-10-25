# Changelog

All notable changes to AgentDB will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.6.0] - 2025-10-25

### Added
- **Direct Vector Search CLI**: New `vector-search` command for raw vector similarity queries
  - Three distance metrics: cosine similarity, euclidean distance, dot product
  - Configurable k (number of results) and threshold parameters
  - JSON and table output formats
- **MMR Diversity Ranking**: Maximal Marginal Relevance algorithm for diverse result sets
  - CLI flag: `--mmr [lambda]` where lambda balances relevance vs diversity (0-1)
  - JavaScript API: `MMRDiversityRanker.selectDiverse()`
  - Works with all distance metrics
- **Context Synthesis**: Intelligent summarization and insight generation from memories
  - CLI flag: `--synthesize-context` for query and reflexion retrieve commands
  - JavaScript API: `ContextSynthesizer.synthesize()`
  - Generates summaries, patterns, insights, and actionable recommendations
- **Advanced Metadata Filtering**: MongoDB-style query operators
  - 10 operators: $eq, $ne, $gt, $gte, $lt, $lte, $in, $nin, $contains, $exists
  - CLI parameter: `--filters <json>`
  - JavaScript API: `MetadataFilter.apply()` and `MetadataFilter.toSQL()`
  - Nested path support for complex queries
- **Enhanced Init Command**: More initialization options
  - Custom embedding dimensions: `--dimension 384|768|1536`
  - Database presets: `--preset small|medium|large`
  - In-memory databases: `--in-memory`
- **Export/Import with Compression**: Data portability features
  - Export command with `--compress` flag (gzip compression)
  - Import command with `--decompress` flag
  - Automatic compression ratio reporting
  - Supports both .json and .json.gz formats
- **Stats Command**: Comprehensive database analytics
  - Episode, embedding, skill, and causal edge counts
  - Database size and storage metrics
  - Coverage statistics
  - Top 5 domain listing

### Fixed
- **Database Persistence**: Critical fix for sql.js WASM data persistence
  - Added `db.save()` calls after all write operations
  - Episodes, skills, and causal edges now correctly persist to disk
  - Affected methods: reflexion store, skill create, skill consolidate, causal observation
- **Browser Bundle WASM Loading**: Resolved test failures in browser environment
  - Added environment-aware path detection
  - Local `node_modules` path for Node.js testing
  - CDN fallback for browser environments
  - Quieted unnecessary WASM fallback logs
- **Package Exports**: All new controllers properly exported
  - MMRDiversityRanker accessible via package API
  - ContextSynthesizer accessible via package API
  - MetadataFilter accessible via package API
  - TypeScript types included for all controllers

### Changed
- **Documentation**: Updated to accurately reflect v1.6.0 features
  - Removed unimplemented QUIC synchronization from main features
  - Removed unimplemented HNSW performance claims
  - Clarified performance characteristics without specific benchmarks
  - Updated version references throughout documentation
- **API Improvements**: Enhanced controller interfaces
  - All controllers follow consistent patterns
  - Comprehensive error handling
  - TypeScript strict mode compliance

### Developer Notes
- **Test Coverage**: 38/38 landing page features verified (100%)
- **Backward Compatibility**: 100% compatible with v1.5.9
- **Breaking Changes**: None
- **Migration**: Drop-in replacement, no code changes required

---

## [1.5.9] - 2025-10-24

### Fixed
- Transaction handling in batch operations
- Hook integration for agentic-flow npm/npx

### Verified
- All core frontier memory features functional
- MCP integration with 29 tools operational
- Database persistence working correctly

---

## [1.3.0] - 2025-10-22

### Added
- **Learning System Tools**: 10 new MCP tools for reinforcement learning
  - Session management: start_session, end_session
  - Adaptive intelligence: predict, feedback, train
  - Analytics: metrics, explain
  - Advanced features: transfer, experience_record, reward_signal
  - 9 RL algorithms: Q-Learning, SARSA, DQN, Policy Gradient, Actor-Critic, PPO, Decision Transformer, MCTS, Model-Based

- **Core AgentDB Tools**: 5 new MCP tools for advanced database management
  - agentdb_stats: Comprehensive database statistics
  - agentdb_pattern_store: Store reasoning patterns with embeddings
  - agentdb_pattern_search: Semantic pattern search with filters
  - agentdb_pattern_stats: Pattern analytics and top task types
  - agentdb_clear_cache: Cache management for optimal performance

### Changed
- **MCP Tool Count**: Increased from 14 to 29 tools
- **Documentation**: Added comprehensive learning system guides

---

## [1.2.2] - 2025-10-20

### Added
- **Core Vector DB Tools**: 5 fundamental MCP tools
  - agentdb_init: Initialize database with schema
  - agentdb_insert: Insert single vector with metadata
  - agentdb_insert_batch: Optimized batch insert with transactions
  - agentdb_search: Semantic k-NN vector search with filters
  - agentdb_delete: Delete vectors by ID or filters

---

## [1.1.0] - 2025-10-15

### Added
- **Frontier Memory Features**: 6 advanced memory patterns
  - Reflexion Memory: Episodic replay with self-critique
  - Skill Library: Lifelong learning with pattern consolidation
  - Causal Memory Graph: Intervention-based causality with p(y|do(x))
  - Explainable Recall: Provenance certificates with Merkle proofs
  - Causal Recall: Utility-based reranking (α·similarity + β·uplift − γ·latency)
  - Nightly Learner: Automated causal discovery with doubly robust estimation

- **MCP Integration**: 9 frontier memory tools for Claude Desktop
- **CLI Commands**: 17 commands for reflexion, skill, causal, learner, and recall operations
- **ReasoningBank Integration**: Pattern matching, experience curation, memory optimization

---

## [1.0.7] - 2025-10-10

### Added
- Browser bundle with sql.js WASM backend
- Universal runtime support (Node.js, browser, edge)
- Basic vector database operations

---

## Roadmap

### v1.7.0 (Planned)
- **QUIC Synchronization**: Real-time multi-node coordination
  - Architecture designed and documented
  - Implementation in progress
  - 8-week development timeline estimated

### v2.0.0 (Future)
- **HNSW Indexing**: Hierarchical Navigable Small World graphs
  - 10-100x performance improvements for large datasets
  - Sub-millisecond search at 100K+ vectors
- **Hybrid Search**: Combined vector + keyword search
- **Quantization**: 4-bit, 8-bit vector compression for memory efficiency
- **Multi-database Coordination**: Cross-instance synchronization
- **Performance Benchmarking Suite**: Comprehensive real-world performance metrics

### Under Consideration
- Distributed consensus protocols (Raft, Byzantine)
- CRDT-based conflict-free synchronization
- WebTransport for browser-to-browser sync
- GPU acceleration for vector operations
- Streaming query results
- Advanced caching strategies

---

## Version Support

- **v1.6.x**: Active development, recommended for production
- **v1.5.x**: Maintenance mode, security fixes only
- **v1.3.x**: Legacy support, critical fixes only
- **v1.0-1.2**: No longer supported

---

## Migration Guides

- [Upgrading from v1.3.0 to v1.6.0](docs/V1.6.0_MIGRATION.md)
- [Upgrading from v1.2.2 to v1.3.0](MIGRATION_v1.3.0.md)
- [Upgrading from v1.2.1 to v1.2.2](docs/MIGRATION_v1.2.2.md)

---

**Note**: This CHANGELOG was created on 2025-10-25 to provide accurate version history. Prior to v1.6.0, version documentation was inconsistent. All features and fixes have been verified against actual implementation and test results.
