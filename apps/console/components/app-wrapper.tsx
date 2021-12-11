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

import { bundle as muiBundle } from '@aglyn/addons-ui-mui-bundle'
import { initializeApp, registerBundle, registerComponent } from '@aglyn/core-data-framework'
import { aglynElementComponent } from '@aglyn/core-feature-renderer'
import { APP } from '@aglyn/shared-data-brand'
import { consoleThemeLight, withTheme } from '@aglyn/shared-feature-themes'
import {
  makeLinkElements,
  MakeLinkElementsConfig,
  makeMetaElements,
  MakeMetaElementsConfig,
} from '@aglyn/shared-ui-jsx'
import CssBaseline from '@mui/material/CssBaseline'
import Head from 'next/head'
import { Fragment, useEffect } from 'react'
import { samplePageData } from '../constants/sample-data'


const c1 = aglynElementComponent(
  {
    componentId: 'root',
    metadata: {
      displayName: 'Root Element',
      title: 'Root element',
    },
  },
  'span',
)

const c2 = aglynElementComponent(
  {
    componentId: 'root1',
    metadata: {
      displayName: 'Root Element',
      title: 'Root element',
    },
  },
  'span',
)

const c3 = aglynElementComponent(
  {
    componentId: 'root2',
    metadata: {
      displayName: 'Root Element',
      title: 'Root element',
    },
  },
  'span',
)

const c4 = aglynElementComponent(
  {
    componentId: 'root3',
    metadata: {
      displayName: 'Root Element',
      title: 'Root element',
    },
  },
  'span',
)

const c5 = aglynElementComponent(
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
catch (e) {
  console.error(e, 'initialize aglyn app')
}

const metaElements: MakeMetaElementsConfig = [
  ['viewport', 'width=device-width, initial-scale=1'],
  ['description', APP.META_DESCRIPTION],
]
const linkElements: MakeLinkElementsConfig = []

function AppWrapperRaw(props) {
  const {children} = props
  const Wrapper = APP.IS_PRODUCTION ? Fragment : Fragment // StrictMode

  useEffect(() => {
    // Remove the server-side injected CSS.
    const jssStyles = document.querySelector('#jss-server-side')
    if (jssStyles) jssStyles.parentElement.removeChild(jssStyles)
  }, [])

  return (
    <Wrapper>
      <Head>
        <title>{APP.META_TITLE}</title>
        {makeMetaElements(metaElements)}
        {makeLinkElements(linkElements)}
      </Head>
      <CssBaseline />
      <div className="app">
        <main>{children}</main>
      </div>
    </Wrapper>
  )
}
AppWrapperRaw.displayName = 'AppWrapper'
const AppWrapper = withTheme({theme: consoleThemeLight})(AppWrapperRaw)
export default AppWrapper
