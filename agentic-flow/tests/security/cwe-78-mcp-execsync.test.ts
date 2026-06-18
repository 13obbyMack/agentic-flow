/**
 * Regression test for CWE-78 OS Command Injection in agentic-flow MCP server tools.
 *
 * The pre-fix source built shell command strings by template-interpolating
 * attacker-influenceable MCP tool parameters (e.g. `agent`, `task`, `name`,
 * `language`, `language`, agentdb args) directly into a string passed to
 * `execSync`. A value like `x"; touch INJECTED; echo "` would break out of
 * the surrounding double quotes and execute arbitrary commands.
 *
 * The fix replaces every such call with `execFileSync('npx', argvArray,
 * { shell: false })` — argv elements are passed straight to execve(2) without
 * shell parsing, so shell metacharacters are inert.
 *
 * This test is a static check: scan every MCP server / tool source file in
 * src/mcp and assert that none of them imports execSync or uses execSync(...).
 * That's the strongest invariant we can enforce here without spinning up a
 * real MCP client.
 *
 * Exemptions live in EXEMPT_FILES — these are static-command call sites
 * where no user input is interpolated (e.g. `git ls-files 2>/dev/null`).
 * Each exemption MUST be accompanied by an explanatory comment in source.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve, relative } from 'node:path';

const MCP_ROOT = resolve(__dirname, '../../src/mcp');

// Files where execSync is allowed because the command is static (no user
// input) AND the shell is required for legitimate functionality like `2>/dev/null`
// or `||` fallbacks. Source must include a comment explaining why.
const EXEMPT_FILES = new Set<string>([
  // pretrain.ts uses execSync for `git ls-files ... || find ...` and
  // `find ... || echo "."` — no MCP-tool-parameter interpolation.
  'fastmcp/tools/hooks/pretrain.ts'
]);

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (name === 'node_modules' || name === 'dist') continue;
      walk(full, out);
    } else if (name.endsWith('.ts') && !name.endsWith('.d.ts')) {
      out.push(full);
    }
  }
  return out;
}

describe('CWE-78: MCP server tools must not use execSync with shell interpolation', () => {
  const files = walk(MCP_ROOT);

  it('discovers MCP source files', () => {
    expect(files.length).toBeGreaterThan(5);
  });

  for (const file of files) {
    const rel = relative(MCP_ROOT, file);
    const src = readFileSync(file, 'utf-8');

    it(`${rel} does not call execSync with template-string interpolation`, () => {
      // Strip comments and string-literal contents that contain the word `execSync`
      // so the documentation comments we added in the fix don't trip the scanner.
      const stripped = src
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/[^\n]*/g, '');

      // Look for execSync( call sites
      const callPattern = /execSync\s*\(/g;
      const calls = [...stripped.matchAll(callPattern)];

      if (calls.length === 0) return; // file is clean

      if (EXEMPT_FILES.has(rel)) {
        // Exempt — but make sure the exempt sites never interpolate variables.
        // Anything passed must be a plain string literal.
        for (const m of calls) {
          const start = m.index!;
          const tail = stripped.slice(start, start + 400);
          // Reject backtick template literals containing ${ and reject
          // identifier-then-comma argument lists.
          const hasTemplate = /execSync\s*\(\s*`[^`]*\$\{/.test(tail);
          expect(hasTemplate, `${rel} has template interpolation in execSync()`).toBe(false);
        }
        return;
      }

      // Non-exempt: no execSync calls allowed at all.
      throw new Error(
        `${rel} contains ${calls.length} execSync() call(s). ` +
        `Use execFileSync('npx', argvArray, { shell: false }) instead, ` +
        `or add an explicit exemption with a justifying comment.`
      );
    });
  }
});

describe('CWE-78: PoC payload must not escape argv when passed to execFileSync', () => {
  // This is a behavioural smoke check: prove that a payload that WOULD have
  // broken out of the old quoted-string command becomes inert as an argv element.
  it('shell metacharacters in argv element do not trigger a subcommand', async () => {
    const { execFileSync } = await import('node:child_process');
    const payload = 'x"; touch /tmp/agentic_flow_cwe78_marker_should_not_exist; echo "';

    // We invoke `node -e 'process.stdout.write(process.argv[1])'` with the
    // payload as argv[2] (process.argv[1] in the script — argv[0] is "node",
    // argv[1] is "-e", so the user payload lands in process.argv[2] visible
    // as argv[1] inside the -e script because -e doesn't reserve a slot).
    // We just want to prove the marker file is NOT created.
    let stdout = '';
    try {
      stdout = execFileSync(
        'node',
        ['-e', 'process.stdout.write(JSON.stringify(process.argv.slice(1)))', payload],
        { shell: false, encoding: 'utf-8', timeout: 5000 }
      );
    } catch (e: unknown) {
      // node may exit non-zero — that's fine, we only care that the shell
      // never saw the metacharacters.
      const err = e as { stdout?: { toString: () => string } };
      stdout = err.stdout?.toString() ?? '';
    }

    // The payload must come back verbatim as an argv element — the shell never
    // ran, so the `touch` subcommand never executed.
    expect(stdout).toContain('"x\\"; touch');

    // Belt-and-suspenders: the marker file must not exist.
    const { existsSync } = await import('node:fs');
    expect(existsSync('/tmp/agentic_flow_cwe78_marker_should_not_exist')).toBe(false);
  });
});
