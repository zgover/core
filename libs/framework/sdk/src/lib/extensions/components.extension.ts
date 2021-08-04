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

import { AglynApp, AglynComponent } from '../types'
import { AglynModuleTriggerFlag } from '../constants'


export type ComponentsRegistry = Map<string, AglynComponent>

const TAG = 'AglynExtension'
const ID = 'components'
let componentsManager = null

exports.onLoad = (app: AglynApp) => {
  if (componentsManager) {
    componentsManager = ComponentsController()
  }
  componentsManager.load(app)
}
exports.onUnload = (app: AglynApp) => {
  if (componentsManager) {
    componentsManager.unload(app)
  }
}
exports.toJSON = () => {
  return {
    components: [...componentsManager.getComponents().values()],
  }
}
exports[Symbol.toStringTag] = `${TAG}`
exports.toString = function() {return (`${TAG}(identifier: '${ID}')`)}

function ComponentsController() {
  const components: ComponentsRegistry = new Map()

  const componentsController = {
    get: (data: { componentId: string }): AglynComponent => {
      const {componentId} = data
      return components.get(componentId)
    },
    getAll: () => {
      return [...components.values()]
    },
    set: (data: AglynComponent): void => {
      const {$id, component, options} = data
      components.set($id, {
        $id: $id,
        options: {...options},
        component: component,
      })
    },
    delete: (data: { componentId: string }): void => {
      const {componentId} = data
      components.delete(componentId)
    },
    load: (app: AglynApp) => {
      app.event.on(
        AglynModuleTriggerFlag.REGISTER_EXTENSION_COMPONENT,
        registerExtensionComponent,
      )
      app.event.on(
        AglynModuleTriggerFlag.UNREGISTER_EXTENSION_COMPONENT,
        unregisterExtensionComponent,
      )
    },
    unload: (app: AglynApp) => {
      app.event.off(
        AglynModuleTriggerFlag.REGISTER_EXTENSION_COMPONENT,
        registerExtensionComponent,
      )
      app.event.off(
        AglynModuleTriggerFlag.UNREGISTER_EXTENSION_COMPONENT,
        unregisterExtensionComponent,
      )
    },
  }

  const registerExtensionComponent = (data) => {
    const {$id, options, component} = data
    componentsController.set({$id: $id, options, component})
  }
  const unregisterExtensionComponent = (data) => {
    const {componentId} = data
    componentsController.delete({componentId: componentId})
  }

  return componentsController
}
