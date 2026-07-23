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
'use client'

import { usePathname } from 'next/navigation'
import { useMemo } from 'react'
import adminNavTabItems from '../constants/admin-nav-tabs'
import hostNavTabItems from '../constants/host-nav-tabs'
import manageNavTabItems from '../constants/manage-nav-tabs'
import useOrgNavTabItems from './use-org-nav-tabs'

export interface NavTabItem {
  id?: string
  label?: string
  href?: string
}

export type NavSectionKind = 'host' | 'org' | 'admin' | 'manage' | 'none'

export interface NavSection {
  kind: NavSectionKind
  /** The path the section's tab hrefs are relative to ('' when none). */
  base: string
  orgSlug?: string
  host?: string
}

const segmentsOf = (path: string) => path.split('/').filter(Boolean)

/**
 * Which tab strip a path belongs to (AGL-754). Every `navTabItems=` variant
 * the pages used to pass corresponds to exactly one route subtree, so the
 * secondary app bar can derive its own strip from the URL instead of being
 * fed by whichever page happens to be mounted.
 *
 * `/[orgSlug]/hosts` is the org "Sites" tab, but `/[orgSlug]/hosts/[host]` is
 * a site — the host branch needs the third segment, not just `hosts`.
 */
export function resolveNavSection(pathname: string | null): NavSection {
  const segments = segmentsOf(pathname ?? '')
  const [first, second, third] = segments
  if (!first) return { kind: 'none', base: '' }
  if (first === 'admin') return { kind: 'admin', base: '/admin' }
  if (first === 'manage') return { kind: 'manage', base: '/manage' }
  if (second === 'hosts' && third) {
    return {
      kind: 'host',
      base: `/${first}/hosts/${third}`,
      orgSlug: first,
      host: third,
    }
  }
  return { kind: 'org', base: `/${first}`, orgSlug: first }
}

/**
 * The tab a path selects, as the matching item's `href` (what
 * `AppLinkTabsComponent` compares against).
 *
 * Matches on the first route SEGMENT below the section base, not by longest
 * prefix: the Screens tab is `…/screens/list` while a screen detail page is
 * `…/screens/[screenId]/versions/[versionId]/view`, so a prefix test selects
 * the Dashboard tab (the only href that is still a prefix) or nothing at all.
 * A tab with no segment below the base — the host Dashboard — is the match
 * only when the path has none either.
 */
export function resolveActiveTab(
  pathname: string | null,
  base: string,
  items: NavTabItem[],
): string | undefined {
  if (!pathname) return undefined
  const relative = (path: string) =>
    path === base || path.startsWith(`${base}/`)
      ? segmentsOf(path.slice(base.length))[0]
      : undefined

  if (!(pathname === base || pathname.startsWith(`${base}/`))) return undefined
  const segment = relative(pathname)
  return items.find((item) => item.href && relative(item.href) === segment)
    ?.href
}

/**
 * The secondary app bar's strip for the current route. Mounted once in the
 * `(app)` layout, so it must not depend on anything a page provides.
 */
export function useSecondaryNav(): {
  navTabItems: NavTabItem[]
  activeTab: string | undefined
  section: NavSection
} {
  const pathname = usePathname()
  const section = useMemo(() => resolveNavSection(pathname), [pathname])
  // Hooks can't be called conditionally, so the org strip is always built;
  // it is only handed out on org routes.
  const orgNavTabItems = useOrgNavTabItems()

  const navTabItems = useMemo(() => {
    switch (section.kind) {
      case 'host':
        return hostNavTabItems(section.orgSlug ?? '', section.host ?? '')
      case 'org':
        return orgNavTabItems
      case 'admin':
        return adminNavTabItems()
      case 'manage':
        return manageNavTabItems()
      default:
        return []
    }
  }, [section, orgNavTabItems])

  const activeTab = useMemo(
    () => resolveActiveTab(pathname, section.base, navTabItems),
    [pathname, section.base, navTabItems],
  )

  return { navTabItems, activeTab, section }
}

export default useSecondaryNav
