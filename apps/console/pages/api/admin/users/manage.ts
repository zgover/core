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

const ACTIONS = [
  'grantStaff',
  'revokeStaff',
  'disable',
  'enable',
  'setRole',
  'updateProfile',
] as const
const STAFF_ROLES = ['support', 'billing', 'super'] as const
type ManageAction = (typeof ACTIONS)[number]

/**
 * Staff user management (AGL-204): grant/revoke the `staff` custom claim
 * and disable/enable accounts from the admin UI instead of the CLI
 * script. Self-lockout guarded (no self-revoke, no self-disable); every
 * action writes an adminAudit entry.
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

  const action = String(req.body?.action ?? '') as ManageAction
  const uid = String(req.body?.uid ?? '')
  if (!uid || !ACTIONS.includes(action)) {
    return res.status(400).json({ error: 'Missing uid or unknown action' })
  }

  try {
    const auth = firebaseAdmin.app().auth()
    const decoded = await auth.verifyIdToken(idToken)
    if (!decoded['staff']) {
      return res.status(403).json({ error: 'Staff only' })
    }
    // RBAC (AGL-206): user management is super-only; a missing role means
    // super so pre-RBAC staff keep access.
    const actorRole = String(decoded['staffRole'] ?? 'super')
    if (actorRole !== 'super') {
      return res.status(403).json({ error: 'Requires the super staff role' })
    }
    if (
      decoded.uid === uid &&
      (action === 'revokeStaff' || action === 'disable')
    ) {
      return res
        .status(400)
        .json({ error: 'You cannot lock yourself out' })
    }

    const target = await auth.getUser(uid)
    const before = {
      staff: Boolean(target.customClaims?.['staff']),
      staffRole: target.customClaims?.['staffRole'] ?? null,
      disabled: target.disabled,
    }

    // Identity edits (AGL-361): names, photo, email — audited with the
    // previous values; email changes mark the address unverified.
    if (action === 'updateProfile') {
      const displayName = String(req.body?.displayName ?? '').trim().slice(0, 120)
      const photoUrl = String(req.body?.photoUrl ?? '').trim().slice(0, 500)
      const email = String(req.body?.email ?? '').trim().toLowerCase()
      if (photoUrl && !/^https:\/\//i.test(photoUrl)) {
        return res.status(400).json({ error: 'Photo URLs must be https://' })
      }
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: 'Enter a valid email' })
      }
      await auth.updateUser(uid, {
        displayName: displayName || undefined,
        photoURL: photoUrl || undefined,
        ...(email && email !== target.email
          ? { email, emailVerified: false }
          : {}),
      })
      // Mirror to the users doc so console lists stay consistent.
      await firebaseAdmin
        .app()
        .firestore()
        .collection('users')
        .doc(uid)
        .set(
          {
            ...(displayName ? { displayName } : {}),
            ...(photoUrl ? { photoUrl } : {}),
          },
          { merge: true },
        )
      await firebaseAdmin.app().firestore().collection('adminAudit').add({
        actorUid: decoded.uid,
        action: 'user.updateProfile',
        target: `users/${uid}`,
        before: {
          displayName: target.displayName ?? null,
          photoURL: target.photoURL ?? null,
          email: target.email ?? null,
        },
        after: {
          displayName: displayName || null,
          photoURL: photoUrl || null,
          email: email || target.email || null,
        },
        at: FieldValue.serverTimestamp(),
      })
      return res.status(200).json({ ok: true })
    }

    const requestedRole = String(req.body?.role ?? '')
    if (action === 'setRole') {
      if (!STAFF_ROLES.includes(requestedRole as any)) {
        return res.status(400).json({ error: 'Unknown role' })
      }
      if (decoded.uid === uid && requestedRole !== 'super') {
        return res.status(400).json({ error: 'You cannot demote yourself' })
      }
      await auth.setCustomUserClaims(uid, {
        ...(target.customClaims ?? {}),
        staff: true,
        staffRole: requestedRole,
      })
    } else if (action === 'grantStaff' || action === 'revokeStaff') {
      await auth.setCustomUserClaims(uid, {
        ...(target.customClaims ?? {}),
        staff: action === 'grantStaff',
        // Grants default to the least-privileged role (AGL-206).
        ...(action === 'grantStaff' ? { staffRole: 'support' } : {}),
      })
    } else {
      await auth.updateUser(uid, { disabled: action === 'disable' })
    }

    await firebaseAdmin
      .app()
      .firestore()
      .collection('adminAudit')
      .add({
        actorUid: decoded.uid,
        action: `user.${action}`,
        target: `users/${uid}`,
        before,
        after: {
          staff:
            action === 'grantStaff' || action === 'setRole'
              ? true
              : action === 'revokeStaff'
                ? false
                : before.staff,
          staffRole:
            action === 'setRole'
              ? requestedRole
              : action === 'grantStaff'
                ? 'support'
                : before.staffRole,
          disabled:
            action === 'disable'
              ? true
              : action === 'enable'
                ? false
                : before.disabled,
        },
        at: FieldValue.serverTimestamp(),
      })

    return res.status(200).json({ ok: true })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Action failed' })
  }
}
