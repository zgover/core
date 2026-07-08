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

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function substitute(value: unknown, pattern: RegExp, tokens: Record<string, string>): unknown {
  if (typeof value === 'string') {
    return value.replace(pattern, (_, name: string) => tokens[name] ?? '')
  }
  if (Array.isArray(value)) {
    return value.map((entry) => substitute(entry, pattern, tokens))
  }
  if (value && typeof value === 'object') {
    const next: Record<string, unknown> = {}
    for (const [key, entry] of Object.entries(value)) {
      next[key] = substitute(entry, pattern, tokens)
    }
    return next
  }
  return value
}

/**
 * Named-token substitution (AGL-105): replaces `{{name}}` occurrences in
 * every node's string props with the provided values — used for
 * entry-template screens where the tenant injects `entry.title`,
 * `entry.body`, etc. Only the provided names are touched, so host variable
 * and function tokens pass through to the regular binding resolver.
 */
export function resolveNamedTokens<N extends AglynNodeSchema = AglynNodeSchema>(
  nodes: Record<NodeId, N>,
  tokens: Record<string, string> | null | undefined,
): Record<NodeId, N> {
  const names = Object.keys(tokens ?? {})
  if (!tokens || names.length === 0) return nodes
  const pattern = new RegExp(
    `\\{\\{\\s*(${names.map(escapeRegExp).join('|')})\\s*\\}\\}`,
    'g',
  )
  const next: Record<NodeId, N> = {}
  for (const [id, node] of Object.entries(nodes)) {
    next[id] = node?.props
      ? { ...node, props: substitute(node.props, pattern, tokens) as any }
      : node
  }
  return next
}

export default resolveNamedTokens
