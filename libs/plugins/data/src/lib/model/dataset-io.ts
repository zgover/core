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
 * Dataset CSV/JSON round-tripping (AGL-182). Serialization is the
 * predictable inverse of `coerceDocumentValues`: ISO dates, `lat, lon`
 * coordinates, comma-joined lists, JSON maps, reference ids — so an
 * export re-imports losslessly through the same coercion.
 */

import type {
  DatasetFieldDefinition,
  DatasetModel,
} from '@aglyn/aglyn'

/** Storage value → portable string (CSV cell / JSON value). */
export function serializeDatasetValue(
  field: DatasetFieldDefinition,
  value: unknown,
): string {
  if (value == null) return ''
  switch (field.type) {
    case 'timestamp':
      return typeof value === 'number' && Number.isFinite(value)
        ? new Date(value).toISOString()
        : String(value)
    case 'coordinates': {
      const coordinates = value as { latitude?: number; longitude?: number }
      return coordinates &&
        typeof coordinates.latitude === 'number' &&
        typeof coordinates.longitude === 'number'
        ? `${coordinates.latitude}, ${coordinates.longitude}`
        : String(value)
    }
    case 'sorted':
    case 'reference':
      return Array.isArray(value) ? value.join(', ') : String(value)
    case 'map':
      try {
        return JSON.stringify(value)
      } catch {
        return String(value)
      }
    default:
      return String(value)
  }
}

const csvEscape = (cell: string): string =>
  /[",\n]/.test(cell) ? `"${cell.replace(/"/g, '""')}"` : cell

/** Rows (storage-form value maps) → CSV with a fieldId header row. */
export function datasetRecordsToCsv(
  model: DatasetModel,
  rows: Array<Record<string, unknown>>,
): string {
  const header = model.order.map(csvEscape).join(',')
  const lines = rows.map((row) =>
    model.order
      .map((fieldId) => {
        const field = model.fields[fieldId]
        return csvEscape(
          field ? serializeDatasetValue(field, row[fieldId]) : '',
        )
      })
      .join(','),
  )
  return [header, ...lines].join('\n')
}

/** Minimal RFC-4180 CSV parser (quoted fields, escaped quotes, CRLF). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false
  const source = String(text ?? '')
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index]
    if (quoted) {
      if (char === '"') {
        if (source[index + 1] === '"') {
          cell += '"'
          index += 1
        } else {
          quoted = false
        }
      } else {
        cell += char
      }
      continue
    }
    if (char === '"') {
      quoted = true
    } else if (char === ',') {
      row.push(cell)
      cell = ''
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && source[index + 1] === '\n') index += 1
      row.push(cell)
      cell = ''
      rows.push(row)
      row = []
    } else {
      cell += char
    }
  }
  if (cell !== '' || row.length) {
    row.push(cell)
    rows.push(row)
  }
  return rows.filter((cells) => cells.some((value) => value.trim() !== ''))
}

/**
 * Parses pasted/uploaded import text — a JSON array of objects or CSV
 * with a header row — into raw string maps keyed by the source column
 * names. Returns null when nothing parseable is found.
 */
export function parseImportRows(
  text: string,
): Array<Record<string, string>> | null {
  const trimmed = String(text ?? '').trim()
  if (!trimmed) return null
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed)
      const list = Array.isArray(parsed) ? parsed : [parsed]
      return list
        .filter((entry) => entry && typeof entry === 'object')
        .map((entry) =>
          Object.fromEntries(
            Object.entries(entry as Record<string, unknown>).map(
              ([key, value]) => [
                key,
                typeof value === 'string' ? value : JSON.stringify(value),
              ],
            ),
          ),
        )
    } catch {
      return null
    }
  }
  const rows = parseCsv(trimmed)
  if (rows.length < 2) return null
  const [header, ...body] = rows
  return body.map((cells) =>
    Object.fromEntries(
      header.map((column, index) => [column.trim(), cells[index] ?? '']),
    ),
  )
}

/**
 * Maps raw import columns to model fieldIds: exact fieldId match first,
 * then case-insensitive display-name match. Unmatched columns are
 * reported, never silently dropped.
 */
export function mapImportColumns(
  model: DatasetModel,
  columns: string[],
): { mapping: Record<string, string>; unmatched: string[] } {
  const byName = new Map<string, string>()
  for (const fieldId of model.order) {
    byName.set(fieldId.toLowerCase(), fieldId)
    const display = model.fields[fieldId]?.name
    if (display) byName.set(display.trim().toLowerCase(), fieldId)
  }
  const mapping: Record<string, string> = {}
  const unmatched: string[] = []
  for (const column of columns) {
    const fieldId = byName.get(column.trim().toLowerCase())
    if (fieldId) mapping[column] = fieldId
    else unmatched.push(column)
  }
  return { mapping, unmatched }
}
