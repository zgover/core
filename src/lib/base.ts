import { Crud, CrudModel } from './crud'
import { Dod } from './dod'
import { Initializable } from './initializable'
import { toJSON } from './json'
import { ID } from './types'

/**
 * Describes the base model object
 *
 * @export
 * @interface BaseDocumentModel
 * @extends {Initializable}
 * @extends {CrudModel<T>}
 * @extends {toJSON<T>}
 * @template T
 */
export interface BaseDocumentModel<T extends Dod.Map = any> extends Initializable, CrudModel<T>, toJSON<T> {
  id: ID
}

/**
 * Base model to be shared with all document models
 *
 * @export
 * @class BaseDocument
 * @extends {Crud<T>}
 * @implements {BaseDocumentModel<T>}
 * @template T
 */
export class BaseDocument<T extends Dod.Map = any> extends Crud<T> implements BaseDocumentModel<T> {

  public get id(): ID { return this.get('id') }
  public set id(value: ID) { this.set('id', value) }

  /**
   * Called from JSON.stringify(base)
   *
   * @returns {T}
   * @memberof Base
   */
  toJSON(): T { return { ...this.data } }

  /**
   * Hook called before init
   *
   * @protected
   * @memberof Base
   */
  preInit?(): void

  /**
   * Initialize the instance, should be called immediately after
   * creating the object. If overridden you must call preInit and
   * onInit yourself, do not super this method.
   *
   * @public
   * @memberof Field
   */
  init(): this {
    this.preInit && this.preInit()
    this.onInit && this.onInit()
    return this
  }

  /**
   * Hook called after init
   *
   * @protected
   * @memberof Field
   */
  onInit?(): void

}