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

import {type ElementId} from '@aglyn/core-data-framework'
import MuiPopper, {type PopperProps as MuiPopperProps} from '@mui/material/Popper'
import {forwardRef} from 'react'
import {CanvasRenderedElementRefsConsumer} from '../contexts/canvas-rendered-element-refs'
import ElementBadgeComponent from './element-badge.component'
import ElementOutlineComponent from './element-outline.component'


const modifiers = [
  {
    name: 'flip',
    enabled: false,
    options: {
      altBoundary: false,
      rootBoundary: 'viewport',
      padding: 0,
    },
  },
  {
    name: 'preventOverflow',
    enabled: false,
    options: {
      altAxis: false,
      altBoundary: false,
      tether: false,
      rootBoundary: 'viewport',
      padding: 0,
    },
  },
]

const defaultClientRect = ({
  width: 0, height: 0,
  left: 0, top: 0, x: 0, y: 0,
}) as DOMRect
const virtualElement = {
  getBoundingClientRect: (): DOMRect => ({
    ...defaultClientRect,
    toJSON: () => ({...defaultClientRect}),
  }),
}

export interface ElementPopperComponentProps extends Partial<MuiPopperProps> {
  $id: ElementId
  variant: 'overlayHovered' | 'overlaySelected'
}

const ElementPopperComponent = forwardRef<any, ElementPopperComponentProps>(
  function RefRenderFn(props, ref) {
    const {
      $id,
      variant,
      ...rest
    } = props

    return (
      <CanvasRenderedElementRefsConsumer>
        {({getElementRef}) => {
          const current = getElementRef($id)?.current,
            element = current?.element || virtualElement

          return (
            <>
              <MuiPopper
                ref={ref}
                anchorEl={element || null}
                placement="top-start"
                modifiers={modifiers}
                open
                keepMounted
                disablePortal

                //{...elementAttributes}
                {...rest}
              >
                <ElementOutlineComponent
                  anchorEl={element || null}
                  $id={$id}
                  data-aglyn-element-outline={$id}
                />
                {variant === 'overlaySelected' && (
                  <ElementBadgeComponent
                    anchorEl={element || null}
                    $id={$id}
                    data-aglyn-element-badge={$id}
                  />
                )}
              </MuiPopper>
            </>
          )
        }}
      </CanvasRenderedElementRefsConsumer>
    )
  },
)
ElementPopperComponent.displayName = 'ElementPopperComponent'
ElementPopperComponent.defaultProps = {}

export {ElementPopperComponent}
export default ElementPopperComponent
