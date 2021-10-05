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

import { AglynAppInstance, AglynExtensionModel } from '@aglyn/data-framework'
import { OrUndef } from '@aglyn/shared-data-types'
import { _isArr, _isUndOrNull } from '@aglyn/shared-util-guards'
import { getStaticField } from '@aglyn/shared-util-tools'

import {
  AglynComponent,
  AglynComponentEventFlag,
  AglynComponentsExtension,
  ComponentId,
  ComponentsRegistry,
  ComponentsRegistryEntries,
  ComponentsRegistryKeys,
  ComponentsRegistryValues,
  GetComponentPayload,
  PluginComponentIdString,
  PluginComponentIdTuple,
  PluginId,
  RegisterComponentPayload,
  RegisterPluginPayload,
  SelfComponentId,
  UnregisterComponentPayload,
  UnregisterPluginPayload,
} from '../../lib/types'


const TAG = 'AglynComponentsExtensionModel'

export default class AglynComponentsExtensionModel
  extends AglynExtensionModel<ComponentsRegistry>
  implements AglynComponentsExtension {
  //start: overrides
  public static readonly $id: string = 'components'
  public static readonly [Symbol.toStringTag]: string = TAG
  protected context: ComponentsRegistry = {
    plugins: new Map(),
    components: new Map(),
  }
  public onDestroy: (app: AglynAppInstance) => void = (app: AglynAppInstance): void => {
    this.listeners.forEach(([flag, method]) => app.getEmitter().off(flag, method))
  }
  public onInit: (app: AglynAppInstance) => void = (app: AglynAppInstance): void => {
    this.listeners.forEach(([flag, method]) => app.getEmitter().on(flag, method))
  }
  public toJSON = () => {
    return {
      ...super.toJSON(),
      componentIds: this.context?.components?.keys(),
    }
  }
  //end: overrides
  //start: not private (readonly)
  /**
   * Match any text possibly following a plugin ID
   * TRUE:
   *  * __`aa:bb::cc:dd`__ matches = "cc:dd"
   *  * __`aa::cc:dd`__ matches = "cc:dd"
   *  * __`aa::cc`__ matches = "cc"
   *  * __`cc`__ matches = "cc"
   *
   * FALSE:
   *  * __`aa:bb::cc::dd`__
   *  * __`::cc:dd`__
   *  * __`::cc`__
   *  * __`aa::`__
   *
   */
  public static readonly componentIdMatcher: RegExp = /^(?:(?:(?:[^:]+:)+)?[^:]+)(?::{2})?((?:(?:[^:]+:)+)?[^:]+)$/g
  /**
   * Match any text always prefixing a plugin ID
   * TRUE:
   *  * __`aa:bb::cc:dd`__ matches = "aa:bb"
   *  * __`aa::cc:dd`__ matches = "aa"
   *  * __`aa::cc`__ matches = "aa"
   *
   * FALSE:
   *  * __`aa:bb::cc::dd`__
   *  * __`::cc:dd`__
   *  * __`::cc`__
   *  * __`aa::`__
   *
   */
  public static readonly pluginIdMatcher: RegExp = /^((?:(?:[^:]+:)+)?[^:]+)(?::{2})(?:(?:[^:]+:)+)?[^:]+$/g
  public static readonly pluginSeparator = '::'
  //end: not private (readonly)
  //start: constructor
  constructor(app: AglynAppInstance) {
    super(app, {autoload: true})
  }
  //end: constructor
  //start: abstract + overridden
  public getAllComponents = (): ComponentsRegistryEntries => {
    return this._componentEntries()
  }
  public getAllComponentsKeys = (): ComponentsRegistryKeys => {
    return this._componentKeys()
  }
  public getAllComponentsValues = (): ComponentsRegistryValues => {
    return this._componentValues()
  }
  public getComponent = (payload: GetComponentPayload): OrUndef<AglynComponent> => {
    const {componentId} = payload
    return this.context?.components?.get(this._decodeId(componentId))
  }
  public registerComponent = (payload: RegisterComponentPayload): this => {
    const {component} = payload
    const [pId, cId] = this._getDecodedId(component?.$id)
    if (cId) {
      this.context?.components?.set(this._decodeId([pId, cId]), component)
      if (pId) {
        this.context?.plugins?.get(pId)?.components?.set(cId, component)
      }
    }
    return this
  }
  public registerComponentsPlugin = (payload: RegisterPluginPayload): this => {
    const {plugin} = payload
    const pId = plugin?.$id
    this.context?.plugins?.set(pId, plugin)
    plugin?.components?.forEach((component) => {
      const cId = component?.$id
      this.context?.components?.set(this._decodeId([pId, cId]), component)
    })
    return this
  }
  public unregisterComponent = (payload: UnregisterComponentPayload): this => {
    const {componentId} = payload
    const [pId, cId] = this._getDecodedId(componentId)
    if (cId) {
      this.context?.components?.delete(this._decodeId([pId, cId]))
      if (pId) {
        this.context?.plugins?.get(pId)?.components?.delete(cId)
      }
    }
    return this
  }
  public unregisterComponentsPlugin: (payload: UnregisterPluginPayload) => this = (payload: UnregisterPluginPayload): this => {
    const {pluginId} = payload
    this.context?.plugins.get(pluginId)?.components?.forEach((component) => {
      this.context?.components?.delete(this._decodeId([pluginId, component?.$id]))
    })
    this.context?.plugins.delete(pluginId)
    return this
  }
  private listeners: [AglynComponentEventFlag, (...args: any[]) => unknown][] = [
    [AglynComponentEventFlag.COMPONENT_REGISTER, this.registerComponent],
    [AglynComponentEventFlag.COMPONENT_UNREGISTER, this.unregisterComponent],
    [AglynComponentEventFlag.COMPONENTS_PLUGIN_REGISTER, this.registerComponentsPlugin],
    [AglynComponentEventFlag.COMPONENTS_PLUGIN_UNREGISTER, this.unregisterComponentsPlugin],
  ]
  //end: abstract + overridden
  //start: not public
  protected _decodeId = (id: ComponentId): PluginComponentIdString | SelfComponentId => {
    return !_isArr(id)
      ? id
      : id
      .filter((i) => {
        return !_isUndOrNull(i)
      })
      .join(getStaticField('pluginSeparator', this))
  }
  protected _componentEntries = (): ComponentsRegistryEntries => {
    return [...this.context?.components?.entries()]
  }
  protected _componentKeys = (): ComponentId[] => {
    return [...this.context?.components.keys()]
  }
  protected _componentValues = (): AglynComponent[] => {
    return [...this.context?.components?.values()]
  }
  protected _decodeComponentId = (id: ComponentId): OrUndef<SelfComponentId> => {
    const _id = this._decodeId(id)
    return (_id.match(getStaticField('componentIdMatcher', this)) ?? [])[0]
  }
  protected _getDecodedId = (id: ComponentId): PluginComponentIdTuple => {
    return [this._decodePluginId(id), this._decodeComponentId(id)]
  }
  protected _decodePluginId = (id: ComponentId): OrUndef<PluginId> => {
    const _id = this._decodeId(id)
    return (_id.match(getStaticField('pluginIdMatcher', this)) ?? [])[0]
  }
  //end: not public
}
