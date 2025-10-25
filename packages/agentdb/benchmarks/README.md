# AgentDB Performance Benchmarks

Comprehensive performance testing suite for AgentDB to validate performance claims and identify optimization opportunities.

## Overview

This benchmark suite tests:

1. **Vector Search Performance**: Tests with 100, 1K, 10K, and 100K vectors
2. **Quantization Performance**: Tests 4-bit and 8-bit quantization
3. **Batch Operations**: Compares batch vs individual operations
4. **Database Backends**: Compares better-sqlite3 vs sql.js
5. **Memory Systems**: Tests causal graph, reflexion, and skill library

## Running Benchmarks

```bash
# Run all benchmarks
npm run benchmark

# Build benchmark suite
npm run benchmark:build

# Run specific benchmark directly
npm run benchmark
```

## Benchmark Categories

### 1. Vector Search Performance

Tests vector similarity search with different dataset sizes:

- **100 vectors**: Baseline small dataset
- **1K vectors**: Typical small application
- **10K vectors**: Medium-sized application
- **100K vectors**: Large-scale application

Each test measures:
- Average search time
- Operations per second
- Query latency (p50, p95, p99)

### 2. HNSW Indexing

Validates the "150x faster" claim by comparing:

- **With HNSW**: Hierarchical Navigable Small World indexing
- **Without HNSW**: Brute force cosine similarity search

### 3. Quantization

Tests memory reduction and accuracy tradeoffs:

- **4-bit quantization**: ~8x memory reduction
- **8-bit quantization**: ~4x memory reduction
- **Accuracy analysis**: Measures impact on search quality

### 4. Batch Operations

Compares batch vs individual insert performance:

- **Batch insert**: Insert 1000 vectors at once
- **Individual insert**: Insert vectors one by one
- **Memory usage**: Track memory consumption during batching

### 5. Database Backends

Compares better-sqlite3 vs sql.js:

- **Initialization time**: Database setup performance
- **Insert performance**: Bulk insert operations
- **Query performance**: Search and retrieval speed

### 6. Memory Systems

Tests specialized memory systems:

- **Causal Graph**: Query performance for causal reasoning
- **Reflexion Memory**: Episode retrieval and filtering
- **Skill Library**: Semantic search and categorization

## Report Formats

The benchmark suite generates three report formats:

1. **HTML Report**: `benchmarks/reports/performance-report.html`
   - Interactive visualizations
   - Detailed metrics tables
   - Bottleneck analysis

2. **JSON Report**: `benchmarks/reports/performance-report.json`
   - Machine-readable results
   - Complete benchmark data
   - API integration friendly

3. **Markdown Report**: `benchmarks/reports/performance-report.md`
   - GitHub-friendly format
   - Summary tables
   - Recommendations

## Performance Metrics

Each benchmark tracks:

- **Duration**: Total time to complete benchmark
- **Operations per Second**: Throughput measurement
- **Memory Usage**: Heap memory consumption
- **Success Rate**: Percentage of successful operations
- **Custom Metrics**: Benchmark-specific measurements

## Bottleneck Detection

The suite automatically identifies:

- **Slow Operations**: Operations exceeding 10 seconds
- **Low Throughput**: Operations below 10 ops/sec
- **Memory Leaks**: Abnormal memory growth patterns
- **Performance Degradation**: Comparison with baselines

## Optimization Recommendations

Based on benchmark results, the suite provides:

- **HNSW Usage**: When to enable HNSW indexing
- **Batch Size**: Optimal batch sizes for bulk operations
- **Quantization**: When to use 4-bit vs 8-bit quantization
- **Database Backend**: better-sqlite3 vs sql.js recommendations

## Baseline Comparisons

The "150x faster" claim is validated by:

1. Running identical searches with HNSW enabled
2. Running identical searches with brute force (no HNSW)
3. Calculating speedup factor
4. Comparing against 150x threshold

## Example Output

```
🚀 AgentDB Performance Benchmark Suite
================================================================================

📊 Vector Search Performance
   Test vector similarity search with different dataset sizes
--------------------------------------------------------------------------------
   ✅ Vector Search (100 vectors): 245.32ms (408 ops/sec)
   ✅ Vector Search (1K vectors): 1,234.56ms (81 ops/sec)
   ✅ Vector Search (10K vectors): 3,456.78ms (29 ops/sec)
   ✅ Vector Search (100K vectors): 12,345.67ms (8 ops/sec)
   ✅ Vector Search with HNSW (10K vectors): 234.56ms (426 ops/sec)
   ✅ Vector Search without HNSW (10K vectors): 35,234.56ms (3 ops/sec)
   ✅ 150x Faster Claim Verification: 1,234.56ms
      speedupFactor: 150.23
      claimVerified: true

================================================================================
📈 Benchmark Summary
================================================================================
Total Duration: 45.23s
Total Benchmarks: 18
Successful: 18
Failed: 0

📄 Reports generated:
   - HTML: benchmarks/reports/performance-report.html
   - JSON: benchmarks/reports/performance-report.json
   - Markdown: benchmarks/reports/performance-report.md
```

## Configuration

Benchmark parameters can be customized:

```typescript
// Vector search dataset sizes
const vectorCounts = [100, 1000, 10000, 100000];

// Quantization bits
const quantizationBits = [4, 8];

// Batch sizes
const batchSizes = [10, 100, 1000, 5000];

// Query iterations
const queryCount = 100;
```

## Performance Targets

Expected performance ranges:

| Metric | Target | Actual |
|--------|--------|--------|
| Vector Search (10K) | < 1s | Measured |
| HNSW Speedup | > 100x | Verified |
| Batch Insert | > 1000 vectors/sec | Measured |
| Memory Reduction (4-bit) | > 70% | Measured |
| Initialization Time | < 100ms | Measured |

## CI/CD Integration

Add to your CI pipeline:

```yaml
- name: Run Performance Benchmarks
  run: npm run benchmark

- name: Upload Benchmark Reports
  uses: actions/upload-artifact@v3
  with:
    name: performance-reports
    path: packages/agentdb/benchmarks/reports/
```

## Contributing

To add new benchmarks:

1. Create a new benchmark class in the appropriate category folder
2. Implement the benchmark methods returning `BenchmarkResult`
3. Add the benchmark to `BenchmarkRunner.ts`
4. Update this README with benchmark description

## License

MIT
