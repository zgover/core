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

// eslint-disable-next-line @nrwl/nx/enforce-module-boundaries
import { CacheProvider, createEmotionCache, type EmotionCache } from '@aglyn/shared-ui-theme'
import type { ReactNode } from 'react'

// Client-side cache, shared for the whole session of the user in the browser.
const clientSideEmotionCache = createEmotionCache()

export interface NextEmotionAppComponentProps {
  emotionCache?: EmotionCache
  children?: ReactNode
}

/**
 * Next.js custom _app.jsx with cached emotion styles
 *
 * App component manages mounting and hydration for the client app at the
 * Next.JS app entry point, removes server styles additionally responsible for
 * rendering every page Component
 *
 * # Resolution order
 * __Server-side__
 *
 * 1. (if-exists) getInitialProps _app.tsx {@link NextEmotionAppComponent.getInitialProps}
 * 2. (if-exists) getInitialProps page {@link NextPageWithLayout.getInitialProps}
 * 3. getInitialProps _document.tsx {@link _EmotionDocumentComponent.getInitialProps}
 * 4. render _app.tsx {@link NextEmotionAppComponent.render}
 * 5. render page {@link NextPageWithLayout.render}
 * 6. render _document.tsx {@link _EmotionDocumentComponent.render}
 *
 * __Server-side (w/ error)__
 *
 * 1. (if-exists) getInitialProps _document.tsx {@link _EmotionDocumentComponent.getInitialProps}
 * 2. render _app.tsx {@link NextEmotionAppComponent.render}
 * 3. render page {@link NextPageWithLayout.render}
 * 4. render _document.tsx {@link _EmotionDocumentComponent.render}
 *
 * __Client-side__
 * 1. (if-exists) getInitialProps _app.tsx {@link NextEmotionAppComponent.getInitialProps}
 * 2. (if-exists) getInitialProps page {@link NextPageWithLayout.getInitialProps}
 * 3. render _app.tsx {@link NextEmotionAppComponent.render}
 * 4. render page {@link NextPageWithLayout.render}
 *
 * @see {@link _EmotionDocumentComponent}
 */
function NextEmotionAppComponent(props: NextEmotionAppComponentProps) {
  const { emotionCache = clientSideEmotionCache, children } = props

  return <CacheProvider value={emotionCache}>{children}</CacheProvider>
}
NextEmotionAppComponent.displayName = 'NextEmotionAppComponent'
NextEmotionAppComponent.aglyn = true

export { NextEmotionAppComponent }
export default NextEmotionAppComponent
