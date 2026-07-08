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

/**
 * URL redirects (AGL-154): paid per-host rules at
 * `hosts/{hostId}/redirects/{id}`. Exact source match in v1 (the `kind`
 * field leaves room for patterns later); destinations are internal paths
 * or absolute https URLs. Console validation and tenant enforcement share
 * these helpers so they can't disagree.
 */

export interface HostRedirect {
  /** Normalized source path — see `normalizeRedirectSource`. */
  source: string
  /** Internal path (`/pricing`) or absolute https URL. */
  destination: string
  /** 302 by default while testing; owners promote to 301 when sure. */
  statusCode: 301 | 302 | 307 | 308
  enabled?: boolean
  /** Exact match only in v1. */
  kind?: 'exact'
}

export const REDIRECT_STATUS_CODES = [301, 302, 307, 308] as const

/**
 * Source normalization: leading slash, lowercase, query/hash stripped,
 * trailing slash stripped (root stays `/`). Returns null for unusable
 * input so callers reject rather than store junk.
 */
export function normalizeRedirectSource(input: string): string | null {
  let path = String(input ?? '').trim()
  if (!path) return null
  // Absolute URLs and protocol-ish sources are not paths.
  if (/^[a-z][a-z0-9+.-]*:/i.test(path) || path.startsWith('//')) return null
  if (!path.startsWith('/')) path = `/${path}`
  path = path.split(/[?#]/)[0].toLowerCase()
  if (path.length > 1) path = path.replace(/\/+$/, '')
  if (path.length > 500 || /\s/.test(path)) return null
  return path || '/'
}

/**
 * Destination validation: an internal path (normalized like sources but
 * case-preserved) or an absolute https URL. Returns the cleaned value or
 * null when invalid.
 */
export function normalizeRedirectDestination(input: string): string | null {
  const value = String(input ?? '').trim()
  if (!value || value.length > 1000 || /\s/.test(value)) return null
  if (/^https:\/\/[^/]+/i.test(value)) return value
  if (value.startsWith('/') && !value.startsWith('//')) {
    return value.length > 1 ? value.replace(/\/+$/, '') : '/'
  }
  return null
}

/**
 * True when the rule would redirect a path onto itself — the loop case
 * both the console and the tenant enforcement must refuse (they validate
 * independently and may disagree; this is the shared floor).
 */
export function isSelfRedirect(redirect: {
  source: string
  destination: string
}): boolean {
  const destination = redirect.destination.toLowerCase()
  if (destination.startsWith('/')) {
    const normalized =
      destination.length > 1 ? destination.replace(/\/+$/, '') : '/'
    return normalized === redirect.source
  }
  return false
}
