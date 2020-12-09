import { Data } from '../const'

/** The index signature of any object */
export type ID = string

/** The index signature of object and arrays */
export type Index = string | number

/** Allows conditional typing type alias */
export type Conditional<T, U, X, Y> = T extends U ? X : Y

/** Plain old object of key(K)-value(T) pairs */
export type Dictionary<T = any> = Record<ID, T> // AKA { [P in Key]: T }

/** The index signature type within the dictionary */
export type SignatureTypeOf<T extends Dictionary> = keyof T

/** The index type within the dictionary */
export type IndexOf<T extends Dictionary, K extends keyof T = any> = T[K]

/** A boxed `value` property */
export type BoxedValue<T> = { value: T }

/** Describe the long/lat of coordinates */
export type GeoPoint = { longitude: number, latitude: number }

/** The Type literal equivalent for named constants in FieldKind */
/** A document-oriented database *document value type* i.e. {[P in Key]: <Field>value} */
export type FieldType<Kind extends Data = any> =
  Kind extends Data.ARRAY ? any[]
  : Kind extends Data.BOOLEAN ? boolean
  : Kind extends Data.BYTES ? Number
  : Kind extends Data.DATETIME ? number
  : Kind extends Data.FLOAT ? number
  : Kind extends Data.GEOPOINT ? GeoPoint
  : Kind extends Data.INTEGER ? number
  : Kind extends Data.MAP ? object
  : Kind extends Data.NULL ? null
  : Kind extends Data.REFERENCE ? string
  : Kind extends Data.TEXT ? string
  : never