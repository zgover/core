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
  BuilderCanvasHoveredElement,
  BuilderCanvasSelectedElement,
  BuilderSetCanvasHoveredPayload,
  BuilderSetCanvasSelectedPayload,
  CommActionData,
} from '@aglyn/core-data-framework'
import { createContext, RefObject, SyntheticEvent, useContext } from 'react'


export interface HoveredOptions extends BuilderCanvasHoveredElement {
}
export interface SelectedOptions extends BuilderCanvasSelectedElement {
}

export interface HoverContextType {
  selectedOptions?: SelectedOptions
  hoveredOptions?: HoveredOptions
  hoverOpen: (event: SyntheticEvent, opts: BuilderSetCanvasHoveredPayload) => void
  hoverSelect: (event: SyntheticEvent, opts: BuilderSetCanvasSelectedPayload) => void
  hoverClose: (event: SyntheticEvent) => void
  hoverDeselect: (event: SyntheticEvent) => void
}

export type UseHoverType = () => HoverContextType

export const buildOptions = (defaultOptions, options) => {
  return {
    ...defaultOptions,
    ...options,
  }
}

export const ActivityContext = createContext<RefObject<any>>(null)
ActivityContext.displayName = 'ActivityContext'
export const HoverContext = createContext<HoverContextType>(null)
HoverContext.displayName = 'HoverContext'

export const useHoverContext: UseHoverType = () => {
  return useContext(HoverContext)
}

export default HoverContext
