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
  AglynComponentElement,
  AglynComponentElementDataNormalized,
  ElementId,
} from '@aglyn/core-data-framework'
import { AnyProps } from '@aglyn/shared-data-types'
import { getDisplayName } from '@aglyn/shared-util-tools'
import {
  ComponentType,
  forwardRef,
  ForwardRefExoticComponent,
  PropsWithoutRef,
  RefAttributes,
} from 'react'
import useAglynComponent from './use-aglyn-component'
import useAglynElementConditionalInnerRefProps
  from './use-aglyn-element-conditional-inner-ref-props'
import { useAglynElementData } from './use-aglyn-element-data'
import useAglynElementResolvedProps from './use-aglyn-element-resolved-props'


export interface ElementDataProps<P extends AnyProps = any> {
  $id: ElementId
  // schema: AglynComponentSchema<P>
  elementData: AglynComponentElementDataNormalized<P>
  component: AglynComponentElement<P>
  elemProps: P
}

export function withElementData<P extends AnyProps, T>(
  Component: ComponentType<P & ElementDataProps>,
): ForwardRefExoticComponent<PropsWithoutRef<P> & RefAttributes<T>> {
  const component = forwardRef<T, Partial<ElementDataProps> & P>(
    function RefRenderFn(props, ref) {
      const {$id, children: childrenProp, ...rest} = props
      const elementData = useAglynElementData($id)
      const component = useAglynComponent({
        componentId: elementData.componentId,
        bundleId: elementData.bundleId,
      })
      const {children, ...elemProps} = useAglynElementResolvedProps($id)
      const innerRefProps = useAglynElementConditionalInnerRefProps($id, ref)

      return (
        <Component
          ref={ref}
          $id={$id}
          elementData={elementData}
          component={component}
          elemProps={elemProps}
          {...innerRefProps}
          {...rest as P}
        >
          {children}
          {childrenProp}
        </Component>
      )
    },
  )
  component.displayName = `WithElementData(${getDisplayName(Component)})`
  return component
}

export default withElementData
