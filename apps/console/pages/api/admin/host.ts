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

import { isBlockedSubdomain, SUBDOMAIN_PATTERN } from '@aglyn/aglyn'
import { firebaseAdmin } from '@aglyn/tenant-data-admin'
import { FieldValue } from 'firebase-admin/firestore'
import type { NextApiRequest, NextApiResponse } from 'next'

/**
 * Staff host management (AGL-390): retarget a host's subdomain (validated,
 * unique, not reserved) from the staff console. Super-staff only; audited
 * to adminAudit.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  const authorization = req.headers.authorization ?? ''
  const idToken = authorization.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length)
    : undefined
  if (!idToken) return res.status(401).json({ error: 'Unauthenticated' })

  const hostId = String(req.body?.hostId ?? '')
  const action = String(req.body?.action ?? '')
  if (!hostId || action !== 'set-subdomain') {
    return res.status(400).json({ error: 'Bad request' })
  }

  try {
    const auth = firebaseAdmin.app().auth()
    const decoded = await auth.verifyIdToken(idToken)
    if (!decoded['staff']) return res.status(403).json({ error: 'Staff only' })
    const actorRole = String(decoded['staffRole'] ?? 'super')
    if (actorRole !== 'super') {
      return res.status(403).json({ error: 'Requires the super staff role' })
    }

    const subdomain = String(req.body?.subdomain ?? '')
      .trim()
      .toLowerCase()
    if (!SUBDOMAIN_PATTERN.test(subdomain) || isBlockedSubdomain(subdomain)) {
      return res.status(400).json({ error: 'Invalid or reserved subdomain' })
    }

    const firestore = firebaseAdmin.app().firestore()
    // Uniqueness: no other host may hold this subdomain.
    const taken = await firestore
      .collection('hosts')
      .where('subdomain', '==', subdomain)
      .limit(1)
      .get()
    if (!taken.empty && taken.docs[0].id !== hostId) {
      return res.status(409).json({ error: 'That subdomain is taken' })
    }

    const hostRef = firestore.collection('hosts').doc(hostId)
    const before = (await hostRef.get()).get('subdomain') ?? null
    await hostRef.set(
      { subdomain, updatedAt: FieldValue.serverTimestamp() },
      { merge: true },
    )
    await firestore.collection('adminAudit').add({
      actorUid: decoded.uid,
      action: 'host.set-subdomain',
      target: `hosts/${hostId}`,
      before: { subdomain: before },
      after: { subdomain },
      at: FieldValue.serverTimestamp(),
    })
    return res.status(200).json({ ok: true, subdomain })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Host update failed' })
  }
}
