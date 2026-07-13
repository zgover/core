#!/usr/bin/env node
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
 * Generates the per-app plugin loader manifests from plugins.config.json
 * (AGL-417). The emitted files are the ONLY code outside libs/plugins that
 * may reference @aglyn/plugins-* — everything else goes through the core
 * plugin-manager loader at runtime, keyed by org.enabledPlugins.
 *
 * Re-run after editing plugins.config.json:  node tools/scripts/generate-plugin-manifests.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..')
const config = JSON.parse(readFileSync(join(ROOT, 'plugins.config.json'), 'utf8'))

const header = (entryPoint) => `/**
 * GENERATED FILE — do not edit. Regenerate with:
 *   node tools/scripts/generate-plugin-manifests.mjs
 *
 * The sole sanctioned @aglyn/plugins-* references outside libs/plugins
 * (AGL-417): dynamic-import loaders the core plugin-manager activates at
 * runtime for the org's enabled plugins. Source of truth: plugins.config.json.
 */
/* eslint-disable @nx/enforce-module-boundaries */

import type { PluginLoadManifest } from '@aglyn/aglyn${entryPoint === 'server' ? '/server' : ''}'

`

function entry(plugin, entryPoint, surfaces) {
  const register = Object.fromEntries(
    Object.entries(plugin.register).filter(([key]) => surfaces.includes(key)),
  )
  if (!Object.keys(register).length) return null
  const specifier =
    entryPoint === 'server' ? `${plugin.package}/server` : plugin.package
  return (
    `  {\n` +
    `    id: '${plugin.id}',\n` +
    (plugin.alwaysOn ? `    alwaysOn: true,\n` : '') +
    (plugin.apiPrefixes?.length
      ? `    apiPrefixes: ${JSON.stringify(plugin.apiPrefixes)},\n`
      : '') +
    `    register: ${JSON.stringify(register)},\n` +
    `    load: () => import('${specifier}'),\n` +
    `  },`
  )
}

function emit(file, entryPoint, surfaces, constName) {
  const entries = config.plugins
    .map((plugin) => entry(plugin, entryPoint, surfaces))
    .filter(Boolean)
    .join('\n')
  const body =
    header(entryPoint) +
    `export const ${constName}: PluginLoadManifest = [\n${entries}\n]\n`
  writeFileSync(join(ROOT, file), body)
  console.log(`wrote ${file}`)
}

emit(
  'apps/console/constants/plugins.client.generated.ts',
  'client',
  ['console', 'site'],
  'CONSOLE_PLUGIN_MANIFEST',
)
emit(
  'apps/console/constants/plugins.server.generated.ts',
  'server',
  ['consoleApi'],
  'CONSOLE_PLUGIN_SERVER_MANIFEST',
)
emit(
  'apps/tenant/utils/plugins.client.generated.ts',
  'client',
  ['site'],
  'TENANT_PLUGIN_MANIFEST',
)
emit(
  'apps/tenant/utils/plugins.server.generated.ts',
  'server',
  ['tenantApi'],
  'TENANT_PLUGIN_SERVER_MANIFEST',
)
