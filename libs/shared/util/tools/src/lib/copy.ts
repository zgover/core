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

export type CopyTarget<Target, ArrIndex, MapKey, MapValue, SetValue> =
  Target extends ReadonlyArray<ArrIndex>
    ? Target /*ReadonlyArray<ArrIndex>*/
    : Target extends Map<MapKey, MapValue>
      ? Target /*Map<MapKey, MapValue>*/
      : Target extends Set<SetValue>
        ? Target /*Set<SetValue>*/
        : Target extends Record<infer K, infer V>
          ? Target /*Record<K, V>*/
          : Target

export type ObjectAssignFn = {
  <T, U>(target: T, source: U): (T & U)
  <T, U, V>(target: T, source1: U, source2: V): (T & U & V)
  <T, U, V, W>(target: T, source1: U, source2: V, source3: W): (T & U & V & W)
  (target: object, ...sources: any[]): any
}

const objectAssign: ObjectAssignFn = Object.assign ?? defaultObjectAssign


function defaultObjectAssign<T, U>(target: T, source: U): T & U {
  getAllKeys(source).forEach((key: string): void => {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      target[key] = source[key]
    }
  })
  return target as T & U
}

function getType<T>(obj: T): string {
  return String(obj).slice(8, -1)
}

function getAllKeys<T>(obj: T): (string | symbol)[] {
  const definedPropertySymbols = typeof Object.getOwnPropertySymbols === 'function'
  const getOwnPropertySymbols = definedPropertySymbols ? Object.getOwnPropertySymbols : () => []
  return Object.keys(obj).concat(getOwnPropertySymbols.call(null, obj))
}

/**
 * Immutable deep copy
 * @param value - Any value to create a copy of
 * @see Inspired by {@link https://github.com/kolodny/immutability-helper/blob/master/index.ts}
 */
export function copy<Target, ArrIndex, MapKey, MapValue, SetValue>(
  value: Target,
): CopyTarget<Target, ArrIndex, MapKey, MapValue, SetValue> {
  return Array.isArray(value)
    ? objectAssign.call(null, value.constructor(value.length), value)
    : getType(value) === 'Map'
      ? new Map(value as unknown as Map<MapKey, MapValue>)
      : getType(value) === 'Set'
        ? new Set(value as unknown as Set<SetValue>)
        : value && typeof value === 'object'
          ? (objectAssign(Object.create(Object.getPrototypeOf(value)), value) as Target)
          : (value as Target)
}
export default copy
