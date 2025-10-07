# Agent Booster

Fast code editing library using tree-sitter and similarity matching.

## Overview

Agent Booster is a Rust library that automatically applies code edits by finding the best matching location in existing code. It uses:

- **Tree-sitter** for AST parsing (JavaScript/TypeScript support)
- **Levenshtein distance** for text similarity matching
- **Smart merge strategies** based on confidence scores
- **Syntax validation** to ensure code remains valid

## Features

- ✅ JavaScript/TypeScript support
- ✅ Tree-sitter AST parsing
- ✅ Multiple similarity metrics (Levenshtein, token overlap, structural similarity)
- ✅ Smart merge strategies (exact replace, fuzzy replace, insert before/after, append)
- ✅ Syntax validation
- ✅ Node.js native addon via napi-rs
- ✅ Comprehensive unit tests

## Project Structure

```
agent-booster/
├── Cargo.toml                    # Workspace configuration
├── crates/
│   ├── agent-booster/            # Core Rust library
│   │   ├── Cargo.toml
│   │   └── src/
│   │       ├── lib.rs            # Main API
│   │       ├── models.rs         # Data structures
│   │       ├── parser.rs         # Tree-sitter integration
│   │       ├── similarity.rs     # Similarity matching
│   │       └── merge.rs          # Merge strategies
│   └── agent-booster-native/     # Node.js native addon
│       ├── Cargo.toml
│       ├── build.rs
│       └── src/
│           └── lib.rs            # napi-rs bindings
```

## Building

### Prerequisites

- Rust 1.70+ (`rustup install stable`)
- Cargo

### Build Commands

```bash
# Build the core library
cd /workspaces/agentic-flow/agent-booster
cargo build --release

# Run tests
cargo test

# Build with verbose output
cargo build --release --verbose

# Build specific crate
cargo build -p agent-booster --release
cargo build -p agent-booster-native --release
```

## Usage

### Rust Library

```rust
use agent_booster::{AgentBooster, Config, EditRequest, Language};

// Create instance
let mut booster = AgentBooster::new(Config::default())?;

// Apply edit
let result = booster.apply_edit(EditRequest {
    original_code: "function foo() { return 1; }".to_string(),
    edit_snippet: "function foo() { return 2; }".to_string(),
    language: Language::JavaScript,
    confidence_threshold: 0.5,
})?;

println!("Merged code: {}", result.merged_code);
println!("Confidence: {:.2}", result.confidence);
println!("Strategy: {:?}", result.strategy);
```

### Node.js Native Addon

```javascript
const { AgentBoosterNative } = require('./agent-booster-native.node');

const booster = new AgentBoosterNative({
  confidenceThreshold: 0.5,
  maxChunks: 50
});

const result = booster.applyEdit({
  originalCode: "function foo() { return 1; }",
  editSnippet: "function foo() { return 2; }",
  language: "javascript"
});

console.log('Merged:', result.mergedCode);
console.log('Confidence:', result.confidence);
console.log('Strategy:', result.strategy);
```

## Architecture

### Core Components

1. **Parser** (`parser.rs`)
   - Tree-sitter integration for JS/TS
   - Extracts semantic code chunks (functions, classes, etc.)
   - Validates syntax

2. **Similarity Matcher** (`similarity.rs`)
   - Levenshtein distance (normalized)
   - Token-based similarity (word overlap)
   - Structural similarity (braces, keywords)
   - Combined scoring with weights

3. **Merger** (`merge.rs`)
   - Strategy selection based on confidence
   - Multiple merge strategies:
     - ExactReplace (>95% similarity)
     - FuzzyReplace (80-95% similarity)
     - InsertAfter (60-80% similarity)
     - InsertBefore (threshold-60% similarity)
     - Append (<threshold similarity)
   - Syntax validation after merge

4. **Native Addon** (`agent-booster-native`)
   - napi-rs bindings for Node.js
   - JavaScript-friendly API
   - Type conversions

## Testing

```bash
# Run all tests
cargo test

# Run tests for specific crate
cargo test -p agent-booster

# Run with output
cargo test -- --nocapture

# Run specific test
cargo test test_simple_function_replacement
```

## Performance

- **Tree-sitter parsing**: Fast AST extraction
- **Similarity matching**: Optimized with multiple metrics
- **Memory efficient**: Processes files in-memory without disk I/O
- **Typical processing time**: <50ms for files up to 1000 lines

## Configuration

```rust
Config {
    confidence_threshold: 0.5,  // Minimum confidence to apply edit (0.0-1.0)
    max_chunks: 50,            // Maximum chunks to consider
}
```

## Merge Strategies

| Similarity | Strategy | Description |
|------------|----------|-------------|
| ≥95% | ExactReplace | Replace matched chunk exactly |
| 80-95% | FuzzyReplace | Replace with slight differences |
| 60-80% | InsertAfter | Insert after matched location |
| threshold-60% | InsertBefore | Insert before matched location |
| <threshold | Append | Append to end of file |

## Limitations (v0.1.0)

- **Languages**: Only JavaScript/TypeScript (Python/Rust/etc. coming later)
- **Embeddings**: Uses simple text similarity, not ONNX/neural embeddings yet
- **Parallel processing**: Batch operations are sequential (no rayon parallelization yet)
- **WASM**: WASM bindings not implemented yet

## Roadmap

### Phase 2 (v0.2.0)
- [ ] Add ONNX runtime integration
- [ ] Neural embeddings (jina-code-v2)
- [ ] WASM bindings (wasm-bindgen)
- [ ] More languages (Python, Rust, Go)

### Phase 3 (v0.3.0)
- [ ] Parallel batch processing (rayon)
- [ ] Embedding caching
- [ ] Multi-file refactoring
- [ ] LSP integration

## License

MIT

## Contributing

Contributions welcome! Please ensure:
- Tests pass: `cargo test`
- Code is formatted: `cargo fmt`
- No clippy warnings: `cargo clippy`
