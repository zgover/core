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
  getPluginConfigSchema,
  mergePluginConfig,
  registerPluginConfigSchema,
  validatePluginConfigValues,
  type PluginConfigSchema,
} from './plugin-config'

const SCHEMA: PluginConfigSchema = {
  pluginId: 'test-plugin',
  fields: [
    { key: 'horizon', label: 'Horizon', type: 'number', min: 1, max: 30 },
    { key: 'enabled', label: 'Enabled', type: 'boolean' },
    {
      key: 'mode',
      label: 'Mode',
      type: 'select',
      options: [
        { value: 'a', label: 'A' },
        { value: 'b', label: 'B' },
      ],
    },
    { key: 'note', label: 'Note', type: 'string' },
  ],
  defaults: { horizon: 14, enabled: true, mode: 'a', note: '' },
  validate: (values) =>
    values.mode === 'b' && values.enabled !== true
      ? 'Mode B requires enabled'
      : null,
}

describe('plugin config (AGL-428)', () => {
  it('registers and resolves schemas by plugin id', () => {
    registerPluginConfigSchema(SCHEMA)
    expect(getPluginConfigSchema('test-plugin')?.pluginId).toBe('test-plugin')
    expect(getPluginConfigSchema('unknown')).toBeUndefined()
  })

  it('merges defaults over a missing doc', () => {
    expect(mergePluginConfig(SCHEMA, null)).toEqual(SCHEMA.defaults)
  })

  it('coerces junk to defaults and clamps numbers', () => {
    const merged = mergePluginConfig(SCHEMA, {
      horizon: 999,
      enabled: 'yes',
      mode: 'nope',
      note: 42,
      dropped: 'unknown key',
    })
    expect(merged).toEqual({
      horizon: 30, // clamped to max
      enabled: true, // junk string → default
      mode: 'a', // unknown option → default
      note: '', // wrong type → default
    })
  })

  it('keeps well-typed overrides', () => {
    const merged = mergePluginConfig(SCHEMA, {
      horizon: 7,
      enabled: false,
      mode: 'b',
    })
    expect(merged.horizon).toBe(7)
    expect(merged.enabled).toBe(false)
    expect(merged.mode).toBe('b')
  })

  it('runs the schema validator on save', () => {
    expect(
      validatePluginConfigValues(SCHEMA, { mode: 'b', enabled: false }).ok,
    ).toBe(false)
    expect(
      validatePluginConfigValues(SCHEMA, { mode: 'b', enabled: true }).ok,
    ).toBe(true)
  })
})
