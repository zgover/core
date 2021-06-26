import { ComponentType, ForwardRefExoticComponent, PropsWithoutRef, RefAttributes, forwardRef } from 'react'
import MuiGrid, { GridProps as MuiGridProps } from '@material-ui/core/Grid'
import { styled } from '@material-ui/core/styles'
import {getDisplayName} from '@aglyn/shared/util/helpers'


const FieldGridItem = styled(MuiGrid)({position: 'relative'}, {name: 'FieldGridItem'})

export type WithGridItemProps = {
  FormFieldGridProps?: MuiGridProps
}

export function withGridItem<P>(WrappedComponent: ComponentType<P>): ForwardRefExoticComponent<PropsWithoutRef<P & WithGridItemProps> & RefAttributes<any>> {
  const WithFieldGrid = forwardRef<any, P & WithGridItemProps>(
    function RefRenderFn(props, ref) {
      const { FormFieldGridProps, ...rest } = props

      return (
        <FieldGridItem ref={ref} xs={12} item {...FormFieldGridProps}>
          <WrappedComponent {...rest as P}/>
        </FieldGridItem>
      )
    }
  )
  WithFieldGrid.displayName = `WithFieldGrid(${getDisplayName(WrappedComponent)})`
  return WithFieldGrid
}
