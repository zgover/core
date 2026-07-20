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

import { Box, CircularProgress } from '@mui/material'
import { useRouter } from 'next/navigation'
import { useEffect, type ReactNode } from 'react'
import { useOrgScope } from '../hooks/use-org-scope'

function GuardSpinner() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
      <CircularProgress />
    </Box>
  )
}

/**
 * `/[orgSlug]/…` membership guard (AGL-621). The org in the URL must be one
 * the signed-in user belongs to. An unknown or non-member slug is sent to
 * the org jump page — NEVER signed out (that was the cross-org logout bug);
 * AGL-625 replaces the bounce with a designed 404 on the dashboard layout.
 * A definitive answer is required before redirecting, so nothing happens
 * while memberships load.
 */
export function OrgGuard({ children }: { children?: ReactNode }) {
  const { orgs, pathOrgSlug, loading } = useOrgScope()
  const router = useRouter()
  const known =
    !pathOrgSlug || orgs.some((org) => org.slug === pathOrgSlug)

  useEffect(() => {
    if (loading || known) return
    router.replace('/')
  }, [loading, known, router])

  // Hold the child tree until the slug is confirmed to avoid flashing a
  // foreign org's shell during the redirect.
  if (loading || !known) return <GuardSpinner />
  return <>{children}</>
}
OrgGuard.displayName = 'OrgGuard'

export default OrgGuard
