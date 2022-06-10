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

import type {AglynElement} from '@aglyn/core-data-framework'
import type {OverrideableComponentProps} from '@aglyn/shared-data-types'
import {forwardRef, Fragment, useMemo} from 'react'
import LeafComponent, {LeafComponentType} from './leaf.component'


export interface TreeProps extends OverrideableComponentProps {
  LeafComponent?: LeafComponentType
  elements?: AglynElement[]
}

const TreeComponent = forwardRef<any, TreeProps>(
  function RefRenderFn(props, ref) {
    const {
      component: Component,
      LeafComponent: LeafOverride,
      elements,
      ...rest
    } = props

    const Leaf = useMemo(() => (
      LeafOverride || 'div'
    ), [LeafOverride])

    return (
      <Component ref={ref} {...rest}>
        {Array.isArray(elements) && elements.map((element) => (
          <LeafComponent
            key={element?.$id}
            element={element}
            component={Leaf}
          />
        ))}
      </Component>
    )
  },
)

TreeComponent.displayName = 'TreeComponent'
TreeComponent.aglyn = true
TreeComponent.defaultProps = {
  component: Fragment,
  children: null,
}

export {TreeComponent}
export default TreeComponent
