/**
 * Local properties and methods required for CRUD logic
 * (create, read, update delete)
 *
 * @export
 * @interface CrudModel
 * @template T
 */
export interface CrudModel<T = any, V = any> {

  /**
   * All data to c.r.u.d.
   *
   * @type {T}
   * @memberof CrudModel
   */
  readonly data: T

  /**
   *  Set the value of an index on the data property
   *
   * @param {ID} id
   * @param {V} value
   * @returns {this}
   * @memberof CrudModel
   */
  set<K extends keyof T>(id: K, value: V): this

  /**
   * Get the value of an index on the data property
   *
   * @param {ID} id
   * @returns {(V | null)}
   * @memberof Crud
   */
  get<K extends keyof T>(id: K): T[K] | null

  /**
   * Check if the index signature (id) exists on the data property
   *
   * @param {ID} id
   * @returns {boolean}
   * @memberof CrudModel
   */
  has<K extends keyof T>(id: K): boolean

  /**
   * Remove an index from the data property
   *
   * @param {ID} id
   * @returns {this}
   * @memberof CrudModel
   */
  del<K extends keyof T>(id: K): this
}

/**
 * Methods (set, get, has, del) to c.r.u.d. an index of the data property
 *
 * @export
 * @abstract
 * @class Crud
 * @implements {CrudModel<T>}
 * @template T
 */
export abstract class Crud<T = any> implements CrudModel<T> {
  /**
   * Creates an instance of Crud.
   * @param {T} [data={} as any]
   * @memberof Crud
   */
  constructor(public readonly data: T = {} as any) { }

  /** @inheritdoc */
  set<K extends keyof T>(id: K, value: any): this { this.data[id] = value; return this }
  /** @inheritdoc */
  get<K extends keyof T>(id: K): T[K] | null { return this.data[id] }
  /** @inheritdoc */
  has<K extends keyof T>(id: K): boolean { return Object.prototype.hasOwnProperty.call(this.data, id) }
  /** @inheritdoc */
  del<K extends keyof T>(id: K): this { delete this.data[id]; return this }
}