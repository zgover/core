/**
 * @license
 * Copyright (c) 2021 Aglyn LLC
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the root directory of this source tree.
 */

import React from 'react'
import Website from '@aglyn/website/core'
import { ElementComponent, ElementComponentProps } from './element.component'
import { ComponentProp } from '@aglyn/shared/ui/react'


export interface ElementsComponentProps extends ComponentProp {
  childrenComponent?: ElementComponentProps['childrenComponent']
  children?: Website.ElementData[]
}

export function ElementsComponent(props: ElementsComponentProps) {
  const {
    component: Component,
    childrenComponent: ChildrenComponent,
    children,
    ...rest
  } = props
  return (
    <Component {...rest}>
      {children.map((data, i) => (
        <ChildrenComponent
          key={data?.$id ?? i}
          elementData={data}
          childrenComponent={ChildrenComponent}
        />
      ))}
    </Component>
  )
}

ElementsComponent.defaultProps = {
  component: React.Fragment,
  childrenComponent: ElementComponent,
  children: [],
}

export default ElementsComponent
