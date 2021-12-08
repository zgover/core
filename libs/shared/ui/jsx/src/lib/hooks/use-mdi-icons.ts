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
import { arraySortBy } from '@aglyn/shared-util-tools'


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
export type UseMdiIconsReturn = [MdiIcon[], ApplyFilterFn, ClearFilterFn]

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
            path: icon.path,
            aliases: Object.keys(icon.alias).filter((i) => icon.alias[i] === true),
          }
      }),
    [ids],
  )
}

const defaultKeys = ['name', 'aliases']
const fuzzyInstance = new FindWithFuzzy<MdiIcon>([], {
  keys: ['name'],
  includeScore: true,
  // shouldSort: true,
  // sortFn: ({score:a}, {score:b}) => a > b ? 1 : a < b ? -1 : 0,
  // threshold: 0.25,
  // minMatchCharLength: 3
})

export function useMdiIcons(initialQuery?: string, opts?: FilterOpts): UseMdiIconsReturn {
  const allIcons = useMemoizedMdiIcons()

  const fuzzy = useMemo(() => {
    fuzzyInstance.setCollection(allIcons)
    return fuzzyInstance
  }, [allIcons])

  const [iconResults, setIconResults] = useState(() => allIcons)

  const clearFilter: ClearFilterFn = useCallback(() => {
    setIconResults(allIcons)
  }, [allIcons, setIconResults])

  const applyFilter: ApplyFilterFn = useCallback((query: string) => {
    const results = fuzzy.search(query)
    console.log('results', query, results)
    setIconResults(results.map((i) => i.item))
  }, [fuzzy, setIconResults])

  return useMemo(() => {
    return [iconResults, applyFilter, clearFilter]
  }, [iconResults, applyFilter, clearFilter])
}

export default useMdiIcons
