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

import { AglynApp } from '../types'
import { AglynModuleTriggerFlag } from '../constants'
import { AglynControllerModel, AglynExtensionModel } from '../models'
import { AglynComponent, ComponentsExtensionController } from './components-type.extension'


export type ComponentsRegistry = Map<string, AglynComponent>

const ID = 'components'
let instance: ComponentsExtensionController = null

const extension = new (class extends AglynExtensionModel {
  protected static __$ID__: string = ID
  constructor() {
    super()
  }
  public override onLoad(app: AglynApp) {
    if (!(instance instanceof ComponentsControllerModel)) {
      this.context = instance = new ComponentsControllerModel()
    }
    instance.onLoad({app})
  }
  public override onUnload(app: AglynApp) {
    if (instance instanceof ComponentsControllerModel) {
      instance.onUnload({app})
    }
  }
  public override toJSON() {
    return {
      ...super.toJSON(),
      componentIds: instance.keys(),
    }
  }
})()

exports = extension

class ComponentsControllerModel extends AglynControllerModel implements ComponentsExtensionController {
  static #state: ComponentsRegistry = new Map()

  public entries = (): [id: string, component: AglynComponent][] => {
    return [...ComponentsControllerModel.#state.entries()]
  }
  public keys = (): string[] => {
    return [...ComponentsControllerModel.#state.keys()]
  }
  public values = (): AglynComponent[] => {
    return [...ComponentsControllerModel.#state.values()]
  }
  public getAll = (options?: { variant: 'entries' | 'keys' | 'values' }) => {
    const {variant} = {...options}
    switch (variant) {
      case 'values':
        return this.values()
      case 'keys':
        return this.keys()
    }
    return this.entries()
  }
  public get = (payload) => {
    const {componentId} = payload
    return ComponentsControllerModel.#state.get(componentId)
  }
  public set = (payload) => {
    const {component} = payload
    ComponentsControllerModel.#state.set(component.$id, component)
    return this
  }
  public delete = (payload) => {
    const {componentId} = payload
    ComponentsControllerModel.#state.delete(componentId)
    return this
  }
  /** @private handled by extension */
  override onLoad(app: AglynApp) {
    app.event.on(
      AglynModuleTriggerFlag.EXTENSION_COMPONENT_REGISTER,
      this.set,
    )
    app.event.on(
      AglynModuleTriggerFlag.EXTENSION_COMPONENT_UNREGISTER,
      this.delete,
    )
    app.event.on(
      AglynModuleTriggerFlag.EXTENSION_COMPONENT_GET,
      this.get,
    )
    app.event.on(
      AglynModuleTriggerFlag.EXTENSION_COMPONENTS_GET,
      this.getAll,
    )
  }
  /** @private handled by extension */
  override onUnload(app: AglynApp) {
    app.event.off(
      AglynModuleTriggerFlag.EXTENSION_COMPONENT_REGISTER,
      this.set,
    )
    app.event.off(
      AglynModuleTriggerFlag.EXTENSION_COMPONENT_UNREGISTER,
      this.delete,
    )
    app.event.off(
      AglynModuleTriggerFlag.EXTENSION_COMPONENT_GET,
      this.get,
    )
    app.event.off(
      AglynModuleTriggerFlag.EXTENSION_COMPONENTS_GET,
      this.getAll,
    )
  }
}
