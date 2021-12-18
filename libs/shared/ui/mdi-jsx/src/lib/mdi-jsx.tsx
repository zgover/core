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

import dynamic from 'next/dynamic'


export const MdiSvgIcon = dynamic(
  () => import('./components/mdi-svg-icon'),
  {ssr: false, loading: () => (<span></span>)},
)
MdiSvgIcon.displayName = 'MdiSvgIcon'
export type {MdiSvgIconProps} from './components/mdi-svg-icon'

export * from './hooks/use-mdi-icon'
export * from './hooks/use-mdi-icons'
export * from './hooks/use-mdi-icons-fuzzy'

export * from './types'
