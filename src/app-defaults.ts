import { AppControllerConfig } from './lib/app-controller'
import { Collection } from './lib/collection'
import { DK, lbl, Sig } from './lib/config'
import { Document } from './lib/document'
import { Dod } from './lib/dod'
import { Field } from './lib/field'
import { Normalized } from './lib/normalized'
import { createUid } from './lib/uid'
import { copyJson, s } from './lib/utils'

/**
 * Blueprint field model document
 */
export const fieldModelId = [s(Sig.Field), s(Sig.Model)].join('_')
export const blueprintModelId = [s(Sig.Blueprint), s(Sig.Model)].join('_')
export const fieldModel: Document = new Document(
  s(fieldModelId),
  Normalized.from(
    new Field(s(Sig.Name), DK.TEXT).init(),
    new Field(s(Sig.Kind), DK.TEXT).init(),
    new Field(s(Sig.Created), DK.DATETIME).init(),
    new Field(s(Sig.Updated), DK.DATETIME).init(),
    new Field(s(Sig.Deleted), DK.DATETIME).init(),
  )
).init()

/**
 * Blueprint model document
 */
export const blueprintModel: Document = new Document(
  s(blueprintModelId),
  Normalized.from(
    new Field(s(Sig.Name), DK.TEXT).init(),
    new Field(s(Sig.Kind), DK.TEXT, DK.BLUEPRINT).init(),
    new Field(
      s(fieldModelId),
      DK.DOCUMENT,
      fieldModel
    ).init(),
    new Field(s(Sig.Created), DK.DATETIME).init(),
    new Field(s(Sig.Updated), DK.DATETIME).init(),
    new Field(s(Sig.Deleted), DK.DATETIME).init(),
  ),
  Normalized.from(
    new Collection(s(Sig.Fields)).init(),
    new Collection(s(Sig.Entries)).init()
  )
).init()

export const createNewBlueprintDocument = (
  name: string,
  kind: string,
): Document => {
  const copy = copyJson(blueprintModel)
  const blueprint = new Document(
    createUid(),
    copy.fields,
    copy.subcollections
  ).init()
  console.log('blueprint document', blueprint, blueprint.getField(Sig.Name))
  blueprint.getField(Sig.Name).setValue(name)
  blueprint.getField(Sig.Kind).setValue(kind)
  blueprint.getField(Sig.Created).setValue(Date.now())
  return blueprint
}

export const createNewBlueprintFieldDocument = (blueprint: Document) => {
  const modelField = blueprint.getField(fieldModelId)
  const copied = copyJson(modelField.getValue() as Dod.Ref.DocumentRef)
  const modelFieldVal = Document.from(copied).init()

  return new Document(
    createUid(),
    modelFieldVal.fields,
    modelFieldVal.subcollections
  ).init()
}

export const createNewBlueprintEntryDocument = (blueprint: Document) => {
  console.log('before fieldsCollection', blueprint)
  const fieldsCollection = Collection.from(
    copyJson(
      <Dod.Ref.CollectionRef>blueprint.getSubcollection(Sig.Fields)
    )
  ).init()
  console.log('after fieldsCollection', fieldsCollection)
  const entryFields = new Normalized()
  const entrySubcollections = new Normalized()

  fieldsCollection.getAllDocuments().forEach(document => {
    const _document = Document.from(document).init()
    entryFields.set(
      s(_document.id),
      new Field(
        s(_document.id),
        _document.getField(Sig.Kind).getValue() as string,
        _document.getField(Sig.Value).getValue(),
      )
    )
    _document.getAllSubcollections().forEach(collection => {
      const _collection = Collection.from(collection).init()
      entrySubcollections.set(
        s(_collection.id),
        _collection
      )
    })
  })

  return new Document(
    createUid(),
    entryFields,
    entrySubcollections
  ).init()
}

// const sampleBlueprint = createNewBlueprintEntryDocument(blueprintModel)
// sampleBlueprint.setField(Sig.Name, 'Blueprint (sample)')
// sampleBlueprint.setField(Sig.Kind, DK.BLUEPRINT)
const sampleBlueprint = createNewBlueprintDocument(
  'Blueprint (sample)', DK.BLUEPRINT
)

const sampleEntry = createNewBlueprintEntryDocument(sampleBlueprint)
sampleEntry.setField(s(Sig.Name), 'Blueprint entry (sample)')
sampleEntry.setField(s(Sig.Kind), DK.ENTRY)
sampleBlueprint
  .getSubcollection(Sig.Entries)
  .setDocument(sampleEntry.id, sampleEntry)

/**
 * Blueprints collection document
 */
const blueprints = new Document(
  'blueprints',
  Normalized.from(
    new Field('name', DK.TEXT, lbl[Sig.Blueprint]).init(),
    new Field('kind', DK.TEXT, DK.COLLECTION).init(),
    new Field(blueprintModelId, DK.DOCUMENT, blueprintModel).init(),
  ),
  Normalized.from(
    new Collection('blueprints').init()
  ),
).init()

blueprints
  .getSubcollection('blueprints')
  .setDocument(sampleBlueprint.id, sampleBlueprint)



console.log('sampleBlueprint', sampleBlueprint)
console.log('blueprintsblueprintsblueprints', blueprints)
console.log('blueprintsblue', blueprints.getSubcollection(Sig.Blueprints))
console.log('blueprintsblue333', blueprints.getSubcollection(Sig.Blueprints).getAllDocuments())

// /**
//  * App config data structure
//  */
// const structure = new Document(
//   'structure_collection',
//   Normalized.from(...[
//     new Field(Sig.Name, DK.TEXT, 'Data Structure'),
//     new Field(Sig.Kind, DK.TEXT, DK.COLLECTION)
//   ]),
//   Normalized.from(...[
//     new Collection(
//       Sig.Documents,
//       Normalized.from(blueprints)
//     ).init()
//   ])
// ).init()

/**
 * The default application configuration object, can be
 * merged with a custom config to set overrides
 */
export const defaultAppConfig: AppControllerConfig = {

  blueprints

}