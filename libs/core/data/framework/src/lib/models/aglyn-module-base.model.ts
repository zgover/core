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

import { AglynAppEffectFlag, AglynModuleEffectPayload } from '../constants/emitter'
import { AglynAppController } from '../controllers/aglyn-app.controller'
import { AglynBaseModel, AglynBaseModelOptions } from './aglyn-base.model'


export interface AglynModuleBaseModelOptions extends AglynBaseModelOptions {
  app: AglynAppController
}

export type AglynAppModuleEffectListener<Effect extends AglynAppEffectFlag> = [
  Effect,
  (args: AglynModuleEffectPayload[Effect]) => unknown
]

export abstract class AglynModuleBaseModel extends AglynBaseModel {

  readonly #options: AglynModuleBaseModelOptions = null
  protected app: AglynAppController

  public get options(): AglynBaseModelOptions {
    return this.#options
  }

  protected constructor(options: AglynModuleBaseModelOptions) {
    super(options)
    this.#options = {...options}
    this.app = this.#options.app
  }

  public aglynOnInit(): void {
    this.listeners.forEach(([flag, method]) => this.app.getEmitter().on(flag, method))
  }
  public aglynOnDestroy(): void {
    this.listeners.forEach(([flag, method]) => this.app.getEmitter().off(flag, method))
  }

  public getOptions = (): AglynBaseModelOptions => {
    return this.#options
  }

  protected listeners: AglynAppModuleEffectListener<any>[] = []
}

export type AglynModuleBaseModelT = typeof AglynModuleBaseModel
export default AglynModuleBaseModel
