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
  NOTIFICATION_TYPE_LABELS,
  type AglynNotification,
} from '@aglyn/aglyn'
import {
  mdiBellOutline,
  mdiCheckAll,
} from '@aglyn/shared-data-mdi'
import { MdiIcon } from '@aglyn/shared-ui-jsx'
import {
  Badge,
  Box,
  Button,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import {
  collection,
  doc,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { useRouter } from 'next/router'
import { useMemo, useState } from 'react'
import { useFirestore, useUser } from '@aglyn/tenant-feature-instance'
import { buildRoute, Route } from '../constants/route-links'
import useFirestoreCollection from '../hooks/use-firestore-collection'

/**
 * App-bar notifications dropdown (AGL-260): unread badge over the 10 most
 * recent notifications, mark-read on click / mark-all, and a "view all"
 * link to the paginated page.
 */
export function NotificationsMenu() {
  const { data: user } = useUser()
  const firestore = useFirestore()
  const router = useRouter()
  const uid = (user as any)?.uid as string | undefined
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)

  const { data: recent } = useFirestoreCollection<any>(
    () =>
      query(
        collection(firestore, 'users', uid ?? '-none-', 'notifications'),
        orderBy('createdAt', 'desc'),
        limit(10),
      ),
    [firestore, uid],
    { idField: '$id' },
  )
  const { data: unreadDocs } = useFirestoreCollection<any>(
    () =>
      query(
        collection(firestore, 'users', uid ?? '-none-', 'notifications'),
        where('readAt', '==', null),
        limit(100),
      ),
    [firestore, uid],
    { idField: '$id' },
  )
  // Emitters omit readAt entirely, and Firestore can't query for a
  // missing field — count unread from the recent window instead when the
  // null-query comes back empty.
  const unreadCount = useMemo(() => {
    const explicit = unreadDocs?.length ?? 0
    const implicit = (recent ?? []).filter((item) => !item.readAt).length
    return Math.max(explicit, implicit)
  }, [unreadDocs, recent])

  if (!uid) return null

  const markRead = (notification: AglynNotification & { $id: string }) => {
    void updateDoc(
      doc(firestore, 'users', uid, 'notifications', notification.$id),
      { readAt: serverTimestamp() },
    ).catch(console.error)
  }

  const handleOpenItem = (
    notification: AglynNotification & { $id: string },
  ) => {
    if (!notification.readAt) markRead(notification)
    setAnchor(null)
    if (notification.link) void router.push(notification.link)
  }

  const handleMarkAll = () => {
    for (const notification of recent ?? []) {
      if (!notification.readAt) markRead(notification)
    }
  }

  return (
    <>
      <Tooltip title="Notifications">
        <IconButton
          color="inherit"
          aria-label="notifications"
          onClick={(event) => setAnchor(event.currentTarget)}
        >
          <Badge
            color="secondary"
            badgeContent={unreadCount > 99 ? '99+' : unreadCount}
            invisible={unreadCount === 0}
          >
            <MdiIcon path={mdiBellOutline.path} />
          </Badge>
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        slotProps={{ paper: { sx: { width: 360, maxWidth: '90vw' } } }}
      >
        <Stack
          direction="row"
          sx={{ px: 2, py: 0.5, alignItems: 'center' }}
        >
          <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
            {'Notifications'}
          </Typography>
          <Tooltip title="Mark all read">
            <IconButton
              size="small"
              onClick={handleMarkAll}
              disabled={unreadCount === 0}
            >
              <MdiIcon path={mdiCheckAll.path} sx={{ fontSize: '1rem' }} />
            </IconButton>
          </Tooltip>
        </Stack>
        <Divider />
        {(recent ?? []).length === 0 ? (
          <Box sx={{ px: 2, py: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {"You're all caught up."}
            </Typography>
          </Box>
        ) : (
          (recent ?? []).map((notification) => (
            <MenuItem
              key={notification.$id}
              onClick={() => handleOpenItem(notification)}
              sx={{ whiteSpace: 'normal', alignItems: 'flex-start' }}
            >
              <Stack sx={{ minWidth: 0 }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: notification.readAt
                      ? 'fontWeightRegular'
                      : 'fontWeightMedium',
                  }}
                >
                  {notification.title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {(NOTIFICATION_TYPE_LABELS as any)[notification.type] ??
                    notification.type}
                  {' · '}
                  {notification.createdAt?.toDate?.().toLocaleString() ?? ''}
                </Typography>
              </Stack>
            </MenuItem>
          ))
        )}
        <Divider />
        <Box sx={{ px: 1, py: 0.5 }}>
          <Button
            fullWidth
            size="small"
            color="secondary"
            onClick={() => {
              setAnchor(null)
              void router.push(buildRoute(Route.MANAGE_NOTIFICATIONS))
            }}
          >
            {'View all'}
          </Button>
        </Box>
      </Menu>
    </>
  )
}
NotificationsMenu.displayName = 'NotificationsMenu'

export default NotificationsMenu
