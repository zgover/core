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
  BesignerPanelTabFlag,
  duplicateCanvasElement,
  type ElementId,
  isRootElementId,
  setBesignerCanvasSelected,
  setBesignerPanels,
} from '@aglyn/core-data-framework'
import {useAglynAppContext, useAglynElementData} from '@aglyn/core-feature-renderer'
import {IconVariant} from '@aglyn/shared-data-brand'
import {SrOnlyComponent, type SrOnlyComponentProps} from '@aglyn/shared-ui-jsx'
import {MdiIcon, type MdiIconProps} from '@aglyn/shared-ui-mdi-jsx'
import MuiButton, {type ButtonProps} from '@mui/material/Button'
import MuiButtonGroup, {type ButtonGroupProps} from '@mui/material/ButtonGroup'
import MuiTooltip, {type TooltipProps} from '@mui/material/Tooltip'
import {type ChangeEvent, forwardRef} from 'react'
import {CanvasRenderedElementRefsConsumer} from '../contexts/canvas-rendered-element-refs'


export interface BadgeButtonProps extends Omit<TooltipProps, 'children'> {
  children?: SrOnlyComponentProps['children']
  iconPath: MdiIconProps['path']
  ButtonProps?: ButtonProps
  IconProps?: MdiIconProps
  SrOnlyProps?: SrOnlyComponentProps
}

export const BadgeButton = forwardRef<any, BadgeButtonProps>(
  function RefRenderFn(props, ref) {
    const {
      children,
      ButtonProps,
      iconPath,
      IconProps,
      SrOnlyProps,
      ...rest
    } = props

    return (
      <MuiTooltip ref={ref} {...rest}>
        <MuiButton {...ButtonProps}>
          <MdiIcon fontSize="small" path={iconPath} {...IconProps} />
          <SrOnlyComponent component="span" {...SrOnlyProps}>
            {children}
          </SrOnlyComponent>
        </MuiButton>
      </MuiTooltip>
    )
  },
)


export interface ElementOverlayBadgeButtonsComponentProps extends ButtonGroupProps {
  $id: ElementId
}

const ElementOverlayBadgeButtonsComponent = forwardRef<any, ElementOverlayBadgeButtonsComponentProps>(
  function RefRenderFn(props, ref) {
    const {$id, ...rest} = props
    const {getApp} = useAglynAppContext()
    const parentId = useAglynElementData($id, 'parentId') || null

    return (
      <CanvasRenderedElementRefsConsumer>
        {({getElementRef}) => {
          const dragHandle = getElementRef($id)?.dragHandle
          return (
            <MuiButtonGroup
              ref={ref}
              variant="contained"
              color="primary"
              aria-label="element controls"
              sx={{boxShadow: 4}}
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
ElementOverlayBadgeButtonsComponent.displayName = 'ElementOverlayBadgeButtonsComponent'

export {ElementOverlayBadgeButtonsComponent}
export default ElementOverlayBadgeButtonsComponent
