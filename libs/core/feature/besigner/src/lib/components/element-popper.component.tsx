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
  type BesignerCanvasState,
  BesignerPanelTabFlag,
  duplicateCanvasElement,
  isRootElementId,
  setBesignerCanvasSelected,
  setBesignerPanels,
} from '@aglyn/core-data-framework'
import {useAglynAppContext, useAglynElementData} from '@aglyn/core-feature-renderer'
import {IconVariant} from '@aglyn/shared-data-brand'
import {type KeyOf} from '@aglyn/shared-data-types'
import MuiButtonGroup from '@mui/material/ButtonGroup'
import MuiPopper, {type PopperProps as MuiPopperProps} from '@mui/material/Popper'
import {ChangeEvent, forwardRef} from 'react'
import {CanvasRenderedElementRefsConsumer} from '../contexts/canvas-rendered-element-refs'
import useAglynBesignerStoreState from '../hooks/use-aglyn-besigner-store-state'
import {BadgeButton} from './element-overlay-badge-buttons.component'
import ElementOverlayOutlineComponent from './element-overlay-outline-component'


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


const variantToStoreName: Record<PopperVariant, KeyOf<BesignerCanvasState>> = {
  selectedOverlay: 'selected',
  hoveredOverlay: 'hovered',
}

export type PopperVariant =
  | 'hoveredOverlay'
  | 'selectedOverlay'

export interface ElementPopperComponentProps extends Partial<MuiPopperProps> {
  variant: PopperVariant
}

const ElementPopperComponent = forwardRef<any, ElementPopperComponentProps>(
  function RefRenderFn(props, ref) {
    const {
      variant,
      ...rest
    } = props


    const {getApp} = useAglynAppContext()
    const selected = useAglynBesignerStoreState('canvas', 'selected')
    const hovered = useAglynBesignerStoreState('canvas', 'hovered')
    const state = {selected, hovered}[variantToStoreName[variant]]
    const $id = state?.$id
    const parentId = useAglynElementData($id, 'parentId') || null

    return (
      <CanvasRenderedElementRefsConsumer>
        {({getElementRef}) => {
          const data = getElementRef($id)
          const anchorEl = data?.element?.current,
            dragHandle = data?.dragHandle

          // console.log('anchorEl', variant, $id, getElementRef($id))

          return (
            <MuiPopper
              ref={ref}
              anchorEl={anchorEl}
              placement="top-start"
              modifiers={modifiers}
              data-aglyn-overlay-id={$id}
              data-aglyn-overlay-variant={variant}
              data-aglyn-overlay-type="popper"
              open={Boolean(anchorEl)}
              keepMounted
              disablePortal
              {...rest}
            >
              <ElementOverlayOutlineComponent
                $id={$id}
                anchorEl={anchorEl}
                data-aglyn-overlay-id={$id}
                data-aglyn-overlay-variant={variant}
                data-aglyn-overlay-type="outline"
              >

                {variant === 'selectedOverlay' && (
                  <MuiButtonGroup
                    ref={ref}
                    variant="contained"
                    color={'primary' as any}
                    aria-label="element controls"
                    data-aglyn-overlay-id={$id}
                    data-aglyn-overlay-variant={variant}
                    data-aglyn-overlay-type="badge"
                    sx={{
                      boxShadow: 4,
                      position: 'absolute',
                      left: 0, top: 0,
                      marginTop: '-32px',
                      pointerEvents: 'auto',
                    }}
                    {...rest}
                  >
                    {!isRootElementId($id) && (
                      <BadgeButton
                        title="Drag"
                        children="drag"
                        ButtonProps={{ref: dragHandle}}
                        iconPath={IconVariant.MODIFY_DRAG}
                        IconProps={{color: 'secondary'}}
                      />
                    )}
                    {!isRootElementId($id) && (
                      <BadgeButton
                        title="Duplicate"
                        children="duplicate"
                        ButtonProps={{onClick: handleDuplicateClick}}
                        iconPath={IconVariant.MODIFY_DUPLICATE}
                      />
                    )}
                    <BadgeButton
                      title="Modify"
                      children="modify"
                      onClick={handleModifyClick}
                      iconPath={IconVariant.MODIFY_EDIT}
                    />

                    {parentId && (
                      <BadgeButton
                        title="Select parent"
                        children={'select parent'}
                        ButtonProps={{onClick: handleSelectParentClick}}
                        iconPath={IconVariant.SELECT_PARENT}
                      />
                    )}
                  </MuiButtonGroup>
                )}
              </ElementOverlayOutlineComponent>
            </MuiPopper>
          )
        }}
      </CanvasRenderedElementRefsConsumer>
    )


    function handleDuplicateClick(e: ChangeEvent<unknown>) {
      duplicateCanvasElement(getApp(), {$id})
    }

    function handleSelectParentClick(e: ChangeEvent<unknown>) {
      setBesignerCanvasSelected(getApp(), {
        selected: (prev) => ({
          ...prev,
          $id: parentId,
        }),
      })
    }

    function handleModifyClick(e: ChangeEvent<unknown>) {
      setBesignerPanels(getApp(), {
        panels: (panels) => ({
          ...panels,
          panelRight: {
            ...panels.panelRight,
            toggled: true,
            tab: BesignerPanelTabFlag.ELEMENT_PROPS_FORM,
          },
        }),
      })
    }
  },
)
ElementPopperComponent.displayName = 'ElementPopperComponent'
ElementPopperComponent.defaultProps = {}

export {ElementPopperComponent}
export default ElementPopperComponent
