/**
 * Harness provenance — Ed25519 witness manifest over harness/agent config files
 * (ADR-075, Track B).
 *
 * Produces a tamper-evident manifest (sha256 per file) and signs it with Ed25519
 * (Node's built-in `crypto` — no external deps), complementing the CWE-78
 * hardening: a signed manifest lets a consumer verify that the agent/skill/policy
 * files a harness ships are exactly the ones that were reviewed.
 *
 * Deterministic by construction (no wall-clock inside): the caller supplies any
 * timestamp, and entries are sorted, so signing the same files yields the same
 * payload.
 *
 * @see docs/adr/ADR-075-metaharness-harness-evolution-and-provenance.md
 */

import { generateKeyPairSync, sign as cryptoSign, verify as cryptoVerify, createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

export interface ManifestEntry {
  /** File path as supplied (used as the stable sort/identity key). */
  path: string;
  /** Lowercase hex sha256 of the file contents. */
  sha256: string;
}

export interface HarnessManifest {
  version: 1;
  /** Optional caller-supplied timestamp (ISO string). Part of the signed payload. */
  createdAt?: string;
  /** File digests, sorted by path for a canonical, reproducible payload. */
  entries: ManifestEntry[];
}

export interface KeyPairPem {
  publicKey: string;
  privateKey: string;
}

/** Generate an Ed25519 keypair as PEM strings (spki/pkcs8). */
export function generateKeyPairPem(): KeyPairPem {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519');
  return {
    publicKey: publicKey.export({ type: 'spki', format: 'pem' }).toString(),
    privateKey: privateKey.export({ type: 'pkcs8', format: 'pem' }).toString(),
  };
}

/** sha256 (hex) of a buffer. */
export function sha256Hex(data: Buffer | string): string {
  return createHash('sha256').update(data).digest('hex');
}

/**
 * Build a canonical manifest over the given files. Entries are sorted by path so
 * the signed payload is stable regardless of input order. `createdAt` is included
 * verbatim if provided.
 */
export function buildManifest(files: string[], opts: { createdAt?: string } = {}): HarnessManifest {
  const entries: ManifestEntry[] = files
    .map((path) => ({ path, sha256: sha256Hex(readFileSync(path)) }))
    .sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  return { version: 1, ...(opts.createdAt ? { createdAt: opts.createdAt } : {}), entries };
}

/** Canonical bytes that get signed/verified — stable JSON of the manifest. */
function canonicalPayload(manifest: HarnessManifest): string {
  // Keys emitted in a fixed order; entries already sorted by buildManifest.
  return JSON.stringify({
    version: manifest.version,
    createdAt: manifest.createdAt ?? null,
    entries: manifest.entries.map((e) => ({ path: e.path, sha256: e.sha256 })),
  });
}

/** Sign a manifest with an Ed25519 private-key PEM. Returns a base64 signature. */
export function signManifest(manifest: HarnessManifest, privateKeyPem: string): string {
  const payload = Buffer.from(canonicalPayload(manifest), 'utf8');
  // Ed25519 takes a null algorithm (the curve fixes the hash).
  return cryptoSign(null, payload, privateKeyPem).toString('base64');
}

/** Verify a base64 Ed25519 signature over a manifest with a public-key PEM. */
export function verifyManifest(manifest: HarnessManifest, signatureBase64: string, publicKeyPem: string): boolean {
  try {
    const payload = Buffer.from(canonicalPayload(manifest), 'utf8');
    return cryptoVerify(null, payload, publicKeyPem, Buffer.from(signatureBase64, 'base64'));
  } catch {
    return false; // malformed signature/key → not verified
  }
}

export interface SignedManifest {
  manifest: HarnessManifest;
  signature: string; // base64
  publicKey: string; // spki PEM (the verification anchor)
}

/** Convenience: build + sign in one step, returning a portable signed bundle. */
export function signFiles(files: string[], privateKeyPem: string, publicKeyPem: string, opts: { createdAt?: string } = {}): SignedManifest {
  const manifest = buildManifest(files, opts);
  return { manifest, signature: signManifest(manifest, privateKeyPem), publicKey: publicKeyPem };
}

/**
 * Verify a signed bundle AND that the on-disk files still match the manifest
 * digests. Returns a per-file drift report so a caller can see exactly what
 * changed since signing.
 */
export function verifySignedManifest(signed: SignedManifest): {
  signatureValid: boolean;
  filesIntact: boolean;
  drift: { path: string; expected: string; actual: string | null }[];
} {
  const signatureValid = verifyManifest(signed.manifest, signed.signature, signed.publicKey);
  const drift: { path: string; expected: string; actual: string | null }[] = [];
  for (const entry of signed.manifest.entries) {
    let actual: string | null = null;
    try {
      actual = sha256Hex(readFileSync(entry.path));
    } catch {
      actual = null; // missing/unreadable
    }
    if (actual !== entry.sha256) drift.push({ path: entry.path, expected: entry.sha256, actual });
  }
  return { signatureValid, filesIntact: drift.length === 0, drift };
}
