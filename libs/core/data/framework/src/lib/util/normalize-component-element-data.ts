/**
 * @license
 * Copyright 2022 Aglyn LLC
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

import {_hasOwnProperty, _isStrT} from '@aglyn/shared-util-guards'
import {arraySafe} from '@aglyn/shared-util-tools'
import type {
  AglynElementDenormalized,
  AglynElementNormalized,
  AglynElementsList,
  AglynElementsNormalized,
  ElementId,
} from '../types/aglyn-elements.types'
import {AglynElementsDenormalized} from '../types/aglyn-elements.types'


const normalizeData = (
  element: AglynElementDenormalized,
  flatMap: AglynElementsDenormalized = {},
  elemData: AglynElementsList = [],
): AglynElementNormalized => {
  if (element) {
    const el = element as unknown as AglynElementNormalized
    el.elements = [...arraySafe(el?.elements)].reduce((accumulator, $id) => {
      if (_hasOwnProperty($id, flatMap)) {
        return [
          ...accumulator,
          normalizeData(flatMap[$id], flatMap, elemData),
        ].filter(Boolean)
      }
      return accumulator
    }, [])
    return el
  }
  return undefined
}

export function normalizeComponentElementData(
  element: AglynElementDenormalized,
  parentId: ElementId,
): AglynElementsNormalized
export function normalizeComponentElementData(
  elements: AglynElementsDenormalized,
  parentId: ElementId,
): AglynElementsNormalized
export function normalizeComponentElementData(
  elements: AglynElementDenormalized | AglynElementsDenormalized,
  parentId: ElementId,
): AglynElementsNormalized {
  const elemData: AglynElementsNormalized = []

  if (elements) {
    try {
      const elems = elements?.$id && _isStrT(elements?.$id)
        ? {[elements.$id]: {...elements}} as AglynElementsDenormalized
        : {...elements} as AglynElementsDenormalized

      elemData.push(
        ...(elems[parentId]?.elements || []).map(($id: any) =>
          normalizeData(elems[$id], elems, elemData),
        ).filter(Boolean),
      )
    }
    catch (error) {
      console.error(error)
    }
  }

  return elemData
}
export default normalizeComponentElementData
