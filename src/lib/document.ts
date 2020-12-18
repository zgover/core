import { BaseDocument, BaseDocumentModel } from './base'
import { Collection, CollectionModel } from './collection'
import { Dod } from './dod'
import { Field, FieldModel } from './field'
import { Normalized, NormalizedData } from './normalized'
import { ID } from './types'


/**
 * Instance outline base for all documents in the DB
 *
 * @export
 * @interface DocumentModel
 * @extends {Dod.DocumentRef<FT, ST>}
 * @extends {BaseDocumentModel<Dod.DocumentRef<FT, ST>>}
 * @template FT
 * @template ST
 */
export interface DocumentModel<FT extends FieldModel = FieldModel, ST extends CollectionModel = CollectionModel> extends Dod.Ref.DocumentRef<FT, ST>, BaseDocumentModel<Dod.Ref.DocumentRef<FT, ST>> {

  fieldModel: new (...args: any[]) => FT
  subcollectionModel: new (...args: any[]) => ST

  readonly fields: NormalizedData<FT>
  readonly subcollections: NormalizedData<ST>

  createField(...args: any[]): FT
  createSubcollection(...args: any[]): ST

  setField(id: ID, value: FT, index?: number): this
  setSubcollection(id: ID, value: ST, index?: number): this

  getField(id: ID): FT | null
  getSubcollection(id: ID): ST | null

  removeField(id: ID): this
  removeSubcollection(id: ID): this

  getAllFields(): FT[]
  getAllSubcollections(): ST[]

  setFields(fields: NormalizedData<FT>): this
  setSubcollections(collections: NormalizedData<ST>): this

}

/**
 * Provides base logic for all documents in the DB
 *
 * @export
 * @class Document
 * @extends {BaseDocument<Dod.DocumentRef<FT, ST>>}
 * @implements {DocumentModel<FT, ST>}
 * @template FT
 * @template ST
 */
export class Document<FT extends FieldModel = FieldModel, ST extends CollectionModel = CollectionModel> extends BaseDocument<Dod.Ref.DocumentRef<FT, ST>> implements DocumentModel<FT, ST> {

  public fieldModel: new (...args: any[]) => FT = Field as any
  public subcollectionModel: new (...args: any[]) => ST = Collection as any

  public get fields(): NormalizedData<FT> { return this.get('fields') }
  public get subcollections(): NormalizedData<ST> { return this.get('subcollections') }

  constructor(id: ID, fields?: NormalizedData<FT>, subcollections?: NormalizedData<ST>) {
    super({
      id,
      fields: new Normalized(fields),
      subcollections: new Normalized(subcollections)
    })
  }

  public static from<T extends Dod.Ref.DocumentRef>(data: T) {
    return new this(data?.id, <any>data?.fields, <any>data?.subcollections)
  }

  /**
   * Initialize the instance, should be called immediately after
   * creating the object
   *
   * @public
   * @memberof Document
   */
  public init(): this {
    this.preInit && this.preInit()
    this.initFields()
    this.initSubcollections()
    this.onInit && this.onInit()
    return this
  }

  protected initFields() {
    console.debug('initFields', this.id, this.fields)
    // Ensure if items are an object we ensure they are a document instance
    if (!(this.fields instanceof Normalized)) {
      this.setFields(new Normalized(this.fields))
    }
    if (this.fields instanceof Normalized) {
      this.fields.toArray().forEach(field => {
        if (!(field instanceof Field)) {
          this.setField(
            field.id, this.createField(field).init()
          )
        }
      })
    }
  }

  protected initSubcollections() {
    console.debug('initSubcollections', this.id, this.subcollections)
    // Ensure if items are an object we ensure they are a document instance
    if (!(this.subcollections instanceof Normalized)) {
      this.setSubcollections(new Normalized(this.subcollections))
    }
    if (this.subcollections instanceof Normalized) {
      this.subcollections.toArray().forEach(col => {
        if (!(col instanceof Collection)) {
          this.setSubcollection(
            col.id, this.createSubcollection(col).init()
          )
        }
      })
    }
  }

  public createField(data?): FT {
    const { id, kind, value } = data
    return new this.fieldModel(id, kind, value)
  }

  public createSubcollection(data): ST {
    const { id, documents } = data
    return new this.subcollectionModel(id, documents)
  }

  public setField(id: ID, value: FT, index?: number): this {
    Normalized.set([id, value], this.fields, index)
    return this
  }

  public setSubcollection(id: ID, value: ST, index?: number): this {
    Normalized.set([id, value], this.subcollections, index)
    return this
  }

  public getField(id: ID): FT | null {
    return Normalized.get(id, this.fields)
  }

  public getSubcollection(id: ID): ST | null {
    return Normalized.get(id, this.subcollections)
  }

  public removeField(id: ID): this {
    Normalized.remove(id, this.fields)
    return this
  }

  public removeSubcollection(id: ID): this {
    Normalized.remove(id, this.subcollections)
    return this
  }

  public getAllFields(): FT[] {
    return Normalized.toArray(this.fields)
  }

  public getAllSubcollections(): ST[] {
    return Normalized.toArray(this.subcollections)
  }

  public setFields(fields: NormalizedData<FT>): this {
    this.set('fields', fields instanceof Normalized
      ? fields : new Normalized(fields)
    )
    return this
  }

  public setSubcollections(collections: NormalizedData<ST>): this {
    this.set('subcollections', collections instanceof Normalized
      ? collections : new Normalized(collections)
    )
    return this
  }


}