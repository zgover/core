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

import { existsSync } from 'node:fs'
import { join } from 'node:path'
import {
  buildDocsUrl,
  DOCS_BASE_URL,
  DOCS_HELP_TOPICS,
} from './docs-links'

describe('docs-links', () => {
  it('has a well-formed base URL with no trailing slash', () => {
    expect(DOCS_BASE_URL).toMatch(/^https:\/\/[^/]+$/)
  })

  it('builds absolute docs URLs from root-relative paths', () => {
    expect(buildDocsUrl()).toBe(`${DOCS_BASE_URL}/`)
    expect(buildDocsUrl('/getting-started/console-tour')).toBe(
      `${DOCS_BASE_URL}/getting-started/console-tour`,
    )
    expect(buildDocsUrl('whats-new')).toBe(`${DOCS_BASE_URL}/whats-new`)
  })

  it('registers complete, root-relative help topics', () => {
    const topics = Object.entries(DOCS_HELP_TOPICS)
    expect(topics.length).toBeGreaterThan(0)
    for (const [key, topic] of topics) {
      expect(topic.path.startsWith('/')).toBe(true)
      expect(topic.path.endsWith('/')).toBe(false)
      expect(topic.title.length).toBeGreaterThan(0)
      // Excerpts are tooltip copy — keep them brief.
      expect(topic.excerpt.length).toBeGreaterThan(0)
      expect(topic.excerpt.length).toBeLessThanOrEqual(200)
      expect(key.length).toBeGreaterThan(0)
    }
  })

  it('points every topic at an existing apps/docs page', () => {
    // Docs serve from the site root (docusaurus routeBasePath '/'), so a
    // topic path maps 1:1 onto a markdown file under apps/docs/docs.
    const docsRoot = join(__dirname, '../../docs/docs')
    for (const [key, topic] of Object.entries(DOCS_HELP_TOPICS)) {
      const md = join(docsRoot, `${topic.path}.md`)
      const mdx = join(docsRoot, `${topic.path}.mdx`)
      if (!existsSync(md) && !existsSync(mdx)) {
        throw new Error(
          `DOCS_HELP_TOPICS.${key} points at ${topic.path}, but no matching page exists under apps/docs/docs`,
        )
      }
    }
  })
})
