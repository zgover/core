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

import type { NextApiRequest, NextApiResponse } from 'next'
import { firebaseAdmin } from './firebase-admin'

/** Variant widths generated at upload (AGL-175). */
export const MEDIA_CDN_VARIANT_WIDTHS = [320, 640, 1280] as const

const SEGMENT = /^[A-Za-z0-9_-]{1,64}$/

/**
 * CDN media delivery (AGL-175, Option B): GET
 * `/api/media/cdn/[hostId]/[mediaId]/[contentHash]?w=[width]` streams the
 * asset (or a WebP variant) with a year-long immutable cache header —
 * safe because the content hash is part of the path, so replacing an
 * asset mints a new URL and can never serve stale bytes. The same
 * handler mounts in both the tenant and console apps so relative CDN
 * URLs resolve on tenant sites and in the editor canvas alike. Raw
 * storage URLs already embedded in screens keep working unchanged.
 */
export async function serveMediaCdn(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<void> {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD')
    res.status(405).end()
    return
  }
  const path = Array.isArray(req.query['path']) ? req.query['path'] : []
  const [hostId, mediaId, hash] = path.map((value) => String(value ?? ''))
  if (
    path.length !== 3 ||
    !SEGMENT.test(hostId) ||
    !SEGMENT.test(mediaId) ||
    !SEGMENT.test(hash)
  ) {
    res.status(400).json({ error: 'Bad media path' })
    return
  }

  try {
    const firestore = firebaseAdmin.app().firestore()
    const snapshot = await firestore
      .collection('hosts')
      .doc(hostId)
      .collection('media')
      .doc(mediaId)
      .get()
    if (
      !snapshot.exists ||
      snapshot.get('deletedAt') ||
      snapshot.get('contentHash') !== hash
    ) {
      res.setHeader('Cache-Control', 'public, max-age=60')
      res.status(404).json({ error: 'Not found' })
      return
    }

    const bucket = firebaseAdmin
      .app()
      .storage()
      .bucket(process.env['NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'])
    const width = Number(req.query['w'] ?? 0)
    const variants: number[] = snapshot.get('variants') ?? []
    const useVariant = Boolean(width) && variants.includes(width)
    const objectPath = useVariant
      ? `hosts/${hostId}/media/${mediaId}__w${width}.webp`
      : `hosts/${hostId}/media/${mediaId}`
    const file = bucket.file(objectPath)
    const [metadata] = await file.getMetadata().catch(() => [null as any])
    if (!metadata) {
      res.status(404).json({ error: 'Not found' })
      return
    }

    res.setHeader(
      'Content-Type',
      useVariant
        ? 'image/webp'
        : String(
            metadata.contentType ??
              snapshot.get('contentType') ??
              'application/octet-stream',
          ),
    )
    if (metadata.size) res.setHeader('Content-Length', String(metadata.size))
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
    if (req.method === 'HEAD') {
      res.status(200).end()
      return
    }
    await new Promise<void>((resolve, reject) => {
      file
        .createReadStream()
        .on('error', reject)
        .on('end', resolve)
        .pipe(res)
    })
  } catch (error) {
    console.error('serveMediaCdn failed', hostId, mediaId, error)
    if (!res.headersSent) res.status(500).json({ error: 'Delivery failed' })
    else res.end()
  }
}
