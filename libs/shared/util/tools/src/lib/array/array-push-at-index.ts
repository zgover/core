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


/**
 * Push an item onto the array at the provided zero index
 * @param array - The array to mutate and push the new elements onto
 * @param index - The zero index to start the new elements
 * @param items - New items to push onto the array
 */
export function arrayPushAtIndex<T>(
  array: Array<T>,
  index: number,
  ...items: T[]
): Array<T> {
  array.splice(index, 0, ...items)
  return array
}
export default arrayPushAtIndex
