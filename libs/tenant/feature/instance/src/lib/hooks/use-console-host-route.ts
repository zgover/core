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
'use client'

import { doc, getDoc } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { useFirestore } from './firebase/firebase-services'

/**
 * Console route base for a host: `/{orgSlug}/hosts/{subdomain}` (AGL-673).
 *
 * Plugin components are handed a host DOC ID and used to build links as
 * `/{hostDocId}/…`. Console routes have been `/[orgSlug]/hosts/[subdomain]/…`
 * since AGL-621/622, so every one of those links silently began 404ing —
 * found three separate times in different plugins, each looking like a new
 * bug. This is the one resolution, so the next plugin does not become the
 * fourth.
 *
 * `null` until resolved, and `null` forever if the org has no slug. Callers
 * must render plain text rather than a link in that case: a link to nowhere
 * is worse than no link.
 *
 * Reads `hostIndex` (signed-in readable, mirrors `subdomain` and `orgId`)
 * plus the org doc for its slug — both cheap and already cached by the SDK
 * on most screens.
 */
export function useConsoleHostRoute(hostId: string | undefined | null): {
  base: string | null
  orgSlug: string | null
  subdomain: string | null
} {
  const firestore = useFirestore()
  const [resolved, setResolved] = useState<{
    base: string | null
    orgSlug: string | null
    subdomain: string | null
  }>({ base: null, orgSlug: null, subdomain: null })

  useEffect(() => {
    if (!hostId) return
    let active = true
    void (async () => {
      try {
        const index = await getDoc(doc(firestore, 'hostIndex', hostId))
        const orgId = index.get('orgId') as string | undefined
        const subdomain = (index.get('subdomain') as string | undefined) ?? hostId
        if (!orgId) return
        const org = await getDoc(doc(firestore, 'orgs', orgId))
        const orgSlug = org.get('slug') as string | undefined
        if (!active || !orgSlug) return
        setResolved({
          base: `/${orgSlug}/hosts/${subdomain}`,
          orgSlug,
          subdomain,
        })
      } catch {
        // Unreadable index or org — stay unresolved so callers degrade.
      }
    })()
    return () => {
      active = false
    }
  }, [firestore, hostId])

  return resolved
}

export default useConsoleHostRoute
