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

import * as Aglyn from '@aglyn/aglyn'
import {
  type BesignerDraggableItem,
  type BesignerDroppableItem,
  DndDragType,
} from '@aglyn/besigner-data-app'
import { addCanvasElement, moveCanvasElement } from '@aglyn/core-data-app'
import { CANVAS_ROOT_ELEMENT_ID } from '@aglyn/core-data-foundation'
import { useAglynAppContext } from '@aglyn/core-feature-renderer'
import { createComponentElementData } from '@aglyn/core-util-app'
import {
  type ConnectDragPreview,
  type ConnectDragSource,
  useDrag,
} from 'react-dnd'
import { useAglynCanvasSetSelected } from './use-aglyn-canvas-selected'
import { useAglynDndSetActive } from './use-aglyn-dnd-active'
import { useAglynDndSetOver } from './use-aglyn-dnd-over'

export type DragCollected = {
  isDragging: boolean
}

export function useLeafDrag<T extends BesignerDraggableItem>(
  dragObject?: T,
  type: DndDragType = DndDragType.CANVAS,
): [DragCollected, ConnectDragSource, ConnectDragPreview] {
  const app = useAglynAppContext()
  const setSelected = useAglynCanvasSetSelected()
  const setDndActive = useAglynDndSetActive()
  const setDndOver = useAglynDndSetOver()

  // console.log('dragItem item canDrag', dragItem, $id, type, canDrag, flags)

  return useDrag<T, BesignerDroppableItem, DragCollected>(
    () => ({
      options: {
        dropEffect: 'move',
      },
      previewOptions: {
        offsetY: -50,
      },
      type,
      isDragging: (monitor) => {
        return dragObject?.$id && dragObject?.$id === monitor.getItem()?.$id
      },
      item: () => {
        console.log('draggable item', dragObject)
        if (type !== DndDragType.TEMPLATE) {
          setSelected({ $id: dragObject.$id })
          setDndActive(dragObject)
        }
        return dragObject
      },
      canDrag: (monitor) => {
        const item = monitor.getItem()
        if (Aglyn.screen.isRootNodeId(item?.$id)) return false
        const schema = Aglyn.components.getSchema(item?.componentId)
        return Aglyn.isFeatureEnabled(schema?.flags?.dragging)
      },
      end: (dragItem, monitor) => {
        setDndActive(undefined)
        setDndOver(undefined)
        const dropItem = monitor.getDropResult()
        console.log('end drag ', dragItem, dropItem)
        if (!monitor.didDrop()) return
        if (!dropItem) return
        if (type === DndDragType.TEMPLATE) {
          const newElement = {
            index: NaN,
            parentId: dropItem?.$id || CANVAS_ROOT_ELEMENT_ID,
            element: createComponentElementData(dragItem as any),
          }
          addCanvasElement(app, newElement)
          setSelected({ $id: newElement.element.$id })
        } else {
          moveCanvasElement(app, {
            $id: dragItem.$id,
            parentId: dropItem?.$id,
            index: NaN,
          })
        }
      },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [dragObject, app, type, setSelected, setDndActive],
  )
}
export default useLeafDrag
