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

import {type AnyProps} from '@aglyn/shared-data-types'
import {type NextPage} from 'next'
import {type AppProps as NextAppProps} from 'next/app'
import {type ReactElement} from 'react'


export type NextPageGetLayoutFn = (
  page: ReactElement,
  props: NextAppWithLayoutProps,
) => ReactElement

export type NextPageMemberLayoutComponent = {
  layoutComponent?: NextPageWithLayout
  layoutProps?: {
    [P in NextPageWithLayout['displayName']]: AnyProps
  }
}

export type NextPageMemberLayoutGetComponent = {
  getLayout?: NextPageGetLayoutFn
}

export type NextPageLayoutMembers =
  & NextPageMemberLayoutComponent
  & NextPageMemberLayoutGetComponent

export type NextPageWithLayout<Props = AnyProps, InitialProps = Props> =
  & NextPage<Props, InitialProps>
  & NextPageLayoutMembers

export type NextAppWithLayoutProps<Props = AnyProps, InitialProps = Props> = NextAppProps<Props> & {
  Component: NextPageWithLayout<Props, InitialProps>
  defaultGetLayout?: NextPageGetLayoutFn,
}

const GET_LAYOUT_NOOP = (page: ReactElement) => page

export function getNextPageLayout<Props, InitialProps>(
  props: NextAppWithLayoutProps<Props, InitialProps>,
): NextPageGetLayoutFn {
  const {Component, defaultGetLayout} = props

  if (Component.getLayout) {
    return Component.getLayout
  }

  if (Component.layoutComponent) {
    const LayoutComponent = Component.layoutComponent
    const layoutProps = Component.layoutProps?.[LayoutComponent.displayName]
    if (layoutProps) {
      LayoutComponent.layoutProps = {
        ...LayoutComponent.layoutProps,
        ...Component.layoutProps,
      }
    }

    return (page, props) => {
      const OuterComponent = getNextPageLayout({
        ...props, Component: LayoutComponent,
      })
      const children = (
        <LayoutComponent {...layoutProps}>
          {page}
        </LayoutComponent>
      )
      return OuterComponent(children, props)
    }
  }

  return defaultGetLayout || GET_LAYOUT_NOOP
}

export default getNextPageLayout
