/**
 * Tests for the cost-optimal model router (ADR-073).
 *
 * Uses k=1 so a candidate's predicted quality equals its nearest example's
 * quality — making every routing decision deterministic and assertable.
 */

import { describe, it, expect } from 'vitest';
import {
  CostOptimalRouter,
  parseModelId,
  type ModelBinding,
} from '../../src/router/cost-optimal-router.js';

// Two models: a cheap one that's only good at "type A" queries ([1,0]) and an
// expensive one that's good everywhere. Embeddings are 2D unit-ish vectors.
const CANDIDATES = [
  {
    id: 'cheap',
    costPerMTok: 1,
    examples: [
      { embedding: [1, 0], quality: 0.9 }, // great at A
      { embedding: [0, 1], quality: 0.4 }, // weak at B
    ],
  },
  {
    id: 'expensive',
    costPerMTok: 15,
    examples: [
      { embedding: [1, 0], quality: 0.95 },
      { embedding: [0, 1], quality: 0.95 }, // strong everywhere
    ],
  },
];

describe('CostOptimalRouter — quality-bar routing', () => {
  it('routes an easy query to the CHEAPEST model that clears the bar', () => {
    const r = CostOptimalRouter.fromCandidates(CANDIDATES, { qualityBar: 0.8, k: 1 });
    const d = r.route([1, 0]); // type A — cheap predicts 0.9, clears 0.8
    expect(d.id).toBe('cheap');
    expect(d.metBar).toBe(true);
    expect(d.costPerMTok).toBe(1);
  });

  it('escalates to the capable model when the cheap one misses the bar', () => {
    const r = CostOptimalRouter.fromCandidates(CANDIDATES, { qualityBar: 0.8, k: 1 });
    const d = r.route([0, 1]); // type B — cheap predicts 0.4 (<0.8), expensive 0.95
    expect(d.id).toBe('expensive');
    expect(d.metBar).toBe(true);
  });

  it('falls back to the best-predicted model when NO candidate clears the bar', () => {
    const r = CostOptimalRouter.fromCandidates(CANDIDATES, { qualityBar: 0.99, k: 1 });
    const d = r.route([0, 1]); // best predicted is expensive @ 0.95, still < 0.99
    expect(d.id).toBe('expensive');
    expect(d.metBar).toBe(false);
  });

  it('with no bar set, always returns the best-predicted model', () => {
    const r = CostOptimalRouter.fromCandidates(CANDIDATES, { k: 1 });
    expect(r.route([0, 1]).id).toBe('expensive');
  });
});

describe('CostOptimalRouter — dataset + provider resolution', () => {
  it('builds from a flat (embedding → per-model scores) dataset', () => {
    const rows = [
      { embedding: [1, 0], scores: { cheap: 0.9, expensive: 0.95 } },
      { embedding: [0, 1], scores: { cheap: 0.4, expensive: 0.95 } },
    ];
    const r = CostOptimalRouter.fromDataset(rows, { cheap: 1, expensive: 15 }, { qualityBar: 0.8, k: 1 });
    expect(r.route([1, 0]).id).toBe('cheap');
    expect(r.route([0, 1]).id).toBe('expensive');
  });

  it('resolves "<provider>/<model>" ids and honors an explicit modelMap', () => {
    const candidates = [
      { id: 'anthropic/claude-haiku-4.5', costPerMTok: 1, examples: [{ embedding: [1, 0], quality: 0.9 }] },
    ];
    const r = CostOptimalRouter.fromCandidates(candidates, { qualityBar: 0.8, k: 1, defaultProvider: 'openrouter' });
    const d = r.route([1, 0]);
    expect(d.provider).toBe('anthropic');
    expect(d.model).toBe('claude-haiku-4.5');
  });

  it('routeText embeds via the injected embedder before routing', async () => {
    const r = CostOptimalRouter.fromCandidates(CANDIDATES, { qualityBar: 0.8, k: 1 });
    const embed = (t: string): number[] => (t === 'easy' ? [1, 0] : [0, 1]);
    expect((await r.routeText('easy', embed)).id).toBe('cheap');
    expect((await r.routeText('hard', embed)).id).toBe('expensive');
  });
});

describe('parseModelId', () => {
  it('parses a known provider prefix', () => {
    expect(parseModelId('gemini/gemini-2.0-flash', undefined, 'anthropic')).toEqual({
      provider: 'gemini',
      model: 'gemini-2.0-flash',
    });
  });

  it('binds an unprefixed id to the default provider', () => {
    expect(parseModelId('claude-opus-4', undefined, 'anthropic')).toEqual({
      provider: 'anthropic',
      model: 'claude-opus-4',
    });
  });

  it('prefers an explicit modelMap entry over prefix parsing', () => {
    const map: Record<string, ModelBinding> = { 'tier-2': { provider: 'ollama', model: 'llama3.2:1b' } };
    expect(parseModelId('tier-2', map, 'anthropic')).toEqual({ provider: 'ollama', model: 'llama3.2:1b' });
  });
});
