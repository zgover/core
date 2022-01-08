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


import {type PayloadData} from '@aglyn/core-data-framework'
import {
  type BesignerCanvasHoveredElement,
  type BesignerCanvasSelectedElement,
  type BesignerContextStores,
  type BesignerDndState,
  type BesignerFlagState,
  type BesignerPanelsState,
} from '../controllers/aglyn-besigner.types'


export enum BesignerAppEffectFlag {
  BESIGNER_GET_STORE = 'effect:besigner:get-store',
  BESIGNER_SET_FLAG = 'effect:besigner:set-flag',
  BESIGNER_SET_PANEL = 'effect:besigner:set-panel',
  BESIGNER_OPEN_PANEL = 'effect:besigner:open-panel',
  BESIGNER_CLOSE_PANEL = 'effect:besigner:close-panel',
}


export type BesignerGetStorePayload<K extends keyof BesignerContextStores = any> = PayloadData<{store: K}>
export type BesignerFlagInteractModePayload<K extends keyof BesignerFlagState = any> = PayloadData<{flag: K, value: BesignerFlagState[K]}>
export type BesignerSetPanelPayload = PayloadData<{panels: (prev: BesignerPanelsState) => BesignerPanelsState}>
export type BesignerOpenPanelPayload = PayloadData<{panel: keyof BesignerPanelsState}>
export type BesignerClosePanelPayload = PayloadData<{panel: keyof BesignerPanelsState}>
export type BesignerSetDndStatePayload = PayloadData<{dnd: (prev: BesignerDndState) => Partial<BesignerDndState>}>
export type BesignerSetCanvasSelectedPayload = PayloadData<{selected: (prev: BesignerCanvasSelectedElement) => BesignerCanvasSelectedElement}>
export type BesignerSetCanvasHoveredPayload = PayloadData<{hovered: (prev: BesignerCanvasHoveredElement) => BesignerCanvasHoveredElement}>

declare module '@aglyn/core-data-framework' {
  interface AglynModuleEffectPayload {
    [BesignerAppEffectFlag.BESIGNER_GET_STORE]: BesignerGetStorePayload
    [BesignerAppEffectFlag.BESIGNER_SET_FLAG]: BesignerFlagInteractModePayload
    [BesignerAppEffectFlag.BESIGNER_SET_PANEL]: BesignerSetPanelPayload
    [BesignerAppEffectFlag.BESIGNER_OPEN_PANEL]: BesignerOpenPanelPayload
    [BesignerAppEffectFlag.BESIGNER_CLOSE_PANEL]: BesignerClosePanelPayload
  }
}
