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


export type Payload<T = any> = {payload: T}
export type PayloadData<T extends Dictionary = any> = T
export type PayloadParams<T> = { [K in keyof T]: T[K] }

export type AglynUniqueId<T extends boolean = false> = T extends boolean
  ? T extends true
    ? {getId(): string}
    : {readonly $id: string}
  : never

/** Observers to handle life cycle onInit/onDestroy events */
export interface AglynLifecycleObserver<T = any> {
  /**
   * Should be invoked once immediately after instantiation
   */
  onInitialize?(props?: T): void
  /**
   * Should be invoked once as last step before garbage collection
   */
  onDestroy?(props?: T): void
}

export interface AglynLoadableObserver<T1 = any, T2 = T1> extends AglynLifecycleObserver<T1> {
  /**
   * Should be invoked each time the object is loaded
   */
  aglynOnLoad?(props?: T2): void
  /**
   * Should be invoked each time the object is unloaded
   */
  aglynOnUnload?(props?: T2): void
}

export interface ModificationHistoryState<T> {
  past: [previous?: T, ...more: T[]],
  present: T
  future: [next?: T, ...more: T[]],
}
