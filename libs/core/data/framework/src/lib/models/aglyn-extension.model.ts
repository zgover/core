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

import { OrNull } from '@aglyn/shared-data-types'
import { getStaticField } from '@aglyn/shared-util-tools'
import { AglynErrorEventFlag } from '../constants/error'
import { EXTENSION_TYPE, MODULE_TYPE, TYPE_KIND, TYPE_OF } from '../constants/symbol'
import type { AglynAppController } from '../controllers/aglyn-app.controller'
import { ExtensionUUN } from '../controllers/aglyn-components.controller'
import { AglynExtensionTypeFields } from '../controllers/aglyn-extension.controller'
import { AglynLifecycleFlag, AglynLoadableObserver } from '../types'
import { AglynBaseModel, AglynBaseModelOptions } from './aglyn-base.model'


const TAG = 'AglynExtension'

export interface AglynExtensionOptions extends AglynBaseModelOptions {
  autoload?: boolean
}

export interface AglynExtension<T = any>
  extends AglynBaseModel,
    AglynLoadableObserver<AglynAppController>,
    AglynExtensionTypeFields {
  getExtensionName(): string
  getOptions(): AglynExtensionOptions
  getContext(): T
  setContext(value: T): this
}

export abstract class AglynExtension<T = any> extends AglynBaseModel {

  public static readonly [Symbol.toStringTag]: string = TAG

  public static readonly [TYPE_OF]: number | symbol = MODULE_TYPE
  public static readonly [TYPE_KIND]: number | symbol = EXTENSION_TYPE

  public static readonly extensionName: string = null

  readonly #options: AglynExtensionOptions = null
  protected app: AglynAppController
  protected context?: T = null
  #lifecycle?: OrNull<AglynLifecycleFlag> = AglynLifecycleFlag.UNREGISTERED

  public get [TYPE_OF]() {
    return getStaticField(TYPE_OF, this)
  }
  public get [TYPE_KIND]() {
    return getStaticField(TYPE_KIND, this)
  }
  public get extensionName() {
    return getStaticField('extensionName', this)
  }
  public get lifecycle(): OrNull<AglynLifecycleFlag> {
    return this.#lifecycle
  }
  public set lifecycle(value: AglynLifecycleFlag) {
    this.#lifecycle = value
  }

  protected constructor(app: AglynAppController, options: AglynExtensionOptions) {
    super(options)
    this.#options = {...options}
    this.app = app
    this.#setup()
  }
  #setup() {
    this.setErrorFactory(this.app.getErrorFactory())
    this.setEmitter(this.app.getEmitter())
    this.setLogger(this.app.getLogger())
  }

  public toString = (): string => {
    return `${TAG}(${this.extensionName})`
  }
  public toJSON = () => {
    return {
      ...super.toJSON(),
      extensionName: this.extensionName,
      [TYPE_OF]: getStaticField(TYPE_OF, this),
      [TYPE_KIND]: getStaticField(TYPE_KIND, this),
    }
  }

  public aglynOnInit(_: AglynAppController): void {
    throw this.getErrorFactory().create(AglynErrorEventFlag.EXTENSION_MISSING_MEMBER_METHOD, {
      extensionName: this.extensionName, memberMethod: 'getErrorFactory',
    })
  }
  public aglynOnLoad(_: AglynAppController): void {
    throw this.getErrorFactory().create(AglynErrorEventFlag.EXTENSION_MISSING_MEMBER_METHOD, {
      extensionName: this.extensionName, memberMethod: 'aglynOnLoad',
    })
  }
  public aglynOnUnload(_: AglynAppController): void {
    throw this.getErrorFactory().create(AglynErrorEventFlag.EXTENSION_MISSING_MEMBER_METHOD, {
      extensionName: this.extensionName, memberMethod: 'aglynOnUnload',
    })
  }
  public aglynOnDestroy(_: AglynAppController): void {
    throw this.getErrorFactory().create(AglynErrorEventFlag.EXTENSION_MISSING_MEMBER_METHOD, {
      extensionName: this.extensionName, memberMethod: 'aglynOnDestroy',
    })
  }

  public getExtensionName = (): ExtensionUUN => {
    return getStaticField('extensionName', this)
  }
  public static getExtensionName = (): ExtensionUUN => {
    return getStaticField('extensionName', this)
  }
  public getOptions = (): AglynExtensionOptions => {
    return this.#options
  }
  public getContext = (): T => {
    return this.context
  }
  public setContext = (value: T): this => {
    this.context = value
    return this
  }
}

export type AglynExtensionT = typeof AglynExtension
export default AglynExtension
