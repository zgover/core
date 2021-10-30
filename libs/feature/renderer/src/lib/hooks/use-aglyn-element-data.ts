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

import type { ElementId } from '@aglyn/core-data-framework'
import { AglynComponentElementDataNormalized, getContextStore } from '@aglyn/core-data-framework'
import type { AnyProps } from '@aglyn/shared-data-types'
import { useStoreMap } from 'effector-react'
import { useMemo } from 'react'
import { useAglynAppContext } from '../contexts/aglyn-app-context'


export function useAglynElementData<P extends AnyProps>(
  $id: ElementId,
): AglynComponentElementDataNormalized {
  const {getApp} = useAglynAppContext()
  const store = getContextStore(getApp(), {storeId: 'elements-normalized'})
  const elementData = useStoreMap(store, (elements) => {
    return elements[$id]
  })

  return useMemo(() => {
    return elementData
  }, [$id, getApp])
}
export default useAglynElementData
