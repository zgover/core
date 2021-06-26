/**
 * @license
 * Copyright (c) 2021 Aglyn LLC
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the root directory of this source tree.
 */

import { createStyles, Theme, WithStyles, withStyles } from '@material-ui/core/styles'
import clsx from 'clsx'
import { forwardRef, HTMLAttributes } from 'react'
import AppBar, { AppBarProps } from '@material-ui/core/AppBar'
import Toolbar from '@material-ui/core/Toolbar'
import IconButton from '@material-ui/core/IconButton'
import Fab from '@material-ui/core/Fab'
import { SvgPathIcon } from '@aglyn/shared/ui/react'


export interface AppBarComponentProps extends Partial<AppBarProps> {

}

export const styles = (theme: Theme) => createStyles({
  root: {
    top: 'auto',
    bottom: 0,
  },
  grow: {
    flexGrow: 1,
  },
  fabButton: {
    position: 'absolute',
    zIndex: 1,
    top: -30,
    left: 0,
    right: 0,
    margin: '0 auto',
  },
})

export const AppBarComponent = forwardRef<any, AppBarComponentProps & WithStyles<typeof styles>>(
  function RefRenderFn(props, ref) {
    const {
      classes,
      className,
      ...rest
    } = props

    return (
      <AppBar
        ref={ref}
        className={clsx(classes.root, className)}
        position="fixed"
        color="primary"
        {...rest}
      >
        <Toolbar>
          <IconButton edge="start" color="inherit" aria-label="open drawer">
            <SvgPathIcon iconId={'menu'} />
          </IconButton>
          <Fab color="secondary" aria-label="add" className={classes.fabButton}>
            <SvgPathIcon iconId={'plus'} />
          </Fab>
          <div className={classes.grow} />
          <IconButton color="inherit">
            <SvgPathIcon iconId={'search'} />
          </IconButton>
          <IconButton edge="end" color="inherit">
            <SvgPathIcon iconId={'more'} />
          </IconButton>
        </Toolbar>
      </AppBar>
    )
  },
)

AppBarComponent.displayName = 'AppBarComponent'
AppBarComponent.defaultProps = {}

export default withStyles(styles, { name: 'AppBarComponent' })(AppBarComponent)
