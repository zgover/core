import { numeronym } from './utils'


/**
 * The classification to describe the Document model instance
 */
export enum Classification {
  FIELD = 'f3d',
  DOCUMENT = 'd6t',
  COLLECTION = 'c8n',
  SUB_COLLECTION = 's12n',
  VALUE = 'v3e',
}

/**
 * Used for local reference to specify/determine remote data type in storage
 * All values stored are critically dependent on the values of the enum named constants
 */
export type DataTypeConfig = {
  id?: string
  name: string
}
export function buildDataType(cnf: DataTypeConfig) {
  const id = numeronym(cnf.name.toLowerCase())
  return { ...cnf, id }
}

/**
 * Data kind
 *
 * @export
 * @enum {string}
 */
export enum DK {
  COLLECTION = 'c8n',
  DOCUMENT = 'd6t',

  ARRAY = 'a3y',
  BOOLEAN = 'b5n',
  BLOB = 'b3s',
  DATETIME = 'd6e',
  DICTIONARY = 'd8y',
  FLOAT = 'f3t',
  GEOPOINT = 'g6t',
  INTEGER = 'i5r',
  NULL = 'n2l',
  RELATION = 'r6n',
  TEXT = 't2t',
}

// export const DKMeta = mapObject(DK, (value, key) => {
//   const nym =

// })

// const a = mapObject(DK, (v, k, i, arr) => {
//   console.log('Zach last prt differ on enumerate', 'i', i, JSON.stringify(arr))
//   return v + 'aa'
// })

export const dataTypes = {
  ARRAY: buildDataType({ name: 'Array' }),
  BOOLEAN: buildDataType({ name: 'Boolean' }),
  BYTES: buildDataType({ name: 'Bytes' }),
  DATETIME: buildDataType({ name: 'DateTime' }),
  FLOAT: buildDataType({ name: 'Float' }),
  GEOPOINT: buildDataType({ name: 'GeoPoint' }),
  INTEGER: buildDataType({ name: 'Integer' }),
  MAP: buildDataType({ name: 'Map' }),
  NULL: buildDataType({ name: 'Null' }),
  RELATION: buildDataType({ name: 'Relation' }),
  TEXT: buildDataType({ name: 'Text' }),
}

export const DataFlags = [
  DK.ARRAY,
  DK.BOOLEAN,
  DK.BLOB,
  DK.DATETIME,
  DK.FLOAT,
  DK.GEOPOINT,
  DK.INTEGER,
  DK.DICTIONARY,
  DK.NULL,
  DK.RELATION,
  DK.TEXT,
]

/** Dynamic data kind allowing nesting */
export type NestableDataKind = DK.ARRAY | DK.DICTIONARY
/** Static data kinds (i.e. string, number, boolean, null) */
export type StaticDataKind =
  DK.BOOLEAN
  | DK.BLOB
  | DK.DATETIME
  | DK.FLOAT
  | DK.GEOPOINT
  | DK.INTEGER
  | DK.NULL
  | DK.RELATION
  | DK.TEXT

/**
 * Evaluation kinds
 */
export enum Eval {
  Required = 'r6d',
  Regex = 'r3x',
}

/**
 * Property name index signatures
 */
export const Sig = {
  Collection: 'collection',
  Document: 'document',
  Field: 'field',
  SubField: 'subfield',

  Model: 'model',
  Blueprint: 'blueprint',

  Id: 'id',
  Name: 'name',
  Kind: 'kind',
  Value: 'value',

  Created: 'created',
  Updated: 'updated',
  Deleted: 'deleted',

}

/**
 * Friendly-text/display-names of local names or
 *
 * TODO: i18n
 */
export const lbl = {

  /** System class types */
  [DK.DOCUMENT]: 'Document',
  [DK.COLLECTION]: 'Collection',
  /** Data Types */
  [DK.ARRAY]: 'Array',
  [DK.BOOLEAN]: 'Boolean',
  [DK.BLOB]: 'Bytes',
  [DK.DATETIME]: 'Date Time',
  [DK.FLOAT]: 'Float',
  [DK.GEOPOINT]: 'Geographical Point',
  [DK.INTEGER]: 'Integer',
  [DK.DICTIONARY]: 'Map',
  [DK.NULL]: 'Null',
  [DK.RELATION]: 'Relation',
  [DK.TEXT]: 'Text',

  /** Entity type fields */
  [Sig.Collection]: 'Collection',
  [Sig.Document]: 'Documents',
  [Sig.Field]: 'Fields',
  [Sig.SubField]: 'Subfields',

  /** Instance fields */
  [Sig.Blueprint]: 'Blueprint',
  [Sig.Model]: 'Model',

  /** Meta fields */
  [Sig.Id]: 'Unique ID',
  [Sig.Name]: 'Display Name',
  [Sig.Kind]: 'Kind',
  [Sig.Value]: 'Value',

  /** Timestamp fields */
  [Sig.Created]: 'Created Date',
  [Sig.Updated]: 'Updated Date',
  [Sig.Deleted]: 'Deleted Date',
}