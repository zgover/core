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

import {_hasOwnProperty} from '@aglyn/shared-util-guards'
import {arrayMoveAtIndex, arrayPushAtIndex, arrayRemoveItem, copy} from '@aglyn/shared-util-tools'
import {CANVAS_ROOT_ELEMENT_ID} from '../constants/canvas'
import type {
  CanvasAddElementPayload,
  CanvasDeleteElementPayload,
  CanvasDuplicateElementPayload,
  CanvasMoveElementPayload,
  CanvasSetElementPayload,
  CanvasSetElementsPayload,
  CanvasUpdateElementPayload,
} from '../constants/emitter'
import type {CanvasContext} from '../types/aglyn-canvas.types'
import type {AglynElementsDenormalized, ElementId} from '../types/aglyn-elements.types'
import {createComponentElementDataCopy} from './create-component-element-data-copy'
import {deleteComponentElement} from './delete-component-element'
import {denormalizeComponentElementData} from './denormalize-component-element-data'
import {getComponentElementHierarchy} from './get-component-element-hierarchy'
import {handleStateModificationHistoryChange} from './handle-state-modification-history-change'


type CanvasApiEventHandler<S extends CanvasContext, P> = (
  state: CanvasContext['present'],
  payload: P,
) => CanvasContext['present']

export const handleCanvasApiChangeEvent = <S extends CanvasContext, P>(
  fn: CanvasApiEventHandler<S, P>,
) => (
  state: S, payload: P,
) => {
  return handleStateModificationHistoryChange(copy(state), fn(state.present, payload))
}


export const handleCanvasSetElements = (
  state: AglynElementsDenormalized,
  payload: CanvasSetElementsPayload,
) => {

  const {elements} = payload || {}
  return elements || {}
}
export const handleCanvasAddElement = (
  state: AglynElementsDenormalized,
  payload: CanvasAddElementPayload,
) => {

  const {index} = payload

  const element = copy(payload.element)
  let parentId: ElementId = null

  if (_hasOwnProperty(payload.parentId, state)) {
    parentId = payload.parentId
  }
  else {
    console.error('Element must have a valid parent, falling back to root')
    parentId = CANVAS_ROOT_ELEMENT_ID
  }

  const newData = denormalizeComponentElementData(element, parentId)
  const siblingIds = state[parentId]?.elements || []
  const newElements = newData[parentId]?.elements || []

  return {
    ...state,
    ...newData,
    [parentId]: {
      ...state[parentId],
      elements: arrayPushAtIndex(
        state[parentId]?.elements || [],
        index === -1 ? siblingIds.length : index,
        ...newElements,
      ),
    },
  }
}


export const handleCanvasUpdateElement = (
  state: AglynElementsDenormalized,
  payload: CanvasUpdateElementPayload,
) => {

  const element = copy(payload.element)

  return {
    ...state,
    [element.$id]: {
      ...state[element.$id],
      ...element,
    },
  } as CanvasContext['present']
}


export const handleCanvasSetElement = (
  state: AglynElementsDenormalized,
  payload: CanvasSetElementPayload,
) => {

  const element = copy(payload.element)
  return {
    ...state,
    [element.$id]: {
      ...element,
    },
  } as CanvasContext['present']
}


export const handleCanvasMoveElement = (
  state: AglynElementsDenormalized,
  payload: CanvasMoveElementPayload,
) => {

  const {$id, index} = payload
  let parentId: ElementId = null

  if (_hasOwnProperty(payload.parentId, state)) {
    parentId = payload.parentId
  }
  else {
    console.error('Element must have a valid parent, falling back to root')
    parentId = CANVAS_ROOT_ELEMENT_ID
  }

  const parentHierarchy = getComponentElementHierarchy(parentId, state)
  if (parentHierarchy.indexOf($id) >= 0) {
    throw new Error('New parent is same or a child of the element')
  }

  const current = copy({...state[$id]})
  const response = copy({
    ...state,
    [$id]: {
      ...current,
      parentId: parentId,
    },
  })
  const siblingIds = response[parentId]?.elements || []

  if (parentId === current.parentId) {
    console.log('reordering')
    response[parentId] = {
      ...response[parentId],
      elements: arrayMoveAtIndex(
        siblingIds,
        siblingIds.indexOf($id),
        index === -1 ? siblingIds.length : index,
      ),
    }
  }
  else {
    console.log('moving')
    const currentParentElements = response[current.parentId].elements || []

    response[parentId] = {
      ...response[parentId],
      elements: arrayPushAtIndex(
        siblingIds,
        index === -1 ? siblingIds.length : index,
        $id,
      ),
    }

    response[current.parentId] = {
      ...response[current.parentId],
      elements: arrayRemoveItem(currentParentElements, $id),
    }
  }

  return response
}


export const handleCanvasDuplicateElement = (
  state: AglynElementsDenormalized,
  payload: CanvasDuplicateElementPayload,
) => {

  const {$id} = payload
  const element = state[$id]
  const parent = state[element?.parentId]
  const position = (parent?.elements ?? []).indexOf($id)
  const elementCopy = createComponentElementDataCopy($id, state)
  return handleCanvasAddElement(state, {
    element: elementCopy,
    parentId: elementCopy.parentId,
    index: position + 1,
  })
}
export const handleCanvasDeleteElement = (
  state: AglynElementsDenormalized,
  payload: CanvasDeleteElementPayload,
) => {

  const {$id} = payload
  return deleteComponentElement($id, state)
}
