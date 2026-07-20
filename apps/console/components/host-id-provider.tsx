/**
 * @license
 * Copyright 2024 Aglyn LLC
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
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from 'next/navigation'
import { createContext, useContext, useEffect } from 'react'
import { useFirestore, useUser } from '@aglyn/tenant-feature-instance'
import { buildRoute, Route } from '../constants/route-links'
import { useOrgScope } from '../hooks/use-org-scope'

export const HostIdContext = createContext<string>(null)

export const useHostId = () => {
  return useContext(HostIdContext)
}

export function HostIdProvider({ children }) {
  const params = useParams<{ orgSlug?: string; hostId?: string }>()
  const hostId = params?.hostId as string
  const pathOrgSlug =
    typeof params?.orgSlug === 'string' ? params.orgSlug : null
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const firestore = useFirestore()
  const { data: user } = useUser()
  const { orgs, currentOrg, loading: orgsLoading } = useOrgScope()

  // Host-route guard (AGL-236/AGL-621/AGL-623). The `[orgSlug]/hosts/[hostId]`
  // route otherwise renders a broken shell for a phantom or cross-org host.
  // Verify against hostIndex, which carries the owning org:
  //  - phantom (no index doc) → the current org's sites list;
  //  - a host owned by a DIFFERENT org the user belongs to → REDIRECT to
  //    that org's canonical URL (swap the org segment), never a sign-out —
  //    this is the cross-org bug fix (AGL-623);
  //  - a host in another org the user is NOT in → the sites list;
  //  - same org but no host access (AGL-242) → the sites list on a
  //    permission-denied read (a denied host doc must never cascade to a
  //    sign-out). Lookup errors (offline/signed-out) don't redirect.
  useEffect(() => {
    if (!hostId || !user || orgsLoading || !currentOrg) return
    const homeHref = buildRoute(Route.HOST_LIST, { orgSlug: currentOrg.slug })
    let active = true
    void getDoc(doc(firestore, 'hostIndex', hostId))
      .then((snapshot) => {
        if (!active) return
        if (!snapshot.exists()) {
          void router.replace(homeHref)
          return
        }
        const hostOrgId = snapshot.get('orgId') as string | undefined
        if (!hostOrgId || hostOrgId === currentOrg.$id) {
          void getDoc(doc(firestore, 'hosts', hostId)).catch(
            (error: { code?: string }) => {
              if (active && error?.code === 'permission-denied') {
                void router.replace(homeHref)
              }
            },
          )
          return
        }
        const membership = orgs.find((org) => org.$id === hostOrgId)
        if (!membership || !membership.slug) {
          void router.replace(homeHref)
          return
        }
        // The host lives in another org the user belongs to: rewrite the
        // URL's org segment to that org and keep the rest of the deep link
        // (and query) intact. Redirect — never sign out.
        if (pathOrgSlug) {
          const query = searchParams?.toString()
          const corrected = pathname.replace(
            `/${pathOrgSlug}/`,
            `/${membership.slug}/`,
          )
          void router.replace(query ? `${corrected}?${query}` : corrected)
        }
      })
      .catch(() => undefined)
    return () => {
      active = false
    }
  }, [
    firestore,
    hostId,
    pathOrgSlug,
    user,
    router,
    pathname,
    searchParams,
    orgs,
    currentOrg,
    orgsLoading,
  ])

  return (
    <HostIdContext.Provider value={hostId}>{children}</HostIdContext.Provider>
  )
}
HostIdProvider.displayName = 'HostIdProvider'

export default HostIdProvider
