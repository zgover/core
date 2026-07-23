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

import { CardDisplay } from '@aglyn/shared-ui-jsx'
import { useSnackbar } from '@aglyn/shared-ui-snackstack'
import {
  TENANT_EMAILS,
  type TenantEmailEntry,
} from '@aglyn/shared-util-email'
import { useFirestore } from '@aglyn/tenant-feature-instance'
import { Alert, Button, Chip, Stack, Typography } from '@mui/material'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { buildRoute, Route } from '../constants/route-links'
import { useCurrentOrg } from '../hooks/use-current-org'
import { useOrgSlug } from '../hooks/use-org-scope'
import { useHostId, useHostSubdomain } from './host-id-provider'
import { openHostEmailVersion } from '../utils/open-host-email-version'

/** Groups the flat catalog by owning plugin, preserving catalog order. */
function groupByPlugin(): Array<{
  pluginId: string
  plugin: string
  emails: TenantEmailEntry[]
}> {
  const order: string[] = []
  const byId = new Map<
    string,
    { pluginId: string; plugin: string; emails: TenantEmailEntry[] }
  >()
  for (const entry of TENANT_EMAILS) {
    let group = byId.get(entry.pluginId)
    if (!group) {
      group = { pluginId: entry.pluginId, plugin: entry.plugin, emails: [] }
      byId.set(entry.pluginId, group)
      order.push(entry.pluginId)
    }
    group.emails.push(entry)
  }
  return order.map((id) => byId.get(id) as ReturnType<typeof groupByPlugin>[0])
}

/**
 * The transactional emails a site sends its own customers (AGL-769), each with
 * the way it is controlled (AGL-770): designable ones open the email besigner,
 * ones authored elsewhere say where, and fixed ones say they are not
 * customizable yet. Groups whose plugin is not enabled on this site are shown
 * dimmed with a chip rather than hidden, so the owner sees the whole surface.
 */
export function SiteEmailsCard() {
  const firestore = useFirestore()
  const router = useRouter()
  const { enqueueSnackbar } = useSnackbar()
  const hostId = useHostId()
  const orgSlug = useOrgSlug()
  const host = useHostSubdomain()
  const { org } = useCurrentOrg()
  const [opening, setOpening] = useState<string | null>(null)

  // Fail-open: an org with no explicit plugin list (pre-billing) shows every
  // group as enabled, matching how entitlement helpers treat undefined.
  const enabled = useMemo(() => {
    const list = org?.enabledPlugins
    return Array.isArray(list) ? new Set(list) : null
  }, [org?.enabledPlugins])
  const isEnabled = (pluginId: string) => !enabled || enabled.has(pluginId)

  const groups = useMemo(groupByPlugin, [])

  const openDesigner = async (entry: TenantEmailEntry) => {
    if (!hostId) return
    setOpening(entry.key)
    try {
      const versionId = await openHostEmailVersion(firestore, hostId, entry)
      router.push(
        buildRoute(Route.HOST_EMAIL_BESIGNER, {
          orgSlug,
          host,
          templateKey: entry.key,
          versionId,
        }),
      )
    } catch (error) {
      enqueueSnackbar(
        `Could not open ${entry.name}: ${(error as Error)?.message}`,
        { variant: 'error', allowDuplicate: true },
      )
      setOpening(null)
    }
  }

  return (
    <CardDisplay
      header={'Emails this site sends'}
      subheader={
        'The transactional emails your site sends to your own customers. ' +
        'A group applies only when that feature is enabled on this site.'
      }
      contentGutterX
      contentGutterY
    >
      <Stack spacing={3}>
        {groups.map((group) => {
          const groupEnabled = isEnabled(group.pluginId)
          return (
            <Stack
              key={group.pluginId}
              spacing={1}
              sx={{ opacity: groupEnabled ? 1 : 0.55 }}
            >
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <Typography variant="subtitle2">{group.plugin}</Typography>
                <Chip
                  size="small"
                  variant="outlined"
                  label={`${group.emails.length} email${
                    group.emails.length === 1 ? '' : 's'
                  }`}
                />
                {groupEnabled ? null : (
                  <Chip size="small" label="Not enabled on this site" />
                )}
              </Stack>
              {group.emails.map((email) => (
                <Stack
                  key={email.key}
                  direction="row"
                  spacing={2}
                  sx={{
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    borderBottom: 1,
                    borderColor: 'divider',
                    pb: 1,
                    '&:last-of-type': { borderBottom: 0, pb: 0 },
                  }}
                >
                  <Stack spacing={0.25} sx={{ flexGrow: 1 }}>
                    <Typography variant="body2">{email.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {email.description}
                    </Typography>
                  </Stack>
                  <Stack sx={{ flexShrink: 0, alignItems: 'flex-end' }}>
                    {email.control === 'besigner' ? (
                      <Button
                        size="small"
                        variant="contained"
                        disabled={!groupEnabled || opening === email.key}
                        onClick={() => void openDesigner(email)}
                      >
                        {'Design'}
                      </Button>
                    ) : email.control === 'external' ? (
                      <Typography variant="caption" color="text.secondary">
                        {`Edited in ${email.authoredIn}`}
                      </Typography>
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        {'Not customizable yet'}
                      </Typography>
                    )}
                  </Stack>
                </Stack>
              ))}
            </Stack>
          )
        })}
        <Alert severity="info">
          {'These are sent by your site, on your behalf. The account emails ' +
            'Aglyn itself sends you — invites, receipts, security — are ' +
            'managed by Aglyn, not here.'}
        </Alert>
      </Stack>
    </CardDisplay>
  )
}
SiteEmailsCard.displayName = 'SiteEmailsCard'

export default SiteEmailsCard
