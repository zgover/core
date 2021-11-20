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
  BuilderClosePanelPayload,
  BuilderFlagInteractModePayload,
  BuilderGetStorePayload,
  BuilderOpenPanelPayload,
  BuilderSetPanelPayload,
  BundleUId,
  ComponentId,
  ContextDomain,
  ElementId,
  TemplateId,
} from '@aglyn/core-data-framework'
import { LogLevelString } from '@aglyn/shared-util-logger'
import { createApi } from 'effector'
import {
  AglynModuleEffectListener,
  AglynModuleModel,
  AglynModuleModelOptions,
} from '../models/aglyn-module.model'
import { ContextStore } from './aglyn-contexts.controller'


export enum InteractionModeFlag {
  SELECT = 0x1,
  REARRANGE = 0x2,
  PREVIEW = 0x3,
}

export enum BuilderActiveViewFlag {
  PANEL_LEFT = 0x1,
  PANEL_RIGHT = 0x2,
  PANEL_BOTTOM = 0x3,
}

export enum DndDragSourceTypeFlag {
  CANVAS_ELEMENT = 0x1,
  COMPONENT_TEMPLATE = 0x2,
}

export enum DndDropLinealTypeFlag {
  ACTIVITY_ELEMENT_BEFORE = 0x1,
  ACTIVITY_ELEMENT_INSIDE = 0x2,
  ACTIVITY_ELEMENT_AFTER = 0x3,
}


export interface CommActionData {
  $id?: ElementId
  componentId?: ComponentId
  bundleId?: BundleUId
}

export interface BuilderFlagState {
  debug?: boolean
  logLevel?: LogLevelString
  interactMode?: InteractionModeFlag
  activeView?: BuilderActiveViewFlag
}

export interface BuilderCanvasState {
  selected?: CommActionData
  focused?: CommActionData
}

export interface BuilderPanelsState {
  left?: {
    toggled?: boolean,
  }
  bottom?: {
    toggled?: boolean,
  }
  right?: {
    toggled?: boolean,
  }
}

export interface BuilderDndState {
  disallowed?: boolean
  dragging?: boolean
  dragActivity?: {
    type?: DndDragSourceTypeFlag
    $id?: ElementId | TemplateId
    componentId?: ComponentId
    bundleUId?: BundleUId
  }
  dropActivity?: {
    type?: DndDropLinealTypeFlag
    item?: {
      $id?: ElementId
      componentId?: ComponentId
      bundleUId?: BundleUId
    }
    parent?: {
      $id?: ElementId
      componentId?: ComponentId
      bundleUId?: BundleUId
    }
  }
}

export interface BuilderContextStores {
  flags: BuilderFlagState
  canvas: BuilderCanvasState
  panels: BuilderPanelsState
  dnd: BuilderDndState
}

type BuilderNestedStores<K extends keyof BuilderContextStores = keyof BuilderContextStores> = {
  [P in K]: ContextStore<BuilderContextStores[P]>
}

const DEFAULT_CONTEXT: Partial<BuilderContextStores> = {
  flags: {
    debug: true,
    logLevel: 'info',
    interactMode: InteractionModeFlag.SELECT,
  },
}


export interface AglynBuilderControllerOptions extends AglynModuleModelOptions {
  defaults?: Partial<BuilderContextStores>
}

interface BuilderContext {
  _domain: ContextDomain
  _store: ContextStore<BuilderContextStores>
  stores: BuilderNestedStores
  events: any
}

export interface AglynBuilderController extends AglynModuleModel<AglynBuilderControllerOptions> {
}

const TAG = 'AglynBuilder'
const MODULE_NAME = 'builder'

export class AglynBuilderController extends AglynModuleModel<AglynBuilderControllerOptions> {

  public static readonly [Symbol.toStringTag]: string = TAG
  public static readonly childNs: string = MODULE_NAME
  public static readonly moduleName: string = MODULE_NAME

