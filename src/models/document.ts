import { mapObject, s } from '../utils'
import { _isObj, _isNum } from '../guards'
import { ID, Dictionary } from '../types/data'
import { DocumentModel } from '../types/document'

/**
 * Provides base logic for all documents in the DB
 *
 * @export
 * @class Document
 * @implements {DocumentModel}
 * @template T
 */
export class Document implements DocumentModel {

  get data(): Dictionary { return this.__data__ }

  get id(): string | undefined { return this.get('id') }
  set id(v: string) { this.set('id', v) }

  constructor(protected readonly __data__: Dictionary = {}) { }

  /**
   * Hook called before init
   *
   * @protected
   * @memberof Document
   */
  preInit?(): void

  /**
   * Initialize the instance, should be called immediately after
   * creating the object
   *
   * @public
   * @memberof Document
   */
  init(): this {
    this.preInit && this.preInit()
    this.data && mapObject(this.data, ((v, k) => this.set(s(k), v)), { forEach: true })
    this.onInit && this.onInit()
    return this
  }

  /**
   * Hook called after init
   *
   * @protected
   * @memberof Document
   */
  onInit?(): void

  set(id: ID, v: any): this { this.__data__[id] = v; return this }
  get(id: ID): any { return this.__data__[id] }
  del(id: ID): this { delete this.__data__[id]; return this }
  has(id: ID): boolean { return this.__data__.hasOwnProperty(id) }

  toJSON(): Dictionary { return { ...this.__data__ } }
}