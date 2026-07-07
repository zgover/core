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

import { ICON_VARIANT_APP_SETTINGS } from '@aglyn/shared-data-enums'
import { CardDisplay, Container, GridItems } from '@aglyn/shared-ui-jsx'
import { NextPageTitle, NextPageWithLayout } from '@aglyn/shared-ui-next'
import { useSnackbar } from '@aglyn/shared-ui-snackstack'
import { Timestamp } from '@aglyn/shared-util-timestamp'
import { Button, Stack, TextField, Typography } from '@mui/material'
import {
  collection,
  doc,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import { useCallback, useEffect, useState } from 'react'
import {
  useFirestore,
  useFirestoreCollectionData,
  useFirestoreDocData,
  useUser,
} from 'reactfire'
import AuthenticatedLayout from '../../../components/layouts/authenticated.layout'
import DashboardLayout from '../../../components/layouts/dashboard.layout'
import MainLayout from '../../../components/layouts/main.layout'
import { buildRoute, Route } from '../../../constants/route-links'
import { CONTENT_MAX_WIDTH } from '../../../constants/shared'

const HANDLE_PATTERN = /^[a-z0-9][a-z0-9-]{2,29}$/

/**
 * Publisher settings (AGL-44): the tenant's public community profile
 * (required before publishing) and their published listings with an
 * explicit unpublish. Handle format mirrors the Firestore rule.
 */
const CommunitySettings: NextPageWithLayout = () => {
  const firestore = useFirestore()
  const { data: user } = useUser()
  const { enqueueSnackbar } = useSnackbar()
  const uid = user?.uid
  const { data: profile } = useFirestoreDocData<any>(
    doc(firestore, 'profiles', uid ?? '-anonymous-'),
    { idField: '$id' },
  )
  const { data: listings } = useFirestoreCollectionData<any>(
    query(
      collection(firestore, 'communityListings'),
      where('profileId', '==', uid ?? '-anonymous-'),
    ),
    { idField: '$id' },
  )

  const [handle, setHandle] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  useEffect(() => {
    setHandle(profile?.handle ?? '')
    setDisplayName(profile?.displayName ?? '')
    setBio(profile?.bio ?? '')
  }, [profile?.handle, profile?.displayName, profile?.bio])

  const validHandle = HANDLE_PATTERN.test(handle)

  const handleSave = useCallback(async () => {
    if (!uid || !validHandle || !displayName.trim()) return
    try {
      await setDoc(
        doc(firestore, 'profiles', uid),
        {
          handle,
          displayName: displayName.trim().slice(0, 80),
          ...(bio.trim() && { bio: bio.trim().slice(0, 500) }),
          updatedAt: Timestamp.now(),
        },
        { merge: true },
      )
      enqueueSnackbar('Profile saved', { variant: 'success', persist: false })
    } catch (error) {
      console.error(error)
      enqueueSnackbar('An error has occurred', {
        variant: 'error',
        allowDuplicate: true,
      })
    }
  }, [uid, validHandle, handle, displayName, bio, firestore, enqueueSnackbar])

  const handleUnpublish = useCallback(
    (listing: any) => async () => {
      try {
        await updateDoc(doc(firestore, 'communityListings', listing.$id), {
          deletedAt: listing.deletedAt ? null : Timestamp.now(),
        })
        enqueueSnackbar(listing.deletedAt ? 'Republished' : 'Unpublished', {
          variant: 'success',
          persist: false,
        })
      } catch (error) {
        console.error(error)
        enqueueSnackbar('An error has occurred', {
          variant: 'error',
          allowDuplicate: true,
        })
      }
    },
    [firestore, enqueueSnackbar],
  )

  return (
    <>
      <NextPageTitle screen={'Community profile'} />
      <DashboardLayout
        navTabItems={[
          {
            id: 'nav-tab-settings-user',
            label: 'User',
            href: buildRoute(Route.MANAGE_USER_SETTINGS),
          },
          {
            id: 'nav-tab-settings-account',
            label: 'Account',
            href: buildRoute(Route.MANAGE_ACCOUNT_SETTINGS),
          },
          {
            id: 'nav-tab-settings-billing',
            label: 'Billing',
            href: buildRoute(Route.MANAGE_BILLING),
          },
          {
            id: 'nav-tab-settings-community',
            label: 'Community',
            href: buildRoute(Route.MANAGE_COMMUNITY_PROFILE),
          },
        ]}
        breadcrumbItems={[
          {
            children: 'Community profile',
            href: buildRoute(Route.MANAGE_COMMUNITY_PROFILE),
          },
        ]}
        header={{
          children: 'Community profile',
          icon: { path: ICON_VARIANT_APP_SETTINGS.path },
        }}
      >
        <Container gutterY maxWidth={CONTENT_MAX_WIDTH}>
          <GridItems
            spacing={3}
            items={[
              {
                size: { xs: 12, md: 6 },
                children: (
                  <CardDisplay
                    header={'Public profile'}
                    contentGutterX
                    contentGutterY
                  >
                    <Stack spacing={2}>
                      <Typography variant="body2" color="text.secondary">
                        {'Shown on every component you publish to the ' +
                          'community. A profile is required before publishing.'}
                      </Typography>
                      <TextField
                        label="Handle"
                        value={handle}
                        onChange={(event) =>
                          setHandle(event.target.value.toLowerCase())
                        }
                        size="small"
                        error={Boolean(handle) && !validHandle}
                        helperText={
                          Boolean(handle) && !validHandle
                            ? '3–30 chars: lowercase letters, digits, dashes'
                            : ' '
                        }
                      />
                      <TextField
                        label="Display name"
                        value={displayName}
                        onChange={(event) =>
                          setDisplayName(event.target.value)
                        }
                        size="small"
                      />
                      <TextField
                        label="Bio"
                        value={bio}
                        onChange={(event) => setBio(event.target.value)}
                        size="small"
                        multiline
                        minRows={2}
                      />
                      <Button
                        variant="contained"
                        color="secondary"
                        disabled={!validHandle || !displayName.trim()}
                        onClick={handleSave}
                      >
                        {'Save profile'}
                      </Button>
                    </Stack>
                  </CardDisplay>
                ),
              },
              {
                size: { xs: 12, md: 6 },
                children: (
                  <CardDisplay
                    header={'Your listings'}
                    contentGutterX
                    contentGutterY
                  >
                    {(listings ?? []).length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        {'Publish a reusable component from a site’s ' +
                          'Setup page to list it here.'}
                      </Typography>
                    ) : (
                      <Stack spacing={1}>
                        {(listings ?? []).map((listing: any) => (
                          <Stack
                            key={listing.$id}
                            direction="row"
                            spacing={1}
                            sx={{ alignItems: 'center' }}
                          >
                            <Stack sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="body2" noWrap>
                                {listing.displayName}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {`v${listing.latestVersion}` +
                                  (listing.deletedAt ? ' · unpublished' : '')}
                              </Typography>
                            </Stack>
                            <Button
                              size="small"
                              color={listing.deletedAt ? 'secondary' : 'error'}
                              onClick={handleUnpublish(listing)}
                            >
                              {listing.deletedAt ? 'Republish' : 'Unpublish'}
                            </Button>
                          </Stack>
                        ))}
                      </Stack>
                    )}
                  </CardDisplay>
                ),
              },
            ]}
          />
        </Container>
      </DashboardLayout>
    </>
  )
}
CommunitySettings.displayName = 'Page:CommunitySettings'
CommunitySettings.layouts = [
  {
    Component: AuthenticatedLayout,
  },
  {
    Component: MainLayout,
    props: {
      title: 'Community profile',
      enableAppBarElevation: true,
    },
  },
]

export default CommunitySettings
