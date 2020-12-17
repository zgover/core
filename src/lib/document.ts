import { BaseDocument, BaseDocumentModel } from './base'
import { Field, FieldModel } from './field'
import { _isObj } from './guards'
import { ID } from './types'


/**
 * Instance outline base for all documents in the DB
 *
 * @export
 * @interface DocumentModel
 * @extends {CrudModel}
 * @template F
 */
export interface DocumentModel<F extends FieldModel = FieldModel> extends BaseDocumentModel, IterableIterator<F> {

  model: new (...args: any[]) => F
  fields: F[]
  subcollections: DocumentModel[]

  createField(...args: any[]): F
  addField(item: F): this

  getAllFields(): F[]

  getFieldById(id: ID): F | undefined
  getFieldById(...ids: ID[]): F[]
  getFieldById(id: ID, ...ids: ID[]): F | F[] | undefined

  removeField(id: ID): this
  removeField(item: F): this
  removeField(item: ID | F): this

  addSubcollection(item: DocumentModel): this

  getAllSubcollections(): DocumentModel[]

  getSubcollectionById(id: ID): DocumentModel | undefined
  getSubcollectionById(...ids: ID[]): DocumentModel[]
  getSubcollectionById(id: ID, ...ids: ID[]): DocumentModel | DocumentModel[] | undefined

  removeSubcollection(id: ID): this
  removeSubcollection(item: DocumentModel): this
  removeSubcollection(item: ID | DocumentModel): this

  length: number
  [Symbol.iterator](): IterableIterator<F>
  next(): IteratorResult<F>
}

/**
 * Provides base logic for all documents in the DB
 *
 * @export
 * @class Document
 * @implements {DocumentModel<F>}
 * @template F
 */
export class Document<F extends FieldModel = FieldModel> extends BaseDocument implements DocumentModel<F> {

  public model: new (...args: any[]) => F = Field as any

  public get fields(): F[] { return this.data['fields'] ??= [] }
  public set fields(v: F[]) { this.data['fields'] = v }

  public get subcollections(): DocumentModel[] { return this.data['subcollections'] }
  public set subcollections(v: DocumentModel[]) { this.data['subcollections'] = v }

  public get length(): number { return (this.fields ?? []).length }

  /**
   * Initialize the instance, should be called immediately after
   * creating the object
   *
   * @public
   * @memberof Document
   */
  init(): this {
    this.preInit && this.preInit()
    this.initFields()
    this.initSubcollections()
    this.onInit && this.onInit()
    return this
  }

  protected initFields() {
    console.debug('initFields', this.id, this.fields)
    // Ensure if items are an object we ensure they are a document instance
    this.fields = (this.fields ??= []).map(item => {
      console.debug('initFields item', item)
      if (_isObj(item) && !(item instanceof this.model)) {
        console.debug('initFields creating', item)
        return this.createField(item).init()
      }
      return item
    })
  }

  protected initSubcollections() {
    console.debug('initSubcollections', this.id, this.subcollections)
    // Ensure if items are an object we ensure they are a document instance
    this.subcollections = (this.subcollections ??= []).map(item => {
      console.debug('initSubcollections item', item)
      if (_isObj(item) && !(item instanceof Document)) {
        console.debug('initSubcollections creating', item)
        return new Document(item).init()
      }
      return item
    })
    console.log('this.subcollections', this.subcollections)
  }

  createField(...args: any[]): F {
    return new this.model(...args)
  }
  addField(item: F): this {
    (this.fields ??= []).push(item)
    return this
  }
  getAllFields(): F[] {
    return this.fields
  }
  getFieldById(id: ID): F | undefined
  getFieldById(...ids: ID[]): F[]
  getFieldById(id: ID, ...ids: ID[]): F | F[] | undefined {
    if (ids.length) {
      const _ids = Array.from([id, ...ids])
      return this.fields?.filter(d => _ids.some(i => i === d?.id))
    }
    return this.fields?.find(i => i?.id === id)
  }
  removeField(id: ID): this
  removeField(item: F): this
  removeField(item: ID | F): this {
    const _item = _isObj(item) ? item : this.getFieldById(item)
    const items = Array.from(this.fields)
    this.fields = items.filter(i => i != _item)
    return this
  }

  addSubcollection(item: DocumentModel): this {
    (this.subcollections ??= []).push(item)
    return this
  }
  getAllSubcollections(): DocumentModel[] {
    return this.subcollections
  }
  getSubcollectionById(id: ID): DocumentModel | undefined
  getSubcollectionById(...ids: ID[]): DocumentModel[]
  getSubcollectionById(id: ID, ...ids: ID[]): DocumentModel | DocumentModel[] | undefined {
    if (ids.length) {
      const _ids = Array.from([id, ...ids])
      return this.subcollections?.filter(d => _ids.some(i => i === d?.id))
    }
    return this.subcollections?.find(i => i?.id === id)
  }
  removeSubcollection(id: ID): this
  removeSubcollection(item: DocumentModel): this
  removeSubcollection(item: ID | DocumentModel): this {
    const _item = _isObj(item) ? item : this.getSubcollectionById(item)
    const items = Array.from(this.subcollections)
    this.subcollections = items.filter(i => i !== _item)
    return this
  }


  private __index__ = 0;
  /** @inheritdoc */
  [Symbol.iterator](): IterableIterator<F> { return this }
  /** @inheritdoc */
  next(): IteratorResult<F> {
    if (this.__index__ < this.length) {
      return {
        done: false,
        value: this.fields[this.__index__++]
      }
    } else {
      return {
        done: true,
        value: null
      }
    }
  }

}