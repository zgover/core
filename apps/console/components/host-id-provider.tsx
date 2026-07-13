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
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation'
import { createContext, useContext, useEffect } from 'react'
import { useFirestore, useUser } from '@aglyn/tenant-feature-instance'
import { useOrgScope } from '../hooks/use-org-scope'

const WORKSPACE_DOMAIN =
  process.env.NEXT_PUBLIC_WORKSPACE_DOMAIN ?? 'aglyn.io'

export const HostIdContext = createContext<string>(null)

export const useHostId = () => {
  return useContext(HostIdContext)
}

export function HostIdProvider({ children }) {
  const params = useParams<{ hostId: string }>()
  const hostId = params?.hostId as string
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const firestore = useFirestore()
  const { data: user } = useUser()
  const {
    orgs,
    currentOrg,
    selectOrg,
    orgSlug,
    loading: orgsLoading,
  } = useOrgScope()

  // Host-route guard (AGL-236): the [hostId] catch-all otherwise treats
  // any unknown first segment (a typo, or a bare /org before its index
  // existed) as a host and renders a broken dashboard. Verify against
  // hostIndex and bounce phantoms to the sites list. The index also
  // carries the owning org, which scopes the WORKSPACE: a site from a
  // different org never renders inside this one — on the apex the
  // workspace switches to the owning org (deep links keep working,
  // Slack-style); on a workspace subdomain the visit moves to the
  // owning org's subdomain; without membership it bounces to the sites
  // list. Lookup errors (signed-out, offline) don't redirect — only a
  // definitive answer does.
  useEffect(() => {
    if (!hostId || !user || orgsLoading || !currentOrg) return
    let active = true
    void getDoc(doc(firestore, 'hostIndex', hostId))
      .then((snapshot) => {
        if (!active) return
        if (!snapshot.exists()) {
          void router.replace('/hosts')
          return
        }
        const hostOrgId = snapshot.get('orgId') as string | undefined
        if (!hostOrgId || hostOrgId === currentOrg.$id) {
          // Host-scoped access guard (AGL-242): membership in the org is
          // not access to every host — restricted members carry
          // `hostAccess` and the host doc's memberRoles projection (and
          // the rules) exclude them elsewhere. A permission-denied read
          // here means "not your site": bounce instead of rendering an
          // empty shell. Staff claims pass the rules, so staff keep
          // access.
          void getDoc(doc(firestore, 'hosts', hostId)).catch(
            (error: { code?: string }) => {
              if (active && error?.code === 'permission-denied') {
                void router.replace('/hosts')
              }
            },
          )
          return
        }
        const membership = orgs.find((org) => org.$id === hostOrgId)
        if (!membership) {
          // Not this user's org — rules already deny the data; keep the
          // UI from rendering an empty shell of someone else's site.
          void router.replace('/hosts')
          return
        }
        if (orgSlug && membership.slug) {
          // Subdomains pin the workspace to the hostname — follow the
          // site home instead (the session cookie signs it in). The Pages
          // Router `router.asPath` (path + query) is reconstructed here from
          // `usePathname()` + `useSearchParams()`.
          const query = searchParams?.toString()
          const asPath = query ? `${pathname}?${query}` : pathname
          window.location.assign(
            `https://${membership.slug}.${WORKSPACE_DOMAIN}${asPath}`,
          )
          return
        }
        selectOrg(hostOrgId)
      })
      .catch(() => undefined)
    return () => {
      active = false
    }
  }, [
    firestore,
    hostId,
    user,
    router,
    pathname,
    searchParams,
    orgs,
    currentOrg,
    selectOrg,
    orgSlug,
    orgsLoading,
  ])

  return (
    <HostIdContext.Provider value={hostId}>{children}</HostIdContext.Provider>
  )
}
HostIdProvider.displayName = 'HostIdProvider'

export default HostIdProvider
