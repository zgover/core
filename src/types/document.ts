import { ID, Dictionary } from './data'
import { CrudModel } from './crud'

/** A document-oriented db document type */
export type DocumentType<T extends Dictionary = any> = { [P in keyof T]: T[P] }

/**
 * Instance outline base for all documents in the DB
 *
 * @export
 * @interface DocumentModel
 * @extends {CrudModel}
 * @template T
 */
export interface DocumentModel extends CrudModel {

  id: string | undefined

  preInit?(): void
  init(...args: any[]): this
  onInit?(): void

  has(id: ID): boolean
  get(id: ID): any
  set(id: ID, item: any): this
  del(id: ID): this

  toJSON(): object

}