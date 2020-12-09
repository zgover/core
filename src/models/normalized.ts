import { removeFromArray, reorderArray, deleteProperty, copy } from '../utils'
import { _isObj, _isNum } from '../guards'
import { ID } from '../types/data'
import { NormalizedData, NormalizedModel } from '../types/normalized'

/**
 * Normalized data for 3NF
 *
 * @export
 * @abstract
 * @class NormalizedCollection
 * @extends {NormalizedData<T, K>}
 * @template T
 * @template K
 * @see https://en.wikipedia.org/wiki/Third_normal_form
 */
export class Normalized<T extends any = object, K extends ID = any> implements NormalizedModel<T, K> {

  static build<T extends any = object, K extends ID = ID>(): NormalizedData<T, K> {
    return { allIds: [], byId: {} }
  }

  public allIds: K[] = []
  public byId: { [P in K]?: T } = {}

  constructor(public readonly props?: NormalizedData<T, K>) {
    const { allIds, byId } = { ...props }
    this.allIds = copy(allIds ?? [])
    this.byId = copy(byId ?? {})
  }

  /**
   * Maps the ids/keys to their respective values in byId
   *
   * @static
   * @template T
   * @template V
   * @param {T} v
   * @returns {V[]}
   * @memberof NormalizedCollection
   */
  public static toArray<T extends NormalizedData<V>, V>(v: T): V[] {
    return Array.from(v.allIds).map((id) => v.byId[id])
  }

  /**
   * Resets the keys/allIds and values/byId back to empty
   *
   * @static
   * @param {NormalizedData} v
   * @returns {NormalizedData}
   * @memberof NormalizedCollection
   */
  public static clear<T extends NormalizedData<any>>(v: T): T {
    v.allIds = []
    v.byId = {}
    return v
  }

  /**
   * Clears all values
   * @returns {this}
   * @memberof NormalizedCollection
   */
  public clear(): this {
    return Normalized.clear(this)
  }

  /**
   * Create a new class instance from the provided params
   *
   * @static
   * @template T
   * @template K
   * @param {(...T[] | [id: K, value: any][])} items
   * @returns {NormalizedModel<T>}
   * @memberof NormalizedCollection
   */
  public static from<T extends object, K extends ID>(...items: T[] | [id: K, value: any][]): NormalizedModel<T> {
    const _items = [...items].map(i => _isObj(i) ? [i['id'], i] : [...i])
    const parsed = _items.reduce<NormalizedData<T, K>>((acc, [id, v]) => ({
      allIds: (acc?.allIds ?? []).concat(id),
      byId: { ...acc?.byId, [id]: v }
    }), { allIds: [], byId: {} })
    return new this(parsed)
  }

  /**
   * Removes an item from an existing key value data structure object
   *
   * @static
   * @template T
   * @param {ID} id
   * @param {NormalizedData<T>} data
   * @returns {NormalizedData<T>}
   * @memberof NormalizedCollection
   */
  public static delete<T extends NormalizedData<any, K>, K extends ID>(id: K, data: T): T {
    data.allIds = removeFromArray(id, data.allIds)
    data.byId = deleteProperty(data.byId, id)
    return data
  }

  /**
   * Sets an item in an existing normalized key value object.
   *
   * @static
   * @template T
   * @template V
   * @template K
   * @param {[id: K, value: V]} item
   * @param {T} data
   * @param {number} [index]
   * @returns {T}
   * @memberof NormalizedCollection
   */
  public static set<T extends NormalizedData<V, K>, V, K extends ID>(
    item: [id: K, value: V],
    data: T,
    index?: number,
  ): T {
    const [id, value] = item
    const currentIndex = data.allIds.indexOf(id)
    const isUpdate = currentIndex !== -1

    data.byId[id] = value

    if (!isUpdate) {
      data.allIds.push(id)
    } else if (_isNum(index) && currentIndex !== index) {
      data.allIds = reorderArray(data.allIds, currentIndex, index)
    }

    return data
  }

  /**
   * Get a property from the key value. shortens call such as data.byId[foo]
   *
   * @static
   * @template T
   * @param {ID} id
   * @param {NormalizedData<T>} data
   * @returns {(undefined | T)}
   * @memberof NormalizedCollection
   */
  public static get<T extends NormalizedData<V, K>, K extends ID, V>(id: K, data: T): V | null {
    return data.byId[id] ?? null
  }

  /**
   * The properties to keep when object is passed to JSON.stringify(...)
   * @returns {NormalizedData<T, K>}
   * @memberof NormalizedCollection
   */
  public toJSON(): NormalizedData<T, K> {
    return { allIds: this.allIds, byId: this.byId }
  }

  /**
   * Converts the current values into an array ordered by the
   * appearance of the key in allIds array
   * @returns {Array<T>}
   * @memberof NormalizedCollection
   */
  public toArray(): Array<T> {
    return Normalized.toArray(this)
  }

  /**
   * Aliases the static method to shortcut delete operations on this instance
   *
   * @param {K} id
   * @returns {this}
   * @memberof NormalizedCollection
   */
  public delete(id: K): this {
    return Normalized.delete(id, this)
  }

  /**
   * Returns whether or not the data byId has property key/id
   *
   * @param {ID} id
   * @returns {boolean}
   * @memberof NormalizedCollection
   */
  public has(id: ID): boolean {
    return this.byId.hasOwnProperty(id)
  }

  /**
   * Aliases the static method to shortcut set operations on this instance
   *
   * @param {ID} id
   * @param {*} [value]
   * @param {number} [index]
   * @returns {this}
   * @memberof NormalizedCollection
   */
  public set(id: ID, value?: T, index?: number): this {
    return Normalized.set([id, value], this, index)
  }

  /**
   * Shortcuts getting the value of properties of the current instance
   *
   * @param {ID} id
   * @returns {(undefined | T)}
   * @memberof NormalizedCollection
   */
  public get(id: ID): undefined | T {
    return Normalized.get(id, this)
  }
}