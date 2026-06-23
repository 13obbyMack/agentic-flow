# ADR-074: Autonomous Test-Driven Repair via @metaharness/darwin

**Status**: Accepted — core implemented in 2.1.0 (`repair()` + `agentic-flow-repair` CLI over Darwin `evolve()`); full SWE-bench Docker TDR product is the documented deployment path
**Date**: 2026-06-23
**Decision Makers**: RUV, Claude Flow Team
**Related**: ADR-073 (Cost-Optimal Router), ADR-075 (Harness Self-Evolution), ADR-076 (Meta-Harness Repositioning), CWE-78 shell-injection hardening (PR #170)
**Affected packages**: `agentic-flow` (`src/repair/`, `src/cli/`, `src/mcp/`)
**Implementation**: `src/repair/darwin-repair.ts`, `src/repair/cli.ts`, `tests/repair/darwin-repair.test.ts`

## Context

`agentic-flow` ships 66 agents but has **no autonomous code-repair capability** — only an incidental SWE-bench mention in `src/cli/commands/init.ts`. `@metaharness/darwin` (`ruvnet/agent-harness-generator`, 0.6.0) provides **Test-Driven Repair (TDR)**: hand it a failing test, get a verified-fix PR.

### Measured capability (from package RESULTS, official `swebench` Docker)

- **68.3%** of real SWE-bench Lite issues resolved **when given the acceptance test** (the realistic CI/CD setting), Wilson 95% CI.
- **~$0.01–0.08 / instance** with a sub-$1/Mtok model — vs. $1–20/instance for frontier-model agents.
- Two modes via one flag: **Test-Driven Repair** (default, gate on your test) and **Conformant** (`--no-test-oracle`, agent writes its own `reproduce_bug.py` + MCTS search).

### Security alignment

Darwin's sandbox is **shell-free** (`execFile`, argv-split, never a shell — no command-injection surface) and runs under a **scrubbed environment** (only `PATH` + 3 identifying vars; no secrets/tokens leak to a variant), with a two-layer safety gate (`inspectVariant` before execution, `validateGeneratedCode` before write). This is directly consistent with the **CWE-78 shell-injection hardening just landed in PR #170** on this repo — adopting Darwin does not regress the security posture; it extends the same model.

## Decision

Integrate Darwin's TDR as a **first-class repair capability** in `agentic-flow`, exposed two ways:

1. **CLI command**: `agentic-flow repair <repo> [--test <cmd>] [--no-test-oracle]` wrapping Darwin's `evolve()` / `metaharness-darwin evolve` in TDR mode.
2. **Agent type**: a `repair` / `autofixer` agent that, given a failing test, produces a verified-fix diff and (optionally) opens a PR through the existing GitHub integration.
3. Default to **Test-Driven Repair** (gate on the user's test) — the high-margin, production-relevant path. Conformant mode behind an explicit `--no-test-oracle` flag.

Reuse Darwin's programmatic API (`import { evolve } from '@metaharness/darwin'`) rather than shelling out, keeping execution in-process and the sandbox boundary intact.

## Consequences

**Positive**

- New product-grade capability (CI autofixer) at pennies-per-fix economics.
- Composes with ADR-073: the cheap model that TDR depends on is exactly what the cost-optimal router selects.
- Security model matches the repo's current hardening direction.

**Negative / risks**

- TDR's headline 68.3% is a **with-acceptance-test** claim; the no-test (Conformant) mode has a genuinely lower, honest ceiling — must be surfaced clearly so users do not over-trust it.
- Darwin runs repo test commands in a sandbox; integration must ensure agentic-flow's invocation preserves the shell-free, env-scrubbed guarantees (do not wrap it in a shell).
- Adds `@metaharness/darwin` as a dependency (Node ≥ 20 built-ins only, **zero runtime deps** — low footprint).

**Neutral**

- Opt-in command/agent; no change to existing agents.

## Implementation sketch

```
src/agents/repair.ts          # autofixer agent wrapping evolve() in TDR mode
src/cli/commands/repair.ts     # `agentic-flow repair <repo>`
src/mcp/...                    # optional MCP tool surface (see ADR-075)
```
