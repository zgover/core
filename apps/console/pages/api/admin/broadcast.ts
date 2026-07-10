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

import { firebaseAdmin, notifyOrgAdmins } from '@aglyn/tenant-data-admin'
import type { NextApiRequest, NextApiResponse } from 'next'

const MAX_ORGS_PER_BROADCAST = 200

/**
 * Staff broadcast (wave v5): pushes a `system.announcement` notification
 * to every organization's owner/admins — product announcements,
 * maintenance windows, policy changes. Optional plan filter targets a
 * tier (e.g. business-only features). Mute prefs apply per recipient
 * like any other notification, and every send is audited.
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

  const title = String(req.body?.title ?? '')
    .trim()
    .slice(0, 150)
  const body = String(req.body?.body ?? '')
    .trim()
    .slice(0, 1000)
  const link = String(req.body?.link ?? '').trim()
  const plan = String(req.body?.plan ?? '').trim()
  if (!title) return res.status(400).json({ error: 'Missing title' })
  if (link && !link.startsWith('/') && !link.startsWith('https://')) {
    return res.status(400).json({ error: 'Links must be a path or https' })
  }

  try {
    const decoded = await firebaseAdmin.app().auth().verifyIdToken(idToken)
    if (!decoded['staff']) {
      return res.status(403).json({ error: 'Staff only' })
    }
    const firestore = firebaseAdmin.app().firestore()
    let query = firestore
      .collection('orgs')
      .limit(MAX_ORGS_PER_BROADCAST) as FirebaseFirestore.Query
    if (plan) query = query.where('plan', '==', plan)
    const orgs = await query.get()

    for (const org of orgs.docs) {
      await notifyOrgAdmins(org.id, {
        type: 'system.announcement',
        title,
        ...(body ? { body } : {}),
        ...(link ? { link } : {}),
      })
    }

    await firestore.collection('adminAudit').add({
      actorUid: decoded.uid,
      action: 'broadcast.send',
      target: plan ? `orgs?plan=${plan}` : 'orgs/*',
      before: null,
      after: { title, orgs: orgs.size },
      at: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
    })

    return res.status(200).json({ orgs: orgs.size })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Broadcast failed' })
  }
}
