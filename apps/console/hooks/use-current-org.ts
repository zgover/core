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

import type { AglynOrgBilling } from '@aglyn/aglyn'
import { useFirestore } from '@aglyn/tenant-feature-instance'
import { doc, onSnapshot } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import useOrgScope from './use-org-scope'

const RETRY_DELAY_MS = 400
const MAX_RETRIES = 5

/**
 * The org workspace's billing doc — the entitlement source the signed-in
 * user acts under (AGL-238). Formerly `useCurrentTenant` (alias removed
 * in AGL-444; the uid-keyed `tenantId` return leg retired with the Stripe
 * `metadata[tenantId]` wire key in AGL-445).
 *
 * Subscribes with a raw `onSnapshot` (with its own retry) rather than
 * reactfire's `useFirestoreDocData` — that hook's cached Observable is a
 * *terminated* RxJS stream once it errors, so it can't recover from the one
 * transient `permission-denied` this read can hit right after sign-in, when
 * `useUser()` reports a signed-in user a beat before Firestore's own
 * credential provider has attached that user's ID token (AGL-216).
 */
export function useCurrentOrg(): {
  org: Partial<AglynOrgBilling> | undefined
  /** The org the billing data came from, once orgs carry it (AGL-237). */
  orgId: string | undefined
} {
  const firestore = useFirestore()
  const { currentOrg, loading: orgsLoading } = useOrgScope()
  // AGL-238 cutover: the org doc is the ONLY entitlement source (plan
  // mirrored by backfill + webhook). Accounts without an org yet (fresh
  // signups pre first host) resolve undefined, which the entitlement
  // helpers treat as the pre-billing fail-open, same as before.
  const orgId = currentOrg?.$id
  const sourcePath =
    orgsLoading || !orgId ? null : (['orgs', orgId] as const)
  const [org, setOrg] = useState<Partial<AglynOrgBilling> | undefined>(
    undefined,
  )

  useEffect(() => {
    // Clear on every scope change (AGL-591): switching orgs must not keep
    // the previous org's name/logo in the switcher until the new doc lands.
    setOrg(undefined)
    if (!sourcePath) {
      return
    }
    let cancelled = false
    let unsubscribe: (() => void) | null = null
    let timer: ReturnType<typeof setTimeout> | null = null
    let attempt = 0

    const [collectionName, docId] = sourcePath
    const subscribe = () => {
      unsubscribe = onSnapshot(
        doc(firestore, collectionName, docId),
        (snapshot) => {
          if (cancelled) return
          attempt = 0
          setOrg(
            snapshot.exists()
              ? ({ $id: snapshot.id, ...snapshot.data() } as Partial<AglynOrgBilling>)
              : undefined,
          )
        },
        () => {
          if (cancelled) return
          unsubscribe?.()
          if (attempt < MAX_RETRIES) {
            attempt += 1
            timer = setTimeout(subscribe, RETRY_DELAY_MS)
          }
        },
      )
    }
    subscribe()

    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
      unsubscribe?.()
    }
    // sourcePath is derived state; its parts are the real dependencies.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firestore, sourcePath?.[0], sourcePath?.[1]])

  return { org, orgId }
}

export default useCurrentOrg
