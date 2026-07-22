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

import { nodesReferenceComponent } from '@aglyn/aglyn/server'

export interface UsageDependent {
  type: 'screen' | 'layout' | 'component'
  id: string
  name: string
  via: Array<'id' | 'name'>
  versionId?: string
}

/** A screen/layout/component reduced to what a usage scan needs. */
export interface UsageCandidate {
  id: string
  displayName?: string
  /** Legacy field some older documents used instead of `displayName`. */
  name?: string
  deletedAt?: unknown
  /**
   * Node tree to search. For screens and layouts this is the PUBLISHED
   * version's nodes (what visitors see); for components it is the definition
   * tree off the component document, which is what the runtime reads.
   */
  nodes?: Record<string, any> | null
  /** Published version, carried through so the caller can deep-link. */
  versionId?: string
  /** Screens only: the layout they render inside. */
  layoutId?: string
}

/** `displayName`, falling back to a legacy `name`, then the raw id. */
function labelFor(candidate: UsageCandidate): string {
  return String(candidate.displayName ?? candidate.name ?? candidate.id)
}

const isLive = (candidate: UsageCandidate) => !candidate.deletedAt

/**
 * Everything that references a reusable component (AGL-703).
 *
 * Three places, because the renderer expands instances in three places:
 * published screen versions, published layout versions, and OTHER component
 * definitions — `composeReusableComponentNodes` grafts nested instances, so
 * a component used only inside another component is genuinely used. Omitting
 * that third scan would report "used nowhere" for it and invite a confident
 * deletion, which is worse than showing nothing at all.
 */
export function scanComponentUsage(
  componentId: string,
  sources: {
    screens: UsageCandidate[]
    layouts: UsageCandidate[]
    components: UsageCandidate[]
  },
): UsageDependent[] {
  if (!componentId) return []
  const dependents: UsageDependent[] = []
  const collect = (
    candidates: UsageCandidate[],
    type: UsageDependent['type'],
  ) => {
    for (const candidate of candidates) {
      if (!isLive(candidate)) continue
      // A component never counts as using itself, however it nests.
      if (type === 'component' && candidate.id === componentId) continue
      if (!nodesReferenceComponent(candidate.nodes, componentId)) continue
      dependents.push({
        type,
        id: candidate.id,
        name: labelFor(candidate),
        // Instances reference by id, so a rename can never break them.
        via: ['id'],
        ...(candidate.versionId ? { versionId: candidate.versionId } : {}),
      })
    }
  }
  collect(sources.screens, 'screen')
  collect(sources.layouts, 'layout')
  collect(sources.components, 'component')
  return dependents
}

/**
 * Every screen rendering inside a layout (AGL-703).
 *
 * `screen.layoutId` is the ONLY reference to a layout that exists — layout
 * composition takes exactly one layout id and reads it from the screen, so
 * layout-inside-layout is not a thing the data model can express. Screens are
 * therefore the complete answer here, not a partial one.
 */
export function scanLayoutUsage(
  layoutId: string,
  screens: UsageCandidate[],
): UsageDependent[] {
  if (!layoutId) return []
  return screens
    .filter((screen) => isLive(screen) && screen.layoutId === layoutId)
    .map((screen) => ({
      type: 'screen' as const,
      id: screen.id,
      name: labelFor(screen),
      via: ['id' as const],
      ...(screen.versionId ? { versionId: screen.versionId } : {}),
    }))
}
