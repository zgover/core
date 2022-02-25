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

import {_isEqualitySameType} from '@aglyn/shared-util-guards'
import {useMediaQuery} from '@mui/material'
import Cookie from 'js-cookie'
import {type SyntheticEvent, useCallback, useMemo, useState} from 'react'


export type ThemeMode = 'light' | 'dark'
export type LocalMode = 'light' | 'dark' | 'system'
export type UseThemeMode = [
  themeMode: ThemeMode,
  localMode: LocalMode,
  toggleThemeMode: (event: SyntheticEvent<any>, to?: LocalMode) => void,
]

export const COOKIE_THEME_KEY = 'theme-color-scheme'

export function useHandleThemeModes(defaultMode?: ThemeMode): UseThemeMode {
  const prefDark = useMediaQuery('(prefers-color-scheme: dark)')
  const cookieMode = Cookie.get(COOKIE_THEME_KEY)
  const [localMode, setLocalMode] = useState<LocalMode | null>(null)

  const themeMode = useMemo(() => {
    const value = localMode
      || cookieMode
      || prefDark
      || defaultMode
    if (value === 'dark' || value === 'light') return value
    return prefDark ? 'dark' : 'light'
  }, [cookieMode, defaultMode, localMode, prefDark])

  const toggleThemeMode = useCallback((event: SyntheticEvent<any>, to?: LocalMode) => {
    const override = _isEqualitySameType(to, 'light', 'dark', 'system') ? to : null
    const value = override || (
      (localMode || themeMode) === 'light' ? 'dark'
        : (localMode || themeMode) === 'system' ? 'light'
          : 'system'
    )
    Cookie.set(COOKIE_THEME_KEY, value, {expires: 365})
    setLocalMode(value)
  }, [themeMode, localMode])

  return useMemo(() => [
    themeMode,
    localMode || themeMode,
    toggleThemeMode,
  ], [themeMode, localMode, toggleThemeMode])
}

export default useHandleThemeModes
