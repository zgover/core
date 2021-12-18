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

import {DEFAULT_ICON, getMdiIconFromId} from '@aglyn/shared-data-mdi'
import {useEffect, useState} from 'react'
import type {Icon, IconId} from '../types'


type UseMdiIcon<T extends IconId[] | IconId> = T extends IconId[] ? Icon[] : Icon

export const useMdiIcon = <T extends IconId[] | IconId>(
  iconIds: T,
): UseMdiIcon<T> => {

  const [icon, setIcon] = useState<UseMdiIcon<T>>(
    () => (Array.isArray(iconIds) ? [DEFAULT_ICON] : DEFAULT_ICON) as UseMdiIcon<T>,
  )
  const isWindow = typeof window !== 'undefined'

  useEffect(() => {
    let mounted = true

    if (isWindow) {
      ;(async function() {
        await getMdiIconFromId(iconIds).then((icon: UseMdiIcon<T>) => {
          if (!mounted) return
          setIcon(icon)
        })
      })()
    }

    return () => {mounted = false}
  }, [iconIds, setIcon, isWindow])

  return icon
}
export default useMdiIcon
