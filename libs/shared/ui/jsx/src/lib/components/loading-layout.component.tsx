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
  LoadingOverlayComponent,
  type LoadingOverlayComponentProps,
  LoadingProviderComponent,
} from '@aglyn/shared-ui-jsx'
import {getDisplayName} from '@aglyn/shared-util-tools'
import {ComponentType, forwardRef} from 'react'


export interface LoadingLayoutComponentProps extends Partial<LoadingOverlayComponentProps> {

}

const LoadingLayoutComponent = forwardRef<any, LoadingLayoutComponentProps>(
  function RefRenderFn(props, ref) {
    const {children, ...rest} = props

    return (
      <LoadingProviderComponent>
        <LoadingOverlayComponent ref={ref} {...rest}>
          {children}
        </LoadingOverlayComponent>
      </LoadingProviderComponent>
    )
  },
)
LoadingLayoutComponent.displayName = 'LoadingLayoutComponent'

export function withLoadingLayoutComponent<P>(
  WrappedComponent: ComponentType<P>,
  loadingLoadingProps: LoadingLayoutComponentProps,
) {
  const displayName = getDisplayName(WrappedComponent)
  const WithLoadingLayoutComponent = forwardRef<any, P>(
    function RefRenderFn(props, ref) {
      return (
        <LoadingLayoutComponent ref={ref} {...loadingLoadingProps}>
          <WrappedComponent {...props} />
        </LoadingLayoutComponent>
      )
    },
  )
  WithLoadingLayoutComponent.displayName = `WithLoadingLayoutComponent(${displayName})`
  return WithLoadingLayoutComponent
}

export {LoadingLayoutComponent}
export default LoadingLayoutComponent
