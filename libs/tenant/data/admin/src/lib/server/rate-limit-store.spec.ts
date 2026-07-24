/**
 * @license
 * Copyright 2026 Aglyn LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  consumeRateLimit,
  RATE_LIMIT_COLLECTION,
} from './rate-limit-store'

/**
 * A Firestore stand-in with just enough transaction semantics: documents in a
 * Map, `runTransaction` executed inline. The point of the durable limiter is
 * that state outlives one instance, so the fake keeps a store the test can
 * inspect and reuse across calls.
 */
function fakeFirestore() {
  const docs = new Map<string, Record<string, unknown>>()
  let failNext = false
  const api = {
    docs,
    failFrom: () => {
      failNext = true
    },
    collection: (name: string) => ({
      doc: (id: string) => ({ path: `${name}/${id}` }),
    }),
    runTransaction: async (fn: (tx: unknown) => Promise<number>) => {
      if (failNext) throw new Error('firestore unavailable')
      const tx = {
        get: async (ref: { path: string }) => ({
          exists: docs.has(ref.path),
          get: (field: string) => docs.get(ref.path)?.[field],
        }),
        set: (ref: { path: string }, value: Record<string, unknown>) => {
          docs.set(ref.path, { ...(docs.get(ref.path) ?? {}), ...value })
        },
      }
      return fn(tx)
    },
  }
  return api
}

describe('consumeRateLimit (AGL-794)', () => {
  const opts = (firestore: unknown, now: number) => ({
    firestore,
    limit: 3,
    windowMs: 1000,
    now,
  })

  it('counts across calls and denies past the limit', async () => {
    const firestore = fakeFirestore()
    const results = []
    for (let i = 0; i < 4; i += 1) {
      results.push(await consumeRateLimit('ip-1', opts(firestore, 10_000)))
    }
    expect(results.map((r) => r.allowed)).toEqual([true, true, true, false])
    expect(results.map((r) => r.remaining)).toEqual([2, 1, 0, 0])
    expect(results.every((r) => !r.degraded)).toBe(true)
  })

  it('keeps separate budgets per key', async () => {
    const firestore = fakeFirestore()
    for (let i = 0; i < 3; i += 1) {
      await consumeRateLimit('ip-1', opts(firestore, 10_000))
    }
    // A different caller is unaffected by the first one exhausting its window.
    const other = await consumeRateLimit('ip-2', opts(firestore, 10_000))
    expect(other.allowed).toBe(true)
    expect(other.remaining).toBe(2)
  })

  it('starts a fresh window once the old one elapses', async () => {
    const firestore = fakeFirestore()
    for (let i = 0; i < 4; i += 1) {
      await consumeRateLimit('ip-1', opts(firestore, 10_000))
    }
    const next = await consumeRateLimit('ip-1', opts(firestore, 11_200))
    expect(next.allowed).toBe(true)
    expect(next.remaining).toBe(2)
  })

  // The whole reason this exists: a per-instance Map does NOT survive a cold
  // start, so the durable counter must be keyed only by (key, window) and not
  // by anything instance-local.
  it('survives a simulated cold start', async () => {
    const firestore = fakeFirestore()
    await consumeRateLimit('ip-1', opts(firestore, 10_000))
    await consumeRateLimit('ip-1', opts(firestore, 10_000))
    // New "instance" — same backing store, no in-process state carried over.
    jest.resetModules()
    const fresh = await consumeRateLimit('ip-1', opts(firestore, 10_000))
    expect(fresh.allowed).toBe(true)
    expect(fresh.remaining).toBe(0)
    const overflow = await consumeRateLimit('ip-1', opts(firestore, 10_000))
    expect(overflow.allowed).toBe(false)
  })

  it('writes an expiry so buckets can be TTL-swept', async () => {
    const firestore = fakeFirestore()
    await consumeRateLimit('ip-1', opts(firestore, 10_000))
    const [[path, doc]] = [...firestore.docs.entries()]
    expect(path.startsWith(`${RATE_LIMIT_COLLECTION}/`)).toBe(true)
    expect(doc['expiresAt']).toBeInstanceOf(Date)
  })

  it('never puts the raw key in the document id', async () => {
    const firestore = fakeFirestore()
    // Keys carry client IPs, which are personal data and must not sit in
    // plaintext document ids.
    await consumeRateLimit('unlock:host:screen:203.0.113.7', opts(firestore, 0))
    const [path] = [...firestore.docs.keys()]
    expect(path).not.toContain('203.0.113.7')
    expect(path).not.toContain('unlock:host')
  })

  it('degrades to the in-memory limiter when the store is unavailable', async () => {
    const firestore = fakeFirestore()
    firestore.failFrom()
    const result = await consumeRateLimit('ip-degraded', opts(firestore, 10_000))
    // Fails SOFT, not open: still answers, still counts, but says the cap
    // held for this instance only. Failing open would let an attacker disable
    // brute-force protection by inducing a storage error.
    expect(result.degraded).toBe(true)
    expect(result.allowed).toBe(true)
    expect(result.limit).toBe(3)
  })
})
