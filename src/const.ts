import { numeronym } from './utils'

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
  REFERENCE: buildDataType({ name: 'Reference' }),
  TEXT: buildDataType({ name: 'Text' }),
}


export enum Data {
  ARRAY = 'a3y',
  BOOLEAN = 'b5n',
  BYTES = 'b3s',
  DATETIME = 'd6e',
  FLOAT = 'f3t',
  GEOPOINT = 'g6t',
  INTEGER = 'i5r',
  MAP = 'm1p',
  NULL = 'n2l',
  REFERENCE = 'r7e',
  TEXT = 't2t',
}


/** Dynamic data kind allowing nesting */
export type NestableDataKind = Data.ARRAY | Data.MAP
/** Static data kinds (i.e. string, number, boolean, null) */
export type StaticDataKind =
  Data.BOOLEAN
  | Data.BYTES
  | Data.DATETIME
  | Data.FLOAT
  | Data.GEOPOINT
  | Data.INTEGER
  | Data.NULL
  | Data.REFERENCE
  | Data.TEXT


export const DataFlags = [
  Data.ARRAY, Data.BOOLEAN, Data.BYTES, Data.DATETIME, Data.FLOAT, Data.GEOPOINT,
  Data.INTEGER,
  Data.MAP,
  Data.NULL,
  Data.REFERENCE,
  Data.TEXT,
]


export enum Entity {
  INSTANCE = 'i6e',
  MODEL = 'm3l',
}


export enum Orientation {
  FIELD = 'f3d',
  DOCUMENT = 'd6t',
  COLLECTION = 'c8n',
}


export enum Sig {
  ID = 'id',
  NAME = 'name',
  KIND = 'kind',
  CREATED = 'created',
  UPDATED = 'updated',
  DELETED = 'deleted',
  VALUE = 'value',
  MODEL = 'model',
  MODELER = 'modeler',
  MODELS = 'models',
  ITEMS = 'items',
  CID = 'cid',
  COLLECTIONS = 'collections',
  DOCUMENTS = 'documents',
  FIELDS = 'fields',
  SUBFIELDS = 'subfields',
}



/**
 * Text value of local names or display names
 */
export namespace n {

  /** Friendly text values */
  export const displayName = { // TODO: i18N

    /** Properties */
    [Sig.ID]: 'Unique ID',
    [Sig.NAME]: 'Display Name',
    [Sig.KIND]: 'Kind',
    [Sig.MODEL]: 'Model',
    [Sig.VALUE]: 'Value',
    [Sig.CREATED]: 'Created Date',
    [Sig.UPDATED]: 'Updated Date',
    [Sig.DELETED]: 'Deleted Date',
    [Sig.COLLECTIONS]: 'Collections',
    [Sig.DOCUMENTS]: 'Documents',
    [Sig.FIELDS]: 'Fields',
    [Sig.SUBFIELDS]: 'Subfields',


    /** Data Types */
    [Data.ARRAY]: 'Array',
    [Data.BOOLEAN]: 'Boolean',
    [Data.BYTES]: 'Bytes',
    [Data.DATETIME]: 'Date Time',
    [Data.FLOAT]: 'Float',
    [Data.GEOPOINT]: 'Geographical Point',
    [Data.INTEGER]: 'Integer',
    [Data.MAP]: 'Map',
    [Data.NULL]: 'Null',
    [Data.REFERENCE]: 'Reference',
    [Data.TEXT]: 'Text',
  }

}


/**
 * Generate a random ID string
 *
 * Math.random should be unique because of its seeding algorithm.
 * Convert it to base 36 (numbers + letters) and grab the first 9 characters
 * after the decimal.
 *
 * @param config {RandomIdConfig}
 *
 * @return {string}
 */
export function randomId(opt?: RandomIdConfig): string {
  const { prefix, radix, minLength, maxLength } = opt ?? {}
  const id = Math.random()
    .toString(radix ?? 36)
    .substr(minLength ?? 2, maxLength ?? 9)
  return String().concat(prefix ?? '', id)
}
type RandomIdConfig = {
  prefix?: any
  minLength?: number
  radix?: number
  maxLength?: number
}