import { DocumentModel } from './document'

/**
 * Instance outline for modeling a collection of documents of a
 * specific type (aka the model)
 *
 * @export
 * @interface CollectionModel
 * @extends {DocumentModel}
 * @extends {IterableIterator<T>}
 * @template T
 */
export interface CollectionModel<T> extends DocumentModel, IterableIterator<T> {
  modeler: new (...args: any[]) => T
  items: T[]

  length: number
  [Symbol.iterator](): IterableIterator<T>
  next(): IteratorResult<T>
}