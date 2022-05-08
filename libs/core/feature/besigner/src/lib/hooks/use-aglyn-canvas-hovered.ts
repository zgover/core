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
  type BesignerCanvasHoveredElement,
  type BesignerCanvasState,
  type IBesignerAppController,
  setBesignerCanvasHovered,
} from '@aglyn/core-data-besigner'
import {useAglynAppContext} from '@aglyn/core-feature-renderer'
import {useSubscribable} from '@aglyn/shared-ui-jsx'
import {_isFnT} from '@aglyn/shared-util-guards'
import {useCallback} from 'react'


export function useAglynCanvasHovered(): [
  value: BesignerCanvasHoveredElement | undefined,
  setValue: (
    hovered: BesignerCanvasHoveredElement | ((
      hovered: BesignerCanvasHoveredElement,
      canvas: BesignerCanvasState,
    ) => BesignerCanvasHoveredElement),
  ) => void
] {
  const app = useAglynAppContext() as IBesignerAppController
  const value = useSubscribable<BesignerCanvasHoveredElement>(
    app.besigner?.canvas, undefined,
    (canvas) => canvas?.hovered,
  )
  const setHovered = useAglynCanvasSetHovered()


  return [value, setHovered]
}

export default useAglynCanvasHovered

export function useAglynCanvasSetHovered(): (
  hovered: BesignerCanvasHoveredElement | ((
    prev: BesignerCanvasHoveredElement,
    canvas: BesignerCanvasState,
  ) => BesignerCanvasHoveredElement),
) => void {
  const app = useAglynAppContext() as IBesignerAppController
  return useCallback((
    hovered: BesignerCanvasHoveredElement | ((
      prev: BesignerCanvasHoveredElement,
      canvas: BesignerCanvasState,
    ) => BesignerCanvasHoveredElement),
  ) => {
    setBesignerCanvasHovered(app, {
      hovered: (prev, canvas) => _isFnT(hovered) ? hovered(prev, canvas) : hovered,
    })
  }, [app])
}
