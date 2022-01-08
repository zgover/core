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

import {bundle as muiBundle} from '@aglyn/addons-ui-mui-bundle'
import {initializeBesignerApp} from '@aglyn/core-data-besigner'
import {doesAppExist, registerBundle, registerComponent} from '@aglyn/core-data-framework'
import {createAglynComponent} from '@aglyn/core-feature-renderer'
import {APP_CONSOLE, IS_PRODUCTION} from '@aglyn/shared-data-brand'
import {type MakeLinkElementsConfig, type MakeMetaElementsConfig} from '@aglyn/shared-ui-jsx'
import {NextEmotionAppComponent, type NextEmotionAppComponentProps} from '@aglyn/shared-ui-next'
import {Fragment, useMemo} from 'react'
import {samplePageData} from '../constants/sample-data'


export interface _AppProps<Props, InitialProps> extends NextEmotionAppComponentProps<Props, InitialProps> {}

function _App<Props, InitialProps>(props: _AppProps<Props, InitialProps>) {
  const {NextAppWrapperProps, ...rest} = props
  const {
    metaElements: wrapperMetaElements,
    linkElements: wrapperLinkElements,
    headChildren: wrapperHeadChildren,
    documentTitle: wrapperDocumentTitle,
    ...nextAppWrapperProps
  } = NextAppWrapperProps || {}
  const documentTitle = useMemo(() => (
    wrapperDocumentTitle || APP_CONSOLE.META_TITLE
  ), [wrapperDocumentTitle])
  const headChildren = useMemo(() => (
    <Fragment>
      {!IS_PRODUCTION ? null : (
        <Fragment>
        </Fragment>
      )}
      {wrapperHeadChildren}
    </Fragment>
  ), [wrapperHeadChildren])
  const metaElements: MakeMetaElementsConfig = useMemo(() => ([
    ['viewport', 'width=device-width, initial-scale=1'],
    ['description', APP_CONSOLE.META_DESCRIPTION],
    ...wrapperMetaElements || [],
  ]), [wrapperMetaElements])
  const linkElements: MakeLinkElementsConfig = useMemo(() => ([
    ...wrapperLinkElements || [],
  ]), [wrapperLinkElements])


  return (
    <NextEmotionAppComponent
      NextAppWrapperProps={{
        documentTitle,
        headChildren,
        metaElements,
        linkElements,
        ...nextAppWrapperProps,
      }}
      {...rest}
    />
  )
}
_App.displayName = '_App'
export default _App


const c1 = createAglynComponent(
  {
    componentId: 'root',
    displayName: 'Root Element',
    title: 'Root element',
  },
  'span',
)

const c2 = createAglynComponent(
  {
    componentId: 'root1',
    displayName: 'Root Element',
    title: 'Root element',
  },
  'span',
)

const c3 = createAglynComponent(
  {
    componentId: 'root2',
    displayName: 'Root Element',
    title: 'Root element',
  },
  'span',
)

const c4 = createAglynComponent(
  {
    componentId: 'root3',
    displayName: 'Root Element',
    title: 'Root element',
  },
  'span',
)

const c5 = createAglynComponent(
  {
    componentId: 'root4',
    displayName: 'Root Element',
    title: 'Root element',
    templates: [
      {
        id: 'root4:1',
        label: 'Root 4',
        data: {
          componentId: 'root4',
          props: {
            children: 'First Root4',
          },
        },
      },
    ],
  },
  'span',
)
const components = [c1, c2, c3, c4, c5]

try {
  if (!doesAppExist()) {
    const app = initializeBesignerApp({
      logLevel: 'debug',
      modulesOptions: {
        canvas: {
          initialElements: samplePageData,
        },
      },
    })


    components.forEach((i) => registerComponent(app, i))
    registerBundle(app, muiBundle)
  }
}
catch (e) {
  console.error(e, 'initialize aglyn app')
}
