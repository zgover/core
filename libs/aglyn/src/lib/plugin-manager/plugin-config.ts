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
 * Per-plugin configuration (AGL-428) — Strapi `config` parity. A plugin
 * DECLARES its settings schema (fields + defaults + validation) at module
 * scope; the org stores overrides in `orgs/{orgId}/pluginSettings/
 * {pluginId}`; every consumer reads the DEFAULTS-MERGED view:
 *
 * - server handlers via `getPluginConfig(orgId, pluginId)`
 *   (tenant-data-admin);
 * - client surfaces via `usePluginConfig(orgId, pluginId)`
 *   (tenant-feature-instance);
 * - the console's Plugins & add-ons hub renders a generic settings form
 *   from the schema, so a plugin gets a settings UI without writing one.
 *
 * Register at MODULE SCOPE in a file imported by both the client barrel
 * and the `/server` entry, so whichever surface loads first the schema is
 * there. Values are coerced defensively on merge — the settings doc is
 * client-writable (org managers), so readers never trust its types.
 */

export interface PluginConfigField {
  key: string
  label: string
  type: 'string' | 'number' | 'boolean' | 'select'
  description?: string
  /** For `select` fields. */
  options?: Array<{ value: string; label: string }>
  /** For `number` fields. */
  min?: number
  max?: number
}

export interface PluginConfigSchema {
  pluginId: string
  fields: PluginConfigField[]
  defaults: Record<string, unknown>
  /** Cross-field validation; returns an error message or null. */
  validate?: (values: Record<string, unknown>) => string | null
}

const schemas = new Map<string, PluginConfigSchema>()

/** Idempotent by pluginId — re-registration replaces the schema. */
export function registerPluginConfigSchema(schema: PluginConfigSchema): void {
  schemas.set(schema.pluginId, schema)
}

export function getPluginConfigSchema(
  pluginId: string,
): PluginConfigSchema | undefined {
  return schemas.get(pluginId)
}

export function listPluginConfigSchemas(): PluginConfigSchema[] {
  return [...schemas.values()]
}

const coerce = (
  field: PluginConfigField,
  raw: unknown,
  fallback: unknown,
): unknown => {
  switch (field.type) {
    case 'boolean':
      return typeof raw === 'boolean' ? raw : fallback
    case 'number': {
      const value = typeof raw === 'number' && Number.isFinite(raw) ? raw : NaN
      if (Number.isNaN(value)) return fallback
      if (field.min != null && value < field.min) return field.min
      if (field.max != null && value > field.max) return field.max
      return value
    }
    case 'select': {
      const value = typeof raw === 'string' ? raw : undefined
      return field.options?.some((option) => option.value === value)
        ? value
        : fallback
    }
    default:
      return typeof raw === 'string' ? raw : fallback
  }
}

/**
 * The defaults-merged, type-coerced config view. Safe against a missing
 * or junk settings doc — unknown keys are dropped, wrong-typed values
 * fall back to the declared default.
 */
export function mergePluginConfig(
  schema: PluginConfigSchema,
  stored: Record<string, unknown> | null | undefined,
): Record<string, unknown> {
  const merged: Record<string, unknown> = { ...schema.defaults }
  if (!stored) return merged
  for (const field of schema.fields) {
    if (field.key in stored) {
      merged[field.key] = coerce(
        field,
        stored[field.key],
        schema.defaults[field.key],
      )
    }
  }
  return merged
}

/** Pre-save validation for the settings UI (coerce + custom validate). */
export function validatePluginConfigValues(
  schema: PluginConfigSchema,
  values: Record<string, unknown>,
): { ok: boolean; error?: string } {
  const merged = mergePluginConfig(schema, values)
  const error = schema.validate?.(merged) ?? null
  return error ? { ok: false, error } : { ok: true }
}
