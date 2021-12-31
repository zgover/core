/**
 * @license
 * Copyright 2021 Aglyn LLC
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
  type BesignerDndElementActive,
  type BesignerDndElementOver,
  DndDragSourceTypeFlag,
  DndDropLinealTypeFlag,
  isRootElementId,
  setBesignerCanvasHovered,
  setBesignerCanvasSelected,
  setBesignerDndState,
} from '@aglyn/core-data-framework'
import {
  LeafComponent,
  type LeafComponentProps,
  useAglynAppContext,
  useAglynCanvasApiEvents,
  useAglynCanvasElementHierarchy,
  useAglynComponentSchema,
  useAglynElementData,
} from '@aglyn/core-feature-renderer'
import {useCombinedRefs} from '@aglyn/shared-ui-jsx'
import {forwardRef, type MouseEvent, useCallback, useEffect, useMemo, useRef} from 'react'
import {DropTargetMonitor, useDrag, useDrop} from 'react-dnd'
import {useCanvasRenderedElementRefs} from '../contexts/canvas-rendered-element-refs'


type DropCollected = {
  isOver?: boolean
  isOverSelf?: boolean
  // isNotOverSelf?: boolean
  isOverChildren?: boolean
  isOverSameDrag?: boolean
  isOverChildOfSameDrag?: boolean
  isOverDropOfDrag?: boolean
}
type DragCollected = {
  isDragging?: boolean,
  active?: BesignerDndElementActive
  over?: BesignerDndElementOver,
}

export interface ElementLeafComponentProps extends LeafComponentProps {
  [prop: string]: any
}

const ElementLeafComponent = forwardRef<any, ElementLeafComponentProps>(
  function RefRenderFn(props, ref) {
    const {$id, leafComponent, ...rest} = props
    const {getApp} = useAglynAppContext()
    const {moveElement} = useAglynCanvasApiEvents()
    const leaf = leafComponent || ElementLeafComponent
    const componentId = useAglynElementData($id, 'componentId')
    const bundleId = useAglynElementData($id, 'bundleId')
    const componentSchema = useAglynComponentSchema(componentId, bundleId)
    const hierarchy = componentSchema?.renderFlags?.hierarchy


    const handleSelect = useCallback((e: MouseEvent) => {
      e.stopPropagation()
      e.preventDefault()
      setBesignerCanvasSelected(getApp(), {
        selected: () => ({$id}),
      })
    }, [$id, getApp])


    const handleMouseOver = useCallback((e: MouseEvent) => {
      e.stopPropagation()
      setBesignerCanvasHovered(getApp(), {
        hovered: () => ({$id}),
      })
    }, [$id, getApp])


    const handleMouseLeave = useCallback((e: MouseEvent) => {
      e.stopPropagation()
      setBesignerCanvasHovered(getApp(), {
        hovered: (prev) => prev.$id === $id ? {} : prev,
      })
    }, [$id, getApp])


    const handleDragStart = useCallback((active: BesignerDndElementActive) => {
      console.log('handleDragStart', $id, active)
      // console.log('handle drag over', $id, active)

      setBesignerCanvasSelected(getApp(), {
        selected: () => ({$id: active.$id}),
      })
      setBesignerDndState(getApp(), {
        dnd: () => ({active}),
      })
    }, [$id, getApp])


    const handleDragOver = useCallback((over?: BesignerDndElementOver) => {
      setBesignerCanvasHovered(getApp(), {
        hovered: () => ({$id: over?.$id}),
      })
      setBesignerDndState(getApp(), {
        dnd: (prev) => ({...prev, over}),
      })
    }, [getApp])


    const handleDragEnd = useCallback((
      active: BesignerDndElementActive,
      over?: BesignerDndElementOver
    ) => {
      console.log('handleDragEnd', active, over)
      setBesignerDndState(getApp(), {dnd: () => ({})})
      if (over?.$id && active?.$id !== over.$id) {
        moveElement({$id: active.$id, parentId: over?.$id, index: -1})
      }
    }, [getApp, moveElement])


    const dragItem = useMemo(() => ({
      $id,
      type: DndDragSourceTypeFlag.CANVAS_ELEMENT,
      componentId,
      bundleId,
      hierarchy,
    }), [$id, bundleId, componentId, hierarchy])


    const [{isDragging}, dragHandle, dragRef] = useDrag<BesignerDndElementActive, BesignerDndElementOver, DragCollected>(() => ({
      type: 'aglyn-element',
      item: (monitor) => {
        handleDragStart(dragItem)
        return dragItem
      },
      isDragging: (monitor) => monitor?.getItem()?.$id === $id,
      canDrag: !isRootElementId($id),
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
        // over: monitor.getDropResult(),
        // active: monitor.getItem(),
      }),
    }))


    const isOverDropOfDrag = isDragging
    const trail = useAglynCanvasElementHierarchy($id)


    const dropCollector = useCallback((monitor: DropTargetMonitor) => {
      const active = monitor.getItem<BesignerDndElementActive>()
      const isOverDrop = trail.some((i) => i === $id)
      const isInSame = isOverDrop && active && active.$id && trail.some((i) => i === active.$id)
      const isOver = monitor.isOver({shallow: false})
      const isOverSelf = monitor.isOver({shallow: true})
      // const isNotOverSelf = monitor.isOver({ shallow: false })
      const isOverChildren = isOver && !isOverSelf
      const isOverSameDrag = isOver && isOverDropOfDrag
      const isOverChildOfSameDrag = isInSame && !isOverSameDrag

      return {
        isOver,
        isOverSelf,
        // isNotOverSelf,
        isOverChildren,
        isOverSameDrag,
        isOverChildOfSameDrag,
        isOverDropOfDrag,
      }
    }, [$id, isOverDropOfDrag, trail])


    const over: BesignerDndElementOver = useMemo(() => ({
      $id,
      type: DndDropLinealTypeFlag.ACTIVITY_ELEMENT_INSIDE,
      componentId,
      bundleId,
      hierarchy,
    }), [$id, bundleId, componentId, hierarchy])


    const [dropCollected, dropRef] = useDrop<BesignerDndElementActive, BesignerDndElementOver, DropCollected>(() => ({
      accept: 'aglyn-element',
      drop: (active, monitor) => {
        if (monitor.didDrop()) return
        setBesignerDndState(getApp(), {dnd: () => ({})})

        if (monitor.isOver({shallow: true})) {
          console.log('drp collection', active, over)
          handleDragEnd(active, over)
        }
        return over
      },
      collect: dropCollector,
    }))


    const {isOverSelf} = dropCollected
    // const localRef = useRef<CanvasElementRefEntry>({
    //   $id, element: elemRef, dragHandle,
    // })


    const {setElementRef, deleteElementRef} = useCanvasRenderedElementRefs()
    const elemRef = useRef<Element>(null)
    setElementRef($id, {$id, element: elemRef, dragHandle})


    useEffect(() => {
      // setElementRef($id, localRef)
      return () => {
        deleteElementRef($id)
      }
    }, [$id, deleteElementRef])


    useEffect(() => {
      isOverSelf && handleDragOver(over)
    }, [handleDragOver, isOverSelf, over])


    // console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~')
    // console.log('element attributes', elementAttributes)

    return (
      <LeafComponent
        ref={useCombinedRefs(ref, elemRef, dragRef, dropRef)}
        $id={$id}
        leafComponent={leaf}
        onMouseOver={handleMouseOver}
        // onMouseLeave={handleMouseLeave}
        onMouseDown={handleSelect}
        data-aglyn-element-type="element"
        data-aglyn-element-id={$id}
        data-aglyn-element-component={componentId}
        data-aglyn-element-bundle={bundleId}
        {...rest}
      />
    )
  },
)

ElementLeafComponent.displayName = 'Besigner.LeafComponent'
ElementLeafComponent.defaultProps = {}

export {ElementLeafComponent}
export default ElementLeafComponent
