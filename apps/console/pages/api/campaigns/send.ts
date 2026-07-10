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
  checkQuota,
  contactMatchesSegment,
  createResourceUid,
  assignExperimentVariant,
  resolveMergeTags,
  type HostExperiment,
} from '@aglyn/aglyn'
import {
  orgDataCollectionForHost, firebaseAdmin, getOrgForHost } from '@aglyn/tenant-data-admin'
import { createHash, createHmac } from 'crypto'
import type { NextApiRequest, NextApiResponse } from 'next'

const MAX_RECIPIENTS_PER_SEND = 500
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Stable doc id for a suppression entry (emails are PII — hash them). */
export function suppressionId(email: string): string {
  return createHash('sha256').update(email.toLowerCase()).digest('hex')
}

/** HMAC for unsubscribe links; env-gated on the shared secret. */
export function unsubscribeSignature(
  hostId: string,
  email: string,
  secret: string,
): string {
  return createHmac('sha256', secret)
    .update(`${hostId}:${email.toLowerCase()}`)
    .digest('hex')
}

/** Send failures carry the HTTP status the API route should answer. */
export class CampaignSendError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message)
  }
}

export interface CampaignSendOptions {
  hostId: string
  subject: string
  body: string
  audience: string
  segmentId?: string
  listId?: string
  emails?: string[]
  campaignId?: string
  experimentId?: string
  /** Recorded as `sentBy`; the scheduler passes the scheduling user. */
  senderUid: string
}

/**
 * Campaign delivery core (AGL-161, extracted for AGL-272): resolves the
 * audience server-side, drops suppressed addresses, enforces the plan's
 * monthly send cap, personalizes merge tags per recipient, and delivers
 * through Resend with a signed unsubscribe link. Shared by the
 * authenticated send route and the scheduled-campaign processor. The
 * caller owns authorization.
 */
