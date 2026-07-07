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

import { promises as dns } from 'dns'
import type { NextApiRequest, NextApiResponse } from 'next'

const DOMAIN_PATTERN = /^(?!-)[a-z0-9-]{1,63}(\.[a-z0-9-]{1,63})+$/i

/**
 * DNS verification for the connect-a-domain wizard (Custom Domain
 * Self-Service): resolves the domain's CNAME chain and reports whether it
 * points at the tenant edge (`AGLYN_TENANT_HOST_CNAME`). With the env unset
 * (local/dev) it reports the found records and treats any CNAME as a soft
 * pass so the flow remains testable.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const domain = String(req.query['domain'] ?? '')
    .trim()
    .toLowerCase()
  if (!DOMAIN_PATTERN.test(domain)) {
    return res.status(400).json({ error: 'Invalid domain' })
  }
  const expected = (process.env.AGLYN_TENANT_HOST_CNAME ?? '').toLowerCase()

  let records: string[] = []
  try {
    records = (await dns.resolveCname(domain)).map((record) =>
      record.toLowerCase().replace(/\.$/, ''),
    )
  } catch {
    // NXDOMAIN / no CNAME — reported as unverified below.
  }
  const verified = expected
    ? records.includes(expected)
    : records.length > 0
  return res.status(200).json({
    domain,
    records,
    expected: expected || null,
    verified,
  })
}
