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

import { AglynComponentElementData } from '@aglyn/core-data-framework'
import { generateUtilityClasses, styled } from '@aglyn/shared-feature-themes'
import { ButtonProps } from '@mui/material/Button'
import { DialogProps } from '@mui/material/Dialog'
import { DialogContentTextProps } from '@mui/material/DialogContentText'
import { DialogTitleProps } from '@mui/material/DialogTitle'
import clsx from 'clsx'
import { forwardRef, Fragment, HTMLAttributes } from 'react'


export interface HoverComponentOptions {
  cancellationText?: ButtonProps['children']
  confirmationText?: ButtonProps['children']
  cancellationButtonProps?: Partial<ButtonProps>
  confirmationButtonProps?: Partial<ButtonProps>
  dialogProps?: Partial<DialogProps>
  title?: DialogTitleProps['children']
  description?: DialogContentTextProps['children']
  clientRect?: DOMRect
  $id?: AglynComponentElementData
}

export interface HoverComponentProps extends HTMLAttributes<HTMLDivElement> {
  options?: HoverComponentOptions
  open?: boolean
  onConfirm?: ButtonProps['onClick']
  onCancel?: ButtonProps['onClick']
  onClose?: ButtonProps['onClick']
}

const classKeys = generateUtilityClasses('HoverRoot', [
  'hover',
])

const HoverRoot = styled('div', {name: 'HoverRoot'})(({theme}) => ({
  outlineWidth: 2,
  outlineOffset: 0,
  outlineColor: theme.palette.secondary.light,
  outlineStyle: 'dashed',
  position: 'absolute',
  pointerEvents: 'none',
  visibility: 'hidden',
  transition: theme.transitions.create(['visibility', 'width', 'height', 'left', 'right', 'top', 'bottom'], {
    duration: theme.transitions.duration.short,
    easing: theme.transitions.easing.easeInOut,
  }),
  [`&.${classKeys.hover}`]: {
    visibility: 'visible'
  }
}))

export const HoverComponent = forwardRef<any, HoverComponentProps>(
  function RefRenderFn(props, ref) {
    const {open, options, onCancel, onConfirm, onClose, children, ...rest} = props
    const className = clsx({
      [classKeys.hover]: Boolean(open)
    })
    return (
      <HoverRoot
        ref={ref}
        style={{...options.clientRect}}
        className={className}
        {...rest}
      >
        {children}
      </HoverRoot>
    )
  }
)

HoverComponent.displayName = 'HoverComponent'
HoverComponent.defaultProps = {
  options: {},
}

export default HoverComponent
