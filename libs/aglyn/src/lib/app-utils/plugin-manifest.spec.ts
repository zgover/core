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

import {
  isPluginRevoked,
  type PluginManifest,
  pluginArtifactPath,
  pluginContentSecurityPolicy,
  validatePluginManifest,
} from './plugin-manifest'

const base = {
  id: 'weather-widget',
  name: 'Weather Widget',
  version: '1.2.0',
  entry: 'dist/index.js',
}

describe('validatePluginManifest', () => {
  it('accepts a minimal valid manifest', () => {
    const result = validatePluginManifest(base)
    expect(result.ok).toBe(true)
  })

  it('normalizes capabilities and dedupes lists', () => {
    const result = validatePluginManifest({
      ...base,
      capabilities: {
        network: ['https://api.example.com', 'https://api.example.com'],
        props: ['city', 'city', 'units'],
        events: ['refresh'],
        size: { width: 320, height: 200 },
      },
    })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.manifest.capabilities?.network).toEqual([
        'https://api.example.com',
      ])
      expect(result.manifest.capabilities?.props).toEqual(['city', 'units'])
      expect(result.manifest.capabilities?.size).toEqual({
        width: 320,
        height: 200,
      })
    }
  })

  it('rejects bad ids, versions, and absolute entries', () => {
    expect(validatePluginManifest({ ...base, id: 'Bad Id' }).ok).toBe(false)
    expect(validatePluginManifest({ ...base, version: '1.0' }).ok).toBe(false)
    expect(
      validatePluginManifest({ ...base, entry: 'https://evil.com/x.js' }).ok,
    ).toBe(false)
    expect(validatePluginManifest({ ...base, entry: '//evil.com/x.js' }).ok).toBe(
      false,
    )
  })

  it('rejects non-https network origins and over-limit lists', () => {
    expect(
      validatePluginManifest({
        ...base,
        capabilities: { network: ['http://insecure.com'] },
      }).ok,
    ).toBe(false)
    expect(
      validatePluginManifest({
        ...base,
        capabilities: {
          network: Array.from({ length: 11 }, (_, i) => `https://a${i}.com`),
        },
      }).ok,
    ).toBe(false)
  })

  it('rejects invalid prop/event identifiers', () => {
    expect(
      validatePluginManifest({
        ...base,
        capabilities: { props: ['9bad'] },
      }).ok,
    ).toBe(false)
  })
})

describe('pluginArtifactPath', () => {
  it('is content-addressed and immutable per version', () => {
    expect(pluginArtifactPath('l1', '1.0.0', 'abc123')).toBe(
      'artifacts/l1/1.0.0/abc123.bundle',
    )
  })
})

describe('pluginContentSecurityPolicy', () => {
  it("uses 'none' for connect-src without network capability", () => {
    const csp = pluginContentSecurityPolicy(base as PluginManifest, [
      'https://console.aglyn.io',
    ])
    expect(csp).toContain("default-src 'none'")
    expect(csp).toContain("connect-src 'none'")
    expect(csp).toContain('frame-ancestors https://console.aglyn.io')
  })

  it('allowlists declared network origins in connect-src', () => {
    const manifest = validatePluginManifest({
      ...base,
      capabilities: { network: ['https://api.example.com'] },
    })
    if (!manifest.ok) throw new Error('expected valid')
    const csp = pluginContentSecurityPolicy(manifest.manifest, [])
    expect(csp).toContain('connect-src https://api.example.com')
    expect(csp).toContain("frame-ancestors 'none'")
  })
})

describe('isPluginRevoked', () => {
  it('kills the whole listing or a specific version', () => {
    expect(isPluginRevoked({ versions: 'all' }, '1.0.0')).toBe(true)
    expect(isPluginRevoked({ versions: ['1.0.0'] }, '1.0.0')).toBe(true)
    expect(isPluginRevoked({ versions: ['1.0.0'] }, '1.1.0')).toBe(false)
    expect(isPluginRevoked(null, '1.0.0')).toBe(false)
  })
})
