/**
 * @license
 * Copyright 2022 Aglyn LLC
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

import * as Aglyn from '@aglyn/aglyn'
import {
  PropertiesDialogComponent,
  useAddElementDrawerCallback,
  useAglynCanvasHistoryControls,
  useBesignerAppContext,
  withBesignerContext,
  type WorkspaceEditorComponentProps,
} from '@aglyn/besigner-feature-app'
import { getApp, setCanvasElements } from '@aglyn/core-data-app'
import { useAglynCanvasElementsNormalized } from '@aglyn/core-feature-renderer'
// import '@aglyn/foundation-feature-singleton'
import {
  HAS_BROWSER,
  ICON_VARIANT_APP_SETTINGS,
  ICON_VARIANT_MODIFY_ADD,
  ICON_VARIANT_SYMBOL_CONFIRMED,
} from '@aglyn/shared-data-enums'
import {
  AppLink,
  LOADING_OVERLAY_ELEMENT,
  useLoading,
} from '@aglyn/shared-ui-jsx'
import { NextPageTitle } from '@aglyn/shared-ui-next'
import { useSnackbar } from '@aglyn/shared-ui-snackstack'
import { useScreenVersion } from '@aglyn/tenant-feature-instance'
import { Stack, Typography } from '@mui/material'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useState } from 'react'
import BesignerAppBarComponent from '../../../../../../../components/besigner-app-bar.component'
import AuthenticatedLayout from '../../../../../../../components/layouts/authenticated.layout'
import MainLayout from '../../../../../../../components/layouts/main.layout'
import '../../../../../../../constants/app-setup'
import { buildRoute, Route } from '../../../../../../../constants/route-links'

const WorkspaceEditorComponent = dynamic<WorkspaceEditorComponentProps>(
  () =>
    import('@aglyn/besigner-feature-app').then(
      (mod) => mod.WorkspaceEditorComponent,
    ),
  { ssr: false, loading: () => LOADING_OVERLAY_ELEMENT },
)
const ViewportRootComponent = dynamic<WorkspaceEditorComponentProps>(
  () =>
    import('@aglyn/besigner-feature-app').then(
      (mod) => mod.ViewportRootComponent,
    ),
  { ssr: false, loading: () => LOADING_OVERLAY_ELEMENT },
)
const ViewportCanvasComponent = dynamic<WorkspaceEditorComponentProps>(
  () =>
    import('@aglyn/besigner-feature-app').then(
      (mod) => mod.ViewportCanvasComponent,
    ),
  { ssr: false, loading: () => LOADING_OVERLAY_ELEMENT },
)

function Besigner(props) {
  const { query } = useRouter()
  const { enqueueSnackbar } = useSnackbar()
  const { queueLoading } = useLoading()
  const app = useBesignerAppContext()
  const hostId = `${query.hostId}`
  const screenId = `${query.screenId}`
  const versionId = `${query.versionId}`
  const saveAvailable = true
  const [screenDialog, setScreenDialog] = useState(false)
  const handleAddElementClick = useAddElementDrawerCallback()
  const [undo, redo, canUndo, canRedo] = useAglynCanvasHistoryControls()
  const detailUrl = buildRoute(Route.SCREEN_DETAILS, { screenId, versionId })
  const normalized = useAglynCanvasElementsNormalized()
  const [result, updateScreen] = useScreenVersion({
    hostId,
    screenId,
    versionId,
  })
  const { data, status, error } = result
  const elements = data?.nodes
  const hasError = status === 'error'
  const notFound = status === 'success' && !data

  console.log('result', result)

  useEffect(() => {
    if (HAS_BROWSER()) {
      console.log('page:/besigner app', getApp())
    }
  }, [])

  useEffect(() => {
    if (HAS_BROWSER()) {
      console.log('Besigner props.tenant,', props.tenant, props)
      console.log('Besigner status screen,', status, data)
    }
  }, [props, data, status])

  useEffect(() => {
    if (hasError) {
      enqueueSnackbar(`Error: ${error?.message}`, {
        variant: 'error',
        allowDuplicate: true,
      })
    } else if (notFound) {
      enqueueSnackbar('404: Screen not found', {
        variant: 'error',
        allowDuplicate: true,
      })
    }
  }, [enqueueSnackbar, hasError, error, notFound])

  useEffect(() => {
    if (elements) {
      console.log('decoded update', elements)
      setCanvasElements(app, { elements, type: 'denormal' })
    }
  }, [app, elements])

  const handleSave = useCallback(async () => {
    const dequeueLoading = queueLoading()
    const nodes = normalized
    const isNested = Array.isArray(nodes)
    const denormalized = !isNested
      ? Aglyn.screen.denormalizeNodes(
          [
            {
              $id: Aglyn.NODE_ROOT_ID,
              componentId: 'div',
              nodes: [
                { ...Aglyn.screen.nestNodes(nodes, nodes[Aglyn.NODE_ROOT_ID]) },
              ],
            },
          ],
          null,
        )
      : Aglyn.screen.denormalizeNodes(
          [
            {
              $id: Aglyn.NODE_ROOT_ID,
              componentId: 'div',
              nodes: [...nodes],
            },
          ],
          null,
        )

    console.log('denormalized', isNested, denormalized)
    console.log(
      'nested',
      Aglyn.screen.nestNodes(denormalized, denormalized[Aglyn.NODE_ROOT_ID]),
    )
    // dequeueLoading()

    // return
    await updateScreen({ nodes: denormalized }, { merge: true })
      .catch((e) => {
        enqueueSnackbar(`Error: ${JSON.stringify(e)}`, {
          variant: 'error',
          allowDuplicate: true,
        })
      })
      .finally(() => {
        dequeueLoading()
      })
  }, [updateScreen, enqueueSnackbar, normalized, queueLoading])

  return (
    <>
      <MainLayout
        title={'Besigner'}
        disableAppBarElevation
        // besigner={true}
        // appBarSuffix={'Besigner'}
        backButton={
          {
            component: AppLink,
            componentVariant: 'naked',
            href: detailUrl,
          } as any
        }
        centerNavigationItems={[
          // {
          //   id: 'center-nav-site-picker',
          //   children: ,
          // },
          {
            id: 'center-nav-file',
            children: 'File',
            // href: '/besigner',
            items: [
              {
                id: 'center-nav-file-save',
                icon: saveAvailable
                  ? undefined
                  : {
                      path: ICON_VARIANT_SYMBOL_CONFIRMED.path,
                    },
                children: saveAvailable ? 'Save' : 'Up to Date',
                onClick: handleSave,
                ListItemTextProps: { inset: Boolean(saveAvailable) },
              },
              {
                id: 'center-nav-file-close',
                children: 'Close',
                href: detailUrl,
                component: AppLink,
                componentVariant: 'naked',
                ListItemTextProps: { inset: true },
              },
              {
                type: 'divider',
              },
              {
                id: 'center-nav-file-new-version',
                children: (
                  <Typography component="div">
                    {'New Version'}{' '}
                    <Typography variant="caption" component="sup">
                      {'Coming Soon'}
                    </Typography>
                  </Typography>
                ),
                onClick: handleAddElementClick,
                disabled: true,
                ListItemTextProps: { inset: true },
              },
              {
                type: 'divider',
              },
              {
                id: 'center-nav-edit-properties',
                icon: {
                  path: ICON_VARIANT_APP_SETTINGS.path,
                },
                children: 'Screen Properties',
                onClick: () => setScreenDialog(true),
              },
            ],
          },
          {
            id: 'center-nav-edit',
            children: 'Edit',
            // href: '/besigner',
            items: [
              {
                id: 'center-nav-edit-undo',
                children: 'Undo',
                onClick: () => undo(),
                disabled: !canUndo,
                ListItemTextProps: { inset: true },
              },
              {
                id: 'center-nav-edit-redo',
                children: 'Redo',
                onClick: () => redo(),
                disabled: !canRedo,
                ListItemTextProps: { inset: true },
              },
            ],
          },
          {
            id: 'center-nav-insert',
            children: 'Insert',
            // href: '/besigner',
            items: [
              {
                id: 'center-nav-insert-element',
                icon: {
                  path: ICON_VARIANT_MODIFY_ADD.path,
                },
                children: 'New Element',
                onClick: handleAddElementClick,
              },
            ],
          },
        ]}
      >
        <NextPageTitle screen={'Besigner'} />

        {error || notFound ? (
          <Stack alignItems="center" justifyContent="center">
            <Typography>{'Not found'}</Typography>
          </Stack>
        ) : status === 'loading' ? (
          LOADING_OVERLAY_ELEMENT
        ) : (
          <>
            <BesignerAppBarComponent
              detailsUrl={detailUrl}
              onSave={handleSave}
              onPropertiesEdit={() => setScreenDialog(true)}
              saveAvailable
            />
            <WorkspaceEditorComponent>
              <ViewportRootComponent>
                <ViewportCanvasComponent />
              </ViewportRootComponent>
            </WorkspaceEditorComponent>
          </>
        )}
      </MainLayout>
      <PropertiesDialogComponent
        open={screenDialog}
        onClose={() => {
          setScreenDialog(false)
        }}
        onActionClick={async () => {
          await handleSave()
          setScreenDialog(false)
        }}
      />
    </>
  )
}

Besigner.displayName = 'Page:Besigner'
Besigner.layouts = [{ Component: AuthenticatedLayout }]

export default withBesignerContext(Besigner)

// export const getServerSideProps = async (ctx) => {
//   // await setAdminTenant({$id: '-atN0g5dZgoDp4rfMaO_', displayName: 'sample tenant', hosts: []})
//   console.log('Page:Besigner getStaticProps START')
//   const tenantId = '-atN0g5dZgoDp4rfMaO_'
//   const tenant = await getAdminTenant(tenantId)
//     .then((snapshot) => {
//       if (snapshot.exists()) {
//         console.log('getAdminTenant exists', tenantId, snapshot.val())
//         console.log(snapshot.val())
//         return snapshot.val()
//       }
//       else {
//         console.log('getAdminTenant No data available', tenantId)
//         return null
//       }
//     }).catch((error) => {
//       console.error(`getAdminTenant error`, tenantId, error)
//       return null
//     })
//   console.log('Page:Besigner getStaticProps AWAIT DONE', tenant)
//
//
//   if (!tenant && ctx) {
//     console.log('Page:Besigner WRITE START')
//     // await setAdminTenant({$id: '-atN0g5dZgoDp4rfMaO_', displayName: 'test fake tenant'})
//     // tenant = await getServerSideProps(null).then((data) => data.props.tenant)
//     console.log('Page:Besigner WRITE DONE', tenant)
//   }
//
//   return {
//     props: {
//       tenant,
//     },
//   }
// }
