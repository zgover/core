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

import { type FirebaseOptions } from 'firebase/app'

export const RECAPTCHA_API_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_PUBLIC_KEY
export const FIREBASE_CLIENT_APP_NAME = 'DEFAULT_AGLYN'

/**
 * On deployed workspace hosts the OAuth handshake is funnelled through one
 * dedicated same-site auth origin — `auth.<workspaceDomain>` (e.g.
 * auth.aglyn.io), which reverse-proxies the Firebase auth helpers under
 * /__/* (console next.config rewrite, AGL-462). This keeps the handshake
 * same-site (all *.aglyn.io share the aglyn.io eTLD+1, so browser storage
 * partitioning — which severed the cross-origin *.firebaseapp.com
 * authDomain and broke mobile Google sign-in — never applies), while
 * every host, including dynamically-provisioned {org}.aglyn.io
 * workspaces, presents the SAME redirect URI. Google OAuth forbids
 * wildcard redirect URIs, so a per-host authDomain would need a new
 * registration per org; the single auth host needs exactly one.
 *
 * The host derives from NEXT_PUBLIC_WORKSPACE_DOMAIN so it tracks the
 * deployment automatically; NEXT_PUBLIC_FIREBASE_AUTH_HANDLER_HOST
 * overrides it outright. Localhost, preview URLs (not on the workspace
 * domain), and the emulator keep the configured *.firebaseapp.com domain.
 */
function resolveFirebaseAuthDomain(): string | undefined {
  const configured = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
  if (typeof window === 'undefined') return configured
  if (process.env['FIREBASE_AUTH_EMULATOR_ENABLED'] === 'true') {
    return configured
  }
  const workspaceDomain = process.env.NEXT_PUBLIC_WORKSPACE_DOMAIN ?? 'aglyn.io'
  const { hostname } = window.location
  const onWorkspaceDomain =
    hostname === workspaceDomain || hostname.endsWith(`.${workspaceDomain}`)
  if (!onWorkspaceDomain) return configured
  return (
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_HANDLER_HOST ?? `auth.${workspaceDomain}`
  )
}

/**
 * Firebase client-side configuration assembled directly from NEXT_PUBLIC_*
 * environment variables so that Next.js webpack DefinePlugin substitutes
 * them at build time and no intermediate constant indirection can carry a
 * stale undefined value across a cached compilation.
 */
export const fbClientAppOptions: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_PUBLIC_API_KEY,
  authDomain: resolveFirebaseAuthDomain(),
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

// export let fbClientApp: FirebaseApp
//
// try {
//   fbClientApp = getApp(FIREBASE_CLIENT_APP_NAME)
// }
// catch {
//   fbClientApp = initializeApp(fbClientAppOptions, {
//     name: FIREBASE_CLIENT_APP_NAME,
//     automaticDataCollectionEnabled: true,
//   })
// }
//
// export default fbClientApp
