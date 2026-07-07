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

import { createResourceUid } from '@aglyn/aglyn'
import { CardDisplay, useLoading } from '@aglyn/shared-ui-jsx'
import { useSnackbar } from '@aglyn/shared-ui-snackstack'
import { Timestamp } from '@aglyn/shared-util-timestamp'
import { Button, Chip, Grid, Stack, Typography } from '@mui/material'
import {
  collection,
  doc,
  getDoc,
  limit,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useFirestore, useFirestoreCollectionData } from 'reactfire'

export interface CommunityBrowseProps {
  hostId: string
}

/**
 * Community components browse + install (AGL-44). Installing copies the
 * listing's pinned version snapshot into `hosts/{hostId}/components` (with
 * `community` source metadata), so the element drawer, editor grafting, and
 * tenant compose pipeline all apply unchanged. When a listing publishes a
 * newer version, installed hosts see an explicit Update action — no silent
 * upgrades.
 */
export function CommunityBrowse(props: CommunityBrowseProps) {
  const { hostId } = props
  const firestore = useFirestore()
  const { enqueueSnackbar } = useSnackbar()
  const { queueLoading } = useLoading()
  const [handles, setHandles] = useState<Record<string, string>>({})

  const { data: listings } = useFirestoreCollectionData<any>(
    query(
      collection(firestore, 'communityListings'),
      where('deletedAt', '==', null),
      limit(60),
    ),
    { idField: '$id' },
  )
  const { data: installedDocs } = useFirestoreCollectionData<any>(
    query(collection(firestore, 'hosts', hostId, 'components'), limit(100)),
    { idField: '$id' },
  )

  // listingId → installed component doc (deleted installs don't count).
  const installed = useMemo(() => {
    const map: Record<string, any> = {}
    for (const definition of installedDocs ?? []) {
      const listingId = definition?.community?.listingId
      if (listingId && !definition.deletedAt) map[listingId] = definition
    }
    return map
  }, [installedDocs])

  useEffect(() => {
    const profileIds = [
      ...new Set((listings ?? []).map((listing: any) => listing.profileId)),
    ].filter((profileId) => profileId && !(profileId in handles))
    if (!profileIds.length) return
    let cancelled = false
    Promise.all(
      profileIds.map(async (profileId) => {
        const snapshot = await getDoc(
          doc(firestore, 'profiles', String(profileId)),
        ).catch(() => null)
        return [profileId, snapshot?.get('handle') ?? ''] as const
      }),
    ).then((entries) => {
      if (!cancelled) {
        setHandles((prev) => ({
          ...prev,
          ...Object.fromEntries(entries),
        }))
      }
    })
    return () => {
      cancelled = true
    }
  }, [listings, handles, firestore])

  const handleInstall = useCallback(
    (listing: any) => async () => {
      const dequeue = queueLoading()
      try {
        const versionSnapshot = await getDoc(
          doc(
            firestore,
            'communityListings',
            listing.$id,
            'versions',
            String(listing.latestVersion),
          ),
        )
        const version = versionSnapshot.data() as any
        if (!version?.nodes || !version?.rootId) {
          throw new Error('Listing version missing')
        }
        const existing = installed[listing.$id]
        const timestamp = Timestamp.now()
        const payload = {
          displayName: listing.displayName,
          ...(listing.description && { description: listing.description }),
          rootId: version.rootId,
          nodes: version.nodes,
          community: {
            listingId: listing.$id,
            profileId: listing.profileId,
            version: listing.latestVersion,
          },
          updatedAt: timestamp,
        }
        if (existing) {
          await updateDoc(
            doc(firestore, 'hosts', hostId, 'components', existing.$id),
            payload as any,
          )
        } else {
          await setDoc(
            doc(
              firestore,
              'hosts',
              hostId,
              'components',
              createResourceUid(),
            ),
            { ...payload, createdAt: timestamp },
          )
        }
        enqueueSnackbar(
          existing
            ? `Updated "${listing.displayName}" to v${listing.latestVersion}`
            : `Installed "${listing.displayName}" — find it under Your components`,
          { variant: 'success', persist: false },
        )
      } catch (error) {
        console.error(error)
        enqueueSnackbar('An error has occurred', {
          variant: 'error',
          allowDuplicate: true,
        })
      } finally {
        dequeue()
      }
    },
    [firestore, hostId, installed, queueLoading, enqueueSnackbar],
  )

  const items = listings ?? []
  return (
    <CardDisplay header={'Community components'} contentGutterX contentGutterY>
      {items.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          {'No community components published yet — publish one of your ' +
            'reusable components from the Setup page to be the first.'}
        </Typography>
      ) : (
        <Grid container spacing={2}>
          {items.map((listing: any) => {
            const install = installed[listing.$id]
            const installedVersion = install?.community?.version
            const upToDate =
              install && installedVersion >= listing.latestVersion
            return (
              <Grid key={listing.$id} size={{ xs: 12, sm: 6, md: 4 }}>
                <Stack
                  spacing={1}
                  sx={{
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 1,
                    p: 2,
                    height: '100%',
                  }}
                >
                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{ alignItems: 'center' }}
                  >
                    <Typography variant="subtitle2" sx={{ flex: 1 }} noWrap>
                      {listing.displayName}
                    </Typography>
                    {listing.category ? (
                      <Chip size="small" label={listing.category} />
                    ) : null}
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    {`v${listing.latestVersion}`}
                    {handles[listing.profileId]
                      ? ` · by @${handles[listing.profileId]}`
                      : ''}
                  </Typography>
                  {listing.description ? (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ flex: 1 }}
                    >
                      {listing.description}
                    </Typography>
                  ) : (
                    <span style={{ flex: 1 }} />
                  )}
                  <Button
                    size="small"
                    variant={install ? 'outlined' : 'contained'}
                    color="secondary"
                    disabled={Boolean(upToDate)}
                    onClick={handleInstall(listing)}
                  >
                    {upToDate
                      ? `Installed (v${installedVersion})`
                      : install
                        ? `Update to v${listing.latestVersion}`
                        : 'Add to this site'}
                  </Button>
                </Stack>
              </Grid>
            )
          })}
        </Grid>
      )}
    </CardDisplay>
  )
}
CommunityBrowse.displayName = 'CommunityBrowse'

export default CommunityBrowse
