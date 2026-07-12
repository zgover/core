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

import type { PresetSchema } from '../types/nodes'

/**
 * Install→preset mapping seam (AGL-419): the besigner drawer shows a
 * preset per installed community plugin, but the preset shape (component
 * id, drawer category, icon) belongs to the mui plugin — so the mapper is
 * REGISTERED by plugins-mui and the console consumes it through core,
 * never importing the plugin.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PluginInstallPresetMapper = (install: any) => PresetSchema | null

let mapper: PluginInstallPresetMapper | undefined

export function registerPluginInstallPresetMapper(
  fn: PluginInstallPresetMapper,
): void {
  mapper = fn
}

/** Maps an install doc to a drawer preset; null until a mapper registers. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function pluginInstallToPreset(install: any): PresetSchema | null {
  return mapper ? mapper(install) : null
}
