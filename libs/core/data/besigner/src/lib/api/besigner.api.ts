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
  type ContextStore,
} from '@aglyn/core-data-framework'
import {_INTERNAL_BESIGNERS_} from '../constants/_internal'
import {
  type BesignerClosePanelPayload,
  type BesignerFlagInteractModePayload,
  type BesignerGetStorePayload,
  type BesignerOpenPanelPayload,
  type BesignerSetCanvasHoveredPayload,
  type BesignerSetCanvasSelectedPayload,
  type BesignerSetDndStatePayload,
  type BesignerSetPanelPayload,
} from '../constants/emitter'
import {
  type BesignerContextStores,
  type IAglynBesignerController,
} from '../controllers/aglyn-besigner.types'
import {IBesignerAppController} from '../controllers/besigner-app.types'
import {_validateBesignerAppArg} from './app.api'


export function _getBesignerController(app: IBesignerAppController): IAglynBesignerController {
  _validateBesignerAppArg(app)
  return _INTERNAL_BESIGNERS_.get(app.getName())
}

export function getBesignerStore<K extends keyof BesignerContextStores>(
  app: IBesignerAppController,
  payload: BesignerGetStorePayload<K>,
): ContextStore<BesignerContextStores[K]> {
  const besignerController = _getBesignerController(app)
  return besignerController.getStore(payload)
}

export function setBesignerFlag(
  app: IBesignerAppController,
  payload: BesignerFlagInteractModePayload,
) {
  const besignerController = _getBesignerController(app)
  return besignerController.setFlag(payload)
}

export function setBesignerPanels(
  app: IBesignerAppController,
  payload: BesignerSetPanelPayload,
) {
  const besignerController = _getBesignerController(app)
  return besignerController.setPanels(payload)
}

export function openBesignerPanel(
  app: IBesignerAppController,
  payload: BesignerOpenPanelPayload,
) {
  const besignerController = _getBesignerController(app)
  return besignerController.openPanel(payload)
}

export function closeBesignerPanel(
  app: IBesignerAppController,
  payload: BesignerClosePanelPayload,
) {
  const besignerController = _getBesignerController(app)
  return besignerController.closePanel(payload)
}

export function setBesignerDndState(
  app: IBesignerAppController,
  payload?: BesignerSetDndStatePayload,
) {
  const besignerController = _getBesignerController(app)
  return besignerController.setDndState(payload)
}

export function setBesignerCanvasSelected(
  app: IBesignerAppController,
  payload?: BesignerSetCanvasSelectedPayload,
) {
  const besignerController = _getBesignerController(app)
  return besignerController.setCanvasSelected(payload)
}

export function setBesignerCanvasHovered(
  app: IBesignerAppController,
  payload?: BesignerSetCanvasHoveredPayload,
) {
  const besignerController = _getBesignerController(app)
  return besignerController.setCanvasHovered(payload)
}
