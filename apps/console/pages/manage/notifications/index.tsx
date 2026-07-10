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

import { NOTIFICATION_TYPE_LABELS } from '@aglyn/aglyn'
import { mdiBellOutline } from '@aglyn/shared-data-mdi'
import { CardDisplay, Container } from '@aglyn/shared-ui-jsx'
import { NextPageTitle, NextPageWithLayout } from '@aglyn/shared-ui-next'
import {
  Button,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  startAfter,
  updateDoc,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useState } from 'react'
import { useFirestore, useUser } from '@aglyn/tenant-feature-instance'
import AuthenticatedLayout from '../../../components/layouts/authenticated.layout'
import DashboardLayout from '../../../components/layouts/dashboard.layout'
import MainLayout from '../../../components/layouts/main.layout'
import { buildRoute, Route } from '../../../constants/route-links'
import { CONTENT_MAX_WIDTH } from '../../../constants/shared'

const PAGE_SIZE = 25

/**
 * Notifications page (AGL-260): the full, cursor-paginated feed behind
 * the app-bar dropdown's "View all".
 */
const ManageNotifications: NextPageWithLayout = () => {
  const { data: user } = useUser()
  const firestore = useFirestore()
  const router = useRouter()
  const uid = (user as any)?.uid as string | undefined
  const [rows, setRows] = useState<any[]>([])
  const [cursors, setCursors] = useState<QueryDocumentSnapshot[]>([])
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)

  const loadPage = useCallback(
    async (targetPage: number, cursor?: QueryDocumentSnapshot) => {
      if (!uid) return
      setLoading(true)
      try {
        const snapshot = await getDocs(
          query(
            collection(firestore, 'users', uid, 'notifications'),
            orderBy('createdAt', 'desc'),
            ...(cursor ? [startAfter(cursor)] : []),
            limit(PAGE_SIZE + 1),
          ),
        )
        const docs = snapshot.docs.slice(0, PAGE_SIZE)
        setRows(docs.map((entry) => ({ $id: entry.id, ...entry.data() })))
        setHasMore(snapshot.docs.length > PAGE_SIZE)
        setPage(targetPage)
        setCursors((previous) => {
          const next = previous.slice(0, targetPage)
          const last = docs[docs.length - 1]
          if (last) next[targetPage] = last
          return next
        })
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    },
    [firestore, uid],
  )

  useEffect(() => {
    void loadPage(0)
  }, [loadPage])

  const handleOpen = (notification: any) => {
    if (!uid) return
    if (!notification.readAt) {
      void updateDoc(
        doc(firestore, 'users', uid, 'notifications', notification.$id),
        { readAt: serverTimestamp() },
      ).catch(console.error)
    }
    if (notification.link) void router.push(notification.link)
  }

  return (
    <>
      <NextPageTitle screen={'Notifications'} />
      <DashboardLayout
        breadcrumbItems={[
          {
            children: 'Notifications',
            href: buildRoute(Route.MANAGE_NOTIFICATIONS),
          },
        ]}
        header={{
          children: 'Notifications',
          icon: { path: mdiBellOutline.path },
        }}
      >
        <Container gutterY maxWidth={CONTENT_MAX_WIDTH}>
          <CardDisplay
            header={'All notifications'}
            contentGutterX
            contentGutterY
            contentBordered="all"
          >
            <Stack spacing={1.5}>
              {rows.length === 0 && !loading ? (
                <Typography variant="body2" color="text.secondary">
                  {"You're all caught up."}
                </Typography>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>{'Notification'}</TableCell>
                      <TableCell>{'Type'}</TableCell>
                      <TableCell>{'When'}</TableCell>
                      <TableCell align="right" />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map((notification) => (
                      <TableRow
                        key={notification.$id}
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => handleOpen(notification)}
                      >
                        <TableCell>
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
                          {notification.body ? (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {notification.body}
                            </Typography>
                          ) : null}
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={
                              (NOTIFICATION_TYPE_LABELS as any)[
                                notification.type
                              ] ?? notification.type
                            }
                          />
                        </TableCell>
                        <TableCell>
                          {notification.createdAt
                            ?.toDate?.()
                            .toLocaleString() ?? ''}
                        </TableCell>
                        <TableCell align="right">
                          {notification.readAt ? null : (
                            <Chip size="small" color="secondary" label="New" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <Button
                  size="small"
                  color="secondary"
                  disabled={loading || page === 0}
                  onClick={() => loadPage(page - 1, cursors[page - 2])}
                >
                  {'Previous'}
                </Button>
                <Typography variant="caption" color="text.secondary">
                  {`Page ${page + 1}`}
                </Typography>
                <Button
                  size="small"
                  color="secondary"
                  disabled={loading || !hasMore}
                  onClick={() => loadPage(page + 1, cursors[page])}
                >
                  {'Next'}
                </Button>
              </Stack>
            </Stack>
          </CardDisplay>
        </Container>
      </DashboardLayout>
    </>
  )
}
ManageNotifications.displayName = 'Page:ManageNotifications'
ManageNotifications.layouts = [
  {
    Component: AuthenticatedLayout,
  },
  {
    Component: MainLayout,
    props: {
      title: 'Notifications',
    },
  },
]

export default ManageNotifications
