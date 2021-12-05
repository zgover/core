/**
 * @license
 * Copyright 2021 Aglyn LLC
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

import { icons as mdiIcons, IconsNormalized } from '@aglyn/shared-data-mdi'

import { _isArr } from '@aglyn/shared-util-guards'
import { FindWithFuzzy } from '@aglyn/shared-util-vendor'
import { useCallback, useMemo, useState } from 'react'


export type MdiIcon = {
  id: string
  name: string
  aliases: string[]
  path: string
}
export type FilterOpts = {
  keys?: string[]
}
export type ApplyFilterFn = (query: string) => void
export type ClearFilterFn = () => void
export type FilterHelpers = {
  applyFilter: ApplyFilterFn
  clearFilter: ClearFilterFn
}
export type UseMdiIconsReturn = [MdiIcon[], FilterHelpers, IconsNormalized]

export function useMemoizedMdiIcons(iconIds?: string[]): (MdiIcon | null)[] {
  const allIds = Array.from(mdiIcons.iconIds)
  const ids = _isArr(iconIds) ? Array.from(iconIds) : allIds
  return useMemo(
    () =>
      ids.map((id) => {
        const icon = mdiIcons.byIconId[id]
        return !icon
          ? null
          : {
            id,
            name: icon.name,
            path: icon.paths,
            aliases: Object.keys(icon.alias).filter((i) => icon.alias[i] === true),
          }
      }),
    [ids],
  )
}

const defaultKeys = ['id', 'name', 'aliases']
const searchItems = (fuzzy, query: string) => fuzzy.search(query ?? '').map((i) => i.item)

export function useMdiIcons(initialQuery?: string, opts?: FilterOpts): UseMdiIconsReturn {
  const allIcons = useMemoizedMdiIcons()
  const options = {keys: defaultKeys, ...opts}
  const icons = useMemo(() => mdiIcons, [])
  const [query, setQuery] = useState(() => initialQuery ?? '')
  const applyFilter: ApplyFilterFn = useCallback((query: string) => setQuery(query), [])
  const clearFilter: ClearFilterFn = useCallback(() => setQuery(''), [])
  const helpers = useMemo(() => ({applyFilter, clearFilter}), [applyFilter, clearFilter])
  const filteredIcons = useMemo<MdiIcon[]>(() => {
    const fuzzy = new FindWithFuzzy(allIcons, options)
    return query ? searchItems(fuzzy, query) : allIcons
  }, [query, options, allIcons])

  return useMemo(
    () => [filteredIcons, helpers, icons],
    [filteredIcons, helpers, icons]
  )
}

export default useMdiIcons
