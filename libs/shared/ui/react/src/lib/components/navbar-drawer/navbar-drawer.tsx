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

import MuiAppBar, { AppBarProps as MuiAppBarProps } from '@material-ui/core/AppBar'
import MuiDrawer, { DrawerProps as MuiDrawerProps } from '@material-ui/core/Drawer'
import Toolbar, { ToolbarProps as MuiToolbarProps } from '@material-ui/core/Toolbar'
import { forwardRef, ReactNode, Ref, useRef } from 'react'
import useCombinedRefs from '../../hooks/use-combined-refs'
import ElevationScroll from '../elevation-scroll/elevation-scroll'


const navbarDrawerClasses = generateUtilityClasses('AglynNavbarDrawer', [
  'appBar',
  'toolbar',
  'left',
  'right',
  'content',
])

const StyledDrawer = styled(MuiDrawer, {
  name: 'Drawer',
})({
  '& .MuiDrawer-paper': {
    width: 620,
    maxWidth: '100%',
  },
})

const StyledAppBar = styled(MuiAppBar, {
  name: 'AppBar',
})(({theme}) => ({
  borderBottom: `1px solid ${theme.palette.divider}`,
}))

const Left = styled('div', {
  name: 'Left',
})({
  flexGrow: 1,
  display: 'flex',
  alignItems: 'center',
  position: 'relative',
})

const Right = styled('div', {
  name: 'Right',
})({
  display: 'flex',
  alignItems: 'center',
  position: 'relative',
})

const Content = styled('div', {
  name: 'Content',
})({
  height: '100%',
  width: '100%',
  overflow: 'auto',
})

/* eslint-disable-next-line */
export interface NavbarDrawerProps extends Partial<MuiDrawerProps> {
  appBarLeft?: ReactNode
  appBarRight?: ReactNode
  innerContentRef?: Ref<HTMLDivElement>
  AppBarProps?: Partial<MuiAppBarProps>
  ToolbarProps?: Partial<MuiToolbarProps>
}

export const NavbarDrawer = forwardRef<any, NavbarDrawerProps>(
  function RefRenderFn(props, ref) {
    const {
      children,
      innerContentRef,
      appBarLeft,
      appBarRight,
      AppBarProps,
      ToolbarProps,
      ...rest
    } = props

    const localContentRef = useRef<HTMLDivElement>()
    const contentRef = useCombinedRefs(localContentRef, innerContentRef)

    return (
      <StyledDrawer
        ref={ref}
        anchor="right"
        {...rest}
      >
        <ElevationScroll target={localContentRef.current}>
          <StyledAppBar
            color="default"
            position="relative"
            variant="elevation"
            className={navbarDrawerClasses.appBar}
            {...AppBarProps}
          >
            <Toolbar {...ToolbarProps} className={navbarDrawerClasses.toolbar}>
              <Left className={navbarDrawerClasses.left}>{appBarLeft}</Left>
              <Right className={navbarDrawerClasses.right}>{appBarRight}</Right>
            </Toolbar>
          </StyledAppBar>
        </ElevationScroll>
        <Content ref={contentRef} className={navbarDrawerClasses.content}>
          {children}
        </Content>
      </StyledDrawer>
    )
  },
)

NavbarDrawer.displayName = 'NavbarDrawer'

export default NavbarDrawer
