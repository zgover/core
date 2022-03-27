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

import type {
  CanvasAddElementPayload,
  CanvasDeleteElementPayload,
  CanvasDuplicateElementPayload,
  CanvasGetApiEventsPayload,
  CanvasGetElementsDenormalizedPayload,
  CanvasGetElementsNormalizedPayload,
  CanvasMoveElementPayload,
  CanvasRedoPayload,
  CanvasSetElementPayload,
  CanvasSetElementsPayload,
  CanvasUndoPayload,
  CanvasUpdateElementPayload,
} from '../constants/emitter'
import type {IAglynAppController} from './aglyn-app.types'
import type {ContextDomain, ContextEvent, ContextStore} from './aglyn-contexts.types'
import type {
  AglynElementNormalized,
  AglynElementsById,
  AglynElementsList,
} from './aglyn-elements.types'
import type {
  AglynModuleModelOptions,
  AglynModuleModelT,
  IAglynModuleModel,
} from './aglyn-module.types'


export type ElementsDataStore = {
  future: AglynElementsById[]
  past: AglynElementsById[]
  present: AglynElementsById
}

export interface ElementsDataStoreApi {
  redo: ContextEvent<any>
  undo: ContextEvent<any>
  addElement: ContextEvent<CanvasAddElementPayload>
  deleteElement: ContextEvent<CanvasDeleteElementPayload>
  duplicateElement: ContextEvent<CanvasDuplicateElementPayload>
  moveElement: ContextEvent<CanvasMoveElementPayload>
  setElement: ContextEvent<CanvasSetElementPayload>
  setElements: ContextEvent<CanvasSetElementsPayload>
  updateElement: ContextEvent<CanvasUpdateElementPayload>
}

export interface AglynCanvasControllerOptions extends AglynModuleModelOptions {
  initialElements: AglynElementNormalized[]
}

export interface IAglynCanvasController extends IAglynModuleModel<AglynCanvasControllerOptions> {
  readonly context: ContextStore<ElementsDataStore>
  readonly denormalizedElementsStore: ContextStore<AglynElementsById>
  readonly domain: ContextDomain
  readonly events: ElementsDataStoreApi
  readonly normalizedElementsStore: ContextStore<AglynElementsList>

  getApiEvents(payload?: CanvasGetApiEventsPayload): ElementsDataStoreApi
  getDenormalizedElementsStore(payload?: CanvasGetElementsDenormalizedPayload): ContextStore<AglynElementsById>
  getNormalizedElementsStore(payload?: CanvasGetElementsNormalizedPayload): ContextStore<AglynElementsList>
  getStore(payload?: CanvasGetApiEventsPayload): ContextStore<ElementsDataStore>

  redo(payload?: CanvasRedoPayload): this
  undo(payload?: CanvasUndoPayload): this

  addElement(payload: CanvasAddElementPayload): this
  deleteElement(payload: CanvasDeleteElementPayload): this
  duplicateElement(payload: CanvasDuplicateElementPayload): this
  moveElement(payload: CanvasMoveElementPayload): this
  setElement(payload: CanvasSetElementPayload): this
  setElements(payload: CanvasSetElementsPayload): this
  updateElement(payload: CanvasUpdateElementPayload): this
}

export interface AglynCanvasControllerT extends AglynModuleModelT<AglynCanvasControllerOptions> {
  new(app: IAglynAppController, options: AglynCanvasControllerOptions): IAglynCanvasController
}
