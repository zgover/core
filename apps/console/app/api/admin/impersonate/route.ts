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

import { pluginRequestFromWeb } from '@aglyn/aglyn/server'
import { firebaseAdmin } from '@aglyn/tenant-data-admin'
import { FieldValue } from 'firebase-admin/firestore'

/**
 * Staff impersonation (AGL-246): mints a short-lived custom token for the
 * target account with an `impersonatedBy` claim, audited to adminAudit.
 * Signing in with it REPLACES the staff session in this browser — the
 * console shows a persistent banner (claims.impersonatedBy) with an exit
 * that signs out. Staff accounts and other staff cannot be impersonated.
 */
async function handler(request: Request): Promise<Response> {
  const { method, body, headers: rawHeaders } = await pluginRequestFromWeb(request)
  const headers = rawHeaders as Partial<Record<string, string>>
  if (method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 })
  }
  const authorization = headers.authorization ?? ''
  const idToken = authorization.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length)
    : undefined
  if (!idToken) return Response.json({ error: 'Unauthenticated' }, { status: 401 })
  const uid = String(body?.uid ?? '')
  if (!uid) return Response.json({ error: 'Missing uid' }, { status: 400 })

  try {
    const auth = firebaseAdmin.app().auth()
    const decoded = await auth.verifyIdToken(idToken)
    if (!decoded['staff']) {
      return Response.json({ error: 'Staff only' }, { status: 403 })
    }
    const target = await auth.getUser(uid)
    if (target.customClaims?.['staff']) {
      return Response.json({ error: 'Staff accounts cannot be impersonated' }, { status: 400 })
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
    return Response.json({ token }, { status: 200 })
  } catch (error) {
    console.error(error)
    return Response.json({ error: 'Impersonation failed' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
export { handler as POST }
