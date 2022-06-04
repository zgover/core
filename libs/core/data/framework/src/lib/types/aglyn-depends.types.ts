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


export type AglynDependencyUid = string

export enum AglynDependencyStatus {
  WAITING = 'waiting',
  LOADING = 'loading',
  LOADED = 'loaded',
  UNLOADING = 'unloading',
}

export type AglynDependencyStatuses = Record<AglynDependencyUid, AglynDependencyStatus>
export type AglynDependenciesById = Record<AglynDependencyUid, AglynDependency>
export type AglynDependencyDependencies = Record<AglynDependencyUid, true>
export type AglynDependents = Record<AglynDependencyUid, true>
export type AglynDependencyDependents = Record<AglynDependencyUid, AglynDependents>

export interface AglynDependency {
  id: AglynDependencyUid
  dependencies?: AglynDependencyDependencies
  load(...args: any[]): void
  destroy(...args: any[]): void
}

export interface AglynDependencyMap {
  status: AglynDependencyStatuses
  dependents: AglynDependencyDependents
  __: AglynDependenciesById
}

export interface IAglynDependencyManager {
  dependencies?: AglynDependencyMap
  dependencyLoaded(id: AglynDependencyUid): boolean
  dependencyWaiting(id: AglynDependencyUid): boolean
  addDependency(dependency: AglynDependency): this
  dependency(id: AglynDependencyUid): AglynDependency | undefined
  removeDependency(id: AglynDependencyUid): this
}
