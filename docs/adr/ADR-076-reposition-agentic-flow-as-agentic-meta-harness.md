# ADR-076: Reposition agentic-flow as an Agentic Meta-Harness

**Status**: Accepted
**Date**: 2026-06-23
**Decision Makers**: RUV, Claude Flow Team
**Related**: ADR-073 (Cost-Optimal Router), ADR-074 (Darwin Repair), ADR-075 (Harness Self-Evolution & Provenance)
**Affected packages**: `agentic-flow` (`package.json` positioning, `README.md`)

## Context

agentic-flow has been positioned as an **"AI agent orchestration platform"** — a
runtime that spawns agents, exposes MCP tools, and coordinates swarms. That
description is accurate but undersells what the system has become with the
metaharness integrations (ADR-073/074/075):

- **It chooses the model** per query by predicted cost-quality (ADR-073,
  `@metaharness/router`) — not a fixed model, not a static rule.
- **It evolves its own harness** — planner, context builder, reviewer, retry,
  tool, memory, and score policy — keeping only what measurably improves under a
  frozen scorer and safety gate (ADR-074, `@metaharness/darwin`).
- **It can sign and verify harness provenance** and expose evolution as MCP
  tools (ADR-075).

Taken together these are not features bolted onto an orchestrator. They are the
defining capabilities of a **meta-harness**: a system whose product is _the
harness around a model_, not the model. The industry lever the DRACO/Darwin work
measured is exactly this — **freeze the model, evolve the harness** — a cheap
model in a well-built, self-improving harness matches a frontier model at a
fraction of the cost. agentic-flow is the open runtime that embodies that thesis.

The `metaharness` package family already names this space (`metaharness`,
`@metaharness/router`, `@metaharness/darwin`). agentic-flow is the runtime that
_operates_ a harness; repositioning makes that relationship explicit instead of
leaving agentic-flow described as a sibling orchestrator.

## Decision

Reposition agentic-flow as **"the agentic meta-harness"** — the open runtime that
builds, routes, evolves, and verifies the harness around a frozen model, and
orchestrates agents and swarms on top of it. Concretely:

1. **Tagline / hero (README):** lead with the meta-harness identity ("freeze the
   model, evolve the harness") and frame the four pillars — **route** (cost-optimal
   model selection), **evolve** (self-improving harness / autonomous repair),
   **orchestrate** (agents, swarms, MCP), **verify** (provenance + safety gate).
2. **`package.json` `description`:** lead with "agentic meta-harness," retaining
   the concrete capabilities (agents, MCP tools, memory, swarms) as what the
   harness runs.
3. **`keywords`:** add `meta-harness`, `metaharness`, `agent-harness`,
   `harness-evolution`, `model-routing`, `cost-optimal-routing`,
   `self-improving`, `darwin`.
4. **Narrative consistency:** ADR-073/074/075 are presented as the pillars of the
   meta-harness, not optional add-ons. Existing orchestration/memory/swarm
   capabilities are reframed as "what the harness runs," not the headline.

This is a positioning and documentation change. **No code behavior changes**, no
API removals — every existing entry point and capability remains.

## Consequences

**Positive**

- Sharper differentiation: the lever is the _harness_, not a bigger model — a
  claim agentic-flow can now back with measured numbers (ADR-073: 28.5% cheaper
  at 98.1% bar-compliance; ADR-074: harness evolution lifts a frozen model's
  score).
- Aligns the package family: `metaharness`/`@metaharness/*` (the parts) and
  `agentic-flow` (the runtime that operates them) tell one story.
- Gives roadmap coherence — routing, evolution, provenance, and orchestration are
  one product, not four.

**Negative / risks**

- "Meta-harness" is a newer term; the README must define it in the first screen
  so it doesn't read as jargon. Mitigation: the one-line "freeze the model,
  evolve the harness" gloss + the four-pillar framing.
- SEO/discovery: existing users search "agent orchestration." Mitigation: keep
  those keywords and phrases; _add_ the meta-harness vocabulary rather than
  replace it.

**Neutral**

- Versioning unaffected; ships within the 2.1.0 docs/positioning update.

## Scope

This ADR covers positioning copy only (`package.json` description/keywords,
`README.md`). It deliberately does **not** rename the package, change exports, or
alter runtime behavior.
