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

import {DEFAULT_ICON, getMdiAllIcons} from '@aglyn/shared-data-mdi'
import {useEffect, useState} from 'react'
import type {Icon, IconId} from '../types'


export const useMdiIcons = (iconIds?: IconId[]): Icon[] => {
  const [icons, setIcons] = useState(() => [])
  const isWindow = typeof window !== 'undefined'

  useEffect(() => {
    let mounted = true

    if (isWindow) {

      ;(async function() {
        await getMdiAllIcons().then((MdiIcons) => {
          if (!mounted) return
          setIcons(() => {
            if (Array.isArray(iconIds)) {
              const icons = MdiIcons.filter(({id}) => iconIds.indexOf(id) >= 0)
              return iconIds.map((id) => {
                return icons.find((icon) => icon.id === id) || DEFAULT_ICON
              })
            }
            return MdiIcons
          })
        })
      })()

    }

    return () => {mounted = false}
  }, [iconIds, setIcons, isWindow])

  return icons
}
export default useMdiIcons
