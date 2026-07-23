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

import {
  EMAIL_NODE_ROOT_ID,
  renderEmailHtml,
  substituteMergeTokens,
} from './email-render'
import {
  getTenantEmail,
  isTenantEmailEditable,
  TENANT_EMAIL_COLLECTION,
  type TenantEmailEntry,
} from './tenant-email-catalog'

/**
 * The slice of the Admin Firestore chain this resolver uses. Structural on
 * purpose (AGL-770): the plugins that call this already hold an Admin
 * Firestore instance, so passing it in keeps `@aglyn/shared-util-email` free
 * of a firebase-admin dependency and importable from every send site.
 */
interface AdminDocSnapshotLike {
  exists: boolean
  get(field: string): unknown
}
interface AdminDocRefLike {
  get(): Promise<AdminDocSnapshotLike>
  collection(path: string): AdminCollectionRefLike
}
interface AdminCollectionRefLike {
  doc(id: string): AdminDocRefLike
}
export interface AdminFirestoreLike {
  collection(path: string): AdminCollectionRefLike
}

export interface RenderedHostEmail {
  subject: string
  html: string
  text: string
}

/**
 * A site-owner-designed template loaded once, ready to render for any number
 * of recipients without another Firestore read (AGL-770) — the booking
 * reminder job renders one per booking.
 */
export interface LoadedHostEmail {
  entry: TenantEmailEntry
  nodes: Record<string, unknown>
  subjectTemplate: string
  preheaderTemplate: string
}

/** Blanks any `{{token}}` the caller did not supply, so a customer never
 * sees a raw tag. Mirrors the platform system-email resolver. */
function blankUnresolvedTokens(value: string): string {
  return value.replace(/\{\{[^}]*\}\}/g, '')
}

/**
 * Loads a site's published email template — ONE Firestore read — or `null`
 * when there is nothing usable (no document, no published version, an empty
 * node map, an unknown or non-designable key). The host-scoped mirror of the
 * platform `loadSystemEmail`: `hosts/{hostId}/emailTemplates/{key}`.
 *
 * The caller passes its own Admin Firestore, so this reads through the Admin
 * SDK — the send path runs as the server, not a signed-in user.
 */
export async function loadHostEmail(
  firestore: AdminFirestoreLike,
  hostId: string,
  templateKey: string,
): Promise<LoadedHostEmail | null> {
  const entry = getTenantEmail(templateKey)
  if (!entry || !isTenantEmailEditable(entry)) return null
  if (!hostId) return null

  try {
    const templateRef = firestore
      .collection('hosts')
      .doc(hostId)
      .collection(TENANT_EMAIL_COLLECTION)
      .doc(templateKey)
    const templateSnapshot = await templateRef.get()
    if (!templateSnapshot.exists) return null

    const versionId = templateSnapshot.get('versionId')
    if (!versionId) return null

    const versionSnapshot = await templateRef
      .collection('versions')
      .doc(String(versionId))
      .get()
    const nodes = versionSnapshot.get('nodes') as
      | Record<string, unknown>
      | undefined
    if (!nodes || !Object.keys(nodes).length) return null

    return {
      entry,
      nodes,
      subjectTemplate:
        String(templateSnapshot.get('subject') ?? '') ||
        entry.defaultSubject ||
        '',
      preheaderTemplate: String(templateSnapshot.get('preheader') ?? ''),
    }
  } catch (error) {
    // Never let a template problem block the send — the caller falls back to
    // its built-in copy and the customer still gets their email.
    console.error(`host email template ${templateKey} failed to load`, error)
    return null
  }
}

/**
 * Renders a pre-loaded template for one recipient's merge values (AGL-770).
 * No Firestore access; returns `null` if the node map renders empty so the
 * caller still falls back to its built-in copy.
 */
export function renderLoadedHostEmail(
  loaded: LoadedHostEmail,
  merge: Record<string, string> = {},
): RenderedHostEmail | null {
  const rendered = renderEmailHtml({
    nodes: loaded.nodes as never,
    // Besigner maps are rooted at '_@_' (AGL-765).
    rootId: EMAIL_NODE_ROOT_ID,
    subject: substituteMergeTokens(loaded.subjectTemplate, merge),
    preheader: substituteMergeTokens(loaded.preheaderTemplate, merge),
    merge,
  })
  if (!rendered?.html) return null
  return {
    subject: blankUnresolvedTokens(
      substituteMergeTokens(loaded.subjectTemplate, merge),
    ),
    html: blankUnresolvedTokens(rendered.html),
    text: blankUnresolvedTokens(rendered.text ?? ''),
  }
}

/**
 * Renders a site's designed email, or `null` when nothing usable is published
 * so the send site keeps its built-in copy (AGL-770). Single-recipient
 * convenience over {@link loadHostEmail} + {@link renderLoadedHostEmail}; a
 * batch should call those two so it reads the template once.
 */
export async function renderHostEmail(
  firestore: AdminFirestoreLike,
  hostId: string,
  templateKey: string,
  merge: Record<string, string> = {},
): Promise<RenderedHostEmail | null> {
  const loaded = await loadHostEmail(firestore, hostId, templateKey)
  return loaded ? renderLoadedHostEmail(loaded, merge) : null
}
