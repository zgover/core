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

import { registerPluginApiRoute } from '@aglyn/aglyn/server'
import { checkoutHandler } from './server/checkout'
import { connectHandler } from './server/connect'
import { installHandler } from './server/install'
import { installPluginHandler } from './server/install-plugin'
import { installTemplateHandler } from './server/install-template'
import { publishHandler } from './server/publish'
import { publishTemplateHandler } from './server/publish-template'

/**
 * Registers the community plugin's console-side API routes (AGL-396):
 * marketplace publish/install of templates and plugins, and the Stripe
 * Connect + checkout flows for paid listings. The upload-bodied routes
 * (publish-plugin's 8 MB bundle, preview-image's 3 MB image) stay as named
 * console routes — the shared body-parsed dispatcher can't grant per-route
 * bodyParser limits.
 */
export function registerCommunityConsoleApi(): void {
  registerPluginApiRoute('community/checkout', checkoutHandler)
  registerPluginApiRoute('community/connect', connectHandler)
  registerPluginApiRoute('community/install', installHandler)
  registerPluginApiRoute('community/install-plugin', installPluginHandler)
  registerPluginApiRoute('community/install-template', installTemplateHandler)
  registerPluginApiRoute('community/publish', publishHandler)
  registerPluginApiRoute('community/publish-template', publishTemplateHandler)
}
