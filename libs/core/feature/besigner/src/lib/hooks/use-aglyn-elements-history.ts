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

import {IBesignerAppController} from '@aglyn/core-data-besigner'
import {canvasRedo, canvasUndo} from '@aglyn/core-data-framework'
import {useAglynAppContext} from '@aglyn/core-feature-renderer'
import {useSubscribable} from '@aglyn/shared-ui-jsx'
import {useCallback} from 'react'


export type UseAglynCanvasHistory = [
  undo: () => void,
  redo: () => void,
  canUndoTimes: number | false,
  canRedoTimes: number | false,
]

export function useAglynCanvasHistoryControls(): UseAglynCanvasHistory {
  const app = useAglynAppContext() as IBesignerAppController
  const canUndo = useSubscribable<number | false>(
    app.canvas?.pastElements, false,
    (past) => past?.length > 0 ? past.length : false,
  )
  const canRedo = useSubscribable<number | false>(
    app.canvas?.futureElements, false,
    (future) => future?.length > 0 ? future.length : false,
  )
  const handleUndo = useCallback(() => canvasUndo(app, {}), [app])
  const handleRedo = useCallback(() => canvasRedo(app, {}), [app])
  return [handleUndo, handleRedo, canUndo, canRedo]
}
export default useAglynCanvasHistoryControls
