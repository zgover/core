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

import {yes} from '@aglyn/shared-util-tools'
import {
  _INTERNAL_CANVAS_,
  _INTERNAL_COMMANDS_,
  _INTERNAL_COMPONENTS_,
  _INTERNAL_CONTEXTS_,
  _INTERNAL_EXTENSIONS_,
} from '../constants/_internal'
import {DEFAULT_APP_UUN} from '../constants/app'
import {AglynAppEffectFlag, AglynAppEventFlag} from '../constants/emitter'
import AglynBaseModel from '../models/aglyn-base.model'
import {IAglynModuleModel} from '../models/aglyn-module.types'
import {
  type AglynAppOptions,
  type AglynEffectOptions,
  type AppUUN,
  type IAglynAppController,
} from './aglyn-app.types'
import AglynCanvasController from './aglyn-canvas.controller'
import {type IAglynCanvasController} from './aglyn-canvas.types'
import AglynCommandsController from './aglyn-commands.controller'
import {type IAglynCommandsController} from './aglyn-commands.types'
import AglynComponentsController from './aglyn-components.controller'
import {type IAglynComponentsController} from './aglyn-components.types'
import AglynContextsController from './aglyn-contexts.controller'
import {type IAglynContextsController} from './aglyn-contexts.types'
import AglynExtensionsController from './aglyn-extensions.controller'
import {type IAglynExtensionsController} from './aglyn-extensions.types'


const TAG = 'AglynApp'

export class AglynAppController<Options extends AglynAppOptions = AglynAppOptions> extends AglynBaseModel<Options> implements IAglynAppController<Options> {

  public static readonly [Symbol.toStringTag]: string = TAG

  readonly #appName: AppUUN = null
  #deleted = false
  #extensionsController: IAglynExtensionsController = null
  #contextsController: IAglynContextsController = null
  #commandsController: IAglynCommandsController = null
  #componentsController: IAglynComponentsController = null
  #canvasController: IAglynCanvasController = null

  protected get modules(): IAglynModuleModel[] {
    return [
      // Load internal modules before extensions
      this.#contextsController,
      this.#commandsController,
      this.#componentsController,
      this.#canvasController,

      // Last step
      this.#extensionsController,
    ]
  }

  public get appName(): AppUUN {return this.#appName}
  public get deleted(): boolean {return this.#deleted}
  public get extensions(): IAglynExtensionsController {return this.#extensionsController}
  public get contexts(): IAglynContextsController {return this.#contextsController}
  public get commands(): IAglynCommandsController {return this.#commandsController}
  public get components(): IAglynComponentsController {return this.#componentsController}
  public get canvas(): IAglynCanvasController {return this.#canvasController}

  constructor(options: Options) {
    super(options)
    this.#appName = options.appName || DEFAULT_APP_UUN
  }
  public setupModules() {
    this.getLogger().debug(AglynAppEventFlag.APP_CREATING, {appName: this.#appName})
    this.getEmitter().emit(AglynAppEventFlag.APP_CREATING, {appName: this.#appName})

    _INTERNAL_CONTEXTS_.set(
      this.#appName,
      this.#contextsController = new AglynContextsController(this, {
        ...this.options.modulesOptions?.contexts,
      }),
    )
    _INTERNAL_COMMANDS_.set(
      this.#appName,
      this.#commandsController = new AglynCommandsController(this, {
        ...this.options.modulesOptions?.commands,
      }),
    )
    _INTERNAL_COMPONENTS_.set(
      this.#appName,
      this.#componentsController = new AglynComponentsController(this, {
        ...this.options.modulesOptions?.components,
      }),
    )
    _INTERNAL_CANVAS_.set(
      this.#appName,
      this.#canvasController = new AglynCanvasController(this, {
        ...this.options.modulesOptions?.canvas,
      }),
    )

    this.getLogger().debug(AglynAppEventFlag.APP_CREATED, {appName: this.#appName})
    this.getEmitter().emit(AglynAppEventFlag.APP_CREATED, {appName: this.#appName})
    return this
  }
  public setupExtensions() {
    _INTERNAL_EXTENSIONS_.set(
      this.#appName,
      this.#extensionsController = new AglynExtensionsController(this, {
        ...this.options.modulesOptions?.extensions,
      }),
    )
    return this
  }

  #initializeAppModules(): void {
    this.#moduleLifecycleChange(this.modules, {type: 'init'})
  }
  #destroyAppModules(): void {
    this.#moduleLifecycleChange(this.modules, {type: 'destroy'})
  }
  #moduleLifecycleChange(modules: IAglynModuleModel[], opts: {type: 'init' | 'destroy'}) {
    const {type} = opts
    const isInit = type === 'init',
      flagBefore = isInit
        ? AglynAppEventFlag.APP_MODULE_INITIALIZING
        : AglynAppEventFlag.APP_MODULE_DESTROYING,
      flagAfter = isInit
        ? AglynAppEventFlag.APP_MODULE_INITIALIZED
        : AglynAppEventFlag.APP_MODULE_DESTROYED
    for (const mod of modules) {
      const moduleName = mod.moduleName
      this.getLogger().debug(flagBefore, {moduleName})
      this.getEmitter().emit(flagBefore, {moduleName})
      isInit ? mod.aglynOnInit(this) : mod.aglynOnDestroy(this)
      this.getLogger().debug(flagAfter, {moduleName})
      this.getEmitter().emit(flagAfter, {moduleName})
    }
  }

  public toString(): string {
    console.log('app name', this.#appName)
    return `${this[Symbol.toStringTag]}(name: '${this.#appName}')`
  }
  public toJSON() {
    return {
      ...super.toJSON(),
      name: this.#appName,
    }
  }

  public aglynOnInit(): void {
    this.getLogger().debug(AglynAppEventFlag.APP_INITIALIZING, {appName: this.#appName})
    this.getEmitter().emit(AglynAppEventFlag.APP_INITIALIZING, {appName: this.#appName})

    this.#initializeAppModules()

    this.getLogger().debug(AglynAppEventFlag.APP_INITIALIZED, {appName: this.#appName})
    this.getEmitter().emit(AglynAppEventFlag.APP_INITIALIZED, {appName: this.#appName})
  }
  public aglynOnDestroy(): void {
    this.getLogger().debug(AglynAppEventFlag.APP_DESTROYING, {appName: this.#appName})
    this.getEmitter().emit(AglynAppEventFlag.APP_DESTROYING, {appName: this.#appName})

    this.#destroyAppModules()

    this.getLogger().debug(AglynAppEventFlag.APP_DESTROYED, {appName: this.#appName})
    this.getEmitter().emit(AglynAppEventFlag.APP_DESTROYED, {appName: this.#appName})
  }

  public getName(): AppUUN {
    return this.#appName
  }
  public getExtensionsController(): IAglynExtensionsController {
    return this.#extensionsController
  }
  public getContextsController(): IAglynContextsController {
    return this.#contextsController
  }
  public getCanvasController(): IAglynCanvasController {
    return this.#canvasController
  }
  public getCommandsController(): IAglynCommandsController {
    return this.#commandsController
  }
  public getComponentsController(): IAglynComponentsController {
    return this.#componentsController
  }
  public isDeleted(): boolean {
    return yes(this.#deleted)
  }
  public setDeleted(value: boolean): this {
    this.#deleted = Boolean(value)
    return this
  }
  public effect<U>(data: AglynEffectOptions<AglynAppEffectFlag, U>) {
    const {type, payload} = data
    this.getEmitter().emit(type, payload as any)
    return this
  }
}

export default AglynAppController
