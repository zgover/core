import { ID, Dictionary } from './data'

/**
 * Local properties and methods required for CRUD logic
 * (create, read, update delete)
 *
 * @export
 * @interface CrudData
 * @template T
 */
export interface CrudModel<D extends Dictionary = any> {
  readonly data: D
  has(id: ID): boolean
  get(id: ID): any
  set(id: ID, item: any): this
  del(id: ID): this
  toJSON(): Dictionary
}