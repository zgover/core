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

import type { ITimestamp } from '@aglyn/shared-util-timestamp'

/**
 * In-app notifications (AGL-259): per-user docs at
 * `users/{uid}/notifications/{id}`, written by the Admin SDK (emitters in
 * the API routes + the `notifyAdmins` automation step) and read/marked by
 * their owner. Types follow the common SaaS taxonomy so the console can
 * icon/group them without a registry.
 */
export type AglynNotificationType =
  | 'billing.invoice'
  | 'billing.paymentFailed'
  | 'team.invite'
  | 'team.roleChanged'
  | 'team.hostAccessGranted'
  | 'content.formSubmission'
  | 'content.booking'
  | 'system.announcement'

export interface AglynNotification {
  $id?: string
  type: AglynNotificationType
  title: string
  body?: string
  /** Console path the notification opens (e.g. a host inbox). */
  link?: string
  orgId?: string
  hostId?: string
  createdAt?: ITimestamp
  /** Set by the owner when read; unread while absent. */
  readAt?: ITimestamp | null
}

export const NOTIFICATION_TYPE_LABELS: Record<AglynNotificationType, string> =
  {
    'billing.invoice': 'Invoice available',
    'billing.paymentFailed': 'Payment failed',
    'team.invite': 'Team invite',
    'team.roleChanged': 'Role changed',
    'team.hostAccessGranted': 'Site access granted',
    'content.formSubmission': 'Form submission',
    'content.booking': 'New booking',
    'system.announcement': 'Announcement',
  }
