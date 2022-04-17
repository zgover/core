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


import {type MutableShallow} from '@aglyn/shared-data-types'
import {_isCtor} from '@aglyn/shared-util-guards'
import {
  AglynEventStateFlag,
  AglynEventTriggerFlag,
  type ExtensionDestroyPayload,
  type ExtensionHandleLoaderPayload,
  type ExtensionInitializePayload,
  type ExtensionLoadPayload,
  type ExtensionRegisterPayload,
  type ExtensionUnloadPayload,
} from '../constants/emitter'
import {AGLYN_ERROR, AglynErrorEventFlag} from '../constants/error'
import {AglynLifecycleFlag} from '../constants/lifecycle'
import {AglynExtension} from '../models/aglyn-extension.model'
import {AglynModuleModel} from '../models/aglyn-module.model'
import {type IAglynAppController} from '../types/aglyn-app.types'
import {type IAglynExtension} from '../types/aglyn-extension.types'
import {
  type AglynExtensionMap,
  type AglynExtensionsControllerOptions,
  type ExtensionUUN,
  type IAglynExtensionsController,
} from '../types/aglyn-extensions.types'
import {type AglynModuleEffectListener} from '../types/aglyn-module.types'
import {isAglynExtension, isAglynModule} from '../util/aglyn-is'


const TAG = 'AglynExtensions'
const NS = 'aglyn.core.data.framework.module.extensions'

export class AglynExtensionsController extends AglynModuleModel<AglynExtensionsControllerOptions> implements IAglynExtensionsController {

  public static readonly [Symbol.toStringTag]: string = TAG
  public static readonly namespace: string = NS

  #extensions: AglynExtensionMap = new Map()

  public get extensions(): IAglynExtension[] {return [...this.#extensions.values()]}

  protected get listeners(): AglynModuleEffectListener<any>[] {
    return [
      [AglynEventTriggerFlag.EXTENSION_REGISTER, this.registerExtension],
      [AglynEventTriggerFlag.EXTENSION_INITIALIZE, this.initializeExtension],
      [AglynEventTriggerFlag.EXTENSION_ACTIVATE, this.loadExtension],
      [AglynEventTriggerFlag.EXTENSION_DEACTIVATE, this.unloadExtension],
      [AglynEventTriggerFlag.EXTENSION_DESTROY, this.destroyExtension],
    ]
  }

  constructor(app: IAglynAppController, options: AglynExtensionsControllerOptions) {
    super(app, options)
    this.#setup()
  }
  #setup() {
    this.#setupInitialExtensions()
  }
  #setupInitialExtensions(): this {
    this.options.initialExtensions?.forEach((payload) => {
      this.handleLoader(payload)
    })
    return this
  }

  public toJSON() {
    return {
      ...super.toJSON(),
      extensions: this.extensions.keys() as any,
    }
  }

  public onDestroy(): this {
    this.unloadAllExtensions()
    this.destroyAllExtensions()
    super.onDestroy()
    return this
  }

  public handleLoader(payload: ExtensionHandleLoaderPayload): IAglynExtension {
    const {loader, options} = payload
    const module = loader()
    const appName = this.app.getName()
    if (!module) {
      throw AGLYN_ERROR.create(AglynErrorEventFlag.EXTENSION_BAD_MODULE_LOADER, {appName})
    }
    if (!isAglynModule(module) || !isAglynExtension(module) || !_isCtor(module)) {
      throw AGLYN_ERROR.create(AglynErrorEventFlag.EXTENSION_BAD_MODULE, {
        appName, extensionName: module?.['moduleName'] ?? 'unknown',
      })
    }
    const instance = new module({...options, app: this.app})
    if (!(instance instanceof AglynExtension)) {
      throw AGLYN_ERROR.create(AglynErrorEventFlag.EXTENSION_BAD_MODULE, {
        appName, extensionName: module?.['extensionName'] ?? 'unknown',
      })
    }
    this.registerExtension({extension: instance})
    return instance
  }

  public getExtensionByName(extensionName: ExtensionUUN): IAglynExtension {
    const extension = this.#extensions.get(extensionName)
    if (extension) {
      const current = extension?.lifecycle
      const autoload = extension?.getOptions?.()?.autoload
      if (current === AglynLifecycleFlag.INITIALIZED && autoload) {
        this.loadExtension({extensionName})
      }
    }
    else {
      // TODO: throw errorFactory error
      throw new Error(`Extension does not exists: (${extensionName})`)
    }
    return extension
  }

