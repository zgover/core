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

import {arraySafe} from '@aglyn/shared-util-tools'
import {CANVAS_ROOT_ELEMENT_ID} from '../constants/canvas'
import {
  type AglynElementDenormalized,
  type AglynElementNormalized,
  type AglynElementsDenormalized,
  type AglynElementsNormalized,
  type ElementId,
} from '../types/aglyn-elements.types'


const denormalizeData = (
  element: AglynElementNormalized,
  parent?: ElementId,
  accumulator: AglynElementsDenormalized = {},
): AglynElementsDenormalized => {
  if (element && element?.$id) {
    updateElementMap(parent || element.parentId)
  }
  return accumulator

  function updateElementMap(parentId: ElementId) {
    const el = element as unknown as AglynElementDenormalized
    const childElements = [...arraySafe(el.elements)]
    accumulator[el.$id] = el
    el.parentId = parentId || CANVAS_ROOT_ELEMENT_ID
    el.elements = childElements.map((child) => {
      denormalizeData(child, el.$id, accumulator)
      return child?.$id
    })
  }
}

export function denormalizeComponentElementData(
  element: AglynElementNormalized,
  parentId?: ElementId,
): AglynElementsDenormalized
export function denormalizeComponentElementData(
  elements: AglynElementsNormalized,
  parentId?: ElementId,
): AglynElementsDenormalized
export function denormalizeComponentElementData(
  elements: AglynElementNormalized | AglynElementsNormalized,
  parentId?: ElementId,
): AglynElementsDenormalized {
  const elemData: AglynElementsDenormalized = {}

  if (elements) {
    try {
      arraySafe(
        elements as AglynElementsNormalized,
        [elements] as [AglynElementNormalized],
      ).reduce(
        (accumulator, element) => ({
          ...accumulator,
          ...denormalizeData(element, parentId, elemData),
        }),
        elemData,
      )
    }
    catch (error) {
      console.error(error)
    }
  }

  return elemData
}
export default denormalizeComponentElementData