export async function performCampaignSend(
  options: CampaignSendOptions,
): Promise<{ campaignId: string; recipients: number; sent: number }> {
  const resendKey = process.env.RESEND_API_KEY
  const emailFrom = process.env.USAGE_EMAIL_FROM
  const unsubscribeSecret =
    process.env.EMAIL_UNSUBSCRIBE_SECRET || process.env.CRON_SECRET
  if (!resendKey || !emailFrom || !unsubscribeSecret) {
    throw new CampaignSendError(
      'Campaigns are not configured (RESEND_API_KEY, USAGE_EMAIL_FROM, ' +
        'EMAIL_UNSUBSCRIBE_SECRET).',
      501,
    )
  }
  const { hostId, subject, body, audience } = options

  const firestore = firebaseAdmin.app().firestore()
  const hostRef = firestore.collection('hosts').doc(hostId)
  const hostSnapshot = await hostRef.get()
  if (!hostSnapshot.exists) {
    throw new CampaignSendError('Unknown site', 404)
  }

  // Audience resolution. Names ride along for merge tags (AGL-272).
  let recipients: string[] = []
  const names = new Map<string, string>()
  const collectName = (email: string, name: unknown) => {
    const cleaned = email.trim().toLowerCase()
    if (cleaned && typeof name === 'string' && name.trim()) {
      names.set(cleaned, name.trim())
    }
  }
  if (audience === 'leads') {
    const leads = await hostRef.collection('leads').limit(1000).get()
    recipients = leads.docs.map((doc) => {
      const email = String(doc.get('email') ?? '')
      collectName(email, doc.get('name'))
      return email
    })
  } else if (audience === 'members') {
    const members = await hostRef.collection('siteMembers').limit(1000).get()
    recipients = members.docs.map((doc) => {
      const email = String(doc.get('email') ?? '')
      collectName(email, doc.get('name'))
      return email
    })
  } else if (audience === 'segment') {
    // Contact segments (AGL-199): resolve the saved filter against the
    // contacts collection server-side.
    const segmentId = String(options.segmentId ?? '')
    const segmentSnapshot = segmentId
      ? await (await orgDataCollectionForHost(hostId, 'contactSegments')).doc(segmentId).get()
      : null
    if (!segmentSnapshot?.exists) {
      throw new CampaignSendError('Unknown segment', 400)
    }
    const segment = {
      tags: segmentSnapshot.get('tags') ?? [],
      sources: segmentSnapshot.get('sources') ?? [],
    }
    const contacts = await (await orgDataCollectionForHost(hostId, 'contacts')).limit(5000).get()
    recipients = contacts.docs
      .filter((doc) =>
        contactMatchesSegment(
          { tags: doc.get('tags') ?? [], sources: doc.get('sources') ?? {} },
          segment,
        ),
      )
      .map((doc) => {
        const email = String(doc.get('email') ?? '')
        collectName(email, doc.get('name'))
        return email
      })
  } else if (audience === 'list') {
    // Org lists (AGL-254): static audiences enrolled manually or by the
    // enrollList automation step.
    const listId = String(options.listId ?? '')
    const listRef = listId
      ? (await orgDataCollectionForHost(hostId, 'contacts')).parent
          ?.collection('lists')
          .doc(listId)
      : null
    if (!listRef) throw new CampaignSendError('Unknown list', 400)
    const members = await listRef.collection('members').limit(5000).get()
    recipients = members.docs.map((doc) => {
      const email = String(doc.get('email') ?? '')
      collectName(email, doc.get('name'))
      return email
    })
  } else {
    recipients = Array.isArray(options.emails)
      ? options.emails.map((value: unknown) => String(value))
      : []
  }
  recipients = [
    ...new Set(
      recipients
        .map((email) => email.trim().toLowerCase())
        .filter((email) => EMAIL_PATTERN.test(email)),
    ),
  ].slice(0, MAX_RECIPIENTS_PER_SEND)
  if (!recipients.length) {
    throw new CampaignSendError('The audience is empty', 400)
  }

  // Suppression list (unsubscribes).
  const suppressed = new Set<string>()
  const suppressions = await hostRef
    .collection('suppressions')
    .limit(5000)
    .get()
  for (const doc of suppressions.docs) suppressed.add(doc.id)
  const sendable = recipients.filter(
    (email) => !suppressed.has(suppressionId(email)),
  )
  if (!sendable.length) {
    throw new CampaignSendError('Every recipient has unsubscribed', 400)
  }

  // Monthly cap by the owning org's plan (dark-launch rule, AGL-238).
  const monthKey = new Date().toISOString().slice(0, 7)
  const counterRef = hostRef.collection('counters').doc('emailSends')
  {
    // Plan-less orgs resolve as free (AGL-247) — the cap always runs.
    const tenant = (await getOrgForHost(hostId))?.org
    const counterSnapshot = await counterRef.get()
    const used = Number(counterSnapshot.get(monthKey) ?? 0)
    const quota = checkQuota(
      tenant as any,
      'emailSendsPerMonth',
      used + sendable.length - 1,
    )
    if (!quota.allowed) {
      throw new CampaignSendError(
        `Monthly email limit reached (${quota.limit}) — upgrade in ` +
          'Billing or shrink the audience',
        403,
      )
    }
  }

  const subdomain = hostSnapshot.get('subdomain')
  const siteBase = hostSnapshot.get('cname')
    ? `https://${hostSnapshot.get('cname')}`
    : `https://${subdomain}.aglyn.app`

  const campaignId = options.campaignId || createResourceUid()

  // Email A/B (AGL-255): each recipient deterministically lands in a
  // variant whose subject/body overrides apply; sends count as that
  // variant's exposures. A finished experiment sends the winner copy.
  const experimentId = String(options.experimentId ?? '')
  let experiment: (HostExperiment & { $id: string }) | null = null
  if (experimentId) {
    const experimentSnapshot = await hostRef
      .collection('experiments')
      .doc(experimentId)
      .get()
    const data = experimentSnapshot.data() as HostExperiment | undefined
    if (
      !experimentSnapshot.exists ||
      !data ||
      data.target !== 'email' ||
      (data.status !== 'running' && !data.winnerVariantId)
    ) {
      throw new CampaignSendError('Pick a running email experiment', 400)
    }
    experiment = { $id: experimentSnapshot.id, ...data }
  }
  const variantSends: Record<string, number> = {}
  let sent = 0
  for (const email of sendable) {
    const signature = unsubscribeSignature(hostId, email, unsubscribeSecret)
    const unsubscribeUrl =
      `${siteBase}/api/email/unsubscribe?hostId=${encodeURIComponent(hostId)}` +
      `&email=${encodeURIComponent(email)}&sig=${signature}`
    // Variant assignment keys on the recipient address (AGL-255) so a
    // re-send reaches the same variant.
    const variant = experiment
      ? assignExperimentVariant(experiment, experiment.$id, email)
      : null
    // Merge tags (AGL-272): personalize after the variant override so
    // variant copy can use tags too.
    const mergeRecipient = { email, name: names.get(email) }
    const recipientSubject = resolveMergeTags(
      variant?.subject?.trim() || subject,
      mergeRecipient,
    )
    const recipientBody = resolveMergeTags(
      variant?.body?.trim() || body,
      mergeRecipient,
    )
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: emailFrom,
        to: [email],
        subject: recipientSubject,
        text: `${recipientBody}\n\n—\nUnsubscribe: ${unsubscribeUrl}`,
        headers: { 'List-Unsubscribe': `<${unsubscribeUrl}>` },
        // Event attribution (AGL-268): the opens/clicks webhook maps
        // deliveries back to the campaign (and experiment) via tags.
        tags: [
          { name: 'hostId', value: hostId },
          { name: 'campaignId', value: campaignId },
          ...(experiment
            ? [{ name: 'experimentId', value: experiment.$id }]
            : []),
        ],
      }),
    }).catch(() => null)
    if (response?.ok) {
      sent += 1
      if (variant) {
        variantSends[variant.id] = (variantSends[variant.id] ?? 0) + 1
      }
    }
  }
  // Sends are the email variant's exposures (AGL-255).
  if (experiment && experiment.status === 'running') {
    for (const [variantId, count] of Object.entries(variantSends)) {
      await hostRef
        .collection('experiments')
        .doc(experiment.$id)
        .collection('stats')
        .doc(variantId)
        .set(
          {
            exposures: firebaseAdmin.firestore.FieldValue.increment(count),
            updatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true },
        )
        .catch(() => undefined)
    }
  }

  await hostRef.collection('campaigns').doc(campaignId).set(
    {
      subject,
      body,
      audience,
      ...(experiment ? { experimentId: experiment.$id } : {}),
      stats: {
        recipients: sendable.length,
        sent,
        ...(Object.keys(variantSends).length ? { variantSends } : {}),
      },
      status: 'sent',
      sentAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
      sentBy: options.senderUid,
    },
    { merge: true },
  )
  await counterRef.set(
    { [monthKey]: firebaseAdmin.firestore.FieldValue.increment(sent) },
    { merge: true },
  )
  return { campaignId, recipients: sendable.length, sent }
}

