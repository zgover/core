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

import type {Icon, IconId} from '@aglyn/shared-data-mdi'
import {getMdiAllIcons, getMdiIconFromId} from '@aglyn/shared-data-mdi'
import {FindWithFuzzy} from '@aglyn/shared-util-vendor'
import {useCallback, useEffect, useMemo, useState} from 'react'


export type MdiIcon = Icon
export type ApplyFilterFn = (query: string) => void
export type ClearFilterFn = () => void
export type UseMdiIconsReturn = [MdiIcon[], ApplyFilterFn, ClearFilterFn]

export function useMemoizedMdiIcons(iconIds?: IconId[]): (MdiIcon | undefined)[] {
  const [icons, setIcons] = useState([])

  useEffect(() => {
    let unloaded = false
    if (Array.isArray(iconIds) && iconIds.length > 0) {
      getMdiIconFromId(iconIds).then((icons: MdiIcon[]) => {
        // if (unloaded) return
        setIcons([...icons])
      })
    }
    else if (!iconIds) {
      getMdiAllIcons().then((icons) => {
        // if (unloaded) return
        setIcons([...icons])
      })
    }
    return () => {unloaded = true}
  }, [iconIds, setIcons])

  return icons
}


export function useMdiIcons(): UseMdiIconsReturn {
  const allIcons = useMemoizedMdiIcons() || []
  const [iconResults, setIconResults] = useState(() => allIcons)

  const fuzzy = useMemo(() => {
    return new FindWithFuzzy<MdiIcon>(allIcons, {
      keys: [
        {name: 'name', weight: 0.5},
        {name: 'as', weight: 0.25},
        {name: 'tags', weight: 0.25},
      ],
      includeScore: true,
      shouldSort: true,
      // threshold: 0.25,
      // minMatchCharLength: 3
    })
  }, [allIcons])

  const clearFilter: ClearFilterFn = useCallback(() => {
    setIconResults(allIcons)
  }, [allIcons, setIconResults])

  const applyFilter: ApplyFilterFn = useCallback((query: string) => {
    const results = fuzzy.search(query)
    setIconResults(results.map((i) => i.item))
  }, [fuzzy, setIconResults])

  return useMemo(() => {
    return [iconResults, applyFilter, clearFilter]
  }, [iconResults, applyFilter, clearFilter])
}

export default useMdiIcons
