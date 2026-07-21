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

import { useLoading } from '@aglyn/shared-ui-jsx'
import { useSnackbar } from '@aglyn/shared-ui-snackstack'
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Typography,
} from '@mui/material'
import { collection, limit, query, where } from 'firebase/firestore'
import { useCallback, useState } from 'react'
import {
  useFirestore,
  useHostResourceApi,
  useUser,
} from '@aglyn/tenant-feature-instance'
import { checkOrgQuota } from '../../constants/entitlements'
import createPageFromTemplate from './create-page-from-template'
import UseTemplateDialog from './use-template-dialog.component'
import {
  STARTER_TEMPLATES,
  type StarterTemplate,
} from '../../constants/starter-templates'
import useCurrentOrg from '../../hooks/use-current-org'
import useFirestoreCollection from '../../hooks/use-firestore-collection'

export interface TemplateGalleryDialogProps {
  hostId: string
  open: boolean
  onClose: () => void
  /** Slugs already used on the host, for collision suffixing. */
  existingSlugs: string[]
  /** Current screen count, for the plan quota check. */
  screenCount: number
}

/**
 * Starter-template gallery (AGL-78/79): instantiates a template's screens
 * into the host — fresh screen/version ids, published routing-map entries
 * (slug conflicts get a numeric suffix), SEO fields carried over. Templates
 * ship in code (STARTER_TEMPLATES), so there is nothing to seed.
 */
