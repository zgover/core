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

import {APP_CONSOLE, BUILD_ID, PACKAGE_VERSION} from '@aglyn/shared-data-enums'
import {getFirebaseAuth} from '@aglyn/shared-feature-fbclient'
import {darken, mergeSxProps, styled} from '@aglyn/shared-feature-themes'
import {
  AglynSvgIcon,
  AglynSvgLogo,
  AppLink,
  type AppLinkProps,
  ElevateOnScroll,
  GridButtons,
  type GridButtonsProps,
  Menu,
} from '@aglyn/shared-ui-jsx'
import {MdiIcon, type MdiIconProps} from '@aglyn/shared-ui-mdi-jsx'
import {_isArr, _isArrEmpty} from '@aglyn/shared-util-guards'
import {gravatarUrlFromEmail} from '@aglyn/shared-util-tools'
import {
  AppBar,
  Avatar,
  Box,
  Container,
  Divider,
  IconButton,
  type IconButtonProps,
  Tab as MuiTab,
  type TabProps as MuiTabProps,
  Tabs as MuiTabs,
  Toolbar,
  Typography,
} from '@mui/material'
import {cyan, purple} from '@mui/material/colors'
import Head from 'next/head'
import {useRouter} from 'next/router'
import {Fragment, type ReactNode, useMemo} from 'react'
import {useAuthState} from 'react-firebase-hooks/auth'
import BreadcrumbsComponent, {type BreadcrumbsProps} from '../components/breadcrumbs.component'
import CopyrightComponent from '../components/copyright.component'
import {tailNavigation} from '../const'


const TabItem = styled(MuiTab, {
  name: 'AglynTabItem',
})(({theme}) => ({
  flexDirection: 'row',
  '& > *:first-of-type': {
    marginBottom: 0,
    marginRight: 1,
  },
  '& .MuiTab-labelIcon': {
    minHeight: 46,
    minWidth: 'auto',
    paddingLeft: 0,
    paddingRight: 0,
    marginLeft: 4,
    '&:first-of-type': {
      marginLeft: 0,
    },
  },
}))

const StyledBreadcrumbs = styled(BreadcrumbsComponent, {
  name: 'BreadcrumbsComponent',
})(({theme}) => ({
  marginTop: theme.spacing(1),
  color: darken(theme.palette.getContrastText(purple['600']), 0.12),

  ['& .AglynBreadcrumbs-item']: {
    color: 'inherit',
    ['&.AglynBreadcrumbs-last']: {
      color: theme.palette.getContrastText(purple['600']),
      fontWeight: theme.typography.fontWeightMedium,
    },
  },
}))

function a11yProps(index) {
  return {
    id: `scrollable-auto-tab-${index}`,
    'aria-controls': `scrollable-auto-tabpanel-${index}`,
  }
}

const firebaseAuth = getFirebaseAuth()
export const NAVIGATION_MAX_WIDTH = false
export const FOOTER_MAX_WIDTH = 'xl'

export interface QuickActionsMenuItem extends IconButtonProps {
  icon?: MdiIconProps
  avatar?: any
  dense?: boolean
  href?: any
  items?: QuickActionsMenuItem[]
}

export type NavTabItem = Partial<AppLinkProps & MuiTabProps & {icon: MdiIconProps}>

export interface MainLayoutProps {
  children?: ReactNode | undefined
  title?: ReactNode[] | ReactNode
  tabBarTitle?: ReactNode
  centerNavigationItems?: Array<any>
  breadcrumbItems?: BreadcrumbsProps['items']
  navTabItems?: NavTabItem[]
  quickActionMenus?: QuickActionsMenuItem[]
  productName?: string
  footerNavItems?: GridButtonsProps['items']
  // aggregatedPageMeta: AggregatedPageMeta
  // currentUserContext: CurrentUserContextType
}

