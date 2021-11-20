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

import { _builderControllers } from '../constants/_internal'
import type {
  BuilderClosePanelPayload,
  BuilderFlagInteractModePayload,
  BuilderGetStorePayload, BuilderOpenPanelPayload,
  BuilderSetPanelPayload,
} from '../constants/emitter'
import { AglynAppController } from '../controllers/aglyn-app.controller'
import type { AglynBuilderController } from '../controllers/aglyn-builder.controller'
import { BuilderContextStores, BuilderPanelsState } from '../controllers/aglyn-builder.controller'
import type { ContextStore } from '../controllers/aglyn-contexts.controller'
import { _validateAppArg } from './app.api'


export {
  InteractionModeFlag,
  BuilderActiveViewFlag,
  DndDragSourceTypeFlag,
  DndDropLinealTypeFlag,
} from '../controllers/aglyn-builder.controller'

export function _getBuilderController(app: AglynAppController): AglynBuilderController {
  _validateAppArg(app)
  return _builderControllers.get(app.getName())
}

export function getBuilderStore<K extends keyof BuilderContextStores>(
  app: AglynAppController,
  payload: BuilderGetStorePayload<K>,
): ContextStore<BuilderContextStores[K]> {
  const builderController = _getBuilderController(app)
  return builderController.getStore(payload)
}

export function setBuilderFlag(
  app: AglynAppController,
  payload: BuilderFlagInteractModePayload,
) {
  const builderController = _getBuilderController(app)
  return builderController.setFlag(payload)
}

export function setBuilderPanels(
  app: AglynAppController,
  payload: BuilderSetPanelPayload,
) {
  const builderController = _getBuilderController(app)
  return builderController.setPanels(payload)
}

export function openBuilderPanel(
  app: AglynAppController,
  payload: BuilderOpenPanelPayload,
) {
  const builderController = _getBuilderController(app)
  return builderController.openPanel(payload)
}

export function closeBuilderPanel(
  app: AglynAppController,
  payload: BuilderClosePanelPayload,
) {
  const builderController = _getBuilderController(app)
  return builderController.closePanel(payload)
}
