import { BaseDocument, BaseDocumentModel } from './base'
import { Document, DocumentModel } from './document'
import { _isObj } from './guards'
import { ID } from './types'

/**
 * Instance outline for modeling a collection of documents
 *
 * @export
 * @interface CollectionModel
 * @extends {DocumentModel<F>}
 * @extends {IterableIterator<D>}
 * @template D
 * @template F
 */
export interface CollectionModel<D extends DocumentModel = DocumentModel> extends BaseDocumentModel, IterableIterator<D> {

  model: new (...args: any[]) => D
  documents: D[]

  createDocument(...args: any[]): D
  addDocument(item: D): this

  getAllDocuments(): D[]

  getDocumentById(id: ID): D | undefined
  getDocumentById(...ids: ID[]): D[]
  getDocumentById(id: ID, ...ids: ID[]): D | D[] | undefined

  removeDocument(id: ID): this
  removeDocument(item: D): this
  removeDocument(item: ID | D): this

  length: number
  [Symbol.iterator](): IterableIterator<D>
  next(): IteratorResult<D>
}

/**
 * Provides logic for modeling collections of documents
 *
 * @export
 * @class Collection
 * @implements {CollectionModel<D>}
 * @template D
 */
export class Collection<D extends DocumentModel = DocumentModel> extends BaseDocument implements CollectionModel<D> {

  public model: new (...args: any[]) => D = Document as any

  public get documents(): D[] { return this.data['documents'] }
  public set documents(v: D[]) { this.data['documents'] = v }

  public get length(): number { return (this.documents ?? []).length }

  /**
   * Initialize the instance, should be called immediately after
   * creating the object
   *
   * @public
   * @memberof Collection
   */
  init(): this {
    this.preInit && this.preInit()
    this.initDocuments()
    this.onInit && this.onInit()
    return this
  }

  protected initDocuments() {
    console.debug('initDocuments', this.id, this.documents)
    // Ensure if items are an object we ensure they are a document instance
    this.documents = (this.documents ??= []).map(item => {
      if (_isObj(item) && !(item instanceof this.model)) {
        return this.createDocument(item).init()
      }
      return item
    })
  }

  createDocument(...args: any[]): D {
    return new this.model(...args)
  }
  addDocument(item: D): this {
    (this.documents ??= []).push(item)
    return this
  }
  getAllDocuments(): D[] {
    return this.documents
  }
  getDocumentById(id: ID): D | undefined
  getDocumentById(...ids: ID[]): D[]
  getDocumentById(id: ID, ...ids: ID[]): D | D[] | undefined {
    if (ids.length) {
      const _ids = Array.from([id, ...ids])
      return this.documents?.filter(d => _ids.some(i => i === d?.id))
    }
    return this.documents?.find(i => i?.id === id)
  }
  removeDocument(id: ID): this
  removeDocument(item: D): this
  removeDocument(item: ID | D): this {
    const _item = _isObj(item) ? item : this.getDocumentById(item)
    const items = Array.from(this.documents)
    this.documents = items.filter(i => i !== _item)
    return this
  }


  private __index__ = 0;
  /** @inheritdoc */
  [Symbol.iterator](): IterableIterator<D> { return this }
  /** @inheritdoc */
  next(): IteratorResult<D> {
    if (this.__index__ < this.length) {
      return {
        done: false,
        value: this.documents[this.__index__++]
      }
    } else {
      return {
        done: true,
        value: null
      }
    }
  }

}