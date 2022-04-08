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

import {getStaticField} from '@aglyn/shared-util-tools'
import {AglynErrorEventFlag} from '../constants/error'
import {AglynLifecycleFlag, nextLifecycleIsValid} from '../constants/lifecycle'
import {EXTENSION_TYPE, OF_KIND} from '../constants/symbol'
import {type IAglynAppController} from '../types/aglyn-app.types'
import {type AglynExtensionOptions, type IAglynExtension} from '../types/aglyn-extension.types'
import {type ExtensionUUN} from '../types/aglyn-extensions.types'
import {AglynModuleModel} from './aglyn-module.model'


const TAG = 'AglynExtension'
const NS = 'aglyn.core.data.framework.model.extension'

export abstract class AglynExtension<T = any, O extends AglynExtensionOptions = AglynExtensionOptions> extends AglynModuleModel<O> implements IAglynExtension<T, O> {

  public static readonly [Symbol.toStringTag]: string = TAG
  public static readonly [OF_KIND]: number | symbol = EXTENSION_TYPE
  public static readonly extensionName: string = 'unknown'

  public static get namespace(): string {return `${NS}::${this.extensionName}`}

  #context?: T = null
  #lifecycle?: AglynLifecycleFlag[] = [AglynLifecycleFlag.UNREGISTERED]

  public get extensionName(): string {return getStaticField('extensionName', this)}
  public get context(): T {return this.#context}
  public get lifecycleHistory(): AglynLifecycleFlag[] {return [...this.#lifecycle]}
  public get lifecycle(): AglynLifecycleFlag {return this.#lifecycle.slice(-1)[0]}
  public set lifecycle(value: AglynLifecycleFlag) {
    if (!nextLifecycleIsValid(this.lifecycle, value)) {
      // TODO: throw errorFactory error
      throw new Error(`Inappropriate lifecycle '${value}' following '${this.lifecycle}'`)
    }
    this.#lifecycle.push(value)
  }

  protected constructor(app: IAglynAppController, options: O) {
    super(app, options)
  }

  public toString(): string {
    return `${super.toString()}[${this.extensionName}]`
  }

  public toJSON() {
    return {
      ...super.toJSON(),
      extensionName: this.extensionName,
    }
  }

  public onInitialize(app: IAglynAppController): this {
    super.onInitialize(app)
    return this
  }

  public aglynOnLoad(app: IAglynAppController): this {
    throw this.getErrorFactory().create(AglynErrorEventFlag.MODULE_MISSING_MEMBER, {
      extensionName: this.extensionName, memberMethod: 'aglynOnLoad',
    })
    return this
  }

  public aglynOnUnload(app: IAglynAppController): this {
    throw this.getErrorFactory().create(AglynErrorEventFlag.MODULE_MISSING_MEMBER, {
      extensionName: this.extensionName, memberMethod: 'aglynOnUnload',
    })
    return this
  }

  public onDestroy(app: IAglynAppController): this {
    super.onDestroy(app)
    return this
  }

  public getExtensionName(): ExtensionUUN {
    return getStaticField('extensionName', this)
  }

  public static getExtensionName(): ExtensionUUN {
    return getStaticField('extensionName', this)
  }

  public getContext(): T {
    return this.#context
  }

  public setContext(value: T): this {
    this.#context = value
    return this
  }
}

export default AglynExtension
