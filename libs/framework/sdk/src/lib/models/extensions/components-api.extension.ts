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
  AglynComponent,
  AglynComponentOptions,
  AglynComponentsExtension, AglynComponentsPlugin,
  GetComponentPayload,
  RegisterComponentPayload,
  RegisterPluginPayload,
  RegistryEntries, SelfComponentId,
  UnregisterComponentPayload,
  UnregisterPluginPayload,
} from './components-types.extension'
import { AglynAppInstance } from '../../types'
import { AglynExtension } from '../../constants'
import { _validateAppArg, getExtension } from '../../api'
import { ComponentBuilder, elementRendererComponentBuilder } from '@aglyn/framework/renderer'


export function aglynComponent<P = any>(componentId: SelfComponentId, options: AglynComponentOptions<P>): ComponentBuilder<P> {
  return elementRendererComponentBuilder(componentId, options)
}

export function _getComponentsExtension(app: AglynAppInstance): AglynComponentsExtension {
  _validateAppArg(app)
  return getExtension<AglynComponentsExtension>(app, {name: AglynExtension.COMPONENTS})
}

export function getAllComponents(app: AglynAppInstance): RegistryEntries {
  return _getComponentsExtension(app)?.getAllComponents() ?? []
}

export function getComponent<P>(app: AglynAppInstance, options: GetComponentPayload): AglynComponent<P> {
  return _getComponentsExtension(app)?.getComponent(options)
}

export function registerComponent<P>(app: AglynAppInstance, component: AglynComponent<P>): void {
  _getComponentsExtension(app)?.registerComponent({ component })
}

export function unregisterComponent(app: AglynAppInstance, options: UnregisterComponentPayload): void {
  _getComponentsExtension(app)?.unregisterComponent(options)
}

export function registerComponentsPlugin(app: AglynAppInstance, plugin: AglynComponentsPlugin): void {
  _getComponentsExtension(app)?.registerComponentsPlugin({ plugin })
}

export function unregisterComponentsPlugin(app: AglynAppInstance, options: UnregisterPluginPayload): void {
  _getComponentsExtension(app)?.unregisterComponentsPlugin(options)
}
