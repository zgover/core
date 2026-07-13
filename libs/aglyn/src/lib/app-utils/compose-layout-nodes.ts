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

import type { AglynNodeSchema, NodeId } from '../foundation'
import { NODE_ROOT_ID } from '../canvas-manager/canvas-manager'

/** Persisted component id of the layout content outlet (plugins-mui). */
export const LAYOUT_SLOT_COMPONENT_ID = 'layoutSlot'

/**
 * Prefix applied to layout node ids during composition so they can never
 * collide with screen node ids (layout ids repeat across every bound
 * screen).
 */
export const LAYOUT_NODE_ID_PREFIX = 'layout__'

type NormalizedNodes<N extends AglynNodeSchema> = Record<NodeId, N>

function prefixLayoutId(id: NodeId): NodeId {
  return id === NODE_ROOT_ID ? id : `${LAYOUT_NODE_ID_PREFIX}${id}`
}

function prefixChildIds(nodes: AglynNodeSchema['nodes']) {
  if (!Array.isArray(nodes)) return nodes
  return (nodes as NodeId[]).map((id) =>
    typeof id === 'string' ? prefixLayoutId(id) : id,
  )
}

/**
 * Grafts a screen's nodes into its layout's LayoutSlot, producing one
 * normalized node map rooted at the layout root.
 *
 * - Layout node ids are namespaced with {@link LAYOUT_NODE_ID_PREFIX} (the
 *   root id excepted) to avoid collisions with screen ids.
 * - The screen root's children are appended to the slot's own children and
 *   repointed at the slot. Slot children shouldn't normally exist, but
 *   designers do land chrome inside the slot — rendering it above the
 *   screen content preserves their intent instead of silently dropping it.
 * - Inputs are never mutated. Without layout nodes — or when the layout has
 *   no slot — the screen nodes are returned unchanged so a stale or broken
 *   layout can't take a published screen down.
 */
export function composeLayoutAndScreenNodes<
  N extends AglynNodeSchema = AglynNodeSchema,
>(
  layoutNodes: NormalizedNodes<N> | undefined,
  screenNodes: NormalizedNodes<N>,
): NormalizedNodes<N> {
  if (!layoutNodes || !layoutNodes[NODE_ROOT_ID]) return screenNodes

  const slotEntry = Object.entries(layoutNodes).find(
    ([, node]) => node?.componentId === LAYOUT_SLOT_COMPONENT_ID,
  )
  if (!slotEntry) return screenNodes

  const composed: NormalizedNodes<N> = {}

  for (const [id, node] of Object.entries(layoutNodes)) {
    const nextId = prefixLayoutId(id)
    composed[nextId] = {
      ...node,
      // Early seeds stored roots without $id or componentId, letting the
      // canvas assign fallbacks — trust the map key so root identity stays
      // canonical, and pin the root to a plain container so production
      // renderers (which have no canvas defaults) can resolve it.
      $id: id === NODE_ROOT_ID ? NODE_ROOT_ID : prefixLayoutId(node.$id ?? id),
      ...(id === NODE_ROOT_ID &&
        !node.componentId && { componentId: 'div' as N['componentId'] }),
      ...(node.parentId != null && { parentId: prefixLayoutId(node.parentId) }),
      ...(node.nodes != null && { nodes: prefixChildIds(node.nodes) }),
    }
  }

  const slotId = prefixLayoutId(slotEntry[0])
  const screenRoot = screenNodes[NODE_ROOT_ID]
  const screenRootChildIds = Array.isArray(screenRoot?.nodes)
    ? ([...screenRoot.nodes] as NodeId[])
    : []
  const slotChildIds = Array.isArray(composed[slotId]?.nodes)
    ? (composed[slotId].nodes as NodeId[])
    : []

  composed[slotId] = {
    ...composed[slotId],
    nodes: [...slotChildIds, ...screenRootChildIds],
  }

  for (const [id, node] of Object.entries(screenNodes)) {
    if (id === NODE_ROOT_ID) continue
    const isTopLevel = node?.parentId === NODE_ROOT_ID
    composed[id] = isTopLevel ? { ...node, parentId: slotId } : node
  }
  // Top-level screen nodes may rely on child arrays alone (no parentId).
  for (const childId of screenRootChildIds) {
    const node = composed[childId]
    if (node && node.parentId !== slotId) {
      composed[childId] = { ...node, parentId: slotId }
    }
  }

  return composed
}

export default composeLayoutAndScreenNodes
