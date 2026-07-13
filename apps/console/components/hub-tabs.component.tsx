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
 * Moved to `@aglyn/shared-ui-next` (AGL-395) so relocated feature plugins
 * (e.g. the commerce console page) can share it; this shim keeps the app's
 * import sites working.
 */
export { HubTabs, HubTabs as default } from '@aglyn/shared-ui-next/components/hub-tabs'
export type { HubTab, HubTabsProps } from '@aglyn/shared-ui-next/components/hub-tabs'
