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

import { firebaseAdmin } from '@aglyn/tenant-data-admin'

export interface CollectionEntrySummary {
  $id: string
  title: string
  slug: string
  excerpt?: string
  body?: string
  publishedAt?: { seconds: number } | null
}

export interface CollectionContent {
  collection: { $id: string; displayName: string; slug: string } | null
  entries: CollectionEntrySummary[]
  entry: CollectionEntrySummary | null
  error: unknown
}

/**
 * Resolves a non-screen path against the host's content collections
 * (Content Collections & Blog): `/{collectionSlug}` returns the published
 * entry list, `/{collectionSlug}/{entrySlug}` one entry. Fail-open — errors
 * resolve to `collection: null` and the caller 404s.
 */
export async function getCollectionContent(options: {
  hostId: string
  collectionSlug: string
  entrySlug?: string
}): Promise<CollectionContent> {
  const { hostId, collectionSlug, entrySlug } = options
  const data: CollectionContent = {
    collection: null,
    entries: [],
    entry: null,
    error: null,
  }
  try {
    const firestore = firebaseAdmin.app().firestore()
    const collectionQuery = await firestore
      .collection('hosts')
      .doc(hostId)
      .collection('collections')
      .where('slug', '==', collectionSlug)
      .limit(1)
      .get()
    const collectionDoc = collectionQuery.docs[0]
    if (!collectionDoc) return data
    data.collection = {
      $id: collectionDoc.id,
      displayName: collectionDoc.get('displayName') ?? collectionSlug,
      slug: collectionSlug,
    }

    const entriesRef = collectionDoc.ref.collection('entries')
    if (entrySlug) {
      const entryQuery = await entriesRef
        .where('slug', '==', entrySlug)
        .where('status', '==', 'published')
        .limit(1)
        .get()
      const entryDoc = entryQuery.docs[0]
      if (entryDoc) {
        const value = entryDoc.data()
        data.entry = {
          $id: entryDoc.id,
          title: value['title'] ?? entrySlug,
          slug: entrySlug,
          excerpt: value['excerpt'] ?? '',
          body: value['body'] ?? '',
          publishedAt: value['publishedAt']
            ? { seconds: value['publishedAt'].seconds }
            : null,
        }
      }
      return data
    }

    // No orderBy: entries missing publishedAt would be dropped by Firestore;
    // sort client-side like the version lists.
    const entriesQuery = await entriesRef
      .where('status', '==', 'published')
      .limit(100)
      .get()
    data.entries = entriesQuery.docs
      .map((entryDoc) => {
        const value = entryDoc.data()
        return {
          $id: entryDoc.id,
          title: value['title'] ?? entryDoc.id,
          slug: value['slug'] ?? entryDoc.id,
          excerpt: value['excerpt'] ?? '',
          publishedAt: value['publishedAt']
            ? { seconds: value['publishedAt'].seconds }
            : null,
        }
      })
      .sort(
        (a, b) => (b.publishedAt?.seconds ?? 0) - (a.publishedAt?.seconds ?? 0),
      )
  } catch (error) {
    console.error(error)
    data.error = error
  }
  return data
}

export default getCollectionContent
