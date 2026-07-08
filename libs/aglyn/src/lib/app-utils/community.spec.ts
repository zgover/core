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
  COMMUNITY_COMPONENT_ID_ALLOWLIST,
  sanitizeCommunityDefinition,
} from './community'

const nodes = {
  root: {
    $id: 'root',
    componentId: 'muiStack',
    pluginId: 'mui',
    parentId: 'outside',
    props: { spacing: 2 },
    nodes: ['child'],
    resolvedProps: { spacing: 2 },
    componentSchema: { $id: 'muiStack' },
  },
  child: {
    $id: 'child',
    componentId: 'muiTypography',
    pluginId: 'mui',
    parentId: 'root',
    props: { children: 'Hello' },
  },
  stray: {
    $id: 'stray',
    componentId: 'muiButton',
    pluginId: 'mui',
    parentId: null,
  },
}

describe('sanitizeCommunityDefinition', () => {
  it('keeps only the reachable subtree and persisted keys', () => {
    const result = sanitizeCommunityDefinition({ rootId: 'root', nodes })
    if (!result.ok) throw new Error(result.error)
    expect(Object.keys(result.nodes).sort()).toEqual(['child', 'root'])
    expect((result.nodes['root'] as any).resolvedProps).toBeUndefined()
    expect((result.nodes['root'] as any).componentSchema).toBeUndefined()
    expect(result.nodes['root'].parentId).toBeNull()
    expect(result.nodes['child'].props).toEqual({ children: 'Hello' })
  })

  it('rejects reusable instances and non-allowlisted components', () => {
    expect(COMMUNITY_COMPONENT_ID_ALLOWLIST).not.toContain('reusableInstance')
    expect(COMMUNITY_COMPONENT_ID_ALLOWLIST).not.toContain('layoutSlot')
    const result = sanitizeCommunityDefinition({
      rootId: 'root',
      nodes: {
        root: {
          $id: 'root',
          componentId: 'reusableInstance',
          parentId: null,
          props: { refId: 'private' },
        },
      },
    })
    expect(result).toEqual({
      ok: false,
      error: 'Component "reusableInstance" cannot be published',
    })
  })

  it('rejects missing roots and broken child references', () => {
    expect(
      sanitizeCommunityDefinition({ rootId: 'nope', nodes }).ok,
    ).toBe(false)
    expect(
      sanitizeCommunityDefinition({
        rootId: 'root',
        nodes: { root: { ...nodes.root, nodes: ['ghost'] } },
      }),
    ).toEqual({ ok: false, error: 'Missing node "ghost"' })
  })

  it('rejects oversized definitions', () => {
    const result = sanitizeCommunityDefinition({
      rootId: 'root',
      nodes: {
        root: {
          $id: 'root',
          componentId: 'muiTypography',
          parentId: null,
          props: { children: 'x'.repeat(210 * 1024) },
        },
      },
    })
    expect(result).toEqual({
      ok: false,
      error: 'Definition is too large to publish',
    })
  })
})
