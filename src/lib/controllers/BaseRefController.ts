import { PKey, Ref } from '../interfaces/dod'
import { RefController } from '../interfaces/ref-controller'
import { Crud } from '../models/Crud'

/**
 *
 *
 * @export
 * @class BaseRefController
 * @extends {Crud<Ref.Base<S>>}
 * @implements {RefController<S>}
 * @template S
 */
export class BaseRefController<T extends Ref.Base> extends Crud<T> implements RefController<T> {

  /** @inheritdoc */
  public preInit?(): void

  /**
   * Initialize the instance, should be called immediately after
   * creating the object. If overridden you must call preInit and
   * onInit yourself, do not super this method.
   *
   * @public
   * @memberof BaseRefController
   */
  public init(): this {
    this.preInit && this.preInit()
    this.onInit && this.onInit()
    return this
  }

  /** @inheritdoc */
  public onInit?(): void

  public getId(): PKey {
    return this.get('id')
  }

  public setId(value: PKey): this {
    return this.set('id', value)
  }

  public getSchema(): T['schema'] {
    return this.get('schema')
  }

  public setSchema(value: T['schema']): this {
    return this.set('schema', value)
  }

}