/**
 * Campaign API (AGL-161/272): `action` picks the operation —
 * `send` (default) delivers now, `schedule` stores the campaign with a
 * `sendAtMs` for the processor, `cancel` withdraws a scheduled campaign.
 * All three require a site admin/editor.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const hostId = String(req.body?.hostId ?? '')
  const action = String(req.body?.action ?? 'send')
  const subject = String(req.body?.subject ?? '')
    .trim()
    .slice(0, 150)
  const body = String(req.body?.body ?? '')
    .trim()
    .slice(0, 20000)
  const audience = String(req.body?.audience ?? 'leads')
  if (!hostId) return res.status(400).json({ error: 'Missing hostId' })
  if (action !== 'cancel' && (!subject || !body)) {
    return res.status(400).json({ error: 'Missing subject or body' })
  }
  if (!['leads', 'members', 'manual', 'segment', 'list'].includes(audience)) {
    return res.status(400).json({ error: 'Unknown audience' })
  }

  const authorization = req.headers.authorization ?? ''
  const idToken = authorization.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length)
    : undefined
  if (!idToken) return res.status(401).json({ error: 'Unauthenticated' })

  try {
    const decoded = await firebaseAdmin.app().auth().verifyIdToken(idToken)
    const firestore = firebaseAdmin.app().firestore()
    const hostRef = firestore.collection('hosts').doc(hostId)
    const hostSnapshot = await hostRef.get()
    if (!hostSnapshot.exists) {
      return res.status(404).json({ error: 'Unknown site' })
    }
    const memberRole = (hostSnapshot.get('memberRoles') ?? {})[decoded.uid]
    if (memberRole !== 'admin' && memberRole !== 'editor') {
      return res.status(403).json({ error: 'Not a site admin' })
    }

    if (action === 'schedule') {
      // Scheduling (AGL-272): store the full send config; the
      // process-scheduled cron delivers it through performCampaignSend.
      const sendAtMs = Number(req.body?.sendAtMs ?? 0)
      if (!Number.isFinite(sendAtMs) || sendAtMs <= Date.now()) {
        return res.status(400).json({ error: 'Pick a future send time' })
      }
      const campaignId =
        String(req.body?.campaignId ?? '') || createResourceUid()
      await hostRef.collection('campaigns').doc(campaignId).set(
        {
          subject,
          body,
          audience,
          ...(req.body?.segmentId
            ? { segmentId: String(req.body.segmentId) }
            : {}),
          ...(req.body?.listId ? { listId: String(req.body.listId) } : {}),
          ...(Array.isArray(req.body?.emails)
            ? { emails: req.body.emails.map(String).slice(0, 500) }
            : {}),
          ...(req.body?.experimentId
            ? { experimentId: String(req.body.experimentId) }
            : {}),
          status: 'scheduled',
          sendAtMs,
          scheduledAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
          scheduledBy: decoded.uid,
        },
        { merge: true },
      )
      return res.status(200).json({ campaignId, status: 'scheduled' })
    }

    if (action === 'cancel') {
      const campaignId = String(req.body?.campaignId ?? '')
      const campaignRef = hostRef.collection('campaigns').doc(campaignId)
      const campaignSnapshot = campaignId ? await campaignRef.get() : null
      if (
        !campaignSnapshot?.exists ||
        campaignSnapshot.get('status') !== 'scheduled'
      ) {
        return res.status(400).json({ error: 'Not a scheduled campaign' })
      }
      await campaignRef.set(
        {
          status: 'canceled',
          canceledAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
          canceledBy: decoded.uid,
        },
        { merge: true },
      )
      return res.status(200).json({ campaignId, status: 'canceled' })
    }

    const result = await performCampaignSend({
      hostId,
      subject,
      body,
      audience,
      segmentId: String(req.body?.segmentId ?? ''),
      listId: String(req.body?.listId ?? ''),
      emails: Array.isArray(req.body?.emails) ? req.body.emails : undefined,
      campaignId: String(req.body?.campaignId ?? ''),
      experimentId: String(req.body?.experimentId ?? ''),
      senderUid: decoded.uid,
    })
    return res.status(200).json(result)
  } catch (error) {
    if (error instanceof CampaignSendError) {
      return res.status(error.status).json({ error: error.message })
    }
    console.error(error)
    return res.status(500).json({ error: 'Campaign send failed' })
  }
}
