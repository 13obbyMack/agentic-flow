# @agentic-flow/jujutsu

> WASM-enabled Jujutsu VCS wrapper for AI agent collaboration and learning

[![npm version](https://badge.fury.io/js/%40agentic-flow%2Fjujutsu.svg)](https://www.npmjs.com/package/@agentic-flow/jujutsu)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![WASM](https://img.shields.io/badge/WASM-Enabled-blue)](https://webassembly.org/)

Fast, safe, and efficient Jujutsu VCS operations powered by Rust and WebAssembly. Designed for AI agents, with zero-copy operations and cross-platform support.

## Features

- 🚀 **Zero-copy jj CLI operations** - Direct command execution with minimal overhead
- 🧠 **AI-first design** - Operation log parsing, conflict detection, and pattern learning
- 📦 **WASM everywhere** - Browser, Node.js, Deno support from a single package
- ⚡ **Ultra-fast** - Rust-powered performance with WASM compilation
- 🔒 **Type-safe** - Full TypeScript definitions included
- 🌐 **Cross-platform** - Linux, macOS, Windows, and web browsers
- 💾 **AgentDB integration** - Optional persistence and learning

## Quick Start

### Installation

```bash
npm install @agentic-flow/jujutsu
```

### Node.js Example

```javascript
const { JJWrapper, JJConfig } = require('@agentic-flow/jujutsu');

async function main() {
    const jj = await JJWrapper.new();
    const status = await jj.status();
    console.log(status.stdout);
}

main();
```

See full documentation in [docs/wasm-usage.md](docs/wasm-usage.md)

## License

MIT - see [LICENSE](LICENSE) file for details.
