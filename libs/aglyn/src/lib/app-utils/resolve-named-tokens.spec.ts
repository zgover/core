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

import { resolveNamedTokens } from './resolve-named-tokens'

describe('resolveNamedTokens', () => {
  it('substitutes only the provided names, leaving other tokens alone', () => {
    const nodes = {
      a: {
        $id: 'a',
        componentId: 'muiTypography',
        props: { children: '{{entry.title}} by {{Author}}' },
      },
    } as any
    const result = resolveNamedTokens(nodes, { 'entry.title': 'Hello' })
    expect((result['a'] as any).props.children).toBe('Hello by {{Author}}')
    // Input untouched.
    expect((nodes['a'] as any).props.children).toContain('{{entry.title}}')
  })

  it('walks nested props and maps missing values to empty strings', () => {
    const nodes = {
      a: {
        $id: 'a',
        componentId: 'x',
        props: { sx: { content: '"{{entry.missing}}"' }, list: ['{{k}}'] },
      },
    } as any
    const result = resolveNamedTokens(nodes, {
      'entry.missing': '',
      k: 'v',
    }) as any
    expect(result['a'].props.sx.content).toBe('""')
    expect(result['a'].props.list).toEqual(['v'])
  })

  it('is a no-op without tokens', () => {
    const nodes = { a: { $id: 'a', componentId: 'x' } } as any
    expect(resolveNamedTokens(nodes, undefined)).toBe(nodes)
  })
})
