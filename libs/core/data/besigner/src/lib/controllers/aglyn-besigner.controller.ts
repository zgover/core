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
  type AglynModuleEffectListener,
  AglynModuleModel,
  type ContextDomain,
  type ContextStore,
  type IAglynAppController,
} from '@aglyn/core-data-framework'
import {copy} from '@aglyn/shared-util-tools'
import {objectDeepMergeFillIn} from '@aglyn/shared-util-vendor'
import {createApi} from 'effector'
import {persist} from 'effector-storage/local'
import {BesignerPanelViewFlag, InteractionModeFlag} from '../constants/besigner'
import type {
  BesignerClosePanelPayload,
  BesignerFlagInteractModePayload,
  BesignerGetStorePayload,
  BesignerOpenPanelPayload,
  BesignerSetCanvasHoveredPayload,
  BesignerSetCanvasSelectedPayload,
  BesignerSetDndStatePayload,
  BesignerSetPanelPayload,
} from '../constants/emitter'
import type {
  AglynBesignerControllerOptions,
  BesignerCanvasState,
  BesignerContext,
  BesignerContextStores,
  BesignerDndState,
  BesignerFlagState,
  BesignerNestedStores,
  BesignerPanelsState,
  IAglynBesignerController,
} from './aglyn-besigner.types'


const DEFAULT_CONTEXT: Partial<BesignerContextStores> = {
  flags: {
    debug: true,
    logLevel: 'info',
    interactMode: InteractionModeFlag.SELECT,
  },
  panels: {
    panelLeft: {
      id: BesignerPanelViewFlag.PANEL_LEFT,
      size: 290,
      toggled: false,
    },
    panelRight: {
      id: BesignerPanelViewFlag.PANEL_RIGHT,
      size: 375,
      toggled: false,
    },
    panelBottom: {
      id: BesignerPanelViewFlag.PANEL_BOTTOM,
      toggled: false,
    },
  },
  canvas: {},
  dnd: {},
}


const TAG = 'AglynBesigner'
const NS = 'aglyn.core.data.besigner.module.besigner'

export class AglynBesignerController extends AglynModuleModel<AglynBesignerControllerOptions> implements IAglynBesignerController {

  public static readonly [Symbol.toStringTag]: string = TAG
  public static readonly namespace: string = NS

  #context: BesignerContext = {
    _domain: null,
    _store: null,
    events: null,
    stores: null,
  }

  public get _domain(): ContextDomain {return this.#context._domain}
  public get _store(): ContextStore<BesignerContextStores> {return this.#context._store}
  public get stores(): BesignerNestedStores {return this.#context.stores}
  public get events(): any {return this.#context.events}

  public get flags(): ContextStore<BesignerFlagState> {return this.#context.stores.flags}
  public get canvas(): ContextStore<BesignerCanvasState> {return this.#context.stores.canvas}
  public get panels(): ContextStore<BesignerPanelsState> {return this.#context.stores.panels}
  public get dnd(): ContextStore<BesignerDndState> {return this.#context.stores.dnd}

  protected get listeners(): AglynModuleEffectListener<any>[] {
    return []
  }

  constructor(app: IAglynAppController, options: AglynBesignerControllerOptions) {
    super(app, options)
    this.#setup()
  }
  #setup() {
    this.#context._domain = this.app.contexts.domain.domain(this.namespace)

    this.#context._store = this.#context._domain.createStore<BesignerContextStores>(
      objectDeepMergeFillIn(copy(DEFAULT_CONTEXT), {...this.options.defaults}),
      {name: `${this.namespace}:store`},
    )
    persist({store: this.#context._store})

    this.#context.stores = {
      flags: this.#context._store.map((state) => state.flags),
      canvas: this.#context._store.map((state) => state.canvas),
      panels: this.#context._store.map((state) => state.panels),
      dnd: this.#context._store.map((state) => state.dnd),
    }

    this.#context.events = createApi(this.#context._store, {

      setFlag: (store, payload: BesignerFlagInteractModePayload) => {
        const {flag, value} = payload
        return {
          ...store,
          flags: {
            ...store.flags,
            [flag]: value,
          },
        }
      },

      setPanels: (
        store,
        payload: BesignerSetPanelPayload,
      ) => {
        const {panels} = payload
        return {
          ...store,
          panels: {
            ...panels(store.panels) || {},
          },
        }
      },

      openPanel: (store, payload: BesignerOpenPanelPayload) => {
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

      closePanel: (store, payload: BesignerOpenPanelPayload) => {
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

      setDndState: (store, payload: BesignerSetDndStatePayload) => {
        const {dnd} = payload || {}
        return {
          ...store,
          dnd: {
            ...dnd(store.dnd),
          },
        }
      },

      setCanvasSelected: (store, payload: BesignerSetCanvasSelectedPayload) => {
        const {selected} = payload || {}
        return {
          ...store,
          canvas: {
            ...store.canvas,
            selected: selected(store.canvas.selected),
          },
        }
      },

      setCanvasHovered: (store, payload: BesignerSetCanvasHoveredPayload) => {
        const {hovered} = payload || {}
        return {
          ...store,
          canvas: {
            ...store.canvas,
            hovered: hovered(store.canvas.hovered),
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


  public getStore<K extends keyof BesignerContextStores>(
    payload: BesignerGetStorePayload<K>,
  ): ContextStore<BesignerContextStores[K]> {
    const {store} = payload
    return this.#context.stores[store]
  }


  public setFlag(payload: BesignerFlagInteractModePayload): this {
    this.#context.events.setFlag(payload)
    return this
  }
  public setPanels(payload: BesignerSetPanelPayload): this {
    this.#context.events.setPanels(payload)
    return this
  }
  public openPanel(payload: BesignerOpenPanelPayload): this {
    this.#context.events.setPanels(payload)
    return this
  }
  public closePanel(payload: BesignerClosePanelPayload): this {
    this.#context.events.setPanels(payload)
    return this
  }
  public setDndState(payload: BesignerSetDndStatePayload): this {
    this.#context.events.setDndState(payload)
    return this
  }
  public setCanvasSelected(payload: BesignerSetCanvasSelectedPayload): this {
    this.#context.events.setCanvasSelected(payload)
    return this
  }
  public setCanvasHovered(payload: BesignerSetCanvasHoveredPayload): this {
    this.#context.events.setCanvasHovered(payload)
    return this
  }
}

export default AglynBesignerController
