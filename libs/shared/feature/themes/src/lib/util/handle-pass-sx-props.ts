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

import {type Dictionary} from '@aglyn/shared-data-types'
import {type SxProps, type Theme} from '../../vendor/mui'


export type MergedPassSxProps<T extends Dictionary<any> = Theme> = Extract<SxProps<T>, any[]>

export function handlePassSxProps<T extends Dictionary<any> = Theme>(
  sx: SxProps<T>,
  ...passProps: Array<SxProps<T>>
): MergedPassSxProps<T>

export function handlePassSxProps<T extends Dictionary<any> = Theme>(
  ...sx: Array<SxProps<T>>
): MergedPassSxProps<T> {
  const res: Extract<SxProps<T>, any[]> = []

  for (const i of sx) {
    if (Array.isArray(i)) res.push(...i)
    else res.push(i)
  }

  return res
}
export default handlePassSxProps
