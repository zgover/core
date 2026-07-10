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
 * Staff user detail (AGL-244): everything the console needs to answer
 * "who is this account" — identity + auth state, staff claims, every org
 * membership with its role/host access (via the reverse index), and the
 * account's recent admin-audit trail.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  const authorization = req.headers.authorization ?? ''
  const idToken = authorization.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length)
    : undefined
  if (!idToken) return res.status(401).json({ error: 'Unauthenticated' })
  const uid = String(req.query.uid ?? '')
  if (!uid) return res.status(400).json({ error: 'Missing uid' })

  try {
    const auth = firebaseAdmin.app().auth()
    const decoded = await auth.verifyIdToken(idToken)
    if (!decoded['staff']) {
      return res.status(403).json({ error: 'Staff only' })
    }
    const firestore = firebaseAdmin.app().firestore()

    const record = await auth.getUser(uid)

    // Org memberships from the reverse index + the authoritative member
    // docs (role, custom role, host access).
    const reverse = await firestore
      .collection('users')
      .doc(uid)
      .collection('orgs')
      .limit(50)
      .get()
    const memberships = await Promise.all(
      reverse.docs.map(async (entry) => {
        const orgId = entry.id
        const member = await firestore
          .collection('orgs')
          .doc(orgId)
          .collection('members')
          .doc(uid)
          .get()
        return {
          orgId,
          orgName: entry.get('orgName') ?? null,
          slug: entry.get('slug') ?? null,
          role: member.get('role') ?? entry.get('role') ?? null,
          roleId: member.get('roleId') ?? null,
          allHosts: member.get('allHosts') === true,
          hostAccess: member.get('hostAccess') ?? {},
          joinedAt: member.get('joinedAt')?.toDate?.()?.toISOString() ?? null,
        }
      }),
    )

    // Recent audit trail: actions BY this account and ON this account.
    const [byActor, onTarget] = await Promise.all([
      firestore
        .collection('adminAudit')
        .where('actorUid', '==', uid)
        .limit(10)
        .get()
        .catch(() => null),
      firestore
        .collection('adminAudit')
        .where('target', '==', `users/${uid}`)
        .limit(10)
        .get()
        .catch(() => null),
    ])
    const audit = [...(byActor?.docs ?? []), ...(onTarget?.docs ?? [])]
      .map((doc) => ({
        id: doc.id,
        actorUid: doc.get('actorUid') ?? null,
        action: doc.get('action') ?? null,
        target: doc.get('target') ?? null,
        at: doc.get('at')?.toDate?.()?.toISOString() ?? null,
      }))
      .sort((a, b) => String(b.at ?? '').localeCompare(String(a.at ?? '')))
      .slice(0, 15)

    return res.status(200).json({
      user: {
        uid: record.uid,
        email: record.email ?? null,
        displayName: record.displayName ?? null,
        disabled: record.disabled,
        staff: record.customClaims?.['staff'] === true,
        staffRole: record.customClaims?.['staffRole'] ?? null,
        providers: record.providerData.map((provider) => provider.providerId),
        createdAt: record.metadata.creationTime ?? null,
        lastSignInAt: record.metadata.lastSignInTime ?? null,
      },
      memberships,
      audit,
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'User detail failed' })
  }
}
