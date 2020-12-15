import { AppControllerConfig, Blueprint, Field } from './lib/app-controller'
import { DK, lbl, Sig } from './lib/config'
import { sortBy } from './lib/utils'

/**
 * Blueprint field
 */
const fields: Field[] = sortBy([
  {
    id: Sig.Id,
    kind: DK.TEXT,
    readonly: true,
    name: lbl[Sig.Id],
  }, {
    id: Sig.Name,
    kind: DK.TEXT,
    readonly: true,
    name: lbl[Sig.Name],
  }, {
    id: Sig.Kind,
    kind: DK.TEXT,
    readonly: true,
    name: lbl[Sig.Kind],
  }, {
    id: Sig.Created,
    kind: DK.DATETIME,
    readonly: true,
    name: lbl[Sig.Created],
  }, {
    id: Sig.Updated,
    kind: DK.DATETIME,
    readonly: true,
    name: lbl[Sig.Updated],
  }, {
    id: Sig.Deleted,
    kind: DK.DATETIME,
    readonly: true,
    name: lbl[Sig.Deleted],
  },
], 'name', 'id')

/**
 * System Blueprint Model
 */
const blueprintModel: Blueprint = {
  id: [Sig.Blueprint, Sig.Model].join('_'),
  kind: DK.DOCUMENT,
  readonly: true,
  name: 'Blueprint Model (system)',
  fields: fields,
}

/**
 * The default application configuration object, can be
 * merged with a custom config to set overrides
 */
export const defaultAppConfig: AppControllerConfig = {

  blueprints: {
    id: 'blueprints',
    kind: DK.COLLECTION,
    name: 'Document Blueprints',
    model: blueprintModel,
    documents: [
      { ...blueprintModel, entries: [] }
    ],
  },

}