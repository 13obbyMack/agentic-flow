/**
 * Cost-Optimal Model Router (ADR-073)
 *
 * Routes each query to the *cheapest model predicted to clear a quality bar*,
 * learned from eval logs — the productized DRACO Phase-2 finding. Wraps
 * `@metaharness/router` (dependency-free k-NN / kernel-ridge, optional native
 * FastGRNN via the already-present `@ruvector/tiny-dancer`).
 *
 * This is additive to `ModelRouter`'s existing config-rule routing: it selects
 * a *model* by predicted cost-quality rather than a provider by static rule.
 * It degrades gracefully — with no labelled examples it falls back to the
 * best-predicted candidate (effectively the caller's prior behavior), so a
 * cold start never breaks routing.
 *
 * @see docs/adr/ADR-073-metaharness-router-cost-optimal-model-routing.md
 */

import { Router, type RouteResult, type RouterCandidate } from '@metaharness/router';
import type { ProviderType } from './types.js';

/** One labelled observation: a query embedding and the quality a model achieved on it. */
export interface RoutingExample {
  embedding: number[];
  quality: number; // 0..1
}

/** A flat training row: query embedding → quality each model achieved on that query. */
export interface RoutingDatasetRow {
  embedding: number[];
  scores: Record<string, number>; // modelId → quality (0..1)
}

/** Maps a router model id (e.g. "anthropic/claude-haiku-4.5") to a concrete provider + model. */
export interface ModelBinding {
  provider: ProviderType;
  model: string;
}

export interface CostOptimalRouterConfig {
  /**
   * Quality bar (0..1). When set, route() returns the CHEAPEST candidate
   * predicted to clear it; when none clear it, the best-predicted; when unset,
   * always the best-predicted.
   */
  qualityBar?: number;
  /** k-NN neighbours used to predict quality on a new query (default 5). */
  k?: number;
  /**
   * Optional explicit model id → provider/model bindings. When a routed id is
   * absent here, it is parsed as `"<provider>/<model>"` (the OpenRouter-style
   * convention), falling back to treating the whole id as the model name on the
   * default provider.
   */
  modelMap?: Record<string, ModelBinding>;
  /** Provider to assume when a model id has no `"<provider>/"` prefix. */
  defaultProvider?: ProviderType;
}

/** A routing decision: the underlying RouteResult plus the resolved provider/model. */
export interface CostOptimalDecision extends RouteResult {
  provider: ProviderType;
  model: string;
}

/**
 * Parse a router model id into a provider/model binding. `"anthropic/claude-..."`
 * → `{ provider: 'anthropic', model: 'claude-...' }`. Ids without a known
 * provider prefix bind to `defaultProvider` with the id as the model name.
 */
export function parseModelId(
  id: string,
  modelMap: Record<string, ModelBinding> | undefined,
  defaultProvider: ProviderType,
): ModelBinding {
  if (modelMap && modelMap[id]) return modelMap[id];
  const slash = id.indexOf('/');
  if (slash > 0) {
    const maybeProvider = id.slice(0, slash) as ProviderType;
    const known: ProviderType[] = [
      'anthropic',
      'openai',
      'openrouter',
      'ollama',
      'litellm',
      'onnx',
      'gemini',
      'custom',
    ];
    if (known.includes(maybeProvider)) {
      return { provider: maybeProvider, model: id.slice(slash + 1) };
    }
  }
  return { provider: defaultProvider, model: id };
}

export class CostOptimalRouter {
  private readonly router: Router;
  private readonly modelMap?: Record<string, ModelBinding>;
  private readonly defaultProvider: ProviderType;

  private constructor(router: Router, config: CostOptimalRouterConfig) {
    this.router = router;
    this.modelMap = config.modelMap;
    this.defaultProvider = config.defaultProvider ?? 'anthropic';
  }

  /**
   * Build from explicit candidates (each with its own labelled examples + price).
   * Use when you already have per-model example sets.
   */
  static fromCandidates(
    candidates: RouterCandidate[],
    config: CostOptimalRouterConfig = {},
  ): CostOptimalRouter {
    const router = new Router({
      candidates,
      k: config.k,
      qualityBar: config.qualityBar,
    });
    return new CostOptimalRouter(router, config);
  }

  /**
   * Build from a flat routing dataset — rows of (query embedding → quality each
   * model achieved) plus a per-model price table. This is the shape eval logs
   * and the DRACO benchmark emit, and the same shape that seeds a native
   * tiny-dancer trainer.
   */
  static fromDataset(
    rows: RoutingDatasetRow[],
    prices: Record<string, number>,
    config: CostOptimalRouterConfig = {},
  ): CostOptimalRouter {
    const router = Router.fromExamples(rows, prices, {
      k: config.k,
      qualityBar: config.qualityBar,
    });
    return new CostOptimalRouter(router, config);
  }

  /** Route a pre-embedded query to the cost-optimal model + provider. */
  route(queryEmbedding: number[]): CostOptimalDecision {
    const result = this.router.route(queryEmbedding);
    const { provider, model } = parseModelId(result.id, this.modelMap, this.defaultProvider);
    return { ...result, provider, model };
  }

  /**
   * Route using an injected embedder (e.g. the ONNX/ruvector embedding service).
   * Keeps this module decoupled from any specific embedding backend.
   */
  async routeText(
    text: string,
    embed: (text: string) => Promise<number[]> | number[],
  ): Promise<CostOptimalDecision> {
    const embedding = await embed(text);
    return this.route(embedding);
  }
}
