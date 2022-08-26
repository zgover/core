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

import {
  AglynBundleSchema,
  AglynComponentSchema,
  AglynComponentType,
  AglynNodePresetSchema,
  BundleId,
  ComponentId,
  PresetId,
} from '@aglyn/core-data-foundation'
import { AglynEvent, lifecycleEvent } from './constants'

export class ComponentManager {
  static #bundles: Record<BundleId, AglynBundleSchema> = {}
  public static get bundles(): Record<BundleId, AglynBundleSchema> {
    return ComponentManager.#bundles
  }

  static #components: Record<ComponentId, AglynComponentType> = {}
  public static get components(): Record<ComponentId, AglynComponentType> {
    return ComponentManager.#components
  }

  static #componentSchemas: Record<ComponentId, AglynComponentSchema> = {}
  public static get componentSchemas(): Record<
    ComponentId,
    AglynComponentSchema
  > {
    return ComponentManager.#componentSchemas
  }

  static #presets: Record<PresetId, AglynNodePresetSchema> = {}
  public static get presets(): Record<PresetId, AglynNodePresetSchema> {
    return ComponentManager.#presets
  }

  protected constructor() {}

  public toJSON() {
    return {
      bundles: ComponentManager.#bundles,
      components: ComponentManager.#components,
      schemas: ComponentManager.#componentSchemas,
      presets: ComponentManager.#presets,
    }
  }

  public static buildId(componentId: ComponentId, bundleId?: BundleId): string {
    return bundleId ? `${bundleId}:${componentId}` : componentId
  }

  public static getBundle(bundleId: BundleId) {
    return ComponentManager.bundles[bundleId]
  }
  public static getComponent(componentId: ComponentId, bundleId?: BundleId) {
    const key = ComponentManager.buildId(componentId, bundleId)
    return ComponentManager.#components[key]
  }
  public static getComponentSchema(
    componentId: ComponentId,
    bundleId?: BundleId,
  ) {
    const key = ComponentManager.buildId(componentId, bundleId)
    return ComponentManager.#componentSchemas[key]
  }
  public static getPreset(presetId: PresetId) {
    return ComponentManager.#presets[presetId]
  }

  public static registerBundle(
    schema: AglynBundleSchema,
    components: {
      component: AglynComponentType
      schema: AglynComponentSchema
    }[],
  ) {
    const { bundleId } = schema
    lifecycleEvent(
      () => {
        ComponentManager.#bundles[bundleId] = schema
        for (const { component, schema } of components) {
          ComponentManager.registerComponent(component, { ...schema, bundleId })
        }
      },
      {
        startEvent: AglynEvent.COMPONENT_BUNDLE_REGISTERING,
        startPayload: [{ bundleId }],
        endEvent: AglynEvent.COMPONENT_BUNDLE_REGISTERED,
        endPayload: [{ bundleId }],
      },
    )
    return ComponentManager
  }

  public static registerComponent(
    component: AglynComponentType,
    schema: AglynComponentSchema,
  ) {
    const { componentId, bundleId } = schema
    const key = ComponentManager.buildId(schema.componentId, schema.bundleId)

    lifecycleEvent(
      () => {
        // TODO: throw errorFactory error
        if (bundleId && !ComponentManager.#bundles[bundleId]) {
          throw new Error(`No bundle exists with ID ${bundleId}.`)
        } else if (bundleId) {
          ComponentManager.#bundles[bundleId].componentIds.push(key)
        }
        ComponentManager.#components[key] = component
        ComponentManager.#componentSchemas[key] = schema
        for (const preset of schema.presets || []) {
          ComponentManager.registerPreset(preset)
        }
      },
      {
        startEvent: AglynEvent.COMPONENT_REGISTERING,
        startPayload: [{ componentId, bundleId }],
        endEvent: AglynEvent.COMPONENT_REGISTERED,
        endPayload: [{ componentId, bundleId }],
      },
    )
    return ComponentManager
  }

  public static registerPreset(preset: AglynNodePresetSchema) {
    const { presetId, bundleId, componentId } = preset
    lifecycleEvent(
      () => {
        ComponentManager.#presets[presetId] = preset
      },
      {
        startEvent: AglynEvent.COMPONENT_PRESET_REGISTERING,
        startPayload: [{ bundleId, componentId, presetId }],
        endEvent: AglynEvent.COMPONENT_PRESET_REGISTERED,
        endPayload: [{ bundleId, componentId, presetId }],
      },
    )
    return ComponentManager
  }

  public static unregisterPreset(presetId: PresetId) {
    lifecycleEvent(
      () => {
        delete ComponentManager.#presets[presetId]
      },
      {
        startEvent: AglynEvent.COMPONENT_PRESET_UNREGISTERING,
        startPayload: [{ presetId }],
        endEvent: AglynEvent.COMPONENT_PRESET_UNREGISTERED,
        endPayload: [{ presetId }],
      },
    )
    return ComponentManager
  }

  public static unregisterComponentPresets(componentId: ComponentId) {
    const schema = ComponentManager.#componentSchemas[componentId]
    for (const preset of schema?.presets || []) {
      ComponentManager.unregisterPreset(preset?.presetId)
    }
    return ComponentManager
  }

  public static unregisterComponent(
    componentId: ComponentId,
    bundleId?: BundleId,
  ) {
    lifecycleEvent(
      () => {
        // TODO: throw errorFactory error
        if (bundleId && !ComponentManager.#bundles[bundleId]) {
          throw new Error(`No bundle exists with ID ${bundleId}.`)
        } else if (bundleId) {
          ComponentManager.#bundles[bundleId].componentIds =
            ComponentManager.#bundles[bundleId].componentIds.filter(
              (i) => i !== componentId,
            )
        }
        const key = ComponentManager.buildId(componentId, bundleId)
        ComponentManager.unregisterComponentPresets(key)
        delete ComponentManager.#componentSchemas[key]
        delete ComponentManager.#components[key]
      },
      {
        startEvent: AglynEvent.COMPONENT_UNREGISTERING,
        startPayload: [{ bundleId, componentId }],
        endEvent: AglynEvent.COMPONENT_UNREGISTERED,
        endPayload: [{ bundleId, componentId }],
      },
    )

    return ComponentManager
  }

  public static unregisterBundle(bundleId: BundleId) {
    const bundle = ComponentManager.bundles[bundleId]
    // TODO: throw errorFactory error
    if (!bundle) throw new Error(`No bundle exists with ID ${bundleId}.`)
    lifecycleEvent(
      () => {
        for (const componentId of bundle.componentIds) {
          ComponentManager.unregisterComponent(componentId, bundleId)
        }
        delete ComponentManager.bundles[bundleId]
      },
      {
        startEvent: AglynEvent.COMPONENT_BUNDLE_UNREGISTERING,
        startPayload: [{ bundleId }],
        endEvent: AglynEvent.COMPONENT_BUNDLE_UNREGISTERED,
        endPayload: [{ bundleId }],
      },
    )

    return ComponentManager
  }
}

export default ComponentManager
