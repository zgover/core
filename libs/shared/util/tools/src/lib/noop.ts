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

export interface NoopFn {
  <T = any>(..._: T[]): any
}

/**
 * Create a no operation function with no return
 */
export function noopFactory(): NoopFn {
  return function noop<T = any>(..._: T[]): any {
    // Do nothing.
  }
}

/**
 * Create a no operation function with no return
 */
export function noop<T = any>(..._: T[]): any {
  // Do nothing.
}

export default noop
