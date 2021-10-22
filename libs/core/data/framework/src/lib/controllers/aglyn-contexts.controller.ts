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

import { Dictionary } from '@aglyn/shared-data-types'
import AglynBaseModel from '../models/aglyn-base.model'


export type AglynContextType<T = any> = Dictionary<T> | Array<T>

export interface AglynContextsController extends AglynBaseModel {
  getContext<T>(props: { name: string }): AglynContextType<T>
  setContext<T>(props: { name: string, data: AglynContextType<T> }): this
  deleteContext(props: { name: string }): this
}
