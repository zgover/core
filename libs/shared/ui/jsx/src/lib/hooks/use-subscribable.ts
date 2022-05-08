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

import {DependencyList, useCallback, useState} from 'react'
import type {Subscribable as RxJsSubscribable} from 'rxjs'
import useIsomorphicLayoutEffect from './use-isomorphic-layout-effect'


export type SubscribableLike<T> = RxJsSubscribable<T> | Observable<T>

export interface Observable<T> {
  subscribe: (listener: (value: T) => void) => {
    unsubscribe: () => void;
  };
}

export type MapObservable<V, R> = (newValue: V, prevValue: R) => R


export function useSubscribable<T>($subscribable: SubscribableLike<T>): T | undefined
export function useSubscribable<T,
  U = any,
  M extends MapObservable<U, U | T | undefined> = MapObservable<U, U | T | undefined>>(
  $subscribable: SubscribableLike<U>,
  initialValue: U | T,
  mapValue?: M,
  dependencies?: DependencyList,
): U | T
export function useSubscribable<T,
  U = any,
  M extends MapObservable<U, U | T | undefined> = MapObservable<U, U | T | undefined>>(
  $subscribable: SubscribableLike<U>,
  initialValue?: U | T,
  mapValue?: M,
  dependencies?: DependencyList,
): U | T | undefined {
  const [value, update] = useState<T | U | undefined>(initialValue)

  const mapUpdate = useCallback(
    (newValue, prevValue) => (
      mapValue
        ? mapValue(newValue, prevValue as T) as T
        : newValue as U
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    dependencies || [],
  )

  useIsomorphicLayoutEffect(() => {
    const subscribable = $subscribable?.subscribe?.((newValue) => {
      update((prevValue) => mapUpdate(newValue, prevValue))
    })
    return () => subscribable?.unsubscribe?.()
  }, [$subscribable, mapUpdate])

  return value
}

export default useSubscribable
