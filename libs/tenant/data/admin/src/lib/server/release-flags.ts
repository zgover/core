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
  filterPluginsByReleaseFlags,
  isReleaseFlagKey,
  isReleaseFlagOn,
  parseReleaseFlagValue,
  RELEASE_FLAGS,
  type ReleaseFlagKey,
  type ReleaseFlagValue,
} from '@aglyn/aglyn/server'
import { firebaseAdmin } from './firebase-admin'

/**
 * Server-side release-flag verdicts (AGL-422): the tenant loader and the
 * API dispatchers subtract flagged-off plugins, so the server needs the
 * same Remote Config values the console client activates. The admin SDK
 * template read is cached with a short TTL — flag flips propagate within
 * a minute without a per-request round trip.
 *
 * Fail-open to the REGISTRY DEFAULTS (not "all on"): environments without
 * Remote Config (emulator e2e, local dev) behave exactly like an
 * unpublished template does on the client, so verdicts agree across
 * surfaces.
 */

const TTL_MS = 60_000

let cache:
  | { at: number; values: Record<ReleaseFlagKey, ReleaseFlagValue> }
  | undefined
let pending:
  | Promise<Record<ReleaseFlagKey, ReleaseFlagValue>>
  | undefined

const registryDefaults = (): Record<ReleaseFlagKey, ReleaseFlagValue> =>
  Object.fromEntries(
    RELEASE_FLAGS.map((definition) => [
      definition.key,
      { enabled: definition.defaultEnabled },
    ]),
  ) as Record<ReleaseFlagKey, ReleaseFlagValue>

export async function getServerReleaseFlagValues(): Promise<
  Record<ReleaseFlagKey, ReleaseFlagValue>
> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.values
  if (!pending) {
    pending = (async () => {
      const values = registryDefaults()
      try {
        const template = await firebaseAdmin.app().remoteConfig().getTemplate()
        for (const definition of RELEASE_FLAGS) {
          const parameter = template.parameters[definition.key]
          const defaultValue = parameter?.defaultValue
          const raw =
            defaultValue && 'value' in defaultValue
              ? defaultValue.value
              : undefined
          values[definition.key] = parseReleaseFlagValue(
            raw,
            definition.defaultEnabled,
          )
        }
      } catch {
        // No Remote Config here (emulator/local) — registry defaults gate.
      }
      cache = { at: Date.now(), values }
      return values
    })().finally(() => {
      pending = undefined
    })
  }
  return pending
}

/**
 * The server half of the plugin release gate (AGL-422): subtracts
 * flagged-off first-party plugins from an effective set, with the same
 * subject bucketing the console client uses (`subjectId` = orgId, so a
 * whole workspace gets a rollout verdict together). The staff bypass is
 * only paid for when something was actually subtracted AND the request
 * carries a bearer token — the common all-flags-on path never verifies.
 */
export async function filterEnabledPluginsByReleaseFlags(
  pluginIds: readonly string[],
  options: {
    subjectId?: string | null
    /** Raw Authorization header, when the caller has one (API dispatch). */
    authorization?: string | null
  },
): Promise<string[]> {
  const values = await getServerReleaseFlagValues()
  const isFlagOn = (flagKey: string): boolean =>
    isReleaseFlagKey(flagKey)
      ? isReleaseFlagOn(flagKey, values[flagKey], options.subjectId ?? null)
      : true
  const filtered = filterPluginsByReleaseFlags(pluginIds, isFlagOn)
  if (filtered.length === pluginIds.length) return filtered

  const authorization = options.authorization ?? ''
  if (authorization.startsWith('Bearer ')) {
    try {
      const decoded = await firebaseAdmin
        .app()
        .auth()
        .verifyIdToken(authorization.slice('Bearer '.length))
      if (decoded['staff'] === true) return [...pluginIds]
    } catch {
      // Invalid token — gate as anonymous.
    }
  }
  return filtered
}
