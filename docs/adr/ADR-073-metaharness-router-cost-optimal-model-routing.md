# ADR-073: Cost-Optimal Model Routing via @metaharness/router

**Status**: Proposed
**Date**: 2026-06-23
**Decision Makers**: RUV, Claude Flow Team
**Related**: ADR-072 (RuVector Advanced Features), ADR-074 (Darwin TDR), ADR-075 (Harness Self-Evolution)
**Affected packages**: `agentic-flow` (`src/router/`, `src/routing/`, `src/billing/`)

## Context

`agentic-flow` already routes work three ways, but **none of them selects a model by predicted quality-per-cost from measured eval data**:

- `src/router/router.ts` (`ModelRouter`) — picks **providers/models** (anthropic / openrouter / onnx / gemini / ollama) by **static config rules**.
- `src/routing/TinyDancerRouter.ts` — FastGRNN routing to one of N **agent types** (`numAgents`); no `costPerMTok` / `qualityBar` concept.
- `src/routing/SemanticRouter.ts` — HNSW intent → **agent-type** matching.

`@metaharness/router` (`ruvnet/agent-harness-generator`, ADR-040/043) productizes the **DRACO Phase-2 finding**: routing each query to the *cheapest model predicted to clear a quality bar* is a measured Pareto win — a learned embedding router beat the best fixed model, with accuracy rising monotonically with training data. It exposes k-NN, a regularised kernel-ridge `TrainedRouter` (portable JSON, no model files), and an optional native FastGRNN backend via `@ruvector/tiny-dancer`.

### Why this is additive, not redundant

- It selects **models by predicted cost-quality**, a capability `ModelRouter` lacks.
- `@ruvector/tiny-dancer` is **already a dependency** of `agentic-flow` — the native backend ships for free.
- The pure-TS path is **dependency-free** (no native deps, no network, no model files) — zero supply-chain risk.
- It consumes data `agentic-flow` **already produces**: embeddings (`@xenova/transformers` / ruvector ONNX), per-model quality from `benchmark-results/`, and price tables from `src/billing/pricing`.

## Decision

Introduce a **cost-optimal routing mode** in `src/router/` that wraps `@metaharness/router`:

1. Add an optional `routingStrategy: "cost-optimal"` to `RouterConfig` (default remains current config-rule behavior — no breaking change).
2. Build candidate sets from existing provider/model definitions, attaching `costPerMTok` from `src/billing/pricing` and labelled `examples` (`{ embedding, quality }`) from eval/benchmark logs.
3. At route time, embed the incoming query with the existing embedding service and call `Router.route(embedding)` → return the cheapest candidate predicted to clear `qualityBar`.
4. Use `resolveRouterBackend('auto')` — native FastGRNN when `@ruvector/tiny-dancer` is present (it is), pure-TS `TrainedRouter` otherwise.
5. Persist the trained model as portable JSON under `~/.agentic-flow/` alongside `router.config.json`.
6. Feed routing outcomes back into the eval log so accuracy improves with usage (the DRACO learning curve).

## Consequences

**Positive**
- Direct cost reduction (DRACO: cheap model matches frontier quality at ~10× lower cost) on the eval data already collected.
- No new heavyweight dependency; pure-TS fallback keeps the security posture intact.
- Quality-bar is explicit and tunable per deployment; falls back to best-predicted when no candidate clears the bar.

**Negative / risks**
- Requires a minimum of labelled eval examples per candidate to be useful (cold-start); until then it degrades to best-predicted, effectively current behavior.
- Adds an embedding step on the hot path (mitigated: <10ms with existing ONNX/ruvector embeddings; cache by query hash).
- Eval-log quality scoring must be trustworthy; garbage-in degrades routing (gate on the same scorer used in benchmarks).

**Neutral**
- Existing routers are untouched; this is a new opt-in strategy behind a config flag.

## Implementation sketch

```
src/router/cost-optimal-router.ts   # adapter over @metaharness/router
src/router/router.ts                # add strategy switch; default unchanged
src/billing/pricing                 # source of costPerMTok
~/.agentic-flow/router.model.json   # persisted TrainedRouter (portable JSON)
```

Surface as `agentic-flow --route cost-optimal` and via `router.config.json` `{ "routingStrategy": "cost-optimal", "qualityBar": 0.8 }`.
