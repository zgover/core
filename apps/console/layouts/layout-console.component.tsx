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

import {getFirebaseAuth} from '@aglyn/shared-feature-fbclient'
import {mergeSxProps} from '@aglyn/shared-feature-themes'
import {BackgroundImageComponent, GridItems, type GridItemsProps} from '@aglyn/shared-ui-jsx'
import {mdiCogOutline, MdiIcon, type MdiIconProps, mdiShieldLock} from '@aglyn/shared-ui-mdi-jsx'
import {_isArr} from '@aglyn/shared-util-guards'
import {Container, Stack, Typography} from '@mui/material'
import type {ReactNode} from 'react'
import {useAuthState} from 'react-firebase-hooks/auth'
import {isElement} from 'react-is'
// import {type CurrentUserContextType} from '../contexts/current-user-context'
// import {type AggregatedPageMeta} from '../lib/app-pages'
// import {tabItems} from '../lib/navigation-menus'
import BreadcrumbsComponent from '../components/breadcrumbs.component'
import LayoutAuthenticatedComponent from './layout-authenticated.component'
import LayoutMainComponent, {type MainLayoutProps} from './layout-main.component'


const firebaseAuth = getFirebaseAuth()
export const CONTENT_MAX_WIDTH = 'xl'
const getHeader = (first, second) => (
  <span>
    <b>{first}:</b> {second}
  </span>
)

export interface LayoutConsoleProps extends MainLayoutProps {
  ContentGridItemsProps?: GridItemsProps
  items?: GridItemsProps['items']
  header?: {
    icon?: MdiIconProps | ReactNode
    children?: ReactNode
  }
  aggregatedPageMeta?: any//AggregatedPageMeta
  currentUserContext?: any//CurrentUserContextType
}

function LayoutConsoleComponent(props: LayoutConsoleProps) {
  const {
    header: headerProp,
    aggregatedPageMeta,
    title: titleProp,
    items,
    breadcrumbItems: breadcrumbItemsProp,
    ContentGridItemsProps,
    children,
    currentUserContext,
    ...rest
  } = props
  const [user, loading, error] = useAuthState(firebaseAuth)
  const {pageMeta, overrideMeta, pageAncestors} = aggregatedPageMeta || {}
  const title = titleProp ?? (overrideMeta ?? pageMeta)?.title
  const [rootArea, mainArea, subArea] = pageAncestors || []
  const header = {
    icon: {path: mainArea?.icon},
    children: getHeader(
      mainArea ? mainArea?.name?.default : rootArea?.name?.default,
      subArea ? subArea?.name?.plural : (overrideMeta ?? pageMeta)?.name?.default,
    ),
    ...headerProp,
  }
  const breadcrumbItems = breadcrumbItemsProp || [] /*?? (copy(pageAncestors || []) as any[]))*/
  // .concat((overrideMeta ?? pageMeta) || [])
  // .map((item: any) => ({
  //   href: _s(item?.id),
  //   children: item?.name.plural,
  // }))
  const quickActionMenus: MainLayoutProps['quickActionMenus'] = [
    {
      icon: {path: mdiCogOutline.path},
      // alt: '',
      items: [
        {
          dense: true,
          children: 'Change Theme',
        },
      ],
    },
  ]

  return (
    <LayoutMainComponent
      title={title ? [..._isArr(title) ? title : [title], 'Secure'] : 'Secure'}
      productName={'Console'}
      quickActionMenus={quickActionMenus}
      tabBarTitle={(
        <Stack
          direction="row"
          spacing={{sm: 0.15, md: 0.5}}
          alignItems="center"
          typography={'subtitle2'}
          lineHeight={'normal'}
          sx={{color: 'tertiary.light'}}
        >
          <span>
            {'Secure'}
          </span>
          <MdiIcon
            path={mdiShieldLock.path}
            fontSize={'small'}
            sx={{color: 'tertiary.light'}}
          />
        </Stack>
      )}
      navTabItems={[
        {
          id: 'dashboard',
          label: 'Dashboard',
          href: '/',
        },
        {
          id: 'besigner',
          label: 'Besigner',
          href: '/besigner',
        },
      ]}
      {...rest}
    >
      <BackgroundImageComponent
        component="header"
        url="/_static/images/backgrounds/patterns/abstract-wave-lines.svg"
        bgPosition="50% 90%"
        sx={{
          pt: 10,
          bgcolor: 'background.secondary',
          color: 'text.primary',
          borderBottomWidth: `1px`,
          borderBottomStyle: 'solid',
          borderBottomColor: 'divider',
        }}
      >
        <Container maxWidth={CONTENT_MAX_WIDTH}>
          <Typography
            component="h1"
            variant="h4"
            sx={mergeSxProps({
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
            })}
          >
            {!header?.icon || isElement(header.icon) ? header.icon : (
              <MdiIcon
                color="inherit"
                {...header.icon}
                sx={mergeSxProps({
                  padding: 1,
                  mr: 1.75,
                  ml: -0.5,
                  fontSize: `1.5em`,
                  borderWidth: `1px`,
                  borderStyle: 'solid',
                  borderColor: 'tertiary.dark',
                  color: 'quaternary.contrastText',
                  bgcolor: 'quaternary.main',
                  borderRadius: (theme) => theme.shape.appIconBorderRadius,
                }, header.icon?.['sx'])}
              />
            )}
            {header?.children ?? title}
          </Typography>
          <BreadcrumbsComponent
            items={breadcrumbItems as any}
            sx={{my: 2}}
          />
        </Container>
      </BackgroundImageComponent>
      <main /*className={classes.content}*/>
        <Container maxWidth={CONTENT_MAX_WIDTH}>
          {items || ContentGridItemsProps ? (
            <GridItems
              items={items}
              spacing={3}
              {...ContentGridItemsProps}
            />
          ) : null}
          {children}
        </Container>
      </main>
    </LayoutMainComponent>
  )
}

LayoutConsoleComponent.displayName = 'LayoutConsoleComponent'
LayoutConsoleComponent.defaultProps = {}
LayoutConsoleComponent.layoutComponent = LayoutAuthenticatedComponent

export {LayoutConsoleComponent}
export default LayoutConsoleComponent
