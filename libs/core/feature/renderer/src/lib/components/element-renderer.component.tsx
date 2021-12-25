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

import {ComponentId} from '@aglyn/core-data-framework'
import {_isArrEmpty} from '@aglyn/shared-util-guards'
import Box from '@mui/material/Box'
import clsx from 'clsx'
import {ComponentType, forwardRef, HTMLAttributes, PropsWithoutRef, RefAttributes} from 'react'
import useAglynElementComponent from '../hooks/use-aglyn-element-component'
import useAglynElementData from '../hooks/use-aglyn-element-data'
import useAglynElementResolvedProps from '../hooks/use-aglyn-element-resolved-props'
import {ElementsRendererComponent} from './elements-renderer.component'

// eslint-disable-next-line @typescript-eslint/ban-types
export interface ElementRendererComponentProps<T = any> extends HTMLAttributes<T> {
  $id: ComponentId
  rendererComponent?: ComponentType<PropsWithoutRef<ElementRendererComponentProps<any>> & RefAttributes<any>>
}

const ElementRendererComponent = forwardRef<any, ElementRendererComponentProps>(
  function RefRenderFn(props, ref) {
    const {
      $id,
      rendererComponent,
      children: childrenProp,
      className: classNameProp,
      ...rest
    } = props

    const render = rendererComponent || ElementRendererComponent
    const elements = useAglynElementData($id, 'elements')
    const Component = useAglynElementComponent<any, any>($id)
    const {children, className: classNameElem, ...elemProps} = useAglynElementResolvedProps($id)
    const className = clsx(classNameProp, classNameElem)


    return/* ReactIs.isValidElementType(Component) ?*/ (
      <Box
        ref={ref}
        className={className}
        component={Component}
        {...elemProps}
        {...rest}
      >
        {children}
        {childrenProp}
        {!_isArrEmpty(elements || []) ? (
          <ElementsRendererComponent
            rendererComponent={render}
            elements={elements}
          />
        ) : null}
      </Box>
    )/* : (
     <>Error loading element component</>
     )*/
  },
)

ElementRendererComponent.displayName = 'Renderer.ElementRendererComponent'
ElementRendererComponent.defaultProps = {
  children: null,
}

export {ElementRendererComponent}
export default ElementRendererComponent