  #context: BuilderContext = {
    _domain: null,
    _store: null,
    events: null,
    stores: null,
  }

  #api = null

  public get _domain(): ContextDomain {return this.#context._domain}
  public get _store(): ContextStore<BuilderContextStores> {return this.#context._store}
  public get stores(): BuilderNestedStores {return this.#context.stores}
  public get events(): any {return this.#context.events}

  public get flags(): ContextStore<BuilderFlagState> {return this.#context.stores.flags}
  public get canvas(): ContextStore<BuilderCanvasState> {return this.#context.stores.canvas}
  public get panels(): ContextStore<BuilderPanelsState> {return this.#context.stores.panels}
  public get dnd(): ContextStore<BuilderDndState> {return this.#context.stores.dnd}

  constructor(options) {
    super(options)
    this.#setup()
  }
  #setup() {
    this.#context._domain = this.app.contexts.domain.domain(this.moduleName)

    this.#context._store = this.#context._domain.createStore<BuilderContextStores>({
      flags: {
        ...DEFAULT_CONTEXT.flags,
        ...this.options.defaults?.flags,
      },
      canvas: {
        ...DEFAULT_CONTEXT.canvas,
        ...this.options.defaults?.canvas,
      },
      panels: {
        ...DEFAULT_CONTEXT.panels,
        ...this.options.defaults?.panels,
      },
      dnd: {
        ...DEFAULT_CONTEXT.dnd,
        ...this.options.defaults?.dnd,
      },
    }, {name: 'builder'})

    this.#context.stores = {
      flags: this.#context._store.map((state) => state.flags),
      canvas: this.#context._store.map((state) => state.canvas),
      panels: this.#context._store.map((state) => state.panels),
      dnd: this.#context._store.map((state) => state.dnd),
    }

    this.#context.events = createApi(this.#context._store, {

      setFlag: (store, payload: BuilderFlagInteractModePayload) => {
        const {flag, value} = payload
        return {
          ...store,
          flags: {
            ...store.flags,
            [flag]: value,
          },
        }
      },

      setPanels: <K extends keyof BuilderSetPanelPayload>(store, payload: BuilderSetPanelPayload) => {
        const {left, bottom, right} = payload
        return {
          ...store,
          panels: {
            ...store.panels,
            left: {
              ...store.panels.left,
              ...left,
            },
            bottom: {
              ...store.panels.bottom,
              ...bottom,
            },
            right: {
              ...store.panels.right,
              ...right,
            },
          },
        }
      },

      openPanel: (store, payload: BuilderOpenPanelPayload) => {
        const {panel} = payload
        return {
          ...store,
          panels: {
            ...store.panels,
            [panel]: {
              ...store.panels[panel],
              toggled: true,
            },
          },
        }
      },
      closePanel: (store, payload: BuilderOpenPanelPayload) => {
        const {panel} = payload
        return {
          ...store,
          panels: {
            ...store.panels,
            [panel]: {
              ...store.panels[panel],
              toggled: false,
            },
          },
        }
      },

    })
  }

  public toJSON() {
    return {
      ...super.toJSON(),
    }
  }


  public getStore<K extends keyof BuilderContextStores>(
    payload: BuilderGetStorePayload<K>,
  ): ContextStore<BuilderContextStores[K]> {
    const {store} = payload
    return this.#context.stores[store]
  }

  public setFlag(payload: BuilderFlagInteractModePayload) {
    return this.#context.events.setFlag(payload)
  }

  public setPanels(payload: BuilderSetPanelPayload) {
    return this.#context.events.setPanels(payload)
  }
  public openPanel(payload: BuilderOpenPanelPayload) {
    return this.#context.events.setPanels(payload)
  }
  public closePanel(payload: BuilderClosePanelPayload) {
    return this.#context.events.setPanels(payload)
  }


  protected listeners: AglynModuleEffectListener<any>[] = [
    // [AglynAppEffectFlag.COMMANDS_RESOLVER_SET, this.setResolver],
    // [AglynAppEffectFlag.COMMANDS_LISTENER_REGISTER, this.registerListener],
    // [AglynAppEffectFlag.COMMANDS_RESOLVER_REMOVE, this.removeResolver],
    // [AglynAppEffectFlag.COMMANDS_LISTENER_UNREGISTER, this.unregisterListener],
    // [AglynAppEffectFlag.COMMANDS_TRIGGER, this.trigger],
  ]
}

export type AglynBuilderControllerT = typeof AglynBuilderController
export default AglynBuilderController
