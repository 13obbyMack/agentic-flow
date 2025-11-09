# WASM Build Status

**Date:** 2025-11-09
**Status:** ❌ **NOT WORKING** (Known Issue)
**Target Fix:** v0.1.1 patch release

---

## Issue Summary

WASM builds fail due to `errno` dependency being pulled in by `rustix` → `async-io` → `tokio`.

### Error Message

```
error: The target OS is "unknown" or "none", so it's unsupported by the errno crate.
 --> errno-0.3.14/src/sys.rs:8:1
```

### Root Cause

**Dependency Chain:**
```
agentic-jujutsu
  → tokio (optional, feature = "native")
    → mio
      → polling
        → rustix
          → errno (not compatible with wasm32)
```

The issue is that even though `tokio` is marked as `optional` and only enabled with the `native` feature, `wasm-pack` still tries to compile it for WASM targets.

---

## Current Workaround

**For crates.io users:** Works perfectly in native mode (non-WASM)
```bash
cargo add agentic-jujutsu --features mcp-full
```

**For npm/WASM users:** Not available yet
- npm package cannot be published until WASM builds work
- ETA: v0.1.1 (within 1-2 weeks)

---

## Planned Fixes for v0.1.1

### Option 1: Conditional Feature Flags (Recommended)

Update `Cargo.toml` to completely exclude async runtime for WASM:

```toml
[target.'cfg(not(target_arch = "wasm32"))'.dependencies]
tokio = { version = "1.0", features = ["rt", "rt-multi-thread", "process", "io-util", "time", "macros"], optional = true }
async-process = { version = "2.0", optional = true }
errno = "0.3"

[target.'cfg(target_arch = "wasm32")'.dependencies]
# No async runtime dependencies for WASM
```

### Option 2: WASM-Specific Wrapper

Create separate WASM wrapper that doesn't use tokio:

```rust
// src/wasm_wrapper.rs
#[cfg(target_arch = "wasm32")]
impl JJWrapper {
    // Synchronous-only implementation for WASM
    pub fn new_sync() -> Result<Self> {
        // ...
    }
}
```

### Option 3: Stub Implementation

Provide limited WASM functionality without async:

```rust
#[cfg(target_arch = "wasm32")]
mod wasm {
    // Minimal WASM bindings
    // No MCP, no async operations
    // Basic jj command execution only
}
```

---

## Impact

### What Works ✅

- ✅ Native Rust builds (cargo)
- ✅ CLI tool (`jj-agent-hook`)
- ✅ crates.io publication
- ✅ All 70 tests passing (native)
- ✅ MCP integration (native)
- ✅ AgentDB sync (native)

### What Doesn't Work ❌

- ❌ WASM builds (web, node, bundler, deno)
- ❌ npm publication
- ❌ Browser usage
- ❌ Deno usage

---

## Temporary Recommendations

### For Rust Developers

Use the native crate - works perfectly:

```bash
cargo add agentic-jujutsu --features mcp-full
```

### For JavaScript/TypeScript Developers

Wait for v0.1.1 with WASM support, or use alternative approaches:

1. **Call jj CLI directly** from Node.js:
   ```javascript
   const { exec } = require('child_process');
   exec('jj status', (error, stdout) => {
     console.log(stdout);
   });
   ```

2. **Use native Rust binary** via FFI:
   ```javascript
   const ffi = require('ffi-napi');
   // Load compiled Rust library
   ```

3. **Wait for v0.1.1** with working WASM builds

---

## Timeline

### v0.1.0 (Current - Released ✅)
- ✅ crates.io publication
- ✅ Native Rust support
- ✅ MCP integration
- ✅ 70/70 tests passing
- ❌ WASM builds fail

### v0.1.1 (Planned - 1-2 weeks)
- 🔧 Fix WASM build issues
- 🔧 Conditional compilation for targets
- 🔧 Remove tokio dependency for WASM
- 🔧 npm publication
- 🔧 TypeScript definitions
- 🔧 Browser/Deno support

### v0.2.0 (Future)
- Complete WASM feature parity
- Full MCP support in WASM
- Performance optimizations
- Additional examples

---

## Testing WASM Locally

Once fixed in v0.1.1, test with:

```bash
# Build for all WASM targets
./scripts/wasm-pack-build.sh --release

# Test in Node.js
cd pkg/node
node -e "const jj = require('.'); console.log('Works!');"

# Test in browser (via bundler)
# Create test app with webpack/vite

# Test with Deno
cd pkg/deno
deno run --allow-all test.ts
```

---

## Known Issues

1. **errno dependency** - Not WASM compatible
   - Pulled in by rustix → async-io
   - Solution: Conditional compilation

2. **tokio runtime** - Not needed for WASM
   - WASM has its own async runtime
   - Solution: Exclude from WASM builds

3. **async-process** - Not WASM compatible
   - Used for jj CLI execution
   - Solution: WASM-specific implementation

---

## Contributing

If you'd like to help fix WASM builds:

1. Fork repository
2. Create branch: `fix/wasm-builds`
3. Implement conditional compilation
4. Test with: `wasm-pack build --target web`
5. Submit PR

**Useful Links:**
- wasm-bindgen docs: https://rustwasm.github.io/wasm-bindgen/
- wasm-pack guide: https://rustwasm.github.io/wasm-pack/
- Conditional compilation: https://doc.rust-lang.org/reference/conditional-compilation.html

---

## Status Updates

**2025-11-09:** WASM builds disabled, documented as known issue
**ETA v0.1.1:** 1-2 weeks
**Priority:** High (blocks npm publication)

---

**Reported by:** Claude Code
**Tracked in:** GitHub Issues
**Fix scheduled for:** v0.1.1

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
