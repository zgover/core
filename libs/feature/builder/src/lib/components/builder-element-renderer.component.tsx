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
  ElementRendererComponent,
  ElementRendererComponentProps,
  useAglynElementData,
} from '@aglyn/feature-renderer'
import { useCombinedRefs, useConfirmationContext } from '@aglyn/shared-ui-jsx'
import { forwardRef, useCallback, useRef } from 'react'
import { useHoverContext } from '../contexts/hover-context'


export interface BuilderElementRendererComponentProps extends ElementRendererComponentProps {
  [prop: string]: any
}

const BuilderElementRendererComponentRaw = forwardRef<any, BuilderElementRendererComponentProps>(
  function RefRenderFn(props, ref) {
    const {$id, ...rest} = props
    const {hoverOpen, hoverClose, hoverSelect, hoverDeselect} = useHoverContext()
    const {confirm} = useConfirmationContext()
    const localRef = useRef()

    const handleMouseOver = useCallback((e) => {
      e.stopPropagation()
      const target = e.currentTarget
      const clientRect = target?.getBoundingClientRect?.().toJSON?.()
      if (target && clientRect) {
        hoverOpen({clientRect, $id})
      }
      else {
        hoverClose(e)
      }
    }, [hoverOpen, hoverClose, $id])

    const handleMouseLeave = useCallback((e) => {
      e.stopPropagation()
      hoverClose(e)
    }, [hoverClose, $id])

    const handleMouseDown = useCallback((e) => {
      e.stopPropagation()
      const target = e.currentTarget
      const clientRect = target?.getBoundingClientRect?.().toJSON?.()
      if (target && clientRect) {
        hoverSelect(e, {clientRect, $id})
      }
      else {
        hoverDeselect(e)
      }
      confirm({title: 'clicked'})
    }, [hoverSelect, hoverDeselect, $id])

    const {componentId, bundleId} = useAglynElementData($id)

    return (
      <ElementRendererComponent
        ref={useCombinedRefs(ref, localRef)}
        $id={$id}
        data-aglyn-element-id={$id}
        data-aglyn-component-id={componentId}
        data-aglyn-bundle-id={bundleId}
        onMouseOver={handleMouseOver}
        onMouseOut={handleMouseLeave}
        onMouseDown={handleMouseDown}
        elementRendererComponent={BuilderElementRendererComponent}
        {...rest}
      />
    )
  },
)

BuilderElementRendererComponentRaw.displayName = 'BuilderElementRendererComponent'
BuilderElementRendererComponentRaw.defaultProps = {}

export const BuilderElementRendererComponent = BuilderElementRendererComponentRaw
export default BuilderElementRendererComponent
