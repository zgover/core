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

import {styled} from '@aglyn/shared-feature-themes'
import {AppLink, type AppLinkProps, ElevateOnScroll} from '@aglyn/shared-ui-jsx'
import {MdiIcon, type MdiIconProps} from '@aglyn/shared-ui-mdi-jsx'
import {_isArrEmpty} from '@aglyn/shared-util-guards'
import {
  AppBar,
  type AppBarProps,
  Divider,
  Tab as MuiTab,
  type TabProps as MuiTabProps,
  Tabs as MuiTabs,
  Toolbar,
  Typography,
} from '@mui/material'
import {useRouter} from 'next/router'
import {Fragment, type ReactNode, useMemo} from 'react'
import {TAB_HEIGHT, TOP_BAR_HEIGHT} from '../constants/shared'


const TabItem = styled(MuiTab, {
  name: 'AglynTabItem',
})({
  flexDirection: 'row',
  minHeight: TAB_HEIGHT,
  '& > *:first-of-type': {
    marginBottom: 0,
    marginRight: 1,
  },
  '& .MuiTab-labelIcon': {
    minHeight: TAB_HEIGHT - 16,
    minWidth: 'auto',
    paddingLeft: 0,
    paddingRight: 0,
    marginLeft: 4,
    '&:first-of-type': {
      marginLeft: 0,
    },
  },
})

function a11yProps(index) {
  return {
    id: `scrollable-auto-tab-${index}`,
    'aria-controls': `scrollable-auto-tabpanel-${index}`,
  }
}

export type NavTabItem = Partial<AppLinkProps & MuiTabProps & {icon: MdiIconProps}>

export interface SecondaryAppBarProps extends Partial<AppBarProps> {
  children?: ReactNode
  tabBarTitle?: ReactNode
  navTabItems?: NavTabItem[]
  activeTab?: string
}

function SecondaryAppBarComponent(props: SecondaryAppBarProps) {
  const {
    children,
    tabBarTitle,
    navTabItems,
    activeTab,
    ...rest
  } = props
  const router = useRouter()
  const tabItems: NavTabItem[] = useMemo(() => {
    return navTabItems ?? []
  }, [navTabItems])
  const tabValue = useMemo(() => {
    const asPath = router.asPath,
      active = activeTab,
      specific = typeof active !== 'undefined'
    return tabItems.find((i) => {
      const href = i?.href,
        as = i?.hrefAs,
        id = i?.id
      if (specific) return active === href || active === as || active === id
      return asPath === href || asPath === as || asPath === id
    })?.href || false
  }, [router, tabItems, activeTab])

  return (
    <ElevateOnScroll threshold={TOP_BAR_HEIGHT}>
      {({activeWithoutHysteresis}) => (
        <AppBar
          component="aside"
          color="inherit"
          position="sticky"
          variant="elevation"
          elevation={activeWithoutHysteresis ? 4 : 0}
          enableColorOnDark
          {...rest}
        >
          <Toolbar
            variant="dense"
            component="div"
            color="inherit"
            sx={{
              minHeight: TAB_HEIGHT,
              borderBottomWidth: `1px`,
              borderBottomStyle: 'solid',
              borderBottomColor: 'divider',
            }}
          >
            {tabBarTitle && (
              <Fragment>
                <Typography
                  component={'div'}
                  variant={'h6'}
                  sx={{
                    lineHeight: 'normal',
                    letterSpacing: 2,
                    fontSize: `0.95em`,
                    fontWeight: 'fontWeightMedium',
                    textTransform: 'uppercase',
                    color: 'text.secondary',
                  }}
                >
                  {tabBarTitle}
                </Typography>

                <Divider
                  orientation="vertical"
                  sx={{ml: 1.25, mr: 1}}
                  flexItem
                  light
                />
              </Fragment>
            )}

            {children}

            {!_isArrEmpty(tabItems) && (
              <MuiTabs
                aria-label="area navigation"
                indicatorColor="secondary"
                scrollButtons="auto"
                textColor="inherit"
                value={tabValue || false}
                variant="scrollable"
                sx={{
                  minHeight: TAB_HEIGHT,
                  alignItems: 'center',
                  '& .MuiTabs-flexContainer': {
                    alignItems: 'center',
                  },
                  '& .MuiTabs-indicator': {
                    height: '3px',
                    backgroundColor: 'unset',
                    '&:after': {
                      borderRadius: '3px 3px 0 0',
                      content: '" "',
                      display: 'block',
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      right: 0,
                      mx: 'auto',
                      width: 0.8,
                      height: 1,
                      backgroundColor: 'secondary.light',
                    },
                  },
                }}
              >
                {tabItems.map(({icon, ...item}, index) => (
                  <TabItem
                    key={item.id ?? index}
                    href={item.href ?? ''}
                    value={item.href ?? index}
                    icon={!icon?.path ? icon : <MdiIcon {...icon} />}
                    componentVariant="button-base"
                    anchorComponent="button"
                    color="inherit"
                    underline="none"
                    // disableRipple
                    wrapped
                    {...a11yProps(index)}
                    {...{component: AppLink} as any}
                    {...item}
                  />
                ))}
              </MuiTabs>
            )}
          </Toolbar>
        </AppBar>
      )}
    </ElevateOnScroll>
  )
}
SecondaryAppBarComponent.displayName = 'SecondaryAppBarComponent'
SecondaryAppBarComponent.defaultProps = {
  navTabItems: undefined,
}

export {SecondaryAppBarComponent}
export default SecondaryAppBarComponent
