# Commerce token signing (`TOKEN_SIGNING_SECRET`)

One secret signs every commerce token the platform mints: order download links, supplier
tokens, gift-card codes and gated-video stream URLs.

It **fails closed**. If the variable is unset, the code throws rather than minting — no
fallback, deliberately. The bug this replaced (AGL-509) was
`createHmac('sha256', process.env.STRIPE_SECRET_KEY ?? 'aglyn')`: on any deploy without a
Stripe key the HMAC key was the literal string `aglyn`, and every payload is built from
public identifiers, so the tokens were trivially forgeable. A fallback is what made that
possible, which is why there isn't one now.

## Where it is read

| File | Tokens |
| --- | --- |
| `libs/plugins/commerce/src/lib/server/download.ts` | order download links (90-day TTL) — defines `tokenSigningSecret()` |
| `libs/plugins/commerce/src/lib/server/billing-webhook.ts` | supplier tokens, gift-card codes |
| `libs/plugins/commerce/src/lib/server/stream.ts` | gated-video stream URLs (15-min TTL) — AGL-689 |

## The two rules that bite

**1. Console and tenant must hold the _same_ value.** The console's Stripe webhook mints
download links that the tenant app verifies. A mismatch does not error anywhere — it just
rejects every link as an invalid signature, which reads like "downloads are broken" rather
than "the secret differs."

**2. Rotation invalidates every outstanding link.** Changing the secret breaks every
download and gift-card link already in a customer's inbox, permanently — they were signed
with the old key and there is no grace window or key-ring. Rotate only with a deliberate
plan to re-issue, and never as a routine hygiene step.

## Provisioning

Generate once, then set the *same* value everywhere:

```bash
openssl rand -hex 32
```

Set it on both Vercel projects, all three environments, plus the root `.env` for local work
and `tools/scripts/*`:

| Vercel project | Directory to run from |
| --- | --- |
| `app-aglyn-io` (console) | `apps/console` |
| `tenant-aglyn-app` (tenant) | `apps/tenant` |

```bash
# Run from the app directory, and link explicitly first — the root
# .vercel/repo.json maps EVERY directory to app-aglyn-io, so an unlinked
# tenant command silently writes to the console project (AGL-542).
cd apps/tenant && vercel link
for env in production preview development; do
  vercel env add TOKEN_SIGNING_SECRET "$env"
done
```

Repeat from `apps/console`. Then confirm each project actually has it — check the project
you think you're checking:

```bash
vercel env ls | grep TOKEN_SIGNING_SECRET
```

Env values are snapshotted per deployment, so **existing deployments do not pick this up** —
redeploy each project after adding it.

## Verify

Read the dashboard last, not first. The dashboard shows the variable exists; it does not
show that both projects agree, which is the failure mode that actually happens. Mint a token
end to end:

1. Complete a test checkout for a digital product on a tenant site.
2. Open the download link from the receipt — it is minted by the console webhook and
   verified by the tenant app, so a success exercises both secrets and proves they match.
3. For the video path, POST to `/api/commerce/stream` as an entitled member and follow the
   returned URL.

A 403 on step 2 with the variable set on both sides means the values differ.

## Related

`MEMBER_SESSION_SECRET` (`membership.ts`) signs the storefront member session cookie. It
*does* have a fallback — a per-boot `randomBytes(32)` — so it never fails closed. That is
fine locally, but unset in production it means member sessions silently drop on every deploy
and disagree between instances. Set it in production too.

Note that `nx` loads the root `.env` into every task, tests included (AGL-690), so a local
`nx test` may pass on a secret that CI does not have.
