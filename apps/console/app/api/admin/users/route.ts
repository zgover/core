/**
 * @license
 * Copyright 2022 Aglyn LLC
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
import {
  emailUnverifiedResponse,
  firebaseAdmin,
  isImpersonationSession,
} from '@aglyn/tenant-data-admin'

/**
 * Staff user listing (AGL-204). Replaces the pre-AGL-42 handler that
 * listed every account WITHOUT a staff check — this one requires the
 * `staff` claim like the other admin APIs and returns trimmed records
 * only (no provider tokens, no raw claim payloads).
 */
async function handler(request: Request): Promise<Response> {
  const { method, query, headers: rawHeaders } = await pluginRequestFromWeb(request)
  const headers = rawHeaders as Partial<Record<string, string>>
  if (method !== 'GET') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 })
  }
  const authorization = headers.authorization ?? ''
  const idToken = authorization.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length)
    : undefined
  if (!idToken) return Response.json({ error: 'Unauthenticated' }, { status: 401 })

  try {
    const decoded = await firebaseAdmin.app().auth().verifyIdToken(idToken)
    if (!decoded.email_verified && !isImpersonationSession(decoded)) {
      return emailUnverifiedResponse()
    }
    if (!decoded['staff']) {
      return Response.json({ error: 'Staff only' }, { status: 403 })
    }
    const auth = firebaseAdmin.app().auth()
    // Exact-email lookup (AGL-270): listUsers can't search, this can.
    const email = typeof query.email === 'string' ? query.email : ''
    if (email) {
      try {
        const record = await auth.getUserByEmail(email.trim().toLowerCase())
        return Response.json({
          users: [
            {
              uid: record.uid,
              email: record.email ?? null,
              displayName: record.displayName ?? null,
              disabled: record.disabled,
              staff: Boolean(record.customClaims?.['staff']),
              staffRole: record.customClaims?.['staffRole'] ?? null,
              createdAt: record.metadata.creationTime ?? null,
              lastSignInAt: record.metadata.lastSignInTime ?? null,
              providers: record.providerData.map(
                (provider) => provider.providerId,
              ),
            },
          ],
          nextPageToken: null,
        }, { status: 200 })
      } catch {
        return Response.json({ users: [], nextPageToken: null }, { status: 200 })
      }
    }
    const pageToken =
      typeof query.nextPageToken === 'string'
        ? query.nextPageToken
        : undefined
    const page = await auth.listUsers(200, pageToken)
    return Response.json({
      users: page.users.map((record) => ({
        uid: record.uid,
        email: record.email ?? null,
        displayName: record.displayName ?? null,
        disabled: record.disabled,
        staff: Boolean(record.customClaims?.['staff']),
        staffRole: record.customClaims?.['staffRole'] ?? null,
        createdAt: record.metadata.creationTime ?? null,
        lastSignInAt: record.metadata.lastSignInTime ?? null,
        providers: record.providerData.map((provider) => provider.providerId),
      })),
      nextPageToken: page.pageToken ?? null,
    }, { status: 200 })
  } catch (error) {
    console.error(error)
    return Response.json({ error: 'Listing failed' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
export { handler as GET }
