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

import {Dictionary} from './basic'


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

export type Bool = boolean
export type Bytes = Uint8Array | string
export type TimestampSeconds = number
export type Float = number
export type Int32 = number
export type Int64 = number
export type Null = null
export type Text = string
export type Coordinates = Record<'longitude' | 'latitude', number>
export type Mapped = Dictionary
export type Sorted<T = any> = T extends any[] ? never : T[]
export type Nestable = Mapped | Sorted<any>


export enum InferValueFlag {
  bool = 'bool',
  bytes = 'bytes',
  timestamp = 'timestamp',
  float = 'float',
  int32 = 'int32',
  int64 = 'int64',
  nil = 'nil',
  text = 'text',
  coordinates = 'coordinates',
  mapped = 'map',
  sorted = 'sorted',
}

export type InferValueTypeAny<T = any> =
  | Sorted<T>
  | Bool
  | Bytes
  | TimestampSeconds
  | Float
  | Coordinates
  | Int32
  | Int64
  | Mapped
  | Null
  | Text

/** Match Type from Tag symbol */
export type InferValueTypeFromFlag<Kind extends InferValueFlag> =
  Kind extends typeof InferValueFlag.bool ? Bool
    : Kind extends typeof InferValueFlag.bytes ? Uint8Array
      : Kind extends typeof InferValueFlag.timestamp ? TimestampSeconds
        : Kind extends typeof InferValueFlag.float ? Float
          : Kind extends typeof InferValueFlag.int32 ? Int32
            : Kind extends typeof InferValueFlag.int64 ? Int64
              : Kind extends typeof InferValueFlag.nil ? Null
                : Kind extends typeof InferValueFlag.text ? Text
                  : Kind extends typeof InferValueFlag.coordinates ? Coordinates
                    : Kind extends typeof InferValueFlag.mapped ? Mapped
                      : Kind extends typeof InferValueFlag.sorted ? Sorted<any>
                        : never
