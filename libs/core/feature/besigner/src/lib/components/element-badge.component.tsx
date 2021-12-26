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
import {
  PopperStyledArrowComponent,
  PopperStyledComponent,
  type PopperStyledComponentProps,
} from '@aglyn/shared-ui-jsx'
import {VirtualElement} from '@aglyn/shared-util-dom'
import Zoom from '@mui/material/Zoom'
import {forwardRef, useState} from 'react'
import useAglynCanvasElementStatus from '../hooks/use-aglyn-canvas-element-status'
import {ElementOverlayBadgeButtonsComponent} from './element-overlay-badge-buttons.component'


export interface ElementBadgeComponentProps extends Partial<PopperStyledComponentProps> {
  $id: ElementId
  anchorEl?: VirtualElement
}

const ElementBadgeComponent = forwardRef<any, ElementBadgeComponentProps>(
  function RefRenderFn(props, ref) {
    const {$id, disableArrow, anchorEl, ...rest} = props

    const [arrowRef, setArrowRef] = useState(null)
    const {isSelfSelected} = useAglynCanvasElementStatus($id)

    const modifiers = [
      {
        name: 'flip',
        enabled: true,
        options: {
          altBoundary: true,
          rootBoundary: 'document',
          padding: 8,
        },
      },
      {
        name: 'preventOverflow',
        enabled: true,
        options: {
          altAxis: false,
          altBoundary: true,
          tether: true,
          rootBoundary: 'document',
          padding: 8,
        },
      },
      {
        name: 'arrow',
        enabled: !disableArrow,
        options: {
          element: arrowRef,
        },
      },
    ]

    return (
      <PopperStyledComponent
        ref={ref}
        placement="top"
        disableArrow={disableArrow}
        modifiers={modifiers}
        anchorEl={anchorEl}
        open={Boolean(isSelfSelected && anchorEl)}
        keepMounted
        disablePortal
        transition
        arrowGap={8}
        {...rest}
      >
        {({TransitionProps}) => (
          <Zoom {...TransitionProps}>
            <div>
              {!disableArrow && <PopperStyledArrowComponent ref={setArrowRef} />}
              <ElementOverlayBadgeButtonsComponent $id={$id} />
            </div>
          </Zoom>
        )}
      </PopperStyledComponent>
    )
  },
)

ElementBadgeComponent.displayName = 'ElementBadgeComponent'
ElementBadgeComponent.defaultProps = {}

export {ElementBadgeComponent}
export default ElementBadgeComponent
