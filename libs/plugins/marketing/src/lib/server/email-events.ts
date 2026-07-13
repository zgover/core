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

import type { PluginApiHandler } from '@aglyn/aglyn/server'
import { firebaseAdmin } from '@aglyn/tenant-data-admin'
import { createHmac, timingSafeEqual } from 'crypto'
import { FieldValue } from 'firebase-admin/firestore'
import { assignExperimentVariant, type HostExperiment } from '../model/experiments'

/**
 * Svix signature check (Resend webhooks): HMAC-SHA256 over
 * `{id}.{timestamp}.{payload}` with the base64 secret after `whsec_`;
 * the header carries space-delimited `v1,<base64sig>` entries.
 */
function verifySvix(
  secret: string,
  id: string,
  timestamp: string,
  payload: Buffer,
  signatureHeader: string,
): boolean {
  try {
    const key = Buffer.from(secret.replace(/^whsec_/, ''), 'base64')
    const expected = createHmac('sha256', key)
      .update(`${id}.${timestamp}.`)
      .update(payload)
      .digest()
    return signatureHeader.split(' ').some((entry) => {
      const [, signature] = entry.split(',')
      if (!signature) return false
      const candidate = Buffer.from(signature, 'base64')
      return (
        candidate.length === expected.length &&
        timingSafeEqual(candidate, expected)
      )
    })
  } catch {
    return false
  }
}

/** Tags arrive as an array of {name, value} or a plain map — accept both. */
function tagMap(raw: unknown): Record<string, string> {
  if (Array.isArray(raw)) {
    const map: Record<string, string> = {}
    for (const tag of raw) {
      if (tag?.name) map[String(tag.name)] = String(tag.value ?? '')
    }
    return map
  }
  if (raw && typeof raw === 'object') {
    return Object.fromEntries(
      Object.entries(raw as Record<string, unknown>).map(([key, value]) => [
        key,
        String(value ?? ''),
      ]),
    )
  }
  return {}
}

/**
 * Resend event ingestion (AGL-268), relocated from the console app route
 * into its owning plugin (AGL-418) — the URL `/api/email/events` is
 * preserved through the plugin API dispatcher. Opened/clicked events
 * increment the tagged campaign's stats; clicks on experiment sends also
 * count as the recipient's variant conversion — the variant re-derives
 * deterministically from the address, so nothing per-send is stored.
 * Svix signs the RAW body: `req.rawBody` carries the exact request text.
 */
export const emailEventsHandler: PluginApiHandler = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  const secret = process.env.RESEND_WEBHOOK_SECRET
  if (!secret) {
    return res.status(501).json({ error: 'Webhook is not configured' })
  }
  const payload = Buffer.from(req.rawBody ?? '', 'utf8')
  const headers = req.headers as Partial<Record<string, string>>
  const svixId = String(headers['svix-id'] ?? '')
  const svixTimestamp = String(headers['svix-timestamp'] ?? '')
  const svixSignature = String(headers['svix-signature'] ?? '')
  if (
    !svixId ||
    !svixTimestamp ||
    !verifySvix(secret, svixId, svixTimestamp, payload, svixSignature)
  ) {
    return res.status(401).json({ error: 'Bad signature' })
  }

  try {
    const event = JSON.parse(payload.toString('utf8'))
    const type = String(event?.type ?? '')
    if (type !== 'email.opened' && type !== 'email.clicked') {
      return res.status(200).json({ ignored: true })
    }
    const data = event?.data ?? {}
    const tags = tagMap(data?.tags)
    const hostId = tags['hostId']
    const campaignId = tags['campaignId']
    if (!hostId || !campaignId) {
      return res.status(200).json({ ignored: true })
    }
    const firestore = firebaseAdmin.app().firestore()
    const hostRef = firestore.collection('hosts').doc(hostId)
    await hostRef
      .collection('campaigns')
      .doc(campaignId)
      .set(
        {
          stats: {
            [type === 'email.opened' ? 'opens' : 'clicks']:
              FieldValue.increment(1),
          },
        },
        { merge: true },
      )
      .catch(() => undefined)

    // Experiment conversion (AGL-268): clicks are the signal.
    const experimentId = tags['experimentId']
    const recipient = String(
      Array.isArray(data?.to) ? (data.to[0] ?? '') : (data?.to ?? ''),
    )
      .trim()
      .toLowerCase()
    if (type === 'email.clicked' && experimentId && recipient) {
      const experimentSnapshot = await hostRef
        .collection('experiments')
        .doc(experimentId)
        .get()
      const experiment = experimentSnapshot.data() as
        | HostExperiment
        | undefined
      if (experimentSnapshot.exists && experiment) {
        const variant = assignExperimentVariant(
          experiment,
          experimentId,
          recipient,
        )
        if (variant) {
          await experimentSnapshot.ref
            .collection('stats')
            .doc(variant.id)
            .set(
              {
                conversions: FieldValue.increment(1),
                updatedAt: FieldValue.serverTimestamp(),
              },
              { merge: true },
            )
            .catch(() => undefined)
        }
      }
    }
    return res.status(200).json({ ok: true })
  } catch (error) {
    console.error(error)
    // Never make Resend retry-storm.
    return res.status(200).json({ ok: true })
  }
}
