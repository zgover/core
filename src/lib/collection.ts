import { BaseDocument, BaseDocumentModel } from './base'
import { Document, DocumentModel } from './document'
import { Dod } from './dod'
import { Normalized, NormalizedData } from './normalized'
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
export interface CollectionModel<D extends DocumentModel = any> extends Dod.Ref.CollectionRef<D>, BaseDocumentModel<Dod.Ref.CollectionRef<D>> {

  documentModel: new (...args: any[]) => D
  readonly documents: NormalizedData<D>
  readonly length: number

  createDocument(...args: any[]): D
  setDocument(id: ID, value: D, index?: number): this
  getDocument(id: ID): D | null
  removeDocument(id: ID): this
  getAllDocuments(): D[]
  setDocuments(documents: NormalizedData<D>): this

}

/**
 * Provides logic for modeling collections of documents
 *
 * @export
 * @class Collection
 * @implements {CollectionModel<D>}
 * @template D
 */
export class Collection<D extends DocumentModel = DocumentModel> extends BaseDocument<Dod.Ref.CollectionRef<D>> implements CollectionModel<D> {

  public documentModel: new (...args: any[]) => D = Document as any
  public get documents(): NormalizedData<D> { return this.get('documents') }
  public get length(): number { return this.documents?.allIds?.length ?? 0 }

  constructor(id: ID, documents?: NormalizedData<D>) {
    super({
      id: id, documents: new Normalized(documents)
    })
  }

  public static from<T extends Dod.Ref.CollectionRef>(data: T) {
    console.log('collection from', data)
    return new this(data?.id, <any>data?.documents)
  }

  /**
   * Initialize the instance, should be called immediately after
   * creating the object
   *
   * @public
   * @memberof Collection
   */
  public init(): this {
    this.preInit && this.preInit()
    this.initDocuments()
    this.onInit && this.onInit()
    return this
  }

  protected initDocuments() {
    console.debug('initDocuments', this.id, this.documents)
    // Ensure if items are an object we ensure they are a document instance
    if (!(this.documents instanceof Normalized)) {
      this.setDocuments(new Normalized(this.documents))
    }
    if (this.documents instanceof Normalized) {
      this.documents.toArray().forEach(doc => {
        if (!(doc instanceof Document)) {
          this.setDocument(
            doc.id, this.createDocument(doc).init()
          )
        }
      })
    }
  }

  public createDocument(data?): D {
    const { id, fields, subcollections } = data
    return new this.documentModel(id, fields, subcollections)
  }

  public setDocument(id: ID, value: D, index?: number): this {
    Normalized.set([id, value], this.documents, index)
    return this
  }

  public getDocument(id: ID): D | null {
    return Normalized.get(id, this.documents)
  }

  public removeDocument(id: ID): this {
    Normalized.remove(id, this.documents)
    return this
  }

  public getAllDocuments(): D[] {
    return Normalized.toArray(this.documents)
  }

  public setDocuments(documents: NormalizedData<D>): this {
    this.set('documents', documents instanceof Normalized
      ? documents : new Normalized(documents)
    )
    return this
  }


}