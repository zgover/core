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

import type {OrUndef} from '@aglyn/shared-data-types'
import {_isArr, _isArrOfArr, _isUndOrNull} from '@aglyn/shared-util-guards'
import type {SxProps, Theme as DefaultTheme} from '../../vendor/mui'


export type MergedSxProps<Theme extends object = DefaultTheme> =
  Extract<SxProps<Theme>, any[]>

export function mergeSxProps<Theme extends object = DefaultTheme>(
  ...sxProps: OrUndef<SxProps<Theme>[] | SxProps<Theme>>[]
): MergedSxProps<Theme> {
  const merged: MergedSxProps<Theme> = []

  for (const i of sxProps) {
    if (_isUndOrNull(i)) continue
    if (_isArr(i)) merged.push(...mergeSxProps(..._isArrOfArr(i) ? i : [i]))
    else merged.push(i)
  }

  return merged
}

export default mergeSxProps
