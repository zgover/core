/**
 * Data kind
 *
 * @export
 * @enum {string}
 */
export enum DK {
  FIELD = 'f2ld',
  SUBFIELD = 's5ld',
  DOCUMENT = 'd5nt',
  COLLECTION = 'c7on',
  SUBCOLLECTION = 'sAon',

  BLUEPRINT = 'b6nt',
  ENTRY = 'e2ry',

  ARRAY = 'a2ay',
  BOOLEAN = 'b4an',
  BLOB = 'b1ob',
  DATETIME = 'd5me',
  DICTIONARY = 'd7ry',
  FLOAT = 'f2at',
  GEOPOINT = 'g5nt',
  INTEGER = 'i4er',
  NULL = 'n2ll',
  TEXT = 't1xt',

  RELATION = 'r5on',
}

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

  Fields: 'fields',
  Subfields: 'subfields',
  Documents: 'documents',
  Collections: 'collections',
  Subcollections: 'subcollections',

  Model: 'model',
  Blueprint: 'blueprint',
  Entries: 'entries',

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
  [DK.FIELD]: 'Field',
  [DK.SUBFIELD]: 'Subfield',
  [DK.DOCUMENT]: 'Document',
  [DK.COLLECTION]: 'Collection',
  [DK.SUBCOLLECTION]: 'Subcollection',

  [DK.BLUEPRINT]: 'Blueprint',
  [DK.ENTRY]: 'Entry',

  /** Field Data Types */
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
  [Sig.Fields]: 'Fields',
  [Sig.Subfields]: 'Subfields',
  [Sig.Documents]: 'Documents',
  [Sig.Collections]: 'Collections',
  [Sig.Subcollections]: 'Subcollections',

  /** Instance fields */
  [Sig.Blueprint]: 'Blueprint',
  [Sig.Model]: 'Model',
  [Sig.Entries]: 'Entries',

  /** Meta fields */
  [Sig.Id]: 'Unique ID',
  [Sig.Name]: 'Display Name',
  [Sig.Kind]: 'Kind',
  [Sig.Value]: 'Value',

  /** Timestamp fields */
  [Sig.Created]: 'Created At',
  [Sig.Updated]: 'Updated At',
  [Sig.Deleted]: 'Deleted At',

}