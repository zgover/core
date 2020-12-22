import { PKey, Ref, Schema } from '../interfaces/dod'

import { BaseRefController } from './BaseRefController'


export class DatabaseRefController<S extends Schema.CollectionsMeta> extends BaseRefController<Ref.Database<S>> {

  constructor(id: PKey, schema: S, collections?: Ref.DatabaseCollections<S>) {
    super({ id, schema, collections })
  }

  public static from<S extends Schema.CollectionsMeta>(model: Ref.Database<S>) {
    return new this(model?.id, model?.schema, model?.collections)
  }

  /**
   * Initialize the instance, should be called immediately after
   * creating the object
   *
   * @public
   * @memberof CollectionRefController
   */
  public init(): this {
    this.preInit && this.preInit()
    this.initDocuments()
    this.onInit && this.onInit()
    return this
  }

  protected initDocuments() {
    console.debug('initDocuments', this.getId(), this.getSchema(), this.getCollections())
    // Ensure if items are an object we ensure they are a document instance
    // if (!(this.documents instanceof Normalized)) {
    //   this.setDocuments(new Normalized(this.documents))
    // }
    // if (this.documents instanceof Normalized) {
    //   this.documents.toArray().forEach(doc => {
    //     if (!(doc instanceof DocumentRefController)) {
    //       this.setDocument(
    //         doc.id, this.createDocument(doc).init()
    //       )
    //     }
    //   })
    // }
  }

  public getCollections(): Ref.DatabaseCollections<S> {
    return this.get('collections')
  }

  public setDocuments(value: Ref.DatabaseCollections<S>): this {
    return this.set('collections', value)
  }

}