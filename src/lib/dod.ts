import { NormalizedData } from './normalized'
import { Dictionary } from './types'

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
  export namespace FT {
    export type Array<T> = T[]
    export type Bool = boolean
    export type Bytes = Uint8Array | string
    export type DateTime = number
    export type Float = number
    export type GeoPoint = Record<'longitude' | 'latitude', number>
    export type Integer = number
    export type Map = Dictionary
    export type Null = null
    export type Text = string

    export type NotArray = Bool
      | Bytes
      | DateTime
      | Float
      | GeoPoint
      | Integer
      | Map
      | Null
      | Map
      | Text

    export type Any<T = any> = FT.NotArray | FT.Array<T>
  }

  /** Document Field */
  export type Field<T = any> = FT.Any<T>

  /** Document */
  export type Document = { [fieldId: string]: Field }

  /** Collection */
  export type Collection = { [documentId: string]: Document }

  /** Ref Models */
  export namespace Ref {

    export type Id = {
      id: ID
    }

    export type Kind = {
      kind: string | number
    }

    export type Value<T = Field> = {
      value?: T
    }

    export type Fields<F = FieldRef, T = NormalizedData<F>> = {
      fields: T
    }

    export type Documents<D = DocumentRef, T = NormalizedData<D>> = {
      documents: T
    }

    export type Subcollections<C = CollectionRef, T = NormalizedData<C>> = {
      subcollections?: T
    }

    export type FieldRef<T = Field> =
      Id & Kind & Value<T>

    export type DocumentRef<F = FieldRef, S = CollectionRef<any>> =
      Id & Fields<F> & Subcollections<S>

    export type CollectionRef<D = DocumentRef> =
      Id & Documents<D>

  }

}