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

import { canManageOrg } from '@aglyn/aglyn'
import { ICON_VARIANT_APP_SETTINGS } from '@aglyn/shared-data-enums'
import { AppLink, Container } from '@aglyn/shared-ui-jsx'
import { NextPageTitle } from '@aglyn/shared-ui-next/contexts/next-page-title-provider'
import type { NextPageWithLayout } from '@aglyn/shared-ui-next'
import { useSnackbar } from '@aglyn/shared-ui-snackstack'
import {
  Alert,
  Button,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useMemo, useState } from 'react'
import { useFirestore, useUser } from '@aglyn/tenant-feature-instance'
import DashboardLayout from '../../../../components/layouts/dashboard.layout'
import OrgPluginsCard from '../../../../components/org-plugins-card.component'
import PluginConfigCards from '../../../../components/plugin-config-card.component'
import PluginWidgetSlot from '../../../../components/plugin-widget-slot.component'
import { buildRoute, Route } from '../../../../constants/route-links'
import { CONTENT_MAX_WIDTH } from '../../../../constants/shared'
import { useAdminHosts } from '../../../../hooks/use-admin-hosts'
import useCurrentOrg from '../../../../hooks/use-current-org'
import useOrgNavTabItems from '../../../../hooks/use-org-nav-tabs'
import { useOrgWorkspace } from '../../../../hooks/use-org-workspace'

/**
 * Plugins & add-ons hub (AGL-423): ONE place to manage everything
 * pluggable in the workspace — the first-party switchboard (org
 * `enabledPlugins`, with release-flag state chips, AGL-416/422) and the
 * marketplace installs (pins, upgrades, uninstall, org sharing — rendered
 * by the community plugin through the `orgAddons` slot so the app stays
 * plugin-free). Marketplace actions act through a site because install
 * pins are validated against host membership; the selector picks which.
 */
const OrgPlugins: NextPageWithLayout = () => {
  const orgNavTabs = useOrgNavTabItems()
  const { currentOrg, loading } = useOrgWorkspace()
  const { org } = useCurrentOrg()
  const { data: user } = useUser()
  const firestore = useFirestore()
  const { enqueueSnackbar } = useSnackbar()
  const canManage = canManageOrg(currentOrg?.role)

  const { hosts } = useAdminHosts(
    firestore,
    user?.uid,
    loading ? undefined : (currentOrg?.$id ?? null),
  )
  const hostIds = useMemo(
    () => ((hosts as Array<{ $id: string }>) ?? []).map((host) => host.$id),
    [hosts],
  )
  const [selectedHost, setSelectedHost] = useState('')
  const actingHost = selectedHost || hostIds[0] || ''

  const saveEnabledPlugins = async (enabledPlugins: string[]) => {
    const idToken = await (
      user as { getIdToken?: () => Promise<string> }
    )?.getIdToken?.()
    const response = await fetch('/api/orgs/settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
      },
      body: JSON.stringify({
        orgId: currentOrg?.$id,
        action: 'set-enabled-plugins',
        enabledPlugins,
      }),
    })
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}))
      throw new Error(payload?.error ?? 'Request failed')
    }
    enqueueSnackbar('Plugins updated', { variant: 'success' })
  }

  return (
    <>
      <NextPageTitle screen={'Plugins & add-ons – Organization'} />
      <DashboardLayout
        navTabItems={orgNavTabs}
        activeTab={buildRoute(Route.ORG_PLUGINS)}
        breadcrumbItems={[
          { children: 'Plugins', href: buildRoute(Route.ORG_PLUGINS) },
        ]}
        header={{
          children: 'Plugins & add-ons',
          icon: { path: ICON_VARIANT_APP_SETTINGS.path },
        }}
      >
        <Container gutterY maxWidth={CONTENT_MAX_WIDTH}>
          {!loading && !currentOrg ? (
            <Alert severity="info">
              {'Create your first site to start an organization, or accept ' +
                'a pending invite from your dashboard.'}
            </Alert>
          ) : currentOrg?.$id ? (
            <Stack spacing={3}>
              <OrgPluginsCard
                org={org}
                disabled={!canManage}
                onSave={saveEnabledPlugins}
              />

              {/* Per-plugin settings (AGL-428): one generic form per
                  schema the loaded plugins declared. */}
              <PluginConfigCards
                orgId={currentOrg.$id}
                disabled={!canManage}
              />

              <Stack
                direction="row"
                spacing={2}
                sx={{ alignItems: 'center', flexWrap: 'wrap' }}
              >
                <Typography variant="h6" sx={{ flex: 1 }}>
                  {'Marketplace add-ons'}
                </Typography>
                {hostIds.length > 1 ? (
                  <TextField
                    select
                    size="small"
                    label="Acting site"
                    value={actingHost}
                    onChange={(event) => setSelectedHost(event.target.value)}
                    sx={{ minWidth: 200 }}
                  >
                    {hostIds.map((hostId) => (
                      <MenuItem key={hostId} value={hostId}>
                        {hostId}
                      </MenuItem>
                    ))}
                  </TextField>
                ) : null}
                {actingHost ? (
                  <Button
                    component={AppLink}
                    href={buildRoute(Route.HOST_COMMUNITY, {
                      hostId: actingHost,
                    })}
                    variant="outlined"
                    size="small"
                  >
                    {'Browse the marketplace'}
                  </Button>
                ) : null}
              </Stack>

              {actingHost ? (
                // Community plugin's installed-add-ons card (org + host
                // pins, upgrades, uninstall). Renders nothing when the
                // community plugin is disabled for the workspace.
                <PluginWidgetSlot slot="orgAddons" hostId={actingHost} />
              ) : (
                <Alert severity="info">
                  {'Marketplace add-ons appear once the organization has a ' +
                    'site to act through.'}
                </Alert>
              )}
            </Stack>
          ) : null}
        </Container>
      </DashboardLayout>
    </>
  )
}
OrgPlugins.displayName = 'Page:OrgPlugins'

export default OrgPlugins