  public getAllExtensions(): IAglynExtension[] {
    return [...this.#extensions.values()]
  }

  public registerExtension(payload: ExtensionRegisterPayload): this {
    const {extension} = payload
    const extensionName = extension?.extensionName
    if (extensionName && isAglynExtension(extension)) {
      extension.lifecycle = AglynLifecycleFlag.REGISTERING
      this.logger.debug(AglynEventStateFlag.EXTENSION_REGISTERED, {extensionName})
      this.emitter.emit(AglynEventStateFlag.EXTENSION_REGISTERED, {extensionName})
      this.#extensions.set(extensionName, extension)
      extension.lifecycle = AglynLifecycleFlag.REGISTERED
      this.logger.debug(AglynEventStateFlag.EXTENSION_REGISTERED, {extensionName})
      this.emitter.emit(AglynEventStateFlag.EXTENSION_REGISTERED, {extensionName})
    }
    else {
      // TODO: throw errorFactory error
      if (!extension) throw new Error(`Bad extension provided`)
      if (!extensionName) throw new Error(`Extension missing name`)
      throw new Error(`Invalid extension provided: (${extensionName})`)
    }
    return this
  }

  public initializeExtension(payload: ExtensionInitializePayload): this {
    const {extension} = payload
    const extensionName = extension?.extensionName
    if (extensionName && isAglynExtension(extension)) {
      extension.lifecycle = AglynLifecycleFlag.INITIALIZING
      this.logger.debug(AglynEventStateFlag.EXTENSION_INITIALIZING, {extensionName})
      this.emitter.emit(AglynEventStateFlag.EXTENSION_INITIALIZING, {extensionName})
      extension.onInitialize?.(this.app)
      extension.lifecycle = AglynLifecycleFlag.INITIALIZED
      this.logger.debug(AglynEventStateFlag.EXTENSION_INITIALIZED, {extensionName})
      this.emitter.emit(AglynEventStateFlag.EXTENSION_INITIALIZED, {extensionName})
    }
    else {
      // TODO: throw errorFactory error
      if (!extension) throw new Error(`Bad extension provided`)
      if (!extensionName) throw new Error(`Extension missing name`)
      throw new Error(`Invalid extension provided: (${extensionName})`)
    }
    return this
  }

  public loadExtension(payload: ExtensionLoadPayload): this {
    const {extensionName} = payload
    const extension = this.#extensions.get(extensionName) as MutableShallow<IAglynExtension>
    const lifecycle = extension.lifecycle
    if (
      extension && (
        lifecycle === AglynLifecycleFlag.INITIALIZED
        || lifecycle === AglynLifecycleFlag.UNLOADED
      )
    ) {
      extension.lifecycle = AglynLifecycleFlag.LOADING
      this.logger.debug(AglynEventStateFlag.EXTENSION_ACTIVATING, {extensionName})
      this.emitter.emit(AglynEventStateFlag.EXTENSION_ACTIVATING, {extensionName})
      extension.onActivate?.(this.app)
      extension.lifecycle = AglynLifecycleFlag.LOADED
      this.logger.debug(AglynEventStateFlag.EXTENSION_ACTIVATED, {extensionName})
      this.emitter.emit(AglynEventStateFlag.EXTENSION_ACTIVATED, {extensionName})
    }
    else {
      // TODO: throw errorFactory error
      if (!extension) throw new Error(`Extension does not exists: (${extensionName})`)
      throw new Error(`Extension is unloaded or not initialized: (${extensionName})`)
    }
    return this
  }

  public unloadExtension(payload: ExtensionUnloadPayload): this {
    const {extensionName} = payload
    const extension = this.#extensions.get(extensionName) as MutableShallow<IAglynExtension>
    if (extension) {
      extension.lifecycle = AglynLifecycleFlag.UNLOADING
      this.logger.debug(AglynEventStateFlag.EXTENSION_DEACTIVATING, {extensionName})
      this.emitter.emit(AglynEventStateFlag.EXTENSION_DEACTIVATING, {extensionName})
      extension.onDeactivate?.(this.app)
      extension.lifecycle = AglynLifecycleFlag.UNLOADED
      this.logger.debug(AglynEventStateFlag.EXTENSION_DEACTIVATED, {extensionName})
      this.emitter.emit(AglynEventStateFlag.EXTENSION_DEACTIVATED, {extensionName})
    }
    else {
      // TODO: throw errorFactory error
      throw new Error(`Extension does not exists: (${extensionName})`)
    }
    return this
  }

  public destroyExtension(payload: ExtensionDestroyPayload): this {
    const {extensionName} = payload
    const extension = this.#extensions.get(extensionName)
    if (extension) {
      extension.lifecycle = AglynLifecycleFlag.DESTROYING
      this.logger.debug(AglynEventStateFlag.EXTENSION_DESTROYING, {extensionName})
      this.emitter.emit(AglynEventStateFlag.EXTENSION_DESTROYING, {extensionName})
      extension.onDestroy?.(this.app)
      this.#extensions.delete(extensionName)
      extension.lifecycle = AglynLifecycleFlag.DESTROYED
      this.logger.debug(AglynEventStateFlag.EXTENSION_DESTROYED, {extensionName})
      this.emitter.emit(AglynEventStateFlag.EXTENSION_DESTROYED, {extensionName})
    }
    else {
      // TODO: throw errorFactory error
      throw new Error(`Extension does not exists: (${extensionName})`)
    }
    return this
  }

  public unloadAllExtensions(): this {
    this.#extensions.forEach((extension, extensionName) => {
      if (extension.lifecycle === AglynLifecycleFlag.LOADED) {
        this.unloadExtension({extensionName})
      }
    })
    return this
  }

  public destroyAllExtensions(): this {
    this.#extensions.forEach((extension, extensionName) => {
      if (extension.lifecycle !== AglynLifecycleFlag.UNREGISTERED) {
        this.destroyExtension({extensionName})
      }
    })
    return this
  }

}

export default AglynExtensionsController