function MainLayoutRaw(props: MainLayoutProps) {
  const {
    children,
    title,
    centerNavigationItems,
    tabBarTitle,
    navTabItems,
    productName,
    footerNavItems,
    quickActionMenus: quickActions,
    breadcrumbItems,
  } = props
  const [user] = useAuthState(firebaseAuth)
  const router = useRouter()
  const tabValue = useMemo(() => {
    return navTabItems.find((i) => {
      return (i?.hrefAs || i?.href || '') === router.asPath
    })?.href || false
  }, [router, navTabItems])

  const buildIconButton = ({avatar, icon, children, ...rest}, i) => (
    <IconButton key={rest.id ?? rest['href'] ?? i} color="inherit" {...rest}>
      {avatar
        ? (
          <Avatar
            {...avatar}
            sx={mergeSxProps({
              backgroundColor: cyan[600],
            }, avatar.sx)}
          />
        )
        : icon ? (<MdiIcon {...icon} />) : null
      }
      {children}
    </IconButton>
  )

  const buildTextButton = (item, key) => (
    <AppLink
      key={key}
      componentVariant="button"
      color="inherit"
      sx={{p: item?.avatar ? 0.5 : undefined}}
      {...item}
    />
  )

  // eslint-disable-next-line react/display-name
  const buildNav = (id, actionBuilder) => (item, key) =>
    _isArr(item.items) ? (
      <Menu
        key={id + key}
        items={item.items}
        sx={{
          p: {padding: 0.5, xs: 0.25},
          '&:last-child': {
            paddingLeft: 0.75,
          },
        }}
      >
        {actionBuilder(item, key)}
      </Menu>
    ) : (
      <Fragment key={id + key}>{actionBuilder(item, key)}</Fragment>
    )

  return (
    <Fragment>
      <Head>
        <title>
          {!title
            ? APP_CONSOLE.TITLE
            : [
              ..._isArr(title) ? title : [title],
              APP_CONSOLE.AFFIX,
            ].join(` ${APP_CONSOLE.SEP} `)
          }
        </title>
      </Head>
      <ElevateOnScroll
        renderProps={(elevated) => ({elevation: elevated ? 4 : 0})}
      >
        <AppBar
          component="header"
          color="inherit"
          position="sticky"
          variant="elevation"
        >
          <AppBar
            component={'div'}
            elevation={0}
            color="inherit"
            position="relative"
            sx={{
              borderBottomWidth: `1px`,
              borderBottomStyle: 'solid',
              borderBottomColor: 'divider',
              // ':after': {
              //   content: '" "',
              //   left: 0,
              //   right: 0,
              //   bottom: 0,
              //   height: 1,
              //   width: 1,
              //   position: 'absolute',
              //   backgroundColor: 'divider',
              // },
            }}
          >
            <Toolbar variant="dense">
              <Box
                component={'div'}
                sx={{
                  flexGrow: 1,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Box
                  sx={{
                    height: '36px',
                    flex: '0 0 auto',
                    my: 0.75,
                    display: 'flex',
                    alignItems: 'center',
                    '& a': {
                      display: 'flex',
                      alignItems: 'center',
                    },
                  }}
                >
                  <AppLink
                    color="inherit"
                    href="/"
                    componentVariant="button-base"
                    anchorComponent={'button'}
                    disableRipple
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      fontWeight: 'fontWeightRegular',
                      fontFamily: 'h6.fontFamily',
                      fontSize: (theme) => ({
                        fontSize: theme.typography.pxToRem(18),
                        md: theme.typography.pxToRem(20),
                      }),
                    }}
                  >
                    <AglynSvgIcon
                      sx={{
                        fontSize: `1.75em`,
                        borderRadius: theme => theme.shape.appIconBorderRadius,
                        // boxShadow: theme.shadows[1],
                        ml: -0.5, mr: 0.75,
                      }}
                    />
                    <AglynSvgLogo
                      color="secondary"
                      sx={{
                        // color: '#36ca94', // Hulu
                        transform: 'translateY(0.0265em)',
                        height: 'auto',
                        fontSize: '2.765em',
                        // color: (theme) => theme.palette.mode === 'dark'
                        //   ? 'secondary.main'
                        //   : 'secondary.light',
                      }}
                    />
                    {productName && (
                      <Box
                        component={'span'}
                        color="textPrimary"
                        sx={{
                          // color: 'text.primary',
                          ml: 0.5,
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        {` ${productName}`}
                      </Box>
                    )}
                  </AppLink>
                </Box>
              </Box>
              <Box
                component={'div'}
                sx={{
                  display: 'flex',
                  flexGrow: 1,
                  flexBasis: '72%',
                  alignItems: 'center',
                }}
              >
                {(centerNavigationItems ?? []).map(buildNav('cni', buildTextButton))}
              </Box>
              <Box
                component={'div'}
                sx={{display: 'flex', alignItems: 'center'}}
              >
                {(quickActions ?? []).map(buildNav('qa', buildIconButton))}
                <Menu
                  title={'User account'}
                  items={[
                    {
                      dense: true,
                      children: 'Account Settings',
                      href: '/settings/account',
                    },
                  ]}
                  sx={{
                    p: {padding: 0.5, xs: 0.25},
                    '&:last-child': {
                      paddingLeft: 0.75,
                    },
                  }}
                >
                  <IconButton color="inherit">
                    <Avatar
                      alt={user?.displayName}
                      src={gravatarUrlFromEmail(user?.email)}
                      sx={{
                        backgroundColor: cyan[600],
                      }}
                    />
                  </IconButton>
                </Menu>
              </Box>
            </Toolbar>
          </AppBar>
          {tabBarTitle || (_isArr(navTabItems) && !_isArrEmpty(navTabItems)) ? (
            <AppBar
              component="div"
              color="inherit"
              elevation={0}
              position="static"
              sx={{
                borderBottomWidth: `1px`,
                borderBottomStyle: 'solid',
                borderBottomColor: 'divider',
                [`& .MuiToolbar-root`]: {
                  minHeight: 40,
                },
              }}
            >
              <Toolbar variant="dense">
                {tabBarTitle && (
                  <Box
                    component={'div'}
                    sx={{
                      // typography: 'h6',
                      lineHeight: 'normal',
                      letterSpacing: 2,
                      fontFamily: 'h6.fontFamily',
                      fontSize: `0.95em`,
                      fontWeight: 'fontWeightMedium',
                      textTransform: 'uppercase',
                      color: 'text.secondary',
                    }}
                  >
                    {tabBarTitle}
                  </Box>
                )}
                <Divider
                  orientation="vertical"
                  sx={{ml: 1.25, mr: 1}}
                  flexItem
                  light
                />

                <MuiTabs
                  aria-label="area navigation"
                  indicatorColor="secondary"
                  scrollButtons="auto"
                  textColor="inherit"
                  value={tabValue || false}
                  variant="scrollable"
                  sx={{
                    minHeight: 40,
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
                  {navTabItems && navTabItems.map(({icon, ...item}, index) => (
                    <TabItem
                      key={item.id ?? index}
                      href={item.href ?? ''}
                      value={item.href ?? index}
                      icon={icon?.path && <MdiIcon {...icon} /> || icon}
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
              </Toolbar>
            </AppBar>
          ) : null}
        </AppBar>
      </ElevateOnScroll>
      <Box component={'main'}>
        {children}
      </Box>
      <Box component={'footer'}>
        <Container maxWidth={FOOTER_MAX_WIDTH}>
          <Box
            component={'div'}
            sx={{
              mt: 6,
              pb: 1,
              pt: 2,
              borderTop: 1,
              display: 'flex',
              flexWrap: 'wrap',
              borderColor: 'divider',
              alignItems: 'center',
            }}
          >
            <Box
              component={'div'}
              sx={{
                flexGrow: 1,
                display: 'flex',
              }}
            >
              <CopyrightComponent />
            </Box>
            <Box
              component={'div'}
              sx={{display: 'flex'}}
            >
              <GridButtons
                spacing={1}
                ItemComponent={AppLink}
                items={footerNavItems.map((i) => ({
                  size: 'small',
                  componentVariant: 'button',
                  ...i,
                }))}
              />
            </Box>

            <Box
              alignItems="space-around"
              display="flex"
              flex="1 1 auto"
              flexBasis="100%"
              justifyContent="center"
            >
              <Typography align="center" color="textSecondary" variant="overline">
                <span>{`Version ${PACKAGE_VERSION}`}</span>
                {' '}
                <span>{`(${BUILD_ID})`}</span>
              </Typography>
            </Box>
          </Box>
        </Container>
      </Box>
    </Fragment>
  )
}

MainLayoutRaw.displayName = 'LayoutMainComponent'
MainLayoutRaw.defaultProps = {
  footerNavItems: tailNavigation as any,
  // aggregatedPageMeta: {} as any,
  // currentUserContext: {} as any,
}

export const LayoutMainComponent = /*withCurrentUserContext(withAggregatedPageMeta(*/MainLayoutRaw/*))*/
export default LayoutMainComponent