export function TemplateGalleryDialog(props: TemplateGalleryDialogProps) {
  const { hostId, open, onClose, existingSlugs, screenCount } = props
  const firestore = useFirestore()
  const { enqueueSnackbar } = useSnackbar()
  const { queueLoading } = useLoading()
  const { org } = useCurrentOrg()
  const { data: user } = useUser()
  const createHostResource = useHostResourceApi()

  // Community site templates (AGL-137): published bundles with previews.
  const { data: templateListings } = useFirestoreCollection<any>(
    () =>
      query(
        collection(firestore, 'communityListings'),
        where('kind', '==', 'template'),
        limit(30),
      ),
    [firestore],
    { idField: '$id' },
  )
  const communityTemplates = (templateListings ?? []).filter(
    (listing: any) => !listing.deletedAt,
  )
  // The host's own library (AGL-672) — saved templates and marketplace
  // installs, the same collection the Templates page renders. Page kind
  // only: a component or layout template has nothing to do with "start
  // from a template" on the screens list.
  const { data: libraryDocs } = useFirestoreCollection<any>(
    () => query(collection(firestore, 'hosts', hostId, 'templates'), limit(50)),
    [firestore, hostId],
    { idField: '$id' },
  )
  const libraryPages = (libraryDocs ?? []).filter(
    (entry: any) => !entry.deletedAt && (entry.kind ?? 'page') === 'page',
  )
  const [useTemplate, setUseTemplate] = useState<Record<string, any> | null>(
    null,
  )
  const [installingId, setInstallingId] = useState<string | null>(null)
  const handleInstallTemplate = useCallback(
    (listing: any) => async () => {
      if (installingId) return
      setInstallingId(listing.$id)
      const dequeue = queueLoading()
      try {
        const idToken = await (user as any)?.getIdToken?.()
        const response = await fetch('/api/community/install-template', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
          },
          body: JSON.stringify({ listingId: listing.$id, hostId }),
        })
        const payload = await response.json().catch(() => ({}))
        if (!response.ok) {
          return void enqueueSnackbar(
            payload?.error ?? 'Template install failed',
            {
              variant: response.status === 402 ? 'warning' : 'error',
              allowDuplicate: true,
            },
          )
        }
        // Installing adds to the template library and publishes nothing
        // (AGL-669), so the message must not imply pages appeared.
        const added = Number(payload.templates ?? 0)
        enqueueSnackbar(
          `Saved ${added} template${added === 1 ? '' : 's'} from ` +
            `"${listing.displayName}" to your library — open Templates to ` +
            'create pages from them.',
          { variant: 'success', persist: false },
        )
        onClose()
      } catch (error) {
        console.error(error)
        enqueueSnackbar('An error has occurred', {
          variant: 'error',
          allowDuplicate: true,
        })
      } finally {
        setInstallingId(null)
        dequeue()
      }
    },
    [installingId, user, hostId, queueLoading, enqueueSnackbar, onClose],
  )

  const handleUse = useCallback(
    (template: StarterTemplate) => async () => {
      const quota = checkOrgQuota(
        org,
        'screensPerHost',
        screenCount + template.screens.length - 1,
      )
      if (!quota.allowed) {
        return void enqueueSnackbar(
          `This template needs ${template.screens.length} screens — your ` +
            `plan allows ${quota.limit}. See Billing to upgrade.`,
          { variant: 'warning', persist: false },
        )
      }
      const dequeue = queueLoading()
      try {
        const used = new Set(existingSlugs)
        for (const screen of template.screens) {
          // Same helper the library's Use flow calls (AGL-672) — one
          // implementation of create-screen → write-version → publish-route,
          // including the slug de-confliction that must not overwrite a
          // live page.
          await createPageFromTemplate(firestore, createHostResource as any, {
            hostId,
            displayName: screen.displayName,
            nodes: screen.nodes as Record<string, unknown>,
            description: screen.description,
            seo: screen.seo,
            slug: screen.slug,
            usedSlugs: used,
          })
        }
        enqueueSnackbar(
          `Added ${template.screens.length} screen${
            template.screens.length === 1 ? '' : 's'
          } from "${template.displayName}"`,
          { variant: 'success', persist: false },
        )
        onClose()
      } catch (error: any) {
        console.error(error)
        enqueueSnackbar(error?.message ?? 'An error has occurred', {
          variant: 'error',
          allowDuplicate: true,
        })
      } finally {
        dequeue()
      }
    },
    [
      org,
      screenCount,
      existingSlugs,
      firestore,
      hostId,
      createHostResource,
      queueLoading,
      enqueueSnackbar,
      onClose,
    ],
  )

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{'Start from a template'}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {'Templates add ready-made, published screens you can restyle in ' +
            'the besigner. Existing screens are never touched.'}
        </Typography>
        {/* Your own library first (AGL-672): saved and installed templates
            are the ones a returning user is looking for, and they open the
            same Use flow as the Templates page rather than a second
            implementation. */}
        {libraryPages.length ? (
          <>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              {'Your templates'}
            </Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {libraryPages.map((template: any) => (
                <Grid key={template.$id} size={{ xs: 12, sm: 6, md: 4 }}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent>
                      <Typography variant="h6">
                        {template.displayName}
                      </Typography>
                      <Chip
                        label={
                          template.source?.type === 'marketplace'
                            ? 'Marketplace'
                            : 'Saved here'
                        }
                        size="small"
                        variant="outlined"
                        sx={{ my: 1 }}
                      />
                      {template.description ? (
                        <Typography variant="body2" color="text.secondary">
                          {template.description}
                        </Typography>
                      ) : null}
                    </CardContent>
                    <CardActions>
                      <Button
                        size="small"
                        variant="contained"
                        color="secondary"
                        onClick={() => setUseTemplate(template)}
                      >
                        {'Use'}
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              {'Starter sites'}
            </Typography>
          </>
        ) : null}
        <Grid container spacing={2}>
          {STARTER_TEMPLATES.map((template) => (
            <Grid key={template.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6">{template.displayName}</Typography>
                  <Chip
                    label={template.category}
                    size="small"
                    variant="outlined"
                    sx={{ my: 1 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {template.description}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    component="div"
                    sx={{ mt: 1 }}
                  >
                    {`${template.screens.length} screen${
                      template.screens.length === 1 ? '' : 's'
                    }`}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    variant="contained"
                    color="secondary"
                    onClick={handleUse(template)}
                  >
                    {'Use template'}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
        {communityTemplates.length ? (
          <>
            <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>
              {'Community templates'}
            </Typography>
            <Grid container spacing={2}>
              {communityTemplates.map((listing: any) => (
                <Grid key={listing.$id} size={{ xs: 12, sm: 6, md: 4 }}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    {listing.previewImageUrl ? (
                      <Box
                        component="img"
                        src={listing.previewImageUrl}
                        alt={`${listing.displayName} preview`}
                        sx={{
                          width: '100%',
                          height: 120,
                          objectFit: 'cover',
                        }}
                      />
                    ) : null}
                    <CardContent>
                      <Typography variant="h6">
                        {listing.displayName}
                      </Typography>
                      {listing.category ? (
                        <Chip
                          label={listing.category}
                          size="small"
                          variant="outlined"
                          sx={{ my: 1 }}
                        />
                      ) : null}
                      <Typography variant="body2" color="text.secondary">
                        {listing.description ?? ''}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        component="div"
                        sx={{ mt: 1 }}
                      >
                        {`${listing.screenCount ?? '?'} screens · v${
                          listing.latestVersion
                        }` +
                          (Number(listing.priceUsd ?? 0) > 0
                            ? ` · $${listing.priceUsd}`
                            : ' · free')}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button
                        size="small"
                        variant="contained"
                        color="secondary"
                        disabled={installingId === listing.$id}
                        onClick={handleInstallTemplate(listing)}
                      >
                        {installingId === listing.$id
                          ? 'Installing…'
                          : 'Use template'}
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </>
        ) : null}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{'Start blank instead'}</Button>
      </DialogActions>
      <UseTemplateDialog
        hostId={hostId}
        template={useTemplate}
        onClose={() => {
          setUseTemplate(null)
          // The gallery's job is done once a page exists; leaving it open
          // over a fresh page invites a second accidental create.
          onClose()
        }}
      />
    </Dialog>
  )
}
TemplateGalleryDialog.displayName = 'TemplateGalleryDialog'

export default TemplateGalleryDialog
