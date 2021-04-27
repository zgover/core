/**
 * @license
 * Copyright (c) 2021 Aglyn LLC
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the root directory of this source tree.
 */

import React from 'react'
import { Website } from '@aglyn/website/core'
import { ElementComponent, ElementComponentProps } from './element.component'
import { ComponentProp } from '@aglyn/shared/ui/react'
import { ElementsComponent } from './elements.component'


export interface WebsiteComponentProps extends ComponentProp {
  elements?: Website.ElementData[]
  childrenComponent?: ElementComponentProps['childrenComponent']
}

export function WebsiteComponent(props: WebsiteComponentProps) {
  const {
    component: Component,
    childrenComponent,
    elements,
    ...rest
  } = props
  return (
    <Component {...rest}>
      <ElementsComponent
        children={elements}
        childrenComponent={childrenComponent}
      />
    </Component>
  )
}

WebsiteComponent.defaultProps = {
  component: 'div',
  elementComponent: ElementComponent,
  elements: [],
}

export default WebsiteComponent
