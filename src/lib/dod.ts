/**
 * (D)Document-(o)oriented (d)database (Dob)
 *
 * A document-oriented database, or Dob, or document
 * store, is a data storage structure designed for
 * storing, retrieving and managing document-oriented
 * information, also known as semi-structured data.
 *
 * Each document contains a set of key-value pairs.
 * All documents must be stored in collections.
 * Documents can contain subcollections and nested
 * objects, both of which can include primitive fields
 * like strings or complex objects like lists.
 *
 * @export
 * @namespace Dod
 */
export namespace Dod {

  export type ID = string

  /** Field Type */
  export type Bool = boolean
  export type DateTime = number
  export type Float = number
  export type GeoPoint = Record<'longitude' | 'latitude', number>
  export type Integer = number
  export type Text = string
  export type Null = null
  export type Map = Record<string, any>
  export type Array = NotArray[]
  export type NotArray = Text | Bool | Integer | Float | DateTime | GeoPoint | Null | Map
  export type Field = Array | NotArray

  /** Entity Types */
  export type Entity = { id: ID }
  export type Fields = Record<ID, Field>
  export type Documents = Record<ID, Document>
  export type Subcollections = Record<ID, Collection>
  export type Collections = Record<ID, Collection>
  export type Document = Entity & {
    subcollections: Subcollections
    fields: Fields
  }
  export type Collection = Entity & {
    documents: Documents
  }

}