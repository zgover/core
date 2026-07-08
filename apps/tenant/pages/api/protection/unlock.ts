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

import { createHash, timingSafeEqual } from 'crypto'
import type { NextApiRequest, NextApiResponse } from 'next'
import composeScreenNodes from '../../../utils/compose-screen-nodes'
import getScreen from '../../../utils/get-screen'

// Best-effort per-instance brute-force damper.
const attemptsByIp = new Map<string, number[]>()
const WINDOW_MS = 60_000
const MAX_ATTEMPTS = 10

/**
 * Password unlock for protected screens (AGL-87): verifies the sha256 of
 * the supplied password against the screen doc and only then returns the
 * composed node tree — protected content never ships in static HTML.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  const { hostId, screenId, password } = req.body ?? {}
  if (
    typeof hostId !== 'string' ||
    typeof screenId !== 'string' ||
    typeof password !== 'string' ||
    !hostId ||
    !screenId
  ) {
    return res.status(400).json({ error: 'Invalid request' })
  }
  const ip = String(
    req.headers['x-forwarded-for'] ?? req.socket.remoteAddress ?? 'unknown',
  ).split(',')[0]
  const now = Date.now()
  const attempts = (attemptsByIp.get(ip) ?? []).filter(
    (at) => now - at < WINDOW_MS,
  )
  attempts.push(now)
  attemptsByIp.set(ip, attempts)
  if (attempts.length > MAX_ATTEMPTS) {
    return res.status(429).json({ error: 'Too many attempts' })
  }

  try {
    const screenRes = await getScreen({ hostId, screenId })
    const stored = (screenRes.screen as any)?.protection?.passwordHash
    if (!screenRes.screen || typeof stored !== 'string' || !stored) {
      return res.status(404).json({ error: 'Not protected' })
    }
    const supplied = createHash('sha256').update(password).digest('hex')
    const match =
      stored.length === supplied.length &&
      timingSafeEqual(
        Buffer.from(stored, 'utf8') as any,
        Buffer.from(supplied, 'utf8') as any,
      )
    if (!match) {
      return res.status(401).json({ error: 'Wrong password' })
    }
    const nodes = await composeScreenNodes({
      hostId,
      screenId,
      screen: screenRes.screen,
    })
    if (!nodes) return res.status(500).json({ error: 'Compose failed' })
    return res.status(200).json({ nodes })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Unlock failed' })
  }
}
