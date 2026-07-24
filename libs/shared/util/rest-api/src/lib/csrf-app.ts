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

import { stringifySetCookie } from 'cookie'
import { sign, unsign } from 'cookie-signature'
import Tokens from 'csrf'
import { CSRF_SECRET, isCsrfConfigured, warnCsrfUnconfigured } from './csrf'

/**
 * App Router equivalent of {@link CsrfApiMiddleware} (the Pages Router
 * `(req,res,next)` middleware doesn't map to `route.ts`). Same double-submit
 * scheme, same `XSRF-TOKEN` signed cookie, same `csrf`/`cookie-signature`
 * primitives: safe methods (GET/HEAD/OPTIONS) only *issue* a token when one
 * is missing; unsafe methods verify the header token against the cookie and
 * rotate it. Route handlers apply `setCookie` to their `Response` and, when
 * `ok` is false, short-circuit with a 403.
 */

const TOKEN_KEY = 'XSRF-TOKEN'
const IGNORED_METHODS = ['GET', 'HEAD', 'OPTIONS']
const tokens = new Tokens()
// Per-process token secret, mirroring `csrfApiMiddlewareFactory`.
const csrfSecret = tokens.secretSync()

const cookieOptions = {
  httpOnly: true,
  path: '/',
  secure: process.env.NODE_ENV === 'production',
}

export interface AppCsrfResult {
  ok: boolean
  /** `Set-Cookie` value to attach to the response, when a token was (re)issued. */
  setCookie?: string
  /** HTTP status to reply with when `ok` is false. */
  status?: number
  message?: string
}

function readCookie(request: Request, name: string): string {
  const raw = request.headers.get('cookie')
  if (!raw) return ''
  for (const pair of raw.split(';')) {
    const index = pair.indexOf('=')
    if (index < 0) continue
    if (pair.slice(0, index).trim() === name) {
      return decodeURIComponent(pair.slice(index + 1).trim())
    }
  }
  return ''
}

function issue(): string {
  const signed = sign(tokens.create(csrfSecret), CSRF_SECRET)
  return stringifySetCookie({ name: TOKEN_KEY, value: signed, ...cookieOptions })
}

export function appCsrfCheck(request: Request): AppCsrfResult {
  // Fail CLOSED when unconfigured (AGL-795). An empty signing key makes
  // `sign()` deterministic, so the double-submit pair becomes forgeable and
  // every check below would pass — protection that reports success while
  // protecting nothing is worse than none.
  if (!isCsrfConfigured()) {
    warnCsrfUnconfigured('appCsrfCheck')
    return { ok: false, status: 500, message: 'CSRF is not configured' }
  }

  const method = request.method ?? 'GET'
  const tokenFromCookie = readCookie(request, TOKEN_KEY)

  // First request: mint a token and proceed (double-submit needs a cookie).
  if (!tokenFromCookie) return { ok: true, setCookie: issue() }

  // Safe methods aren't verified — they only guarantee a token exists.
  if (IGNORED_METHODS.includes(method)) return { ok: true }

  const tokenFromHeader = request.headers.get(TOKEN_KEY.toLowerCase())
  if (!tokenFromHeader) {
    return { ok: false, status: 403, message: 'Invalid CSRF token' }
  }
  const cookieUnsigned = unsign(tokenFromCookie, CSRF_SECRET)
  const headerUnsigned = unsign(tokenFromHeader, CSRF_SECRET)
  if (
    !cookieUnsigned ||
    !headerUnsigned ||
    cookieUnsigned !== headerUnsigned ||
    !tokens.verify(csrfSecret, cookieUnsigned)
  ) {
    return { ok: false, status: 403, message: 'Invalid CSRF token' }
  }
  // Verified: rotate the token.
  return { ok: true, setCookie: issue() }
}
