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

import { resolvePluginApiRoute } from '@aglyn/aglyn'
import type { NextApiRequest, NextApiResponse } from 'next'
// Populate the plugin API registry before resolving (AGL-396).
import '../../utils/register-plugin-apis'

/**
 * Console plugin API dispatcher (AGL-396): the server counterpart to the
 * tenant app's catch-all. Named API routes win over it, so it only serves
 * paths a plugin has registered — migrating a feature's console handler
 * into its plugin preserves its `/api/...` URL: delete the named route,
 * register the handler, done. Unregistered paths 404 as before.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const slug = req.query['pluginApi']
  const path = Array.isArray(slug) ? slug.join('/') : String(slug ?? '')
  const route = resolvePluginApiRoute(path)
  if (!route) return res.status(404).json({ error: 'Not found' })
  return route(req, res)
}
