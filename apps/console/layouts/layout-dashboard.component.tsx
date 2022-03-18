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

import {ICON_VARIANT_HOME} from '@aglyn/shared-data-enums'
import {MdiIcon, mdiShieldLock} from '@aglyn/shared-ui-mdi-jsx'
import {Box, Stack} from '@mui/material'
import {type ReactNode, useMemo} from 'react'
import DashboardHeaderComponent, {
  type DashboardHeaderProps,
} from '../components/dashboard-header.component'
import FooterComponent from '../components/footer.component'
import SecondaryAppBarComponent, {
  type SecondaryAppBarProps,
} from '../components/secondary-app-bar.component'


const defaultNavTabItems = [
  {
    id: 'nav-tab-dashboard',
    label: 'Dashboard',
    href: '/',
  },
  {
    id: 'nav-tab-screens',
    label: 'Screens',
    href: '/screens',
  },
]

const defaultTabBarTitle = (
  <Stack
    direction="row"
    spacing={{sm: 0.15, md: 0.5}}
    alignItems="center"
    typography={'subtitle2'}
    lineHeight={'normal'}
    sx={{color: 'tertiary.light'}}
  >
    <span>{'Secure'}</span>
    <MdiIcon
      path={mdiShieldLock.path}
      fontSize={'small'}
    />
  </Stack>
)

const defaultBreadcrumbs = [
  {
    id: 'home',
    children: 'Home',
    href: '/',
    icon: {path: ICON_VARIANT_HOME.path},
  },
]

export interface LayoutDashboardProps {
  children?: ReactNode
  breadcrumbItems?: DashboardHeaderProps['breadcrumbItems']
  disableBreadcrumbs?: DashboardHeaderProps['disableBreadcrumbs']
  disableDefaultBreadcrumb?: true
  header?: DashboardHeaderProps['header']
  headerRight?: DashboardHeaderProps['headerRight']

  tabBarTitle?: SecondaryAppBarProps['tabBarTitle']
  navTabItems?: SecondaryAppBarProps['navTabItems']
  aside?: ReactNode
}

function LayoutDashboardComponent(props: LayoutDashboardProps) {
  const {
    children,
    header,
    breadcrumbItems,
    disableBreadcrumbs,
    disableDefaultBreadcrumb,
    tabBarTitle,
    navTabItems,
    headerRight,
    aside,
  } = props

  const breadcrumbs = useMemo(() => {
    return [
      ...(disableDefaultBreadcrumb ? [] : defaultBreadcrumbs),
      ...Array.isArray(breadcrumbItems) ? breadcrumbItems : [],
    ]
  }, [breadcrumbItems, disableDefaultBreadcrumb])

  return (
    <>
      <SecondaryAppBarComponent
        tabBarTitle={tabBarTitle ?? defaultTabBarTitle}
        navTabItems={navTabItems ?? defaultNavTabItems}
      />

      <Stack
        component="main"
        direction="column"
        sx={{flexGrow: 1}}
      >
        <DashboardHeaderComponent
          disableBreadcrumbs={disableBreadcrumbs}
          breadcrumbItems={breadcrumbs}
          headerRight={headerRight}
          header={header}
        />

        <Box
          component="main"
          sx={{flexGrow: 1}}
        >
          {children}
        </Box>

        <FooterComponent />

      </Stack>

      {aside}
    </>
  )
}
LayoutDashboardComponent.displayName = 'LayoutDashboardComponent'
LayoutDashboardComponent.defaultProps = {}

export {LayoutDashboardComponent}
export default LayoutDashboardComponent
