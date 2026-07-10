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

import type { AglynNotification } from '@aglyn/aglyn'
import { FieldValue } from 'firebase-admin/firestore'
import firebaseAdmin from './firebase-admin'
import { listOrgMembers } from './organizations'

const firestore = () => firebaseAdmin.app().firestore()

export type NotificationPayload = Omit<
  AglynNotification,
  '$id' | 'createdAt' | 'readAt'
>

/**
 * Notification fan-out (AGL-259): batch-writes one doc per recipient at
 * `users/{uid}/notifications`. Never throws — a notification miss must
 * not break the mutation that emitted it.
 */
export async function notifyUsers(
  uids: Iterable<string>,
  payload: NotificationPayload,
): Promise<void> {
  try {
    const db = firestore()
    const batch = db.batch()
    let count = 0
    for (const uid of new Set(uids)) {
      if (!uid) continue
      batch.set(
        db.collection('users').doc(uid).collection('notifications').doc(),
        { ...payload, createdAt: FieldValue.serverTimestamp() },
      )
      count += 1
      if (count >= 400) break // stay under the batch limit; enough fan-out
    }
    if (count > 0) await batch.commit()
  } catch (error) {
    console.error('notification fan-out failed', error)
  }
}

/** Notifies the org's owner + admins (billing, membership, org events). */
export async function notifyOrgAdmins(
  orgId: string,
  payload: NotificationPayload,
): Promise<void> {
  try {
    const members = await listOrgMembers(orgId)
    const admins = members
      .filter((member) => member.role === 'owner' || member.role === 'admin')
      .map((member) => member.$id)
    await notifyUsers(admins, { ...payload, orgId })
  } catch (error) {
    console.error('org admin notification failed', error)
  }
}

/**
 * Notifies everyone who manages a host (admin/editor in the host doc's
 * `memberRoles` projection) — the audience for form submissions and
 * bookings on that site.
 */
export async function notifyHostManagers(
  hostId: string,
  payload: NotificationPayload,
): Promise<void> {
  try {
    const host = await firestore().collection('hosts').doc(hostId).get()
    const memberRoles =
      (host.get('memberRoles') as Record<string, string> | undefined) ?? {}
    const managers = Object.entries(memberRoles)
      .filter(([, role]) => role === 'admin' || role === 'editor')
      .map(([uid]) => uid)
    await notifyUsers(managers, { ...payload, hostId })
  } catch (error) {
    console.error('host manager notification failed', error)
  }
}
