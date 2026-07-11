/**
 * @license
 * Copyright 2026 Aglyn LLC
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

import * as Aglyn from '@aglyn/aglyn/server'
import type { Metadata } from 'next'
import { notFound, permanentRedirect, redirect } from 'next/navigation'
import CatchAllClient from './catch-all-client'
import { loadPageData } from './load-page-data'
import type { Props } from './types'

// ISR: the old getStaticPaths used `fallback: 'blocking'` with per-page
// revalidate 60s. generateStaticParams returns nothing (nothing prebuilt);
// every path server-renders on demand and caches for `revalidate` seconds.
export const revalidate = 60
export const dynamicParams = true

export function generateStaticParams() {
  return []
}

type CatchAllPageProps = {
  params: Promise<{ host: string; slug?: string[] }>
}

/**
 * Metadata replaces the Pages Router `<Head>` blocks (no-ops in the App
 * Router). Derived server-side from the same composed props — screen SEO
 * with host-level defaults, noindex for the gated/soft-404 surfaces.
 */
function buildMetadata(props: Props): Metadata {
  const host = props.data?.host as any
  const screen = props.data?.screen?.data as any
  const siteTitle: string | undefined = host?.seo?.title ?? host?.displayName
  const separator: string = host?.seo?.separator ?? ' – '
  const withSite = (title?: string) =>
    [title, siteTitle].filter(Boolean).join(separator) || 'Aglyn site'

  // Gated / fixed surfaces stay out of search (AGL-87/109/131).
  if (props.membershipPage) {
    return {
      title: props.membershipPage === 'signup' ? 'Sign up' : 'Sign in',
      robots: { index: false, follow: true },
    }
  }
  if (props.maintenanceFallback) {
    return { title: 'Temporarily unavailable', robots: { index: false } }
  }
  if (props.memberScreen) {
    return { title: 'Members only', robots: { index: false, follow: true } }
  }

  // Content collections (AGL-81/117): entry metadata drives the head.
  if (props.content) {
    const content = props.content as any
    const entry = content.entry
    const title = entry ? entry.title : content.collection?.displayName
    const description: string | undefined = entry?.excerpt || undefined
    const fullTitle = withSite(title)
    return {
      title: fullTitle,
      ...(description ? { description } : {}),
      openGraph: {
        title: fullTitle,
        ...(description ? { description } : {}),
        type: entry ? 'article' : 'website',
        ...(siteTitle ? { siteName: siteTitle } : {}),
      },
    }
  }

  // Screen render (SEO Toolkit): screen fields with host-level fallbacks.
  const pageTitle: string | undefined = screen?.seo?.title || screen?.displayName
  const fullTitle = withSite(pageTitle)
  const description: string | undefined =
    screen?.seo?.description || screen?.description || host?.seo?.description
  const socialImage: string | undefined =
    screen?.seo?.image || host?.seo?.image || undefined
  const unlisted = screen?.visibility === Aglyn.HostScreenVisibility.UNLISTED
  const noindex = unlisted || props.notFoundFallback || props.protectedScreen
  const canonicalBase = host?.cname
    ? `https://${host.cname}`
    : host?.subdomain
      ? `https://${host.subdomain}.aglyn.app`
      : undefined
  const screenPath = screen?.$id ? host?.screens?.[screen.$id] : undefined
  const canonical =
    canonicalBase && screenPath != null
      ? `${canonicalBase}${Aglyn.screenRoutePathToUrl(screenPath)}`
      : undefined

  return {
    title: fullTitle,
    ...(description ? { description } : {}),
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
    ...(canonical ? { alternates: { canonical } } : {}),
    openGraph: {
      title: fullTitle,
      ...(description ? { description } : {}),
      type: 'website',
      ...(canonical ? { url: canonical } : {}),
      ...(socialImage ? { images: [socialImage] } : {}),
      ...(siteTitle ? { siteName: siteTitle } : {}),
    },
    twitter: {
      card: socialImage ? 'summary_large_image' : 'summary',
      ...(socialImage ? { images: [socialImage] } : {}),
    },
  }
}

export async function generateMetadata({
  params,
}: CatchAllPageProps): Promise<Metadata> {
  const { host, slug } = await params
  const result = await loadPageData(host, slug ?? [])
  return 'props' in result ? buildMetadata(result.props) : {}
}

/**
 * Catch-all tenant site render (AGL-398), migrated from the Pages Router
 * `[[...slug]]` + getStaticProps. The server loader composes the page and
 * this route maps its result to `notFound()` / `redirect()` / the client
 * renderer. Metadata comes from `generateMetadata`; the two share one
 * `cache`d `loadPageData` call per request.
 */
export default async function CatchAllPage({ params }: CatchAllPageProps) {
  const { host, slug } = await params
  const result = await loadPageData(host, slug ?? [])
  if ('notFound' in result) notFound()
  if ('redirect' in result) {
    const { destination, statusCode } = result.redirect
    if (statusCode === 301 || statusCode === 308) permanentRedirect(destination)
    redirect(destination)
  }
  return <CatchAllClient {...result.props} />
}
