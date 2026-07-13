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

export const dynamic = 'force-dynamic'

const SESSION_COOKIE = '__session'
const SESSION_TTL_MS = 14 * 24 * 60 * 60 * 1000
const WORKSPACE_DOMAIN = process.env.NEXT_PUBLIC_WORKSPACE_DOMAIN ?? 'aglyn.io'

/**
 * Cross-subdomain sessions (AGL-236): Firebase client auth persists
 * per-origin, so hopping between {org}.aglyn.io workspaces would force
 * re-login. POST mints a session cookie scoped to the parent domain from
 * a fresh ID token; GET exchanges the cookie for a custom token so a new
 * subdomain's client can sign in silently; DELETE clears it on sign-out.
 * Revocation-aware: the exchange rejects cookies minted before the
 * user's tokens were revoked.
 */
function cookieAttributes(request: Request, maxAgeSeconds: number) {
  const host = String(request.headers.get('host') ?? '').split(':')[0]
  const onWorkspaceDomain =
    host === WORKSPACE_DOMAIN || host.endsWith(`.${WORKSPACE_DOMAIN}`)
  return [
    `Path=/`,
    `Max-Age=${maxAgeSeconds}`,
    'HttpOnly',
    'SameSite=Lax',
    // Domain only on the real deployment so localhost dev still works;
    // Secure likewise (localhost is http).
    ...(onWorkspaceDomain ? [`Domain=.${WORKSPACE_DOMAIN}`, 'Secure'] : []),
  ].join('; ')
}

function jsonWithCookie(
  body: unknown,
  status: number,
  cookie?: string,
): Response {
  const response = Response.json(body, { status })
  if (cookie) response.headers.set('Set-Cookie', cookie)
  return response
}

function readCookie(request: Request, name: string): string | undefined {
  const raw = request.headers.get('cookie')
  if (!raw) return undefined
  for (const pair of raw.split(';')) {
    const index = pair.indexOf('=')
    if (index < 0) continue
    if (pair.slice(0, index).trim() === name) {
      return decodeURIComponent(pair.slice(index + 1).trim())
    }
  }
  return undefined
}

async function handler(request: Request): Promise<Response> {
  try {
    const auth = firebaseAdmin.app().auth()

    if (request.method === 'POST') {
      const authorization = request.headers.get('authorization') ?? ''
      const idToken = authorization.startsWith('Bearer ')
        ? authorization.slice('Bearer '.length)
        : undefined
      if (!idToken) {
        return Response.json({ error: 'Unauthenticated' }, { status: 401 })
      }
      const sessionCookie = await auth.createSessionCookie(idToken, {
        expiresIn: SESSION_TTL_MS,
      })
      return jsonWithCookie(
        { ok: true },
        200,
        `${SESSION_COOKIE}=${sessionCookie}; ${cookieAttributes(request, SESSION_TTL_MS / 1000)}`,
      )
    }

    if (request.method === 'GET') {
      const cookie = readCookie(request, SESSION_COOKIE)
      if (!cookie) {
        return Response.json({ error: 'No session' }, { status: 401 })
      }
      const decoded = await auth.verifySessionCookie(cookie, true)
      const token = await auth.createCustomToken(decoded.uid)
      return Response.json({ token }, { status: 200 })
    }

    if (request.method === 'DELETE') {
      return jsonWithCookie(
        { ok: true },
        200,
        `${SESSION_COOKIE}=; ${cookieAttributes(request, 0)}`,
      )
    }

    return Response.json({ error: 'Method not allowed' }, { status: 405 })
  } catch (error) {
    // Expired/revoked cookies land here — clear and report unauthenticated.
    return jsonWithCookie(
      { error: 'Session invalid' },
      401,
      `${SESSION_COOKIE}=; ${cookieAttributes(request, 0)}`,
    )
  }
}

export { handler as GET, handler as POST, handler as DELETE }
