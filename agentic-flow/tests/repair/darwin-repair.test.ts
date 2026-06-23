/**
 * Hermetic tests for Darwin Repair (ADR-074).
 *
 * Uses sandboxMode 'mock' — deterministic, surface-driven, no repo test command,
 * no Docker, no network — so the evolution pipeline can be smoke-tested in CI.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { repair, DarwinRepair, REPAIR_TASKS } from '../../src/repair/darwin-repair.js';
import { parseArgs } from '../../src/repair/cli.js';

let repoRoot: string;
let workSeq = 0;
const freshWork = () => join(repoRoot, `.mh-${workSeq++}`);

beforeAll(() => {
  repoRoot = mkdtempSync(join(tmpdir(), 'darwin-repair-'));
  writeFileSync(
    join(repoRoot, 'package.json'),
    JSON.stringify({ name: 'fixture', version: '0.0.0', scripts: { test: 'node -e "process.exit(0)"' } }),
  );
});

afterAll(() => {
  rmSync(repoRoot, { recursive: true, force: true });
});

describe('DarwinRepair — hermetic mock-mode evolution', () => {
  it('runs a deterministic mock evolution and returns a structured result', async () => {
    const res = await repair({
      repoRoot,
      workRoot: freshWork(),
      sandboxMode: 'mock',
      generations: 1,
      childrenPerGeneration: 2,
      seed: 0,
    });
    expect(res.raw.baseline).toBeTruthy();
    expect(res.generations).toBe(1);
    expect(res.variantsEvaluated).toBeGreaterThanOrEqual(1);
    expect(res.winnerLineage[0]).toBeTruthy(); // baseline id roots the lineage
    expect(typeof res.baselineScore).toBe('number');
    expect(typeof res.improved).toBe('boolean');
  });

  it('is reproducible for a fixed seed', async () => {
    const a = await repair({ repoRoot, workRoot: freshWork(), sandboxMode: 'mock', generations: 1, childrenPerGeneration: 2, seed: 7 });
    const b = await repair({ repoRoot, workRoot: freshWork(), sandboxMode: 'mock', generations: 1, childrenPerGeneration: 2, seed: 7 });
    expect(b.winnerLineage).toEqual(a.winnerLineage);
    expect(b.baselineScore).toBe(a.baselineScore);
  });

  it('DarwinRepair binds defaults across runs', async () => {
    const runner = new DarwinRepair({ sandboxMode: 'mock', generations: 1, childrenPerGeneration: 2 });
    const res = await runner.repair({ repoRoot, workRoot: freshWork(), seed: 1 });
    expect(res.generations).toBe(1);
  });

  it('exposes the default repair task list', () => {
    expect(REPAIR_TASKS.length).toBeGreaterThan(0);
  });
});

describe('repair CLI arg parsing', () => {
  it('parses positional repo + flags, defaulting to real (test-driven) mode', () => {
    expect(parseArgs(['/repo', '--generations', '5', '--children', '3', '--seed', '9'])).toEqual({
      repoRoot: '/repo',
      generations: 5,
      children: 3,
      seed: 9,
      sandboxMode: 'real',
    });
  });

  it('--mock selects the hermetic substrate', () => {
    expect(parseArgs(['/repo', '--mock']).sandboxMode).toBe('mock');
  });
});
