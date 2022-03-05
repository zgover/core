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

import {_isArrEmpty} from '@aglyn/shared-util-guards'
import {type ModificationHistoryState} from '../types/generic.types'


export const handleRedoEvent = <S>(state: ModificationHistoryState<S>) => {
  return handleStateModificationHistoryRedo(state)
}

export const handleStateModificationHistoryRedo = <S>(
  state: ModificationHistoryState<S>,
): ModificationHistoryState<S> => {
  if (!_isArrEmpty(state.future)) {
    const future = state.future
    const past = [state.present, ...state.past]
    return {
      present: future.pop(),
      past: past,
      future: future,
    }
  }
  return state
}
export default handleStateModificationHistoryRedo
