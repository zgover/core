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

import { createPluginLoader, type PluginLoadManifest } from './plugin-loader'

describe('plugin loader lifecycle (AGL-417/429)', () => {
  const makeManifest = (calls: string[]): PluginLoadManifest => [
    {
      id: 'alpha',
      register: { console: 'registerAlpha' },
      load: async () => ({
        registerAlpha: () => calls.push('register:alpha'),
        bootstrapConsole: () => calls.push('bootstrap:alpha'),
      }),
    },
    {
      id: 'beta',
      register: { console: 'registerBeta', site: 'registerBetaSite' },
      load: async () => ({
        registerBeta: () => calls.push('register:beta'),
        registerBetaSite: () => calls.push('register:beta-site'),
        bootstrapConsole: () => calls.push('bootstrap:beta'),
        // No bootstrapSite — optional per surface.
      }),
    },
  ]

  it('runs every register before any bootstrap, in manifest order', async () => {
    const calls: string[] = []
    const loader = createPluginLoader(makeManifest(calls))
    await loader.ensure(['alpha', 'beta'], ['console'])
    const lastRegister = Math.max(
      calls.indexOf('register:alpha'),
      calls.indexOf('register:beta'),
    )
    const firstBootstrap = Math.min(
      calls.indexOf('bootstrap:alpha'),
      calls.indexOf('bootstrap:beta'),
    )
    expect(lastRegister).toBeLessThan(firstBootstrap)
    expect(calls.indexOf('bootstrap:alpha')).toBeLessThan(
      calls.indexOf('bootstrap:beta'),
    )
  })

  it('bootstraps once per plugin+surface across repeated ensures', async () => {
    const calls: string[] = []
    const loader = createPluginLoader(makeManifest(calls))
    await loader.ensure(['alpha', 'beta'], ['console'])
    await loader.ensure(['alpha'], ['console'])
    await loader.ensureAll(['console'])
    expect(calls.filter((call) => call === 'bootstrap:alpha')).toHaveLength(1)
    expect(calls.filter((call) => call === 'bootstrap:beta')).toHaveLength(1)
  })

  it('a surface without a bootstrap export is fine', async () => {
    const calls: string[] = []
    const loader = createPluginLoader(makeManifest(calls))
    await expect(loader.ensure(['beta'], ['site'])).resolves.toBeUndefined()
    expect(calls).toContain('register:beta-site')
  })

  it('a throwing bootstrap does not fail the ensure', async () => {
    const calls: string[] = []
    const manifest: PluginLoadManifest = [
      {
        id: 'broken',
        register: { console: 'registerBroken' },
        load: async () => ({
          registerBroken: () => calls.push('register:broken'),
          bootstrapConsole: () => {
            throw new Error('boom')
          },
        }),
      },
    ]
    const loader = createPluginLoader(manifest)
    await expect(
      loader.ensure(['broken'], ['console']),
    ).resolves.toBeUndefined()
    expect(calls).toContain('register:broken')
  })
})
