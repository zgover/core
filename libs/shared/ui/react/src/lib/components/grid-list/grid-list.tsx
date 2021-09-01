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

import { generateUtilityClasses, styled } from '@aglyn/shared/ui/themes'
import Card from '@material-ui/core/Card'
import Grid, { GridProps as MuiGridProps } from '@material-ui/core/Grid'

import clsx from 'clsx'
import { forwardRef, HTMLProps, ReactNode, useCallback, useMemo } from 'react'
import { VirtuosoGrid, VirtuosoGridHandle, VirtuosoGridProps } from 'react-virtuoso'


const gridListClasses = generateUtilityClasses('AglynGridList', [
  'listRoot',
  'itemWrapper',
  'itemContent',
])

const GridItemWrapper = styled(Grid, {
  name:'GridItemWrapper'
})({
  height: 0,
  position: 'relative',
  paddingTop: `${(3 / 4) * 100}%`, // 16:9
})
const CardItemContent = styled(Card, {
  name: 'CardItemContent'
})({
  position: 'absolute',
  left: 0,
  top: 0,
  width: '100%',
  height: '100%',
  display: 'flex',
  textAlign: 'center',
  flexDirection: 'column',
  justifyContent: 'space-evenly',
})

export interface Item {
  id: string | number | symbol
  [prop: string]: any
}

/* eslint-disable-next-line */
export interface GridListProps extends Partial<VirtuosoGridProps> {
  items?: Item[]
  renderItemContent?: (item: GridListProps['items'][number], index: number, items: GridListProps['items']) => ReactNode
  GridContainerProps?: MuiGridProps
  GridItemProps?: MuiGridProps
  ListWrapperProps?: HTMLProps<HTMLDivElement>
}

export const GridList = forwardRef<VirtuosoGridHandle, GridListProps>(
  function RefRenderFn(props, ref) {
    const {
      items,
      renderItemContent,
      ListWrapperProps,
      GridContainerProps,
      GridItemProps,
      ...rest
    } = props
    const computeItemKey = useCallback((index: number) => items[index].id as any, [items])

    const GridContainer = useMemo(() => forwardRef<any, MuiGridProps>(
      function RefRenderFn(props, ref) {
        return (
          <div
            {...ListWrapperProps}
            className={clsx(
              gridListClasses.listRoot,
              ListWrapperProps?.className
            )}
          >
            <Grid ref={ref} container {...GridContainerProps} {...props} />
          </div>
        )
      },
    ), [ListWrapperProps, GridContainerProps])

    const GridItem = useMemo(() => forwardRef<any, MuiGridProps>(
      function RefRenderFn(itemProps, ref) {
        return <Grid ref={ref} item {...GridItemProps} {...itemProps} />
      },
    ), [GridItemProps])

    const MemoizedItemContent = useMemo(() => forwardRef<any, MuiGridProps>(
      function RefRenderFn(props, ref) {
        const {children, ...rest} = props
        return (
          <GridItemWrapper ref={ref} className={gridListClasses.itemWrapper}{...rest}>
            <CardItemContent className={gridListClasses.itemContent}>
              {children}
            </CardItemContent>
          </GridItemWrapper>
        )
      },
    ), [])

    const itemContent = useCallback((index) => (
      <MemoizedItemContent>
        {renderItemContent(items[index], index, items)}
      </MemoizedItemContent>
    ), [renderItemContent])

    return (
      <VirtuosoGrid
        ref={ref}
        computeItemKey={computeItemKey}
        itemContent={itemContent}
        totalCount={items.length}
        {...rest}
        components={{
          Item: GridItem,
          List: GridContainer,
          ...rest.components,
        }}
      />
    )
  },
)

GridList.displayName = 'GridList'
GridList.defaultProps = {
  renderItemContent: (item) => item,
}

export default GridList
