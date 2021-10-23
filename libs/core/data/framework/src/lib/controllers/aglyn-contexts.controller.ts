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

import {
  AglynAppEffectFlag,
  AglynModuleBaseModelOptions,
  ContextsCreateStorePayload,
  ContextsDeleteStorePayload,
  ContextsGetStorePayload,
  ContextsSetStorePayload,
} from '@aglyn/core-data-framework'
import { KeyValueMap } from '@aglyn/shared-data-types'
import { _hasProperty, _isObj } from '@aglyn/shared-util-guards'
import { getProperty } from '@aglyn/shared-util-tools'
import {
  createDomain as createEffectorDomain,
  createEffect as createEffectorEffect,
  createEvent as createEffectorEvent,
  Domain as EffectorDomain,
  Store as EffectorStore,
} from 'effector'
import {
  AglynAppModuleEffectListener,
  AglynModuleBaseModel,
} from '../models/aglyn-module-base.model'
import { ContextStoreUid } from './aglyn-components.controller'


export interface ContextDomain extends EffectorDomain {

}

export interface ContextStore<T> extends EffectorStore<T> {

}

export type CreateEvent = typeof createEffectorEvent
export type CreateEffect = typeof createEffectorEffect

export type ContextStoreOptions<T> = {
  name?: string
  sid?: string
  updateFilter?: (update: T, current: T) => boolean
  serialize?: 'ignore'
}

export interface AglynContextsController extends AglynModuleBaseModel {
  getStore<T>(props: ContextsGetStorePayload): ContextStore<T>
  setStore<T>(props: ContextsSetStorePayload<T>): this
  createStore<T>(data: ContextsCreateStorePayload<T>): ContextStore<T>
  deleteStore(props: ContextsDeleteStorePayload): this
  createEvent(...args: Parameters<CreateEvent>): ReturnType<CreateEvent>
  createEffect(...args: Parameters<CreateEffect>): ReturnType<CreateEffect>
}

export interface AglynContextsControllerOptions extends AglynModuleBaseModelOptions {
  defaultStores: KeyValueMap<ContextStoreUid, { defaultState: any, options?: ContextStoreOptions<any> }>
}

const TAG = 'AglynContextsController'

export class AglynContextsController extends AglynModuleBaseModel {

  public static readonly [Symbol.toStringTag]: string = TAG

  #options: AglynContextsControllerOptions = null
  #domain: ContextDomain = null
  #stores: Map<ContextStoreUid, ContextStore<any>> = new Map()

  constructor(options) {
    super(options)
    this.#options = {...options}
    this.#setup()
  }
  #setup() {
    this.#domain = createEffectorDomain(this.app.getName())
    this.#setupDefaultStores()
  }
  #setupDefaultStores(): void {
    const defaultStores = this.#options.defaultStores
    if (defaultStores && _isObj(defaultStores)) {
      for (const storeId in defaultStores) {
        if (_hasProperty(storeId, defaultStores)) {
          const {options, defaultState} = getProperty(defaultStores, storeId) || {}
          const store = this.createStore({defaultState, options})
          this.setStore({storeId, store})
        }
      }
    }
  }

  public toString(): string {
    return `${TAG}(app: '${this.app.getName()}')`
  }
  public toJSON() {
    return {
      ...super.toJSON(),
      ...this.#stores,
    }
  }

  public getOptions = (): AglynContextsControllerOptions => {
    return this.#options
  }
  public createEvent = (...args: Parameters<CreateEvent>): ReturnType<CreateEvent> => {
    return this.#domain.createEvent(...args)
  }
  public createEffect = (...args: Parameters<CreateEffect>): ReturnType<CreateEffect> => {
    return this.#domain.createEffect(...args)
  }
  public createStore = <T>(data: ContextsCreateStorePayload<T>): ContextStore<T> => {
    const {options, defaultState} = data
    return this.#domain.createStore(defaultState, options)
  }
  public getStore = <T>(data: ContextsGetStorePayload): ContextStore<T> => {
    const {storeId} = data
    return this.#stores.get(storeId)
  }
  public setStore = <T>(data: ContextsSetStorePayload<T>): this => {
    const {storeId, store} = data
    if (storeId && store) {
      this.#stores.set(storeId, store)
    }
    else {
      // TODO: throw errorFactory error
    }
    return this
  }
  public deleteStore = (data: ContextsDeleteStorePayload): this => {
    const {storeId} = data
    this.#stores.delete(storeId)
    return this
  }

  protected listeners: AglynAppModuleEffectListener<any>[] = [
    [AglynAppEffectFlag.CONTEXTS_CREATE_STORE, this.createStore],
    [AglynAppEffectFlag.CONTEXTS_GET_STORE, this.getStore],
    [AglynAppEffectFlag.CONTEXTS_SET_STORE, this.setStore],
    [AglynAppEffectFlag.CONTEXTS_DELETE_STORE, this.deleteStore],
  ]
}

export type AglynContextsControllerT = typeof AglynContextsController
export default AglynContextsController
