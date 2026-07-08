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

import { checkEntitlement } from '@aglyn/aglyn'
import { firebaseAdmin } from '@aglyn/tenant-data-admin'
import type { NextApiRequest, NextApiResponse } from 'next'
import {
  EXPORT_COLLECTION_LIMITS,
  EXPORTABLE_HOST_FIELDS,
  SITE_EXPORT_FORMAT,
  SITE_EXPORT_VERSION,
} from './export'

// Bundles are JSON text; 20MB covers the export caps comfortably.
export const config = { api: { bodyParser: { sizeLimit: '20mb' } } }

/** Firestore rejects `undefined`; timestamps re-mint on import. */
function cleanDoc(input: Record<string, unknown>): Record<string, unknown> {
  // Destructure-to-drop: ids/children re-key explicitly, timestamps re-mint.
  const {
    $id: _id,
    version: _version,
    entries: _entries,
    records: _records,
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    ...rest
  } = input as any
  const clean: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(rest)) {
    if (value !== undefined) clean[key] = value
  }
  clean['updatedAt'] = firebaseAdmin.firestore.FieldValue.serverTimestamp()
  return clean
}

/**
 * Whole-site restore/import (AGL-163): writes an export bundle into the
 * target host — additive-by-id (docs keep their export ids, so the
 * routing map, screen links, and layout references keep resolving; a
 * restore into the source host is an exact overwrite). Host identity
 * (subdomain/admins/tenant/domain) never changes; PII collections aren't
 * in bundles by design. Pro+ (`siteExport` flag), host-admin only.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  const hostId = String(req.body?.hostId ?? '')
  const bundle = req.body?.bundle
  if (!hostId || typeof bundle !== 'object' || bundle === null) {
    return res.status(400).json({ error: 'Missing hostId or bundle' })
  }
  if (
    bundle.format !== SITE_EXPORT_FORMAT ||
    Number(bundle.version) > SITE_EXPORT_VERSION
  ) {
    return res.status(422).json({
      error: 'Not an Aglyn site export (or a newer format than this build)',
    })
  }

  const authorization = req.headers.authorization ?? ''
  const idToken = authorization.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length)
    : undefined
  if (!idToken) return res.status(401).json({ error: 'Unauthenticated' })

  try {
    const decoded = await firebaseAdmin.app().auth().verifyIdToken(idToken)
    const firestore = firebaseAdmin.app().firestore()
    const hostRef = firestore.collection('hosts').doc(hostId)
    const hostSnapshot = await hostRef.get()
    if (!hostSnapshot.exists) {
      return res.status(404).json({ error: 'Unknown host' })
    }
    const admins = hostSnapshot.get('admins') ?? {}
    if (!admins[decoded.uid]) {
      return res.status(403).json({ error: 'Not a host admin' })
    }
    const tenantId = hostSnapshot.get('tenantId') as string | undefined
    if (tenantId) {
      const tenantSnapshot = await firestore
        .collection('tenants')
        .doc(tenantId)
        .get()
      const tenant = tenantSnapshot.exists ? tenantSnapshot.data() : undefined
      if (tenant?.['plan'] && !checkEntitlement(tenant as any, 'siteExport')) {
        return res
          .status(403)
          .json({ error: 'Site restore requires a Pro plan' })
      }
    }

    let written = 0
    // Firestore batches cap at 500 writes; chunk conservatively.
    let batch = firestore.batch()
    let batched = 0
    const commit = async () => {
      if (batched > 0) await batch.commit()
      batch = firestore.batch()
      batched = 0
    }
    const write = async (
      ref: FirebaseFirestore.DocumentReference,
      data: Record<string, unknown>,
    ) => {
      batch.set(ref, data, { merge: false })
      written += 1
      if ((batched += 1) >= 400) await commit()
    }

    // Host settings — exportable fields only.
    const hostPatch: Record<string, unknown> = {}
    for (const field of EXPORTABLE_HOST_FIELDS) {
      if (bundle.host?.[field] !== undefined) {
        hostPatch[field] = bundle.host[field]
      }
    }
    if (Object.keys(hostPatch).length) {
      batch.set(hostRef, hostPatch, { merge: true })
      batched += 1
    }

    const importPlain = async (name: string) => {
      const items: any[] = Array.isArray(bundle[name]) ? bundle[name] : []
      for (const item of items.slice(
        0,
        EXPORT_COLLECTION_LIMITS[name] ?? 100,
      )) {
        if (!item?.$id) continue
        await write(
          hostRef.collection(name).doc(String(item.$id)),
          cleanDoc(item),
        )
      }
    }

    // Screens/layouts restore the doc plus its published version.
    const importVersioned = async (name: 'screens' | 'layouts') => {
      const items: any[] = Array.isArray(bundle[name]) ? bundle[name] : []
      for (const item of items.slice(0, EXPORT_COLLECTION_LIMITS[name])) {
        if (!item?.$id) continue
        const docRef = hostRef.collection(name).doc(String(item.$id))
        await write(docRef, cleanDoc(item))
        if (item.version?.$id) {
          await write(
            docRef.collection('versions').doc(String(item.version.$id)),
            cleanDoc(item.version),
          )
        }
      }
    }

    const importCollections = async () => {
      const items: any[] = Array.isArray(bundle.collections)
        ? bundle.collections
        : []
      for (const item of items.slice(0, 20)) {
        if (!item?.$id) continue
        const docRef = hostRef.collection('collections').doc(String(item.$id))
        await write(docRef, cleanDoc(item))
        const entries: any[] = Array.isArray(item.entries) ? item.entries : []
        for (const entry of entries.slice(0, 200)) {
          if (!entry?.$id) continue
          await write(
            docRef.collection('entries').doc(String(entry.$id)),
            cleanDoc(entry),
          )
        }
      }
    }

    const importDatasets = async () => {
      const items: any[] = Array.isArray(bundle.datasets)
        ? bundle.datasets
        : []
      for (const item of items.slice(0, 50)) {
        if (!item?.$id) continue
        const docRef = hostRef.collection('datasets').doc(String(item.$id))
        await write(docRef, cleanDoc(item))
        const records: any[] = Array.isArray(item.records) ? item.records : []
        for (const record of records.slice(0, 1000)) {
          if (!record?.$id) continue
          await write(
            docRef.collection('records').doc(String(record.$id)),
            cleanDoc(record),
          )
        }
      }
    }

    await importVersioned('screens')
    await importVersioned('layouts')
    await importPlain('components')
    await importPlain('variables')
    await importPlain('functions')
    await importPlain('workflows')
    await importPlain('actions')
    await importPlain('services')
    await importPlain('media')
    await importCollections()
    await importDatasets()
    await commit()

    await hostRef
      .collection('activity')
      .add({
        actorId: decoded.uid,
        actorEmail: decoded.email ?? null,
        action: `Restored site from export (${written} documents)`,
        target: { type: 'host', id: hostId },
        createdAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
      })
      .catch(() => undefined)

    return res.status(200).json({ written })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Import failed' })
  }
}
