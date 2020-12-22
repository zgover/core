import { FT, PKey, Ref, Schema } from '../interfaces/dod'

import { BaseRefController } from './BaseRefController'

/**
 *
 *
 * @export
 * @class FieldRefController
 * @extends {BaseRefController<Ref.Field<S>>}
 * @template S
 */
export class FieldRefController<S extends Schema.FieldMeta> extends BaseRefController<Ref.Field<S>> {

  constructor(id: PKey, schema: S, value?: FT.TypeFromTag<S['$type']>) {
    super({ id, schema, value })
  }

  public static from<S extends Schema.FieldMeta>(model: Ref.Field<S>) {
    return new this(model?.id, <any>model?.schema, model?.value)
  }

  /**
   * Initialize the instance, should be called immediately after
   * creating the object
   *
   * @public
   * @memberof FieldRefController
   */
  public init(): this {
    this.preInit && this.preInit()
    this.initValue()
    this.onInit && this.onInit()
    return this
  }

  protected initValue() {
    console.debug('initValue', this.getId(), this.getSchema(), this.getValue())
  }

  public getValue(): Ref.FieldValue<S> {
    return this.get('value')
  }

  public setValue(value: Ref.FieldValue<S>): this {
    return this.set('value', value)
  }

  public getSchema(): S {
    return this.get('schema')
  }

  public setSchema(value: S): this {
    return this.set('schema', value)
  }

}