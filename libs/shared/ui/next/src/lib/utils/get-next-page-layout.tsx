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
import {type ComponentType, type ReactElement} from 'react'


export type NextPageGetLayout<Props = AnyProps, InitialProps = Props> = {
  (page: ReactElement, props: NextAppWithLayoutProps<Props, InitialProps>): ReactElement
}
export type NextPageWithLayout<Props = AnyProps, InitialProps = Props> = NextPage<Props, InitialProps> & {
  getLayout?: NextPageGetLayout<Props, InitialProps>
  layoutComponent?: ComponentType<any>
}
export type NextAppWithLayoutProps<Props = AnyProps, InitialProps = Props> = NextAppProps<Props> & {
  Component: NextPageWithLayout<Props, InitialProps>
  defaultGetLayout?: NextPageGetLayout<Props, InitialProps>,
}

const GET_LAYOUT_NOOP = (page: ReactElement) => page

export function getNextPageLayout<Props, InitialProps>(
  props: NextAppWithLayoutProps<Props, InitialProps>,
): NextPageGetLayout<Props, InitialProps> {
  const {Component, defaultGetLayout} = props

  if (Component.getLayout) return Component.getLayout
  if (Component.layoutComponent) return (children, props) => {
    const InnerComponent = Component.layoutComponent
    const OuterComponent = getNextPageLayout({...props, Component: InnerComponent})
    return OuterComponent(<InnerComponent>{children}</InnerComponent>, props)
  }
  if (defaultGetLayout) return defaultGetLayout

  return GET_LAYOUT_NOOP
}

export default getNextPageLayout
