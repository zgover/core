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

import { _contextsControllers } from '../constants/_internal'
import {
  ContextsCreateEffectPayload,
  ContextsCreateEventPayload,
  ContextsCreateStorePayload,
  ContextsGetStorePayload,
  ContextsSetStorePayload,
} from '../constants/emitter'
import { AglynAppController } from '../controllers/aglyn-app.controller'
import type { AglynContextsController } from '../controllers/aglyn-contexts.controller'
import { ContextStore } from '../controllers/aglyn-contexts.controller'
import { _validateAppArg } from './app.api'


export function _getContextsController(app: AglynAppController): AglynContextsController {
  _validateAppArg(app)
  return _contextsControllers.get(app.getName())
}


export function createContextStore<T>(
  app: AglynAppController,
  payload: ContextsCreateStorePayload<T>,
): void {
  const contextsController = _getContextsController(app)
  contextsController.createStore(payload)
}

export function createContextEvent(
  app: AglynAppController,
  payload: ContextsCreateEventPayload,
): void {
  const contextsController = _getContextsController(app)
  contextsController.createEvent(payload)
}

export function createContextEffect(
  app: AglynAppController,
  payload: ContextsCreateEffectPayload,
): void {
  const contextsController = _getContextsController(app)
  contextsController.createEffect(payload)
}

export function setContextStore<T>(
  app: AglynAppController,
  payload: ContextsSetStorePayload<T>,
): void {
  const contextsController = _getContextsController(app)
  contextsController.setStore(payload)
}

export function getContextStore<T>(
  app: AglynAppController,
  payload: ContextsGetStorePayload,
): ContextStore<T> {
  const contextsController = _getContextsController(app)
  return contextsController.getStore(payload)
}

export function deleteContextStore(
  app: AglynAppController,
  payload: ContextsGetStorePayload,
): void {
  const contextsController = _getContextsController(app)
  contextsController.deleteStore(payload)
}
