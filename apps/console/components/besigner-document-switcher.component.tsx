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

import * as Aglyn from '@aglyn/aglyn'
import { useConfirmationContext } from '@aglyn/shared-ui-jsx'
import {
  Chip,
  ListSubheader,
  MenuItem,
  Select,
  type SelectChangeEvent,
  Typography,
} from '@mui/material'
import { collection, doc, limit, query } from 'firebase/firestore'
import { useRouter } from 'next/router'
import { observer } from 'mobx-react-lite'
import { useCallback, useMemo } from 'react'
import {
  useFirestore,
  useFirestoreCollectionData,
  useFirestoreDocData,
} from 'reactfire'
import { buildRoute, Route } from '../constants/route-links'

export interface BesignerDocumentSwitcherProps {
  hostId: string
  /** The document currently open in the besigner. */
  current: { kind: 'screen' | 'layout'; id: string }
}

const keyOf = (kind: 'screen' | 'layout', id: string) => `${kind}:${id}`

/**
 * App-bar control that shows which screen/layout the besigner is editing and
 * switches to another document from the same host. Navigating with unsaved
 * canvas changes asks for confirmation first; the besigner pages' existing
 * reset-on-param-change effect clears the canvas for the next document.
 */
export const BesignerDocumentSwitcherComponent = observer(
  function BesignerDocumentSwitcherComponent(
    props: BesignerDocumentSwitcherProps,
  ) {
    const { hostId, current } = props
    const firestore = useFirestore()
    const router = useRouter()
    const { confirm } = useConfirmationContext()

    const { data: screenDocs } = useFirestoreCollectionData<any>(
      query(collection(firestore, 'hosts', hostId, 'screens'), limit(200)),
      { idField: '$id' },
    )
    const { data: layoutDocs } = useFirestoreCollectionData<any>(
      query(collection(firestore, 'hosts', hostId, 'layouts'), limit(100)),
      { idField: '$id' },
    )
    const { data: hostData } = useFirestoreDocData<any>(
      doc(firestore, 'hosts', hostId),
      { idField: '$id' },
    )
    const routingMap = hostData?.screens as Record<string, string> | undefined

    const screens = useMemo(
      () =>
        (screenDocs ?? [])
          .filter((screen: any) => !screen.deletedAt)
          .sort((a: any, b: any) =>
            (a.displayName ?? a.$id).localeCompare(b.displayName ?? b.$id),
          ),
      [screenDocs],
    )
    const layouts = useMemo(
      () =>
        (layoutDocs ?? [])
          .filter((layout: any) => !layout.deletedAt)
          .sort((a: any, b: any) =>
            (a.displayName ?? a.$id).localeCompare(b.displayName ?? b.$id),
          ),
      [layoutDocs],
    )

    const currentKey = keyOf(current.kind, current.id)
    const optionsLoaded =
      current.kind === 'screen'
        ? screens.some((screen: any) => screen.$id === current.id)
        : layouts.some((layout: any) => layout.$id === current.id)

    const pathLabel = useCallback(
      (screenId: string) => {
        const path = routingMap?.[screenId]
        return path ? Aglyn.screenRoutePathToUrl(path) : 'not published'
      },
      [routingMap],
    )

    const handleChange = useCallback(
      async (event: SelectChangeEvent<string>) => {
        const value = event.target.value
        if (!value || value === currentKey) return
        if (value === 'view-all') {
          return void router.push(buildRoute(Route.SCREEN_LIST, { hostId }))
        }
        const [kind, id] = value.split(':') as ['screen' | 'layout', string]
        const target =
          kind === 'screen'
            ? screens.find((screen: any) => screen.$id === id)
            : layouts.find((layout: any) => layout.$id === id)
        if (!target?.versionId) return

        if (!Aglyn.canvas.isInitialSame) {
          const confirmed = await confirm({
            title: 'Discard unsaved changes?',
            description:
              'The canvas has unsaved changes. Switching documents discards ' +
              "them. Press 'Discard' to continue or 'Cancel' to stay.",
            confirmationText: 'Discard',
            confirmationButtonProps: { color: 'error' },
          })
            .then(() => true)
            .catch(() => false)
          if (!confirmed) return
        }

        const url =
          kind === 'screen'
            ? buildRoute(Route.SCREEN_BESIGNER, {
                hostId,
                screenId: id,
                versionId: target.versionId,
              })
            : buildRoute(Route.LAYOUT_BESIGNER, {
                hostId,
                layoutId: id,
                versionId: target.versionId,
              })
        void router.push(url)
      },
      [currentKey, screens, layouts, confirm, router, hostId],
    )

    return (
      <Select
        size="small"
        variant="standard"
        disableUnderline
        value={optionsLoaded ? currentKey : ''}
        onChange={handleChange}
        displayEmpty
        renderValue={(value) => {
          if (!value) return <Typography variant="body2">{'…'}</Typography>
          const [kind, id] = String(value).split(':')
          const docs = kind === 'screen' ? screens : layouts
          const selected = docs.find((item: any) => item.$id === id)
          const name = selected?.displayName ?? id
          return (
            <Typography
              variant="body2"
              sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}
              component="span"
              noWrap
            >
              <strong>{name}</strong>
              {kind === 'screen' ? (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  component="span"
                >
                  {pathLabel(id)}
                </Typography>
              ) : (
                <Chip label="Layout" size="small" variant="outlined" />
              )}
            </Typography>
          )
        }}
        sx={{ minWidth: 180, maxWidth: 320, mx: 1 }}
        MenuProps={{ slotProps: { paper: { sx: { maxHeight: 420 } } } }}
        aria-label="Switch edited document"
      >
        <ListSubheader>{'Screens'}</ListSubheader>
        {screens.map((screen: any) => (
          <MenuItem key={screen.$id} value={keyOf('screen', screen.$id)}>
            <Typography variant="body2" component="span" noWrap>
              {screen.displayName ?? screen.$id}{' '}
              <Typography
                variant="caption"
                color="text.secondary"
                component="span"
              >
                {pathLabel(screen.$id)}
              </Typography>
            </Typography>
          </MenuItem>
        ))}
        <ListSubheader>{'Layouts'}</ListSubheader>
        {layouts.map((layout: any) => (
          <MenuItem key={layout.$id} value={keyOf('layout', layout.$id)}>
            <Typography variant="body2" component="span" noWrap>
              {layout.displayName ?? layout.$id}
            </Typography>
          </MenuItem>
        ))}
        <MenuItem value="view-all" divider>
          <Typography variant="body2" color="secondary">
            {'View all screens…'}
          </Typography>
        </MenuItem>
      </Select>
    )
  },
)

export default BesignerDocumentSwitcherComponent
