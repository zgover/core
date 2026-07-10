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

import { firebaseAdmin } from '@aglyn/tenant-data-admin'
import type { NextApiRequest, NextApiResponse } from 'next'

/**
 * Staff notes on organizations (wave v5): support/billing context that
 * lives with the org but never in the tenant-visible data —
 * `orgs/{orgId}/staffNotes`, staff-claim gated on both read and write
 * (tenants can't read the subcollection; there is no client rule for
 * it). GET lists newest-first; POST appends and audits.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const authorization = req.headers.authorization ?? ''
  const idToken = authorization.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length)
    : undefined
  if (!idToken) return res.status(401).json({ error: 'Unauthenticated' })
  const orgId = String(
    (req.method === 'GET' ? req.query['orgId'] : req.body?.orgId) ?? '',
  )
  if (!orgId) return res.status(400).json({ error: 'Missing orgId' })

  try {
    const decoded = await firebaseAdmin.app().auth().verifyIdToken(idToken)
    if (!decoded['staff']) {
      return res.status(403).json({ error: 'Staff only' })
    }
    const firestore = firebaseAdmin.app().firestore()
    const notesRef = firestore
      .collection('orgs')
      .doc(orgId)
      .collection('staffNotes')

    if (req.method === 'GET') {
      const snapshot = await notesRef
        .orderBy('createdAt', 'desc')
        .limit(50)
        .get()
      return res.status(200).json({
        notes: snapshot.docs.map((doc) => ({
          $id: doc.id,
          text: doc.get('text') ?? '',
          actorUid: doc.get('actorUid') ?? null,
          actorEmail: doc.get('actorEmail') ?? null,
          createdAt: doc.get('createdAt')?.toMillis?.() ?? null,
        })),
      })
    }

    if (req.method === 'POST') {
      const text = String(req.body?.text ?? '')
        .trim()
        .slice(0, 2000)
      if (!text) return res.status(400).json({ error: 'Empty note' })
      await notesRef.add({
        text,
        actorUid: decoded.uid,
        actorEmail: decoded.email ?? null,
        createdAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
      })
      await firestore.collection('adminAudit').add({
        actorUid: decoded.uid,
        action: 'org.note',
        target: `orgs/${orgId}`,
        before: null,
        after: { text: text.slice(0, 200) },
        at: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
      })
      return res.status(200).json({ ok: true })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Notes request failed' })
  }
}
