import {type ElementType, forwardRef, type HTMLAttributes} from 'react'


export interface ${NAME}Props<C extends ElementType = any> extends HTMLAttributes<C> {
  component?: C
}

export const ${NAME}Component = forwardRef<any, ${NAME}Props>(
  function RefRenderFn(props, ref) {
    const { 
      children,
      component: Component,
      ...rest
    } = props

    return (
      <Component ref={ref} {...rest}>
        {children}
      </Component>
    )
  }
)

${NAME}.displayName = '${NAME}Component'
${NAME}.defaultProps = {
  component: 'div',
}

export default ${NAME}
