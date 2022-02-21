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
import {_isArr} from '@aglyn/shared-util-guards'
import {base64Decode} from '@aglyn/shared-util-tools'
import {useRouter} from 'next/router'
import {useMemo} from 'react'
import type {ContinueRouteData} from '../types'


export function decodeContinueQuery(query: string): ContinueRouteData {
  return JSON.parse(
    base64Decode(
      decodeURIComponent(
        query,
      ),
    ),
  )
}

export function useContinueQueryDecoded(): [ContinueRouteData, OrUndef<string[] | string>] {
  const router = useRouter()
  const {continue: query} = router.query

  return useMemo(() => {
    return [
      decodeContinueQuery((_isArr(query) ? query[0] : query) || ''),
      query,
    ]
  }, [query])
}

export default useContinueQueryDecoded
