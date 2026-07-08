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
 * Binding token grammar (AGL-185) — the single source of truth for what a
 * binding token looks like, shared by the besigner editor, the console
 * binding picker, and the tenant renderer.
 *
 * Two generations coexist:
 * - id tokens: `{{var:variableId}}` and `{{fn:functionId(args)}}` — the
 *   reference survives renames because only the display name changes.
 * - legacy name tokens: `{{name}}` and `{{fn:name(args)}}` — resolved as a
 *   fallback until AGL-188 migrates stored content.
 *
 * Resolution maps are therefore double-keyed (doc id AND name → same doc);
 * id entries are written last so an id match wins if the two ever collide.
 */

/** Firestore doc ids and legacy binding names both fit this shape. */
const REF = '[a-zA-Z0-9_-]{1,64}'

/** `{{var:variableId}}` — capture group 1 is the variable's doc id. */
export const VARIABLE_ID_TOKEN_PATTERN = new RegExp(
  `\\{\\{\\s*var:(${REF})\\s*\\}\\}`,
  'g',
)

/**
 * `{{fn:ref(args)}}` — capture 1 is a function doc id OR legacy name,
 * capture 2 the raw argument list. One pattern serves both generations;
 * lookup order (id first, then name) decides what the ref means.
 */
export const FUNCTION_TOKEN_PATTERN = new RegExp(
  `\\{\\{\\s*fn:(${REF}(?: ${REF})*)\\s*\\(([^)]*)\\)\\s*\\}\\}`,
  'g',
)

/** Legacy `{{name}}` — names never contain `:`, so `var:`/`fn:` can't match. */
export const NAME_TOKEN_PATTERN = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]{0,39})\s*\}\}/g

/** Renders the id-form variable token the picker inserts (AGL-186). */
export function formatVariableIdToken(variableId: string): string {
  return `{{var:${variableId}}}`
}

/** Renders the id-form function token with its parameter placeholders. */
export function formatFunctionIdToken(
  functionId: string,
  parameterNames: string[] = [],
): string {
  return `{{fn:${functionId}(${parameterNames.join(', ')})}}`
}

/**
 * Double-keys resource docs by id and name so one map serves both token
 * generations. Name entries are written first; id entries last, so an id
 * lookup wins on a (pathological) name/id collision.
 */
export function keyByIdAndName<T extends { name?: string }>(
  docs: Array<T & { id: string }>,
): Record<string, T> {
  const map: Record<string, T> = {}
  for (const { id: _id, ...doc } of docs) {
    if (doc.name) map[doc.name] = doc as T
  }
  for (const { id, ...doc } of docs) {
    map[id] = doc as T
  }
  return map
}
