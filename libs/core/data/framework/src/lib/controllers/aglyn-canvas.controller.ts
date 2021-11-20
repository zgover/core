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
  CanvasAddElementPayload,
  CanvasGetApiEventsPayload,
  CanvasGetElementPayload,
  CanvasGetElementsDenormalizedPayload,
  CanvasGetElementsNormalizedPayload,
  CanvasGetStorePayload,
  CanvasRedoPayload,
  CanvasSetElementsPayload,
  CanvasUndoPayload,
  ContextDomain,
  ContextStore,
} from '@aglyn/core-data-framework'
import { _isArrEmpty } from '@aglyn/shared-util-guards'
import { arrayAddAtIndex } from '@aglyn/shared-util-tools'
import { createApi, Event as EffectorEvent } from 'effector'
import {
  AglynModuleEffectListener,
  AglynModuleModel,
  AglynModuleModelOptions,
} from '../models/aglyn-module.model'
import { denormalizeComponentElementData } from '../util/denormalize-component-element-data'
import { normalizeComponentElementData } from '../util/normalize-component-element-data'
import {
  AglynComponentElementData,
  AglynComponentElementDataNormalizedMap,
} from './aglyn-components.controller'


export type ElementsDataStore = {
  past: AglynComponentElementDataNormalizedMap[]
  present: AglynComponentElementDataNormalizedMap
  future: AglynComponentElementDataNormalizedMap[]
}

export interface ElementsDataStoreApi {
  addElement: EffectorEvent<CanvasAddElementPayload>
  setElements: EffectorEvent<CanvasSetElementsPayload>
  undo: EffectorEvent<any>
  redo: EffectorEvent<any>
}


export interface AglynCanvasControllerOptions extends AglynModuleModelOptions {
  defaultElements: AglynComponentElementData[]
}

export interface AglynCanvasController extends AglynModuleModel<AglynCanvasControllerOptions> {
  undo(payload?: CanvasUndoPayload)
  redo(payload?: CanvasRedoPayload)
  setElements(payload: CanvasSetElementsPayload)
  addElement(payload: CanvasAddElementPayload)
  getElement(payload: CanvasGetElementPayload)
  getStore(payload?: CanvasGetApiEventsPayload)
  getNormalizedElementsStore(payload?: CanvasGetElementsNormalizedPayload)
  getDenormalizedElementsStore(payload?: CanvasGetElementsDenormalizedPayload)
  getApiEvents(payload?: CanvasGetApiEventsPayload)
}

const TAG = 'AglynCanvas'
const MODULE_NAME = 'canvas'

export class AglynCanvasController extends AglynModuleModel<AglynCanvasControllerOptions> {

  public static readonly [Symbol.toStringTag]: string = TAG
  public static readonly moduleName: string = MODULE_NAME
  public static readonly childNs: string = MODULE_NAME

  #domain: ContextDomain = null
  #context: ContextStore<ElementsDataStore> = null
  #events: ElementsDataStoreApi = null
  #normalizedElementsStore: ContextStore<ElementsDataStore['present']> = null
  #denormalizedElementsStore: ContextStore<AglynComponentElementData[]> = null

  public get domain(): ContextDomain {return this.#domain}
  public get context(): ContextStore<ElementsDataStore> {return this.#context}
  public get events(): ElementsDataStoreApi {return this.#events}
  public get normalizedElementsStore(): ContextStore<ElementsDataStore['present']> {return this.#normalizedElementsStore}
  public get denormalizedElementsStore(): ContextStore<AglynComponentElementData[]> {return this.#denormalizedElementsStore}

  constructor(options) {
    super(options)
    this.#setup()
  }
  #setup() {
    this.#domain = this.app.contexts.domain.domain(this.moduleName)

    this.#context = this.#domain.createStore<ElementsDataStore>({
      past: [] as AglynComponentElementDataNormalizedMap[],
      present: normalizeComponentElementData(this.options.defaultElements || [], '__root__'),
      future: [] as AglynComponentElementDataNormalizedMap[],
    })
    this.#normalizedElementsStore = this.#context.map((elements) => {
      return elements.present
    })
    this.#denormalizedElementsStore = this.#context.map((elements) => {
      return denormalizeComponentElementData(elements.present, '__root__')
    })

    this.#events = createApi(this.#context, {
      undo: (state) => {
        if (!_isArrEmpty(state.past)) {
          return {
            past: state.past.slice(0, state.past.length - 1),
            present: state.past[state.past.length - 1],
            future: [...state.future, state.present],
          }
        }
      },
      redo: (state) => {
        if (!_isArrEmpty(state.future)) {
          return {
            past: [...state.past, state.present],
            present: state.future[state.future.length - 1],
            future: state.future.slice(0, state.future.length - 1),
          }
        }
      },
      setElements: (state, payload: CanvasSetElementsPayload) => {
        const {elements} = payload
        state.past.push(state.present)
        return {past: state.past, present: elements, future: []}
      },
      addElement: (state, payload: CanvasAddElementPayload) => {
        state.past.push(state.present)

        const {element, parentId, position} = payload
        const newData = normalizeComponentElementData(element, parentId)
        const present = {
          ...state.present,
          ...newData,
          [parentId]: {
            ...state.present[parentId],
            elements: arrayAddAtIndex(
              position,
              state.present[parentId].elements || [],
              newData[parentId]?.elements || [],
              {copy: true},
            ).items,
          },
        }

        return {past: state.past, present, future: []}
      },
      // updateElement: (state, _) => {
      //
      // },
    })
  }

  public getStore(payload: CanvasGetStorePayload) {
    return this.#context
  }

  public getNormalizedElementsStore(payload: CanvasGetElementsNormalizedPayload) {
    return this.#normalizedElementsStore
  }

  public getDenormalizedElementsStore(payload: CanvasGetElementsDenormalizedPayload) {
    return this.#denormalizedElementsStore
  }


  public getApiEvents(payload?: CanvasGetApiEventsPayload) {
    return this.#events
  }

  public undo(payload?: CanvasUndoPayload) {
    return this.#events.undo(payload)
  }

  public redo(payload?: CanvasRedoPayload) {
    return this.#events.undo(payload)
  }

  public setElements(payload: CanvasSetElementsPayload) {
    return this.#events.setElements(payload)
  }

  public addElement(payload: CanvasAddElementPayload) {
    return this.#events.addElement(payload)
  }


  public toJSON() {
    return {
      ...super.toJSON(),
      ...this.#context,
    }
  }

  protected listeners: AglynModuleEffectListener<any>[] = []
}

export type AglynCanvasControllerT = typeof AglynCanvasController
export default AglynCanvasController
