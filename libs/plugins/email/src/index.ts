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

export * from './lib/constants/bundle-common'
export * from './lib/components/email-blocks'
export * from './lib/plugin'
// Console surfaces consumed directly by the app (e.g. inbox Campaigns tab).
export { default as CampaignsCard } from './lib/components/campaigns-card'
export { default as OrgListsCard } from './lib/components/lists-card'
export { default as EmailScreensCard } from './lib/components/email-screens-card'
export * from './lib/model'
