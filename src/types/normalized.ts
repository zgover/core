import { ID } from './data'

/** Normalized local state design for interfacing with 3NF rules  */
export type NormalizedData<T extends any = object, K extends ID = ID> = {
  allIds: K[],
  byId: { [P in K]?: T }
}

export interface NormalizedModel<T extends any = object, K extends ID = ID> extends NormalizedData<T, K> {
  /**
   * The properties to keep when object is passed to JSON.stringify(...)
   * @returns {NormalizedData<T, K>}
   * @memberof NormalizedCollection
   */
  toJSON(): NormalizedData<T, K>
  /**
   * Converts the current values into an array ordered by the
   * appearance of the key in allIds array
   * @returns {Array<T>}
   * @memberof NormalizedCollection
   */
  toArray(): Array<T>
  /**
   * Clears all values
   * @returns {this}
   * @memberof NormalizedCollection
   */
  clear(): this
  /**
   * Aliases the static method to shortcut delete operations on this instance
   *
   * @param {K} id
   * @returns {this}
   * @memberof NormalizedCollection
   */
  delete(id: K): this
  /**
   * Returns whether or not the data byId has property key
   *
   * @param {ID} id
   * @returns {boolean}
   * @memberof NormalizedCollection
   */
  has(id: ID): boolean
  /**
   * Aliases the static method to shortcut set operations on this instance
   *
   * @param {ID} id
   * @param {*} [value]
   * @param {number} [index]
   * @returns {this}
   * @memberof NormalizedCollection
   */
  set(id: ID, value?: T, index?: number): this
  /**
   * Shortcuts getting the value of properties of the current instance
   *
   * @param {ID} id
   * @returns {(undefined | T)}
   * @memberof NormalizedCollection
   */
  get(id: ID): undefined | T
}