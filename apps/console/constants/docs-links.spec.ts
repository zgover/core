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

import { existsSync, readdirSync, readFileSync } from 'node:fs'
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

  it('uses only anchors that exist as headings on the linked docs page', () => {
    // Mirror Docusaurus' github-slugger: lowercase, strip punctuation,
    // then turn EVERY space into a hyphen (so "A & B" → "a--b").
    const slugify = (heading: string) =>
      heading
        .trim()
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s-]/gu, '')
        .replace(/ /g, '-')

    const docsRoot = join(__dirname, '../../docs/docs')
    const headingSlugs = (topicPath: string): Set<string> => {
      const md = join(docsRoot, `${topicPath}.md`)
      const source = readFileSync(md, 'utf8')
      const slugs = new Set<string>()
      for (const match of source.matchAll(/^#{2,4}\s+(.+?)\s*$/gm)) {
        const explicit = match[1].match(/\{#([^}]+)\}\s*$/)
        slugs.add(
          explicit ? explicit[1] : slugify(match[1].replace(/\{#[^}]+\}\s*$/, '')),
        )
      }
      return slugs
    }

    // Sweep every docsHelp('<topic>', { anchor: '#...' }) call in the app.
    const sourceRoots = ['app', 'components', 'constants'].map((dir) =>
      join(__dirname, '..', dir),
    )
    const sourceFiles: string[] = []
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name)
        if (entry.isDirectory()) walk(full)
        else if (/\.tsx?$/.test(entry.name)) sourceFiles.push(full)
      }
    }
    sourceRoots.forEach(walk)

    const anchorCall =
      /docsHelp\(\s*'(\w+)'\s*,\s*\{[^}]*anchor:\s*'#([^']+)'/gs
    for (const file of sourceFiles) {
      const source = readFileSync(file, 'utf8')
      for (const match of source.matchAll(anchorCall)) {
        const [, topicKey, anchor] = match
        const topic =
          DOCS_HELP_TOPICS[topicKey as keyof typeof DOCS_HELP_TOPICS]
        if (!topic) {
          throw new Error(`${file} uses unknown docsHelp topic '${topicKey}'`)
        }
        const slugs = headingSlugs(topic.path)
        if (!slugs.has(anchor)) {
          throw new Error(
            `${file} links ${topic.path}#${anchor}, but that heading does not exist (have: ${[...slugs].join(', ')})`,
          )
        }
      }
    }
  })

  it('validates the besigner designer lib docs links and anchors', () => {
    // The designer lib can't import console constants, so it carries its own
    // BESIGNER_DOCS map (libs/besigner/feature/designer/.../docs-help.ts).
    // Validate its paths and every besignerDocsUrl anchor the same way.
    const slugify = (heading: string) =>
      heading
        .trim()
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s-]/gu, '')
        .replace(/ /g, '-')

    const docsRoot = join(__dirname, '../../docs/docs')
    const libRoot = join(
      __dirname,
      '../../../libs/besigner/feature/designer/src',
    )
    const helper = readFileSync(join(libRoot, 'lib/utils/docs-help.ts'), 'utf8')
    const pages: Record<string, string> = {}
    for (const match of helper.matchAll(/^\s*(\w+):\s*'([^']+)',$/gm)) {
      pages[match[1]] = match[2]
    }
    expect(Object.keys(pages).length).toBeGreaterThan(0)
    for (const [key, pagePath] of Object.entries(pages)) {
      if (!existsSync(join(docsRoot, `${pagePath}.md`))) {
        throw new Error(
          `BESIGNER_DOCS.${key} points at ${pagePath}, but no page exists under apps/docs/docs`,
        )
      }
    }

    const sourceFiles: string[] = []
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name)
        if (entry.isDirectory()) walk(full)
        else if (/\.tsx?$/.test(entry.name)) sourceFiles.push(full)
      }
    }
    walk(libRoot)

    const anchorCall = /besignerDocsUrl\(\s*'(\w+)'\s*,\s*'#([^']+)'/gs
    for (const file of sourceFiles) {
      const source = readFileSync(file, 'utf8')
      for (const match of source.matchAll(anchorCall)) {
        const [, key, anchor] = match
        const pagePath = pages[key]
        if (!pagePath) {
          throw new Error(`${file} uses unknown BESIGNER_DOCS key '${key}'`)
        }
        const md = readFileSync(join(docsRoot, `${pagePath}.md`), 'utf8')
        const slugs = new Set<string>()
        for (const heading of md.matchAll(/^#{2,4}\s+(.+?)\s*$/gm)) {
          const explicit = heading[1].match(/\{#([^}]+)\}\s*$/)
          slugs.add(
            explicit
              ? explicit[1]
              : slugify(heading[1].replace(/\{#[^}]+\}\s*$/, '')),
          )
        }
        if (!slugs.has(anchor)) {
          throw new Error(
            `${file} links ${pagePath}#${anchor}, but that heading does not exist (have: ${[...slugs].join(', ')})`,
          )
        }
      }
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
