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

import {
  LeafComponent,
  type LeafComponentProps,
  useAglynElementData,
} from '@aglyn/core-feature-renderer'
import {useCombinedRefs, useDebouncedTransition} from '@aglyn/shared-ui-jsx'
import {type ChangeEvent, forwardRef, useCallback, useEffect, useMemo, useRef} from 'react'
import {useRenderedCanvasElements} from '../contexts/rendered-canvas-elements'
import {useAglynCanvasSetHovered} from '../hooks/use-aglyn-canvas-hovered'
import useAglynCanvasElementIsSelected from '../hooks/use-aglyn-canvas-is-element-selected'
import {useAglynCanvasSetSelected} from '../hooks/use-aglyn-canvas-selected'
import useLeafDnd from '../hooks/use-leaf-dnd'


export interface ElementLeafComponentProps extends LeafComponentProps {}

const ElementLeafComponent = forwardRef<any, ElementLeafComponentProps>(
  function RefRenderFn(props, ref) {
    const {$id, leafComponent, ...rest} = props
    const componentId = useAglynElementData($id, 'componentId')
    const bundleId = useAglynElementData($id, 'bundleId')
    const isSelected = useAglynCanvasElementIsSelected($id)
    const setHovered = useAglynCanvasSetHovered()
    const setSelected = useAglynCanvasSetSelected()
    const elemRef = useRef<Element>(null)
    const leaf = useMemo(() => leafComponent || ElementLeafComponent, [leafComponent])
    const [dragHandleRef, dragPreviewRef, dropRef] = useLeafDnd($id)
    const [setElementRef, deleteElementRef] = useRenderedCanvasElements()
    const [, debounceUpdate] = useDebouncedTransition(200, {trailing: true, leading: false}, [])

    useEffect(() => {
      setElementRef($id, {$id, element: elemRef, dragHandle: dragHandleRef})
      console.log('setElementRef', $id, elemRef)
      return () => deleteElementRef($id)
    }, [$id, deleteElementRef, dragHandleRef, setElementRef])


    const handleOnMouseOver = useCallback((e: ChangeEvent<any>) => {
      e.stopPropagation()
      debounceUpdate(() => {
        setHovered({$id})
      })
    }, [$id, setHovered, debounceUpdate])
    const handleOnMouseDown = useCallback((e: ChangeEvent<any>) => {
      e.preventDefault()
      e.stopPropagation()
      debounceUpdate(() => {
        setSelected((prev) => ({$id: $id && prev?.$id === $id ? undefined : $id}))
      })
    }, [$id, setSelected, debounceUpdate])

    console.log('leaf component besigner', rest)

    // console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~')
    // console.log('element attributes', elementAttributes)

    return (
      <LeafComponent
        ref={useCombinedRefs(ref, elemRef, dragPreviewRef, dropRef)}
        $id={$id}
        leafComponent={leaf}
        onMouseOver={handleOnMouseOver}
        onMouseDown={handleOnMouseDown}
        data-aglyn-element-id={$id}
        data-aglyn-element-component={componentId}
        data-aglyn-element-bundle={bundleId}
        data-aglyn-element-selected={isSelected}
        {...rest}
      />
    )
  },
)

ElementLeafComponent.displayName = 'Besigner.LeafComponent'
ElementLeafComponent.aglyn = true
ElementLeafComponent.defaultProps = {}

export {ElementLeafComponent}
export default ElementLeafComponent
