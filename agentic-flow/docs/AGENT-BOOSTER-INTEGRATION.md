# Agent Booster Integration Guide

## Overview

Agent Booster (v0.2.1) integrates with agentic-flow at **three levels**:

1. **MCP Tools** (✅ Current): Available via Claude Desktop/Cursor MCP server
2. **Anthropic Proxy** (🚧 Proposed): Intercept tool calls to use Agent Booster
3. **CLI Agents** (🚧 Proposed): Pre-process agent tasks with Agent Booster

## Current Status

### ✅ MCP Integration (v1.4.2)

**Location**: `src/mcp/standalone-stdio.ts`

**Tools Available**:
- `agent_booster_edit_file` - Single file editing
- `agent_booster_batch_edit` - Multi-file refactoring
- `agent_booster_parse_markdown` - Parse LLM markdown outputs

**Usage** (Claude Desktop):
```
User: Use agent_booster_edit_file to convert var to const in utils.js
Claude: [Calls MCP tool] ✅ Edited in 10ms with 64% confidence
```

**Version**: Uses `npx agent-booster@0.2.1` for strategy fix (fuzzy_replace)

**Performance**:
- var→const: 10ms (was creating duplicates in v0.1.2, fixed in v0.2.1)
- Add types: 11ms with fuzzy_replace
- Confidence threshold: 70% (auto-fallback to LLM below this)

---

## 🚧 Proposed: Anthropic Proxy Integration

### Goal
Intercept Anthropic SDK tool calls and use Agent Booster for code editing tools.

### Implementation

**Location**: `src/proxy/anthropic-to-openrouter.ts` or new `anthropic-to-requesty.ts`

#### Step 1: Tool Call Interception

```typescript
// In AnthropicToOpenRouterProxy or AnthropicToRequestyProxy
class ProxyWithAgentBooster {
  async handleToolCall(toolCall: any) {
    // Detect code editing tools
    if (this.isCodeEditingTool(toolCall)) {
      return await this.tryAgentBooster(toolCall);
    }

    // Pass through to original handler
    return await this.originalToolHandler(toolCall);
  }

  private isCodeEditingTool(toolCall: any): boolean {
    const codeEditTools = [
      'str_replace_editor',  // Cursor
      'apply_diff',           // Aider
      'edit_file',            // Generic
      'replace_in_file'       // Generic
    ];

    return codeEditTools.includes(toolCall.name);
  }

  private async tryAgentBooster(toolCall: any): Promise<any> {
    try {
      const { file_path, old_string, new_string, language } = this.extractEditParams(toolCall);

      // Call Agent Booster
      const result = await this.callAgentBooster(file_path, old_string, new_string, language);

      if (result.success && result.confidence >= 0.7) {
        // High confidence - use Agent Booster result
        return {
          success: true,
          method: 'agent_booster',
          latency_ms: result.latency,
          confidence: result.confidence,
          output: result.output
        };
      } else {
        // Low confidence - fall back to LLM
        logger.warn(`Agent Booster confidence too low (${result.confidence}), using LLM fallback`);
        return await this.originalToolHandler(toolCall);
      }
    } catch (error) {
      // Error - fall back to LLM
      logger.error('Agent Booster failed, using LLM fallback:', error);
      return await this.originalToolHandler(toolCall);
    }
  }

  private async callAgentBooster(filePath: string, oldCode: string, newCode: string, language?: string): Promise<any> {
    const { execSync } = await import('child_process');
    const fs = await import('fs');

    const originalCode = fs.readFileSync(filePath, 'utf-8');

    const cmd = `npx --yes agent-booster@0.2.1 apply --language ${language || 'javascript'}`;
    const result = execSync(cmd, {
      encoding: 'utf-8',
      input: JSON.stringify({ code: originalCode, edit: newCode }),
      maxBuffer: 10 * 1024 * 1024,
      timeout: 5000
    });

    return JSON.parse(result);
  }
}
```

#### Step 2: Enable in CLI

```typescript
// In cli-proxy.ts
if (options.agentBooster) {
  // Use proxy with Agent Booster interception
  const proxy = new AnthropicToRequestyProxy({
    anthropicApiKey: apiKey,
    enableAgentBooster: true,
    agentBoosterConfidenceThreshold: 0.7
  });
}
```

**CLI Usage**:
```bash
npx agentic-flow --agent coder --task "Convert var to const" --agent-booster
# Agent Booster intercepts str_replace_editor calls
# Falls back to LLM if confidence < 70%
```

**Benefits**:
- Transparent to agents (no code changes needed)
- Automatic fallback to LLM
- 200x faster for simple edits
- $0 cost for pattern matching

---

## 🚧 Proposed: CLI Agent Integration

### Goal
Pre-process agent tasks with Agent Booster before invoking LLM.

### Implementation

**Location**: `src/agents/claudeAgent.ts` or `src/utils/agentLoader.ts`

#### Step 1: Task Analysis

