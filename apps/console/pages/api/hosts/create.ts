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

import {
  checkQuota,
  createResourceUid,
  isBlockedSubdomain,
  SUBDOMAIN_PATTERN,
  suggestSubdomains,
} from '@aglyn/aglyn'
import { firebaseAdmin } from '@aglyn/tenant-data-admin'
import type { NextApiRequest, NextApiResponse } from 'next'
import { resolveTenantPermissions } from '../../../utils/server/tenant-permissions'

/**
 * Creates a host (user request 2026-07-07 — the hosts page had no create
 * flow). Server-side because the scoped Firestore rules only admit
 * admin-constrained host queries, so a client can't check subdomain
 * uniqueness; the hostLimit quota is enforced here too (plan-gated per
 * AGL-38: tenants without a plan are uncapped).
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  const displayName = String(req.body?.displayName ?? '')
    .trim()
    .slice(0, 80)
  const subdomain = String(req.body?.subdomain ?? '')
    .trim()
    .toLowerCase()
  if (!displayName) {
    return res.status(400).json({ error: 'Missing display name' })
  }
  if (!SUBDOMAIN_PATTERN.test(subdomain)) {
    return res.status(400).json({
      error: 'Subdomain must be 3–30 lowercase letters, digits, or dashes',
    })
  }
  // Shared reserved + profanity policy (AGL-147).
  if (isBlockedSubdomain(subdomain)) {
    return res.status(409).json({ error: 'That subdomain is not available' })
  }

  const authorization = req.headers.authorization ?? ''
  const idToken = authorization.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length)
    : undefined
  if (!idToken) return res.status(401).json({ error: 'Unauthenticated' })

  try {
    const decoded = await firebaseAdmin.app().auth().verifyIdToken(idToken)
    // Manager permission gate (AGL-108).
    const membership = await resolveTenantPermissions(decoded.uid)
    if (!membership.permissions.createHosts) {
      return res
        .status(403)
        .json({ error: 'Your team role does not allow creating hosts' })
    }
    const firestore = firebaseAdmin.app().firestore()

    const taken = await firestore
      .collection('hosts')
      .where('subdomain', '==', subdomain)
      .limit(1)
      .get()
    if (!taken.empty) {
      // Offer available alternatives (AGL-147): name-2, name-<year>, …
      const suggestions: string[] = []
      for (const candidate of suggestSubdomains(subdomain)) {
        const candidateTaken = await firestore
          .collection('hosts')
          .where('subdomain', '==', candidate)
          .limit(1)
          .get()
        if (candidateTaken.empty) suggestions.push(candidate)
      }
      return res
        .status(409)
        .json({ error: 'That subdomain is taken', suggestions })
    }

    const tenantSnapshot = await firestore
      .collection('tenants')
      .doc(decoded.uid)
      .get()
    const tenant = tenantSnapshot.data()
    if (tenant?.['plan']) {
      const owned = await firestore
        .collection('hosts')
        .where(`admins.${decoded.uid}`, '==', true)
        .count()
        .get()
      const quota = checkQuota(
        tenant as any,
        'hostLimit',
        owned.data().count,
      )
      if (!quota.allowed) {
        return res.status(403).json({
          error:
            `Host limit reached (${quota.limit}) — upgrade or add extra ` +
            'hosts from Billing',
        })
      }
    }

    const hostId = createResourceUid()
    await firestore
      .collection('hosts')
      .doc(hostId)
      .set({
        displayName,
        subdomain,
        tenantId: decoded.uid,
        admins: { [decoded.uid]: true },
        screens: {},
        createdAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
      })
    return res.status(200).json({ hostId })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Host creation failed' })
  }
}
