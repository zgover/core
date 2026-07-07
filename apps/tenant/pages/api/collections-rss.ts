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
import getCollectionContent from '../../utils/get-collection-content'
import getHost from '../../utils/get-host'

const escapeXml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

/**
 * RSS feed for a content collection (AGL-81):
 * `/api/collections-rss?host={subdomain|cname}&collection={slug}`.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const host = String(req.query['host'] ?? '')
  const collectionSlug = String(req.query['collection'] ?? '')
  if (!host || !collectionSlug) {
    return res.status(400).send('Missing host or collection')
  }
  const hostRes = await getHost({ host })
  if (hostRes.error || !hostRes.host) return res.status(404).send('Not found')

  const content = await getCollectionContent({
    hostId: hostRes.host.$id,
    collectionSlug,
  })
  if (!content.collection) return res.status(404).send('Not found')

  const base = `https://${String(req.headers['host'] ?? host)}`
  const items = content.entries
    .map(
      (entry) =>
        '  <item>\n' +
        `    <title>${escapeXml(entry.title)}</title>\n` +
        `    <link>${base}/${collectionSlug}/${entry.slug}</link>\n` +
        `    <guid>${base}/${collectionSlug}/${entry.slug}</guid>\n` +
        (entry.publishedAt
          ? `    <pubDate>${new Date(entry.publishedAt.seconds * 1000).toUTCString()}</pubDate>\n`
          : '') +
        (entry.excerpt
          ? `    <description>${escapeXml(entry.excerpt)}</description>\n`
          : '') +
        '  </item>',
    )
    .join('\n')

  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<rss version="2.0"><channel>\n' +
    `  <title>${escapeXml(content.collection.displayName)}</title>\n` +
    `  <link>${base}/${collectionSlug}</link>\n` +
    `  <description>${escapeXml(content.collection.displayName)}</description>\n` +
    items +
    '\n</channel></rss>\n'

  res.setHeader('Content-Type', 'application/rss+xml')
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate')
  return res.status(200).send(xml)
}
