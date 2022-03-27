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

import arrayCopyDeep from './array-copy-deep'
import arrayCopyShallow from './array-copy-shallow'
import arrayMoveAtIndex from './array-move-at-index'
import arrayPushAtIndex from './array-push-at-index'
import arrayRemoveAtIndex from './array-remove-at-index'
import arrayRemoveItem from './array-remove-item'
import arrayUpdateAtIndex from './array-update-at-index'


export {}

declare global {
  interface Array<T> {
    copyShallow(): Array<T>
    copyDeep(): Array<T>
    moveAtIndex(elem: T, index: number, newIndex: number): Array<T>
    pushAtIndex(elem: T, index: number, newIndex: number): Array<T>
    remove(elem: T): Array<T>
    removeAtIndex(index: number): Array<T>
    replaceAtIndex(index: number, elem: T): Array<T>
  }
}

if (!Array.prototype.remove) {
  Array.prototype.copyDeep = function <T>(this: T[]): T[] {
    return arrayCopyDeep(this)
  }
  Array.prototype.copyShallow = function <T>(this: T[]): T[] {
    return arrayCopyShallow(this)
  }
  Array.prototype.moveAtIndex = function <T>(this: T[], index: number, newIndex: number): T[] {
    return arrayMoveAtIndex(this, index, newIndex)
  }
  Array.prototype.pushAtIndex = function <T>(this: T[], index: number, ...elems: T[]): T[] {
    return arrayPushAtIndex(this, index, ...elems)
  }
  Array.prototype.remove = function <T>(this: T[], elem: T): T[] {
    return arrayRemoveItem(this, elem)
  }
  Array.prototype.removeAtIndex = function <T>(this: T[], elem: T): T[] {
    return arrayRemoveAtIndex(this, elem)
  }
  Array.prototype.replaceAtIndex = function <T>(this: T[], index: number, elem: T): T[] {
    return arrayUpdateAtIndex(this, index, elem)
  }
}
