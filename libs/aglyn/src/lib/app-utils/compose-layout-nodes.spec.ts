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

import type { AglynNodeSchema } from '../foundation'
import {
  composeLayoutAndScreenNodes,
  LAYOUT_NODE_ID_PREFIX,
  LAYOUT_SLOT_COMPONENT_ID,
} from './compose-layout-nodes'

const ROOT = '_@_'

const layoutNodes: Record<string, AglynNodeSchema> = {
  [ROOT]: { $id: ROOT, componentId: 'root', nodes: ['appbar', 'slot', 'footer'] },
  appbar: { $id: 'appbar', componentId: 'muiAppBar', parentId: ROOT },
  slot: { $id: 'slot', componentId: LAYOUT_SLOT_COMPONENT_ID, parentId: ROOT },
  footer: { $id: 'footer', componentId: 'muiToolbar', parentId: ROOT },
}

const screenNodes: Record<string, AglynNodeSchema> = {
  [ROOT]: { $id: ROOT, componentId: 'root', nodes: ['hero', 'body'] },
  hero: { $id: 'hero', componentId: 'muiContainer', parentId: ROOT, nodes: ['heroText'] },
  heroText: { $id: 'heroText', componentId: 'muiTypography', parentId: 'hero' },
  body: { $id: 'body', componentId: 'muiContainer', parentId: ROOT },
}

describe('composeLayoutAndScreenNodes', () => {
  it('returns screen nodes unchanged without layout nodes or a slot', () => {
    expect(composeLayoutAndScreenNodes(undefined, screenNodes)).toBe(
      screenNodes,
    )
    const slotless = {
      [ROOT]: layoutNodes[ROOT],
      appbar: layoutNodes['appbar'],
    }
    expect(composeLayoutAndScreenNodes(slotless, screenNodes)).toBe(screenNodes)
  })

  it('grafts screen children into the slot under the layout root', () => {
    const composed = composeLayoutAndScreenNodes(layoutNodes, screenNodes)
    const slotId = `${LAYOUT_NODE_ID_PREFIX}slot`

    // Layout root keeps its structure with prefixed child ids.
    expect(composed[ROOT].nodes).toEqual([
      `${LAYOUT_NODE_ID_PREFIX}appbar`,
      slotId,
      `${LAYOUT_NODE_ID_PREFIX}footer`,
    ])
    // The slot holds the screen root's children, repointed at the slot.
    expect(composed[slotId].nodes).toEqual(['hero', 'body'])
    expect(composed['hero'].parentId).toBe(slotId)
    expect(composed['body'].parentId).toBe(slotId)
    // Nested screen nodes are untouched.
    expect(composed['heroText'].parentId).toBe('hero')
    // The screen's own root is dropped.
    expect(Object.values(composed).filter((n) => n.$id === ROOT)).toHaveLength(1)
  })

  it('does not mutate its inputs', () => {
    const layoutCopy = JSON.parse(JSON.stringify(layoutNodes))
    const screenCopy = JSON.parse(JSON.stringify(screenNodes))
    composeLayoutAndScreenNodes(layoutNodes, screenNodes)
    expect(layoutNodes).toEqual(layoutCopy)
    expect(screenNodes).toEqual(screenCopy)
  })

  it('avoids id collisions between layout and screen nodes', () => {
    const collidingLayout: Record<string, AglynNodeSchema> = {
      [ROOT]: { $id: ROOT, componentId: 'root', nodes: ['hero', 'slot'] },
      hero: { $id: 'hero', componentId: 'muiAppBar', parentId: ROOT },
      slot: {
        $id: 'slot',
        componentId: LAYOUT_SLOT_COMPONENT_ID,
        parentId: ROOT,
      },
    }
    const composed = composeLayoutAndScreenNodes(collidingLayout, screenNodes)
    // Layout's "hero" is prefixed; screen's "hero" survives untouched.
    expect(composed[`${LAYOUT_NODE_ID_PREFIX}hero`].componentId).toBe(
      'muiAppBar',
    )
    expect(composed['hero'].componentId).toBe('muiContainer')
  })
})