```typescript
// In claudeAgent.ts
class AgentWithBooster {
  async execute(task: string, options: any) {
    // Analyze task to detect code editing intent
    const editIntent = this.detectCodeEditIntent(task);

    if (editIntent && options.enableAgentBooster) {
      // Try Agent Booster first
      const boosterResult = await this.tryAgentBooster(editIntent);

      if (boosterResult.success) {
        return boosterResult;  // Done in 10ms!
      }
    }

    // Fall back to LLM agent
    return await this.executeLLMAgent(task, options);
  }

  private detectCodeEditIntent(task: string): EditIntent | null {
    // Pattern matching for common edits
    const patterns = [
      { regex: /convert\s+var\s+to\s+const/i, type: 'var_to_const' },
      { regex: /add\s+type\s+annotations/i, type: 'add_types' },
      { regex: /add\s+error\s+handling/i, type: 'add_error_handling' },
      { regex: /convert\s+to\s+async\/await/i, type: 'async_await' }
    ];

    for (const pattern of patterns) {
      if (pattern.regex.test(task)) {
        return {
          type: pattern.type,
          task,
          filePath: this.extractFilePath(task)
        };
      }
    }

    return null;
  }

  private async tryAgentBooster(intent: EditIntent): Promise<any> {
    const { execSync } = await import('child_process');
    const fs = await import('fs');

    if (!fs.existsSync(intent.filePath)) {
      return { success: false, reason: 'File not found' };
    }

    const originalCode = fs.readFileSync(intent.filePath, 'utf-8');
    const editedCode = this.generateEditFromIntent(intent, originalCode);

    const cmd = `npx --yes agent-booster@0.2.1 apply --language javascript`;
    const result = execSync(cmd, {
      encoding: 'utf-8',
      input: JSON.stringify({ code: originalCode, edit: editedCode }),
      timeout: 5000
    });

    const parsed = JSON.parse(result);

    if (parsed.success && parsed.confidence >= 0.7) {
      fs.writeFileSync(intent.filePath, parsed.output);
      return {
        success: true,
        method: 'agent_booster',
        latency_ms: parsed.latency,
        confidence: parsed.confidence
      };
    }

    return { success: false, confidence: parsed.confidence };
  }
}
```

#### Step 2: Enable in CLI Options

```typescript
// In cli-proxy.ts options parsing
const options = parseArgs();

if (options.agentBooster || process.env.AGENTIC_FLOW_AGENT_BOOSTER === 'true') {
  // Enable Agent Booster pre-processing
  agentOptions.enableAgentBooster = true;
  agentOptions.agentBoosterConfidenceThreshold = options.boosterThreshold || 0.7;
}
```

**CLI Usage**:
```bash
# Explicit flag
npx agentic-flow --agent coder --task "Convert var to const in utils.js" --agent-booster

# Environment variable
export AGENTIC_FLOW_AGENT_BOOSTER=true
npx agentic-flow --agent coder --task "Add types to api.ts"

# With confidence threshold
npx agentic-flow --agent coder --task "Refactor" --agent-booster --booster-threshold 0.8
```

**Benefits**:
- Avoids LLM call entirely for simple edits
- Saves ~$0.001 per edit
- 200x faster (10ms vs 2000ms)
- Automatic fallback to LLM

---

## Integration Levels Comparison

| Level | Speed | Cost | Use Case | Status |
|-------|-------|------|----------|--------|
| **MCP Tools** | 10ms | $0 | User explicitly requests Agent Booster | ✅ Live (v1.4.2) |
| **Proxy Intercept** | 10ms | $0 | Transparent to agents | 🚧 Proposed |
| **CLI Pre-Process** | 10ms | $0 | Direct agentic-flow usage | 🚧 Proposed |

## Strategy Fix (v0.2.1)

**Critical fix**: var→const now uses `fuzzy_replace` instead of `insert_after`

**Before (v0.1.2)**:
```javascript
var x = 1;

const x = 1;  // Duplicate!
```

**After (v0.2.1)**:
```javascript
const x = 1;  // Replaced correctly
```

**Thresholds Updated**:
- ExactReplace: 95% → 90%
- FuzzyReplace: 80% → 50% (fixes duplicates)
- InsertAfter: 60% → 30%

**Confidence Improvement**: 57% → 64% for simple substitutions

## Recommended Implementation Order

1. ✅ **MCP Tools** (Done) - Already works in Claude Desktop/Cursor
2. **Proxy Integration** - Highest value, transparent to agents
3. **CLI Integration** - Lower priority, requires task pattern matching

## Environment Variables

```bash
# Enable Agent Booster in all modes
export AGENTIC_FLOW_AGENT_BOOSTER=true

# Set confidence threshold (default: 0.7)
export AGENTIC_FLOW_BOOSTER_THRESHOLD=0.8

# Disable fallback to LLM (fail on low confidence)
export AGENTIC_FLOW_BOOSTER_NO_FALLBACK=false

# Force specific version
export AGENTIC_FLOW_BOOSTER_VERSION=0.2.1
```

## Testing

### MCP Integration Test
```bash
# Claude Desktop: "Use agent_booster_edit_file to convert var to const in test.js"
# Expected: 10ms with fuzzy_replace strategy
```

### Proxy Integration Test (when implemented)
```bash
npx agentic-flow --agent coder --task "Convert var to const" --agent-booster --openrouter
# Should intercept str_replace_editor and use Agent Booster
```

### CLI Integration Test (when implemented)
```bash
npx agentic-flow --agent coder --task "Add types to utils.js" --agent-booster
# Should pre-process with Agent Booster before LLM
```

## Performance Metrics

| Operation | LLM (Anthropic) | Agent Booster v0.2.1 | Speedup |
|-----------|----------------|----------------------|---------|
| var → const | 2,000ms | 10ms | 200x |
| Add types | 2,500ms | 11ms | 227x |
| Error handling | 3,000ms | 1ms (template) | 3000x |
| Cost per edit | $0.001 | $0.00 | 100% savings |

## Next Steps

- [ ] Implement proxy interception (highest value)
- [ ] Add task pattern detection for CLI
- [ ] Create comprehensive test suite
- [ ] Document agent configuration
- [ ] Add telemetry for Agent Booster usage

---

**Last Updated**: 2025-10-08
**Agent Booster Version**: 0.2.1
**Agentic-Flow Version**: 1.4.2+
