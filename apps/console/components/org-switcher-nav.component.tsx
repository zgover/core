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

import {
  ICON_VARIANT_MENU_DOWN,
  ICON_VARIANT_ORGANIZATION,
} from '@aglyn/shared-data-enums'
import { AppLink, MdiIcon } from '@aglyn/shared-ui-jsx'
import {
  Avatar,
  Button,
  Divider,
  ListItemText,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
} from '@mui/material'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { buildRoute, Route } from '../constants/route-links'
import useCurrentOrg from '../hooks/use-current-org'
import { useOrgScope } from '../hooks/use-org-scope'
import CreateOrgDialog from './create-org-dialog.component'

const WORKSPACE_DOMAIN = process.env.NEXT_PUBLIC_WORKSPACE_DOMAIN ?? 'aglyn.io'

/**
 * Slack-style organization switcher (AGL-236/AGL-621), rendered in the
 * secondary app bar. Switching NAVIGATES to the other org's URL — the URL is
 * the source of truth, so there is no local selection to race and snap back
 * (the old switch-bounce). On the apex that is `/[orgSlug]/hosts`; on a
 * workspace subdomain it is the other org's subdomain (the session cookie
 * signs it in silently).
 */
export function OrgSwitcherNav() {
  const { orgs, currentOrg, orgSlug } = useOrgScope()
  // Org logo (AGL-363) — replaces the generic building icon when set.
  const { org } = useCurrentOrg()
  const logoUrl = (org as any)?.logoUrl as string | undefined
  const router = useRouter()
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const [creating, setCreating] = useState(false)

  if (!currentOrg) return null

  return (
    <>
      <Tooltip title={`Workspace: ${currentOrg.orgName ?? currentOrg.$id}`}>
        <Button
          size="small"
          variant="contained"
          color="primary"
          onClick={(event) => setAnchor(event.currentTarget)}
          startIcon={
            logoUrl ? (
              <Avatar
                src={logoUrl}
                variant="rounded"
                sx={{ width: 18, height: 18 }}
              />
            ) : (
              <MdiIcon
                path={ICON_VARIANT_ORGANIZATION.path}
                fontSize={'small'}
              />
            )
          }
          endIcon={
            <MdiIcon path={ICON_VARIANT_MENU_DOWN.path} fontSize="small" />
          }
          sx={{
            maxWidth: 240,
            textTransform: 'none',
            '& .MuiButton-endIcon': { marginLeft: 0 },
            '& .MuiButton-endIcon>*:nth-of-type(1)': { fontSize: `1.7em` },
          }}
        >
          <Typography
            variant="subtitle2"
            noWrap
            sx={{ display: 'block', minWidth: 0 }}
          >
            {currentOrg.orgName ?? currentOrg.slug ?? currentOrg.$id}
          </Typography>
        </Button>
      </Tooltip>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
      >
        {orgs.map((item) => (
          <MenuItem
            key={item.$id}
            selected={item.$id === currentOrg.$id}
            onClick={() => {
              setAnchor(null)
              if (item.$id === currentOrg.$id || !item.slug) return
              const href = buildRoute(Route.HOST_LIST, { orgSlug: item.slug })
              // On a workspace subdomain the org IS the hostname, so switching
              // means moving to the other org's subdomain; on the apex it is a
              // client navigation. Either way the URL drives the scope.
              if (orgSlug) {
                window.location.assign(
                  `https://${item.slug}.${WORKSPACE_DOMAIN}${href}`,
                )
                return
              }
              router.push(href)
            }}
          >
            <ListItemText
              primary={item.orgName ?? item.$id}
              secondary={
                item.slug
                  ? `${item.slug}.${WORKSPACE_DOMAIN} · ${item.role}`
                  : item.role
              }
            />
          </MenuItem>
        ))}
        <Divider />
        <MenuItem
          component={AppLink as any}
          {...({ componentVariant: 'naked' } as any)}
          href={buildRoute(Route.MANAGE_TEAM, { orgSlug: currentOrg.slug })}
          onClick={() => setAnchor(null)}
        >
          {'Manage organization…'}
        </MenuItem>
        <MenuItem
          onClick={() => {
            setAnchor(null)
            setCreating(true)
          }}
        >
          {'Create organization…'}
        </MenuItem>
      </Menu>
      <CreateOrgDialog open={creating} onClose={() => setCreating(false)} />
    </>
  )
}
OrgSwitcherNav.displayName = 'OrgSwitcherNav'
OrgSwitcherNav.aglyn = true

export default OrgSwitcherNav
