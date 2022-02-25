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

import {mergeSxProps} from '@aglyn/shared-feature-themes'
import {
  Box,
  type BoxProps as MuiBoxProps,
  Menu as MuiMenu,
  MenuItem as MuiMenuItem,
  type MenuItemProps as MuiMenuItemProps,
  type MenuProps as MuiMenuProps,
} from '@mui/material'
import {
  Children,
  cloneElement,
  forwardRef,
  type MouseEvent,
  type MouseEventHandler,
  type ReactElement,
  useCallback,
  useState,
} from 'react'
import AppLink, {type AppLinkProps} from './app-link'


const ITEM_HEIGHT = 48
const defaultState = {
  anchorEl: null,
  mouseX: null,
  mouseY: null,
}

export type MenuItemProps = AppLinkProps & MuiMenuItemProps

/* eslint-disable-next-line */
export interface MenuProps extends MuiBoxProps {
  items: MenuItemProps[]
  context?: boolean
  MenuProps?: Partial<MuiMenuProps>
  children: ReactElement
}

export const Menu = forwardRef<any, MenuProps>(
  function RefRenderFn(props, ref) {
    const {
      children,
      items,
      context,
      className,
      sx,
      MenuProps,
      ...rest
    } = props

    const [state, setState] = useState(defaultState)
    const child = Children.only(children)
    const onChildClick = child.props?.onClick?.bind(null) as MouseEventHandler
    const handleClose = () => setState(defaultState)
    const handleClick = useCallback((event: MouseEvent<any>) => {
      if (onChildClick) {
        onChildClick.call(null, event)
      }
      if (context) {
        event.preventDefault()
      }
      setState({
        anchorEl: event.currentTarget,
        mouseX: event.clientX - 2,
        mouseY: event.clientY - 4,
      })
    }, [context, onChildClick])
    const open = Boolean(state.anchorEl || state.mouseY)
    const cloned = cloneElement(child, {onClick: handleClick})

    return (
      <Box
        ref={ref}
        component={'div'}
        onContextMenu={handleClick}
        sx={mergeSxProps({
          cursor: context ? 'context-menu' : undefined,
        }, sx)}
        {...(context ? {onContextMenu: handleClick} : {})}
        {...rest}
      >
        {cloned}
        <MuiMenu
          PaperProps={
            context
              ? undefined
              : {
                style: {
                  maxHeight: ITEM_HEIGHT * 4.5,
                  minWidth: '20ch',
                },
              }
          }
          anchorEl={context ? undefined : state.anchorEl}
          anchorOrigin={
            context
              ? undefined
              : {
                vertical: 'top',
                horizontal: 'left',
              }
          }
          anchorPosition={
            !context || !state.mouseY
              ? undefined
              : {
                top: state.mouseY,
                left: state.mouseX,
              }
          }
          anchorReference={context ? 'anchorPosition' : undefined}
          // getContentAnchorEl={null}
          open={open}
          transformOrigin={
            context
              ? undefined
              : {
                vertical: 'top',
                horizontal: 'right',
              }
          }
          onClose={handleClose}
          {...MenuProps}
        >
          {items.map(({onClick, ...item}, key) => (
            <MuiMenuItem
              key={item.id ?? item.key ?? key}
              component={AppLink}
              onClick={(e) => {
                handleClose()
                onClick && onClick(e)
              }}
              {...item}
            />
          ))}
        </MuiMenu>
      </Box>
    )
  },
)

Menu.displayName = 'Menu'
Menu.defaultProps = {
  items: [],
}

export default Menu
