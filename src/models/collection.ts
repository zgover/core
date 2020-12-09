import { CollectionModel } from '../types/collection'
import { Document } from './document'

/**
   * Provides logic for modeling collections of documents of a
   * specific type (aka the model)
   *
   * @export
   * @class Collection
   * @extends {Document}
   * @implements {CollectionModel<T>}
   * @template T
   */
export class Collection<T = any> extends Document implements CollectionModel<T> {

  protected __modeler__: new (...args: any[]) => T = Document as any

  get modeler() { return this.__modeler__ }
  set modeler(v: new (...args: any[]) => T) { this.__modeler__ = v }

  get items(): T[] { return this.get('items') }
  set items(v: T[]) { this.set('items', v) }

  private __index__: number = 0
  get length(): number { return (this.items ?? []).length }

  /** @inheritdoc */
  [Symbol.iterator](): IterableIterator<T> { return this }
  /** @inheritdoc */
  next(): IteratorResult<T> {
    if (this.__index__ < this.length) {
      return {
        done: false,
        value: this.items[this.__index__++]
      }
    } else {
      return {
        done: true,
        value: null
      }
    }
  }

  addItem(item: T): this {
    this.items.push(item)
    return this
  }

  delItem(item: T): this {
    const items = Array.from(this.items)
    this.items = items.filter(i => i != item)
    return this
  }
}