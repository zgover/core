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
import { FieldValue } from 'firebase-admin/firestore'
import type { NextApiRequest, NextApiResponse } from 'next'

/**
 * Staff impersonation (AGL-246): mints a short-lived custom token for the
 * target account with an `impersonatedBy` claim, audited to adminAudit.
 * Signing in with it REPLACES the staff session in this browser — the
 * console shows a persistent banner (claims.impersonatedBy) with an exit
 * that signs out. Staff accounts and other staff cannot be impersonated.
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
  const uid = String(req.body?.uid ?? '')
  if (!uid) return res.status(400).json({ error: 'Missing uid' })

  try {
    const auth = firebaseAdmin.app().auth()
    const decoded = await auth.verifyIdToken(idToken)
    if (!decoded['staff']) {
      return res.status(403).json({ error: 'Staff only' })
    }
    const target = await auth.getUser(uid)
    if (target.customClaims?.['staff']) {
      return res
        .status(400)
        .json({ error: 'Staff accounts cannot be impersonated' })
    }
    const token = await auth.createCustomToken(uid, {
      impersonatedBy: decoded.uid,
      impersonatedByEmail: decoded.email ?? null,
    })
    await firebaseAdmin
      .app()
      .firestore()
      .collection('adminAudit')
      .add({
        actorUid: decoded.uid,
        action: 'user.impersonate',
        target: `users/${uid}`,
        before: null,
        after: { email: target.email ?? null },
        at: FieldValue.serverTimestamp(),
      })
    return res.status(200).json({ token })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Impersonation failed' })
  }
}
