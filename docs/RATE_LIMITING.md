# Rate limiting

How abuse is bounded on the endpoints that anyone on the internet can call.

## The problem this fixed (AGL-794)

Every limiter in the codebase was a per-instance `Map`:

```ts
const recentByIp = new Map<string, number[]>()
```

Each carried an honest caveat — *"serverless instances are ephemeral, so this
only blunts bursts"* — and on Vercel that is close to no limit at all. The
counter resets on every cold start, and each concurrent instance keeps its
own, so the effective cap is roughly `limit × instances`. An attacker widens
it just by sending requests faster, which spreads them across more instances.

That is fine for damping accidental bursts. It is not a brute-force defense.

## What is durable now

`consumeRateLimit()` in `@aglyn/tenant-data-admin`
(`lib/server/rate-limit-store.ts`) backs the same fixed-window shape with a
Firestore counter, so the cap is global.

| Endpoint | Limit | Why durable |
| --- | --- | --- |
| `POST /api/protection/unlock` | 10 / min per (screen, IP) | Password guessing. The per-instance cap was directly bypassable. |
| `POST /api/forms/submit` | 10 / min per (site, IP) | Spam. The monthly plan quota is the hard cap, but burning a site's whole allowance *is* the damage — it shouldn't be the protection. |

Keys are compound on purpose. Unlock is keyed per *(screen, IP)* so a shared
office NAT can't be locked out of a whole site by one person, while one IP
still can't get a fresh budget for every screen it attacks.

## What is deliberately NOT durable

`POST /api/analytics/collect` still uses the in-memory limiter.

Each durable call is a Firestore transaction — one read plus one write. That
is the right price for a password attempt and the wrong price for a beacon
that can fire on every page view. The harm from analytics spam is polluted
numbers, not access; paying a write per pageview to prevent it would cost more
than the problem.

The same reasoning applies to `checkRateLimit()` in `api-http.ts`, which the
customer REST API uses per key. Those callers are already authenticated, so
the limiter is protecting capacity rather than a secret. If it needs to become
global later, swap the call — the shapes match.

**Rule of thumb: `checkRateLimit` for volume, `consumeRateLimit` for
consequence.**

## Failure behaviour: soft, not open

If Firestore is unreachable, `consumeRateLimit` falls back to the in-memory
limiter and returns `degraded: true`.

Neither extreme is right here. Failing fully **open** would let an attacker
disable brute-force protection by inducing a storage error — the protection
evaporates exactly when someone is attacking it. Failing fully **closed**
would lock legitimate visitors out of a customer's site over an unrelated
Firestore blip. Degrading to the per-instance cap keeps some protection, keeps
sites usable, and reports which happened.

Note this is the opposite of the fail-open default the pre-release audit
flagged as systemic — `CSRF_SECRET = process.env.CSRF_SECRET || ''` still
signs with an empty key when unset (see AGL-792).

## Operational: enable the TTL policy

Each call writes `rateLimits/{hash}_{windowStart}` with an `expiresAt`
timestamp. **Firestore does not act on that field by itself** — a TTL policy
has to be configured once, or these documents accumulate forever:

Firebase console → Firestore → **Time-to-live** → add a policy on collection
`rateLimits`, field `expiresAt`.

Until that is enabled, the collection grows by roughly one document per
(caller, minute) on the two protected endpoints. Small, but unbounded.

## Privacy

Bucket keys contain client IPs, so the document id is a truncated SHA-256 of
the key rather than the key itself. IPs are personal data and would otherwise
sit in plaintext ids, which also surface in index exports. Hashing has the
side benefit of producing ids that are always Firestore-safe.

## Rules

`rateLimits` is denied to all clients in `cloud/firebase-firestore.rules`. A
client that could write these could reset its own counter, which defeats the
point; one that could read them could see which buckets are near their cap.

The rule is explicit rather than load-bearing — there is no catch-all match in
the ruleset, so unmatched collections are denied anyway, and the Admin SDK
bypasses rules entirely. It does not need an urgent deploy; it will go out
with the next `node tools/scripts/deploy-firestore-rules.mjs` run.

## Adding a limiter

```ts
import { consumeRateLimit } from '@aglyn/tenant-data-admin'

const rate = await consumeRateLimit(`myfeature:${scopeId}:${ip}`, {
  limit: 10,
  windowMs: 60_000,
})
if (!rate.allowed) {
  return Response.json({ error: 'Too many requests' }, {
    status: 429,
    headers: { 'Retry-After': String(Math.ceil((rate.resetMs - Date.now()) / 1000)) },
  })
}
```

Always send `Retry-After` on a 429 — without it a well-behaved client has no
idea when to come back and will usually just retry immediately.
