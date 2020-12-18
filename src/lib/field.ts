import { BaseDocument, BaseDocumentModel } from './base'
import { Dod } from './dod'
import { ID } from './types'

/**
 * Instance outline base for all documents in the DB
 *
 * @export
 * @interface FieldModel
 * @extends {Dod.FieldRef<T>}
 * @extends {BaseDocumentModel<Dod.FieldRef<T>>}
 * @template T
 */
export interface FieldModel<T extends Dod.Field = Dod.Field> extends Dod.Ref.FieldRef<T>, BaseDocumentModel<Dod.Ref.FieldRef<T>> {

  readonly value: T | null
  readonly kind: string | number

  getValue(): T | null
  setValue(value: T): this

  getKind(): string | number
  setKind(value: string | number): this

}

/**
 * Provides base logic for all documents in the DB
 *
 * @export
 * @class Field
 * @extends {BaseDocument<Dod.FieldRef<T>>}
 * @implements {FieldModel<T>}
 * @template T
 */
export class Field<T extends Dod.Field = Dod.Field> extends BaseDocument<Dod.Ref.FieldRef<T>> implements FieldModel<T> {

  public get value(): T { return this.get('value') }
  public get kind(): string | number { return this.get('kind') }

  constructor(id: ID, kind: string, value?: T) {
    super({ id, kind, value })
  }

  public static from<T extends Dod.Ref.FieldRef>(data: T) {
    return new this(data?.id, <any>data?.kind, data?.value)
  }

  /**
   * Initialize the instance, should be called immediately after
   * creating the object
   *
   * @public
   * @memberof Field
   */
  public init(): this {
    this.preInit && this.preInit()
    this.initValue()
    this.onInit && this.onInit()
    return this
  }

  protected initValue() {
    console.debug('initValue', this.id, this.value)
  }

  public getValue(): T {
    return this.value
  }

  public setValue(value: T): this {
    this.set('value', value)
    return this
  }

  public getKind(): string | number {
    return this.kind
  }

  public setKind(value: string | number): this {
    this.set('kind', value)
    return this
  }

}