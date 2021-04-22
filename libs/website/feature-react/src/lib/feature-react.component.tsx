import React from 'react'
import Website from '@aglyn/website/feature-core'
import { ElementComponent, ElementComponentProps } from './element.component'

/* eslint-disable-next-line */
export interface FeatureReactProps {
  component?: any
  elements?: Website.ElementData[]
  elementComponent?: ElementComponentProps['childrenComponent']
}

export function FeatureReact(props: FeatureReactProps) {
  const {
    component: Wrapper,
    elementComponent: Component,
    elements,
    ...rest
  } = props
  return (
    <Wrapper {...rest}>
      {elements.map(data =>
        <Component
          key={data.$id}
          elementData={data}
          childrenComponent={Component}
        />
      )}
    </Wrapper>
  )
}

FeatureReact.defaultProps = {
  component: React.Fragment,
  elementComponent: ElementComponent,
  elements: []
}

export default FeatureReact
