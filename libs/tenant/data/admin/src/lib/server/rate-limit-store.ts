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

import { createHash } from 'crypto'
import { firebaseAdmin } from './firebase-admin'
import {
  checkRateLimit,
  DEFAULT_RATE_LIMIT,
  DEFAULT_RATE_WINDOW_MS,
  type RateLimitResult,
} from './api-http'

/**
 * Durable, cross-instance rate limiting (AGL-794).
 *
 * Every limiter in the codebase was a per-instance `Map`, each carrying its
 * own "best-effort, serverless instances are ephemeral" caveat. On Vercel that
 * is close to no limit at all: the counter resets on every cold start and each
 * concurrent instance keeps its own, so the effective cap is roughly
 * `limit × instances` and an attacker can widen it just by going wider. That
 * is tolerable for blunting accidental bursts; it is not a brute-force
 * defense.
 *
 * This backs the same fixed-window shape with a Firestore counter, so the cap
 * is global. `api-http.ts` deliberately stays pure — it has no imports and is
 * unit-tested directly — so the storage-backed variant lives here instead of
 * being bolted onto it.
 *
 * **Cost is the reason this isn't the default everywhere.** Each call is a
 * transaction (one read + one write). That is the right trade for a password
 * unlock attempt; it is the wrong trade for an analytics beacon, which can
 * fire on every page view. Use `checkRateLimit` for volume, this for
 * consequence.
 */

/** Collection holding one document per (key, window). Server-writes only. */
export const RATE_LIMIT_COLLECTION = 'rateLimits'

export interface DurableRateLimitOptions {
  limit?: number
  windowMs?: number
  now?: number
  /** Injectable for tests; defaults to the Admin SDK's Firestore. */
  firestore?: any
}

export interface DurableRateLimitResult extends RateLimitResult {
  /**
   * True when the durable store was unreachable and the in-memory limiter
   * answered instead — the cap held for this instance only.
   */
  degraded: boolean
}

/**
 * Document id for a (key, window) pair.
 *
 * The key is hashed rather than embedded: callers key on client IPs, and an
 * IP is personal data that would otherwise sit in plaintext document ids
 * (which also show up in any index export). Hashing additionally makes the id
 * safe — Firestore ids may not contain `/`, which IPv6-mapped and
 * path-derived keys can. Truncated to 32 hex chars: collisions would merely
 * merge two callers into one bucket, and 128 bits is far past needing that.
 */
function bucketId(key: string, windowStartMs: number): string {
  const hash = createHash('sha256').update(key).digest('hex').slice(0, 32)
  return `${hash}_${windowStartMs}`
}

/**
 * Counts one request against `key`'s fixed window, globally.
 *
 * Fails *soft, not open*: if Firestore is unreachable the in-memory limiter
 * answers and the result is flagged `degraded`. Failing fully open would let
 * an attacker disable brute-force protection by inducing a storage error;
 * failing fully closed would lock legitimate visitors out of a site because of
 * an unrelated Firestore blip. Degrading to the per-instance cap keeps some
 * protection and keeps the site usable, and says which happened.
 */
export async function consumeRateLimit(
  key: string,
  options?: DurableRateLimitOptions,
): Promise<DurableRateLimitResult> {
  const limit = options?.limit ?? DEFAULT_RATE_LIMIT
  const windowMs = options?.windowMs ?? DEFAULT_RATE_WINDOW_MS
  const now = options?.now ?? Date.now()
  const windowStartMs = Math.floor(now / windowMs) * windowMs
  const resetMs = windowStartMs + windowMs

  try {
    const firestore =
      options?.firestore ?? firebaseAdmin.app().firestore()
    const ref = firestore
      .collection(RATE_LIMIT_COLLECTION)
      .doc(bucketId(key, windowStartMs))

    const count = await firestore.runTransaction(async (tx: any) => {
      const snapshot = await tx.get(ref)
      const next = ((snapshot.exists ? snapshot.get('count') : 0) ?? 0) + 1
      tx.set(
        ref,
        {
          count: next,
          windowStartMs,
          // For a Firestore TTL policy on `expiresAt` — without one these
          // documents accumulate forever. See docs/RATE_LIMITING.md.
          expiresAt: new Date(resetMs + windowMs),
        },
        { merge: true },
      )
      return next
    })

    return {
      allowed: count <= limit,
      limit,
      remaining: Math.max(0, limit - count),
      resetMs,
      degraded: false,
    }
  } catch (error) {
    console.error('[rate-limit] durable store unavailable, degrading', error)
    return { ...checkRateLimit(key, { limit, windowMs, now }), degraded: true }
  }
}

export default consumeRateLimit
