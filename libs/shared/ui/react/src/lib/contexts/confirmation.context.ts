/**
 * @license
 * Copyright (c) 2021 Aglyn LLC
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the root directory of this source tree.
 */

import { createContext, useContext } from 'react'
import { ButtonProps } from '@material-ui/core/Button'
import { DialogProps } from '@material-ui/core/Dialog'
import { DialogTitleProps } from '@material-ui/core/DialogTitle'
import { DialogContentTextProps } from '@material-ui/core/DialogContentText'


export interface ConfirmationOptions {
  cancellationText?: ButtonProps['children']
  confirmationText?: ButtonProps['children']
  cancellationButtonProps?: Partial<ButtonProps>
  confirmationButtonProps?: Partial<ButtonProps>
  dialogProps?: Partial<DialogProps>
  title?: DialogTitleProps['children']
  description?: DialogContentTextProps['children']
}

export type ConfirmFn = (options?: ConfirmationOptions) => Promise<unknown>

export interface ConfirmationContextType {
  confirm: ConfirmFn
}

export type UseConfirmationType = () => ConfirmationContextType


export const DEFAULT_OPTIONS: ConfirmationOptions = {
  title: 'Are you sure?',
  description: '',
  confirmationText: 'OK',
  cancellationText: 'Cancel',
  dialogProps: {},
  confirmationButtonProps: {},
  cancellationButtonProps: {},
}
export const buildOptions = (defaultOptions, options) => {
  const dialogProps = {
    ...(defaultOptions.dialogProps || DEFAULT_OPTIONS.dialogProps),
    ...(options.dialogProps || {}),
  }
  const confirmationButtonProps = {
    ...(defaultOptions.confirmationButtonProps || DEFAULT_OPTIONS.confirmationButtonProps),
    ...(options.confirmationButtonProps || {}),
  }
  const cancellationButtonProps = {
    ...(defaultOptions.cancellationButtonProps || DEFAULT_OPTIONS.cancellationButtonProps),
    ...(options.cancellationButtonProps || {}),
  }

  return {
    ...DEFAULT_OPTIONS,
    ...defaultOptions,
    ...options,
    dialogProps,
    confirmationButtonProps,
    cancellationButtonProps,
  }
}

export const ConfirmationContext = createContext<ConfirmationContextType>(null)
export const useConfirmationContext: UseConfirmationType = () => {
  return useContext(ConfirmationContext)
}

export default ConfirmationContext
