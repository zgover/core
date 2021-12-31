/**
 * @license
 * Copyright 2021 Aglyn LLC
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
import {
  doesAppExist,
  initializeApp,
  registerBundle,
  registerComponent,
} from '@aglyn/core-data-framework'
import {createAglynComponent} from '@aglyn/core-feature-renderer'
import {APP_WWW} from '@aglyn/shared-data-brand'
import {
  AppLoaderProviderComponent,
  type MakeLinkElementsConfig,
  type MakeMetaElementsConfig,
} from '@aglyn/shared-ui-jsx'
import {NextEmotionAppComponent, type NextEmotionAppComponentProps} from '@aglyn/shared-ui-next'
import {samplePageData} from '../constants/sample-data'


export interface _AppProps<Props, InitialProps> extends NextEmotionAppComponentProps<Props, InitialProps> {}

function _App<Props, InitialProps>(props: _AppProps<Props, InitialProps>) {
  const {NextAppWrapperProps, ...rest} = props
  const metaElements: MakeMetaElementsConfig = [
    ['viewport', 'width=device-width, initial-scale=1'],
    ['description', APP_WWW.META_DESCRIPTION],
    ...NextAppWrapperProps?.metaElements || [],
  ]
  const linkElements: MakeLinkElementsConfig = [
    ...NextAppWrapperProps?.linkElements || [],
  ]
  return (
    <NextEmotionAppComponent
      NextAppWrapperProps={{
        documentTitle: APP_WWW.META_TITLE,
        ...NextAppWrapperProps,
        metaElements,
        linkElements,
        mainWrapper: AppLoaderProviderComponent,
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
    metadata: {
      displayName: 'Root Element',
      title: 'Root element',
    },
  },
  'span',
)

const c2 = createAglynComponent(
  {
    componentId: 'root1',
    metadata: {
      displayName: 'Root Element',
      title: 'Root element',
    },
  },
  'span',
)

const c3 = createAglynComponent(
  {
    componentId: 'root2',
    metadata: {
      displayName: 'Root Element',
      title: 'Root element',
    },
  },
  'span',
)

const c4 = createAglynComponent(
  {
    componentId: 'root3',
    metadata: {
      displayName: 'Root Element',
      title: 'Root element',
    },
  },
  'span',
)

const c5 = createAglynComponent(
  {
    componentId: 'root4',
    metadata: {
      displayName: 'Root Element',
      title: 'Root element',
    },
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
    const app = initializeApp({
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
