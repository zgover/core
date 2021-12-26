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
import {alpha, generateComponentClassKeys, styled} from '@aglyn/shared-feature-themes'
import {getElementClientRectBounding, type VirtualElement} from '@aglyn/shared-util-dom'
import Box, {type BoxProps} from '@mui/material/Box'
import clsx from 'clsx'
import {forwardRef} from 'react'
import useAglynCanvasElementStatus from '../hooks/use-aglyn-canvas-element-status'
import useAglynDndElementStatus from '../hooks/use-aglyn-dnd-element-status'


const classKeys = generateComponentClassKeys('AglynElementOverlayOutline', [
  'open',
  'hoveringSelf',
  'selectedSelf',
  'draggingSelf',
  'draggingOverSelf',
])

const ElementOverlayOutline = styled(Box, {
  name: 'AglynElementOverlayOutline',
})(({theme}) => ({
  pointerEvents: 'none',
  position: 'absolute',
  left: 0,
  top: 0,
  right: 0,
  bottom: 0,
  outlineColor: 'transparent',
  outlineOffset: 1,
  outlineWidth: 1,
  outlineStyle: 'dashed',
  // transition: theme.transitions.create([
  //   'visibility',
  //   'outlineWidth',
  //   'outlineOffset',
  //   'outlineStyle',
  //   'outlineColor',
  //   'backgroundColor',
  // ], {
  //   duration: theme.transitions.duration.standard,
  //   easing: theme.transitions.easing.easeInOut,
  // }),

  [`&.${classKeys.selectedSelf}`]: {
    outlineWidth: 2,
    outlineStyle: 'solid',
    outlineColor: theme.palette.quaternary.main,
  },
  [`&.${classKeys.draggingSelf}`]: {
    outlineColor: 'transparent',
    backgroundColor: alpha(theme.palette.grey['300'], 0.76),
  },
  [`&.${classKeys.draggingOverSelf}`]: {
    outlineColor: theme.palette.quaternary.main,
    backgroundColor: alpha(theme.palette.quaternary.dark, 0.76),
  },

  [`&.${classKeys.hoveringSelf}`]: {
    outlineColor: theme.palette.grey['A400'],
    backgroundColor: alpha(theme.palette.grey['A400'], 0.12),
    // [`&.${classKeys.selectedSelf}`]: {
    //   outlineColor: theme.palette.quaternary.main,
    //   backgroundColor: alpha(theme.palette.quaternary.dark, 0.12),
    // },
    // [`&.${classKeys.draggingOverSelf}`]: {
    //   outlineColor: theme.palette.quaternary.main,
    //   backgroundColor: alpha(theme.palette.quaternary.dark, 0.76),
    // },
    // [`&.${classKeys.draggingSelf}`]: {
    //   outlineColor: 'transparent',
    //   backgroundColor: alpha(theme.palette.grey['300'], 0.76),
    // },
  },

}))

export interface ElementOverlayOutlineProps extends BoxProps {
  $id: ElementId
  anchorEl?: VirtualElement
}

const ElementOverlayOutlineComponent = forwardRef<any, ElementOverlayOutlineProps>(
  function RefRenderFn(props, ref) {
    const {className: classNameProp, $id, anchorEl, ...rest} = props

    const [isActive, isOver] = useAglynDndElementStatus($id)
    const {isSelfSelected, isSelfHovered} = useAglynCanvasElementStatus($id)
    const {width, height} = anchorEl && getElementClientRectBounding(anchorEl) || {}
    // const componentId = useAglynElementData($id, 'componentId')
    // const bundleId = useAglynElementData($id, 'bundleId')
    // const elementAttributes = useBesignerElementAttributes({$id, componentId, bundleId})

    const className = clsx({
      [classKeys.draggingSelf]: Boolean(isActive),
      [classKeys.draggingOverSelf]: Boolean(isOver),
      [classKeys.hoveringSelf]: Boolean(isSelfHovered),
      [classKeys.selectedSelf]: Boolean(isSelfSelected),
    }, classNameProp)


    // useDynamicEffect(() => {
    //   const rect = anchorEl && getElementClientRectBounding(anchorEl)
    //   if (rect) {
    //     setStyle({
    //       width: rect.width,
    //       height: rect.height,
    //     })
    //   }
    // }, [anchorEl])

    return (
      <ElementOverlayOutline
        ref={ref}
        className={className}
        style={{width, height}}
        {...rest}
      />
    )
  },
)

ElementOverlayOutlineComponent.displayName = 'ElementOverlayOutlineComponent'
ElementOverlayOutlineComponent.defaultProps = {}

export {ElementOverlayOutlineComponent}
export default ElementOverlayOutlineComponent
