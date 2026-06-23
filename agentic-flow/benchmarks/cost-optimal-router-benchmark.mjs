/**
 * Cost-Optimal Router benchmark (ADR-073).
 *
 * Simulates a 3-tier model lineup (haiku/sonnet/opus) over a synthetic query
 * stream whose difficulty varies, then compares routing strategies on a
 * held-out test set:
 *   - always-haiku  (cheapest, degrades on hard queries)
 *   - always-opus   (frontier, expensive)
 *   - cost-optimal  (@metaharness/router: cheapest model predicted to clear the bar)
 *
 * Reports per-strategy total cost, mean achieved quality, % of queries meeting
 * the quality bar, and the routing-decision latency. Deterministic (seeded).
 *
 * Run:  node benchmarks/cost-optimal-router-benchmark.mjs
 * (build first: npm run build)
 */

import { CostOptimalRouter } from '../dist/router/cost-optimal-router.js';

// ---- deterministic PRNG (mulberry32) -------------------------------------
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(42);
const clamp01 = (x) => Math.min(1, Math.max(0, x));

// ---- model lineup: price + ground-truth quality vs difficulty -------------
// Cheap models are great on easy queries and fall off as difficulty rises;
// the frontier model stays strong everywhere. This is the regime where
// per-query routing is a Pareto win.
const MODELS = {
  'anthropic/claude-haiku-4.5': { price: 1, quality: (d) => clamp01(0.97 - 1.15 * d) },
  'anthropic/claude-sonnet-4.5': { price: 3, quality: (d) => clamp01(0.98 - 0.55 * d) },
  'anthropic/claude-opus-4': { price: 15, quality: (d) => clamp01(0.99 - 0.12 * d) },
};
const MODEL_IDS = Object.keys(MODELS);
const PRICES = Object.fromEntries(MODEL_IDS.map((id) => [id, MODELS[id].price]));
const QUALITY_BAR = 0.8;

// Encode a query's latent difficulty as an 8-dim embedding (difficulty-correlated
// components + noise) so the router must *learn* the difficulty→quality mapping.
function embedFor(difficulty) {
  const e = [difficulty, 1 - difficulty, difficulty * difficulty, Math.sqrt(difficulty)];
  for (let i = 0; i < 4; i++) e.push((rnd() - 0.5) * 0.05); // small noise dims
  return e;
}

// Build a labelled training set: each row = (embedding → quality each model
// achieved), with realistic eval noise on the labels.
function makeRows(n) {
  const rows = [];
  for (let i = 0; i < n; i++) {
    const d = rnd();
    const scores = {};
    for (const id of MODEL_IDS) {
      scores[id] = clamp01(MODELS[id].quality(d) + (rnd() - 0.5) * 0.06);
    }
    rows.push({ embedding: embedFor(d), scores });
  }
  return rows;
}

function evaluate(routeFn, testSet) {
  let totalCost = 0;
  let totalQuality = 0;
  let metBar = 0;
  for (const { difficulty, embedding } of testSet) {
    const id = routeFn(embedding);
    const achieved = MODELS[id].quality(difficulty); // ground truth (no noise)
    totalCost += MODELS[id].price;
    totalQuality += achieved;
    if (achieved >= QUALITY_BAR) metBar++;
  }
  const n = testSet.length;
  return {
    totalCost,
    avgCost: totalCost / n,
    avgQuality: totalQuality / n,
    metBarPct: (100 * metBar) / n,
  };
}

// ---- run ------------------------------------------------------------------
const TRAIN_N = 300;
const TEST_N = 1000;

const router = CostOptimalRouter.fromDataset(makeRows(TRAIN_N), PRICES, {
  qualityBar: QUALITY_BAR,
  k: 5,
});

const testSet = Array.from({ length: TEST_N }, () => {
  const difficulty = rnd();
  return { difficulty, embedding: embedFor(difficulty) };
});

const strategies = {
  'always-haiku': () => 'anthropic/claude-haiku-4.5',
  'always-opus': () => 'anthropic/claude-opus-4',
  'cost-optimal': (e) => router.route(e).id,
};

console.log(`\nCost-Optimal Router benchmark (ADR-073)`);
console.log(`  train=${TRAIN_N} rows · test=${TEST_N} queries · qualityBar=${QUALITY_BAR}`);
console.log(`  prices ($/Mtok): ` + MODEL_IDS.map((id) => `${id.split('/')[1]}=${PRICES[id]}`).join(' · '));
console.log('');
console.log('  strategy        avg$/q   totalCost   avgQuality   %≥bar');
console.log('  ' + '-'.repeat(58));
const results = {};
for (const [name, fn] of Object.entries(strategies)) {
  const r = evaluate(fn, testSet);
  results[name] = r;
  console.log(
    `  ${name.padEnd(14)}  ${r.avgCost.toFixed(2).padStart(6)}   ${String(r.totalCost).padStart(9)}   ${r.avgQuality
      .toFixed(3)
      .padStart(10)}   ${r.metBarPct.toFixed(1).padStart(5)}`,
  );
}

// Headline: cost-optimal vs always-opus at comparable quality.
const co = results['cost-optimal'];
const opus = results['always-opus'];
const savedPct = (100 * (opus.totalCost - co.totalCost)) / opus.totalCost;
console.log('');
console.log(
  `  → cost-optimal spends ${savedPct.toFixed(1)}% less than always-opus ` +
    `(${co.totalCost} vs ${opus.totalCost}) while holding ${co.metBarPct.toFixed(1)}% of queries at/above the bar.`,
);

// ---- routing-decision latency --------------------------------------------
const LAT_ITERS = 20000;
const probe = testSet[0].embedding;
// warm up
for (let i = 0; i < 1000; i++) router.route(probe);
const samples = new Float64Array(LAT_ITERS);
for (let i = 0; i < LAT_ITERS; i++) {
  const t0 = process.hrtime.bigint();
  router.route(testSet[i % TEST_N].embedding);
  samples[i] = Number(process.hrtime.bigint() - t0) / 1000; // µs
}
samples.sort();
const p = (q) => samples[Math.floor(q * LAT_ITERS)];
console.log('');
console.log(
  `  routing latency over ${LAT_ITERS} calls: ` +
    `p50=${p(0.5).toFixed(1)}µs · p99=${p(0.99).toFixed(1)}µs · max=${samples[LAT_ITERS - 1].toFixed(1)}µs`,
);
console.log('');
