# Email setup (Resend + aglyn.com)

How Aglyn sends outbound application email — team invites, receipts, usage
summaries, marketing campaigns, staff alerts — and how to configure it so mail
comes **from `@aglyn.com`**.

## The two-provider split (read this first)

Aglyn uses **two** email systems that do different jobs and don't conflict:

| System | Job | Sends as | Config |
| --- | --- | --- | --- |
| **Google Workspace** | Human **mailboxes** + **inbound** mail (`info@aglyn.com` inbox). Your `MX` records point here. | n/a (receiving) | Workspace admin |
| **Firebase Auth** | Auth emails only — verification, password reset. | `@aglyn.com` via `_spf.firebasemail.com` | Firebase console |
| **Resend** | Everything else the **app** sends programmatically. | `noreply@aglyn.com` | `RESEND_API_KEY` + `USAGE_EMAIL_FROM` |

Sending **from** `@aglyn.com` does **not** mean sending **through** Google.
Resend sends on your behalf and proves it's authorized with DKIM/SPF DNS
records. It only adds a `send.aglyn.com` subdomain for bounce handling — your
Google inbound MX is untouched, and your mailboxes keep working normally.

`RESEND_API_KEY` is an API key from a [Resend](https://resend.com) account.
Resend is the transactional-email provider (same category as SendGrid /
Postmark / Mailgun), chosen because it's purpose-built for app email
(SES-backed, high limits, bounce webhooks) and is already integrated across
~18 call sites. Google Workspace SMTP is **not** used for app mail — it caps at
~2,000/day and would risk locking the real mailboxes.

## Current DNS facts (aglyn.com)

- **DNS host:** Google Cloud DNS (`ns-cloud-*.googledomains.com`) — add records
  in the Google Cloud console → Network Services → Cloud DNS → `aglyn.com` zone.
- **MX:** Google Workspace. ✅ (do not change)
- **SPF:** `v=spf1 include:_spf.google.com include:_spf.firebasemail.com ~all`
  — Resend's SPF goes on the `send.` subdomain, so this root record is **not**
  edited.
- **DMARC:** `p=none` (monitoring) — permissive, so verification won't be
  blocked. Consider tightening to `p=quarantine` later, once Resend is verified.

## One-time setup

### 1. Create / open a Resend account
Go to <https://resend.com> and sign in (or sign up). This is the source of
`RESEND_API_KEY`.

### 2. Add the domain in Resend
Resend → **Domains** → **Add Domain** → enter **`aglyn.com`** (the root, so the
sender can be a bare `@aglyn.com` address). Pick the region closest to the
deployment. Resend then shows ~3 DNS records to add.

### 3. Add Resend's DNS records to Google Cloud DNS
Copy the **exact** values Resend shows. They look like this (the `send`
subdomain is Resend's return-path — it does not affect Workspace inbound mail):

| Type | Name (Cloud DNS "DNS name") | Value | Notes |
| --- | --- | --- | --- |
| `MX` | `send` | `feedback-smtp.<region>.amazonses.com` (priority 10) | bounce handling |
| `TXT` | `send` | `v=spf1 include:amazonses.com ~all` | SPF for the send subdomain |
| `TXT` | `resend._domainkey` | `p=<long DKIM public key>` | DKIM signing |

In Cloud DNS you enter just the subdomain part as the DNS name (e.g. `send`,
`resend._domainkey`) — it appends `.aglyn.com` automatically. Paste long DKIM
values as a single string; Cloud DNS handles the 255-char chunking.

Do **not** touch the existing root `MX`, root `SPF`, or `_dmarc` records.

### 4. Verify
Back in Resend → Domains → **Verify**. Google Cloud DNS usually propagates in a
few minutes. Wait for the domain to show **Verified**.

### 5. Create an API key
Resend → **API Keys** → **Create** → permission **Sending access**, scoped to
the `aglyn.com` domain. Copy the key (`re_...`) — it's shown once.

### 6. Set the env vars

**Local** (`apps/console/.env.development.local`):
```
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
USAGE_EMAIL_FROM="Aglyn <noreply@aglyn.com>"
STAFF_ALERT_EMAIL=you@aglyn.com   # optional
```

**Production (Vercel):** add the same two vars. Multiple apps send email (the
**console** app and the **tenant** app via plugins — commerce, bookings,
marketing, workflows). The cleanest way is a **Team-level (shared) Environment
Variable** in Vercel so every project inherits it:

- Vercel → Team **Settings** → **Environment Variables** (shared), add
  `RESEND_API_KEY` and `USAGE_EMAIL_FROM`, linked to the console + tenant
  projects, for Production (and Preview if you want previews to send).
- ⚠️ Gotcha: `vercel env ls` and the project env API **omit** team-level shared
  vars — so after adding them, don't trust `vercel env ls` showing them as
  "missing." Verify in the Team Settings UI. Redeploy for the change to take.

## How the code uses it

Every sender reads the same two vars and no-ops safely when they're unset:
```ts
const resendKey = process.env.RESEND_API_KEY
const from = process.env.USAGE_EMAIL_FROM
if (resendKey && from) { /* POST https://api.resend.com/emails */ }
```
The org-invite route additionally returns an `emailed` boolean so the console
can tell the user whether a message actually went out (AGL-708). When the vars
are unset it logs a `console.warn` instead of silently doing nothing.

## Test it

1. With the vars set, restart the dev server.
2. Console → an org → **Team** → invite an email **you can receive** that is not
   yet an Aglyn account.
3. Expect the toast **"Invited … — email sent"** and an actual email in that
   inbox. (Without the key you'll see "… they'll see it when they sign in".)
4. Check Resend → **Emails** for the delivery log; bounces/complaints show there
   too.

## Later hardening (optional)

- Tighten DMARC from `p=none` to `p=quarantine` once Resend traffic looks clean.
- Consider a monitored `hello@aglyn.com` reply-to for a human touch.
- Consolidating the ~18 copy-pasted Resend call sites behind one `sendEmail()`
  helper would make future provider/config changes one-line.
