/**
 * @license
 * Copyright (c) 2021 Aglyn LLC
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the root directory of this source tree.
 */

import { ElementType, Fragment, MouseEventHandler, ReactNode, useCallback, useState } from 'react'
import DialogConfirm from '../dialog-confirm/dialog-confirm'
import { ConfirmationContext, ConfirmationOptions } from '../../contexts/confirmation.context'
import { DEFAULT_OPTIONS, buildOptions } from '../../contexts/confirmation.context'


export interface ConfirmationProviderComponentProps {
  defaultOptions?: ConfirmationOptions
  children?: ReactNode
  component: ElementType<{
    open: boolean
    options: ConfirmationOptions
    onClose: MouseEventHandler<unknown>
    onCancel: MouseEventHandler<unknown>
    onConfirm: MouseEventHandler<unknown>
  }>
}

export function ConfirmationProviderComponent(props: ConfirmationProviderComponentProps) {
  const { children, defaultOptions = {}, component: Component } = props
  const [options, setOptions] = useState({ ...DEFAULT_OPTIONS, ...defaultOptions })
  const [resolveReject, setResolveReject] = useState([])
  const [resolve, reject] = resolveReject

  const confirm = useCallback((options: ConfirmationOptions = {}) => {
    return new Promise((resolve, reject) => {
      setOptions(buildOptions(defaultOptions, options))
      setResolveReject([resolve, reject])
    })
  }, [defaultOptions])

  const handleClose = useCallback(() => {
    setResolveReject([])
  }, [])

  const handleCancel = useCallback(() => {
    reject()
    handleClose()
  }, [reject, handleClose])

  const handleConfirm = useCallback(() => {
    resolve()
    handleClose()
  }, [resolve, handleClose])

  return (
    <Fragment>
      <ConfirmationContext.Provider value={{ confirm }}>
        {children}
      </ConfirmationContext.Provider>
      <Component
        open={resolveReject.length === 2}
        options={options}
        onClose={handleClose}
        onCancel={handleCancel}
        onConfirm={handleConfirm}
      />
    </Fragment>
  )
}

ConfirmationProviderComponent.defaultProps = {
  component: DialogConfirm,
}
export default ConfirmationProviderComponent
