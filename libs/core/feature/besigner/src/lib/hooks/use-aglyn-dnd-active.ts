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


import type {
  BesignerDndElementActive,
  BesignerDndState,
  IBesignerAppController,
} from '@aglyn/core-data-besigner'
import {setBesignerDndItem} from '@aglyn/core-data-besigner'
import {useAglynAppContext} from '@aglyn/core-feature-renderer'
import {useSubscribable} from '@aglyn/shared-ui-jsx'
import {_isFnT} from '@aglyn/shared-util-guards'
import {useCallback} from 'react'


export function useAglynDndActive(): [
  value: BesignerDndElementActive | undefined,
  setValue: (
    value: BesignerDndElementActive | ((
      prev: BesignerDndElementActive,
      dnd: BesignerDndState,
    ) => BesignerDndElementActive),
  ) => void
] {
  const app = useAglynAppContext() as IBesignerAppController
  const value = useSubscribable<BesignerDndElementActive>(
    app.besigner?.dnd, undefined,
    (dnd) => dnd?.active,
  )
  const setDndActive = useAglynDndSetActive()

  return [value, setDndActive]
}

export default useAglynDndActive

export function useAglynDndSetActive(): (
  value: BesignerDndElementActive | ((
    prev: BesignerDndElementActive,
    dnd: BesignerDndState,
  ) => BesignerDndElementActive),
) => void {
  const app = useAglynAppContext() as IBesignerAppController
  return useCallback((
    value: BesignerDndElementActive | ((
      prev: BesignerDndElementActive,
      dnd: BesignerDndState,
    ) => BesignerDndElementActive),
  ) => {
    setBesignerDndItem(app, {
      item: 'active',
      value: (prev, dnd) => (_isFnT(value) ? value(prev, dnd) : value),
    })
  }, [app])
}
