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
import {base64Decode} from '@aglyn/shared-util-tools'
import {useRouter} from 'next/router'
import {useMemo} from 'react'
import type {ContinueRouteData} from '../types'


export function decodeContinueRoute(continueParam: string): ContinueRouteData {
  return JSON.parse(
    base64Decode(
      decodeURIComponent(
        continueParam,
      ),
    ),
  )
}

export function useContinueRouteDecoded(): [ContinueRouteData, OrUndef<string[] | string>] {
  const router = useRouter()
  const {continue: cont} = router.query

  return useMemo(() => {
    const decoded = decodeContinueRoute((Array.isArray(cont) ? cont[0] : cont) || '')
    return [decoded, cont]
  }, [cont])
}

export default useContinueRouteDecoded
