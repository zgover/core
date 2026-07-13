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

/**
 * Shared site-export bundle contract (AGL-163), used by both the export and
 * import routes. Lives in `_lib` (an App Router private folder) because
 * `route.ts` files may only export route handlers — the Pages Router version
 * exported these from the export route itself.
 */

export const SITE_EXPORT_FORMAT = 'aglyn-site-export'
export const SITE_EXPORT_VERSION = 1

/** Host-doc fields that travel in a bundle (never admins/tenant/domain). */
export const EXPORTABLE_HOST_FIELDS = [
  'displayName',
  'seo',
  'theme',
  'screens',
  'layouts',
  'notFoundScreenId',
  'errorScreens',
  'analytics',
] as const

/** Per-collection doc caps keep bundles bounded and import tractable. */
export const EXPORT_COLLECTION_LIMITS: Record<string, number> = {
  screens: 200,
  layouts: 50,
  components: 100,
  variables: 100,
  functions: 100,
  workflows: 100,
  actions: 100,
  services: 50,
  collections: 20,
  datasets: 50,
}
