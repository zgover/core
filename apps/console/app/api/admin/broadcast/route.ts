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
import { firebaseAdmin, notifyOrgAdmins } from '@aglyn/tenant-data-admin'

const MAX_ORGS_PER_BROADCAST = 200

/**
 * Staff broadcast (wave v5): pushes a `system.announcement` notification
 * to every organization's owner/admins — product announcements,
 * maintenance windows, policy changes. Optional plan filter targets a
 * tier (e.g. business-only features). Mute prefs apply per recipient
 * like any other notification, and every send is audited.
 */
async function handler(request: Request): Promise<Response> {
  const { method, body: payload, headers: rawHeaders } = await pluginRequestFromWeb(request)
  const headers = rawHeaders as Partial<Record<string, string>>
  if (method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 })
  }
  const authorization = headers.authorization ?? ''
  const idToken = authorization.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length)
    : undefined
  if (!idToken) return Response.json({ error: 'Unauthenticated' }, { status: 401 })

  const title = String(payload?.title ?? '')
    .trim()
    .slice(0, 150)
  const body = String(payload?.body ?? '')
    .trim()
    .slice(0, 1000)
  const link = String(payload?.link ?? '').trim()
  const plan = String(payload?.plan ?? '').trim()
  if (!title) return Response.json({ error: 'Missing title' }, { status: 400 })
  if (link && !link.startsWith('/') && !link.startsWith('https://')) {
    return Response.json({ error: 'Links must be a path or https' }, { status: 400 })
  }

  try {
    const decoded = await firebaseAdmin.app().auth().verifyIdToken(idToken)
    if (!decoded['staff']) {
      return Response.json({ error: 'Staff only' }, { status: 403 })
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

    return Response.json({ orgs: orgs.size }, { status: 200 })
  } catch (error) {
    console.error(error)
    return Response.json({ error: 'Broadcast failed' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
export { handler as POST }
