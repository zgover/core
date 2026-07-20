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

// Same env override + fallback as the console's constants/docs-links.ts —
// this lib can't import app code, so the base URL is resolved here too.
const DOCS_BASE_URL = (
  process.env['NEXT_PUBLIC_AGLYN_DOCS_URL'] || 'https://docs.aglyn.com'
).replace(/\/+$/, '')

/** Docs pages the besigner panels deep-link to. Paths mirror apps/docs; the
 * console's docs-links.spec.ts validates them (and every anchor used with
 * `besignerDocsUrl`) against the markdown headings. */
export const BESIGNER_DOCS = {
  besigner: '/building-sites/besigner/overview',
  responsiveStyling: '/building-sites/besigner/responsive-styling',
  dragDropHierarchy: '/building-sites/besigner/drag-drop-hierarchy',
  textEditing: '/building-sites/besigner/text-editing',
  reusableComponents: '/building-sites/besigner/reusable-components',
  interactions: '/building-sites/besigner/interactions-and-custom-html',
  bindings: '/building-sites/bindings/overview',
  screens: '/building-sites/screens-and-layouts/overview',
} as const

export type BesignerDocsKey = keyof typeof BESIGNER_DOCS

/** Absolute docs URL for a besigner docs page, with an optional heading
 * anchor (e.g. `besignerDocsUrl('responsiveStyling', '#box-stylers')`). */
export function besignerDocsUrl(
  page: BesignerDocsKey,
  anchor?: `#${string}`,
): string {
  return `${DOCS_BASE_URL}${BESIGNER_DOCS[page]}${anchor ?? ''}`
}
