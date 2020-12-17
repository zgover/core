import { defaultAppConfig } from '../app-defaults'

import { DK, } from './config'
import { Document, DocumentModel } from './document'
import { Field } from './field'
import { Dictionary, FieldType, ID } from './types'
import { copyJson } from './utils'

interface ModelBase extends Dictionary {
  id?: ID
  name?: string
  kind?: DK
}
export interface FieldT extends ModelBase {
  subfields?: Field[]

  // TODO: evaluation rules
  // eval?: Eval | Eval[] | { [field: string]: Eval | Eval[] }
}
export interface Blueprint extends ModelBase {
  kind: DK.DOCUMENT | DK.COLLECTION
  fields?: FieldT[]

  // TODO: rules for the fields
  // rules?: any[]
}
export interface BlueprintCollection<Model extends Blueprint = Blueprint> extends ModelBase {
  kind: DK.COLLECTION
  model: Model
  documents: (Model & {
    entries: Record<
      Model['fields'][any]['id'],
      FieldType<Model['fields'][any]['kind']>
    >[]
  })[]

  // TODO: Workflow operations/functions
  // operations?: any[]
}


/**
 * Describes the initial configuration for the application controller
 */
export interface AppControllerConfig {
  structure: DocumentModel//Blueprint
}

/**
 * All top level support
 *
 * @export
 * @class AppController
 */
export class AppController {

  /**
   * Singleton class instance
   *
   * @private
   * @static
   * @type {AppController}
   * @memberof AppController
   */
  private static _instance: AppController

  /**
   * Application configuration
   *
   * @private
   * @type {AppControllerConfig}
   * @memberof AppController
   */
  private readonly _config: AppControllerConfig

  /**
   * Create a new singleton instance only if it's undefined
   *
   * @private
   * @static
   * @throws
   * @param {AppControllerConfig} [config]
   * @returns {AppController}
   * @memberof AppController
   */
  private static _createInstance(config?: AppControllerConfig): AppController {
    return this._instance ??= new this(config)
  }

  /**
   * Initialize the app controller for the first time
   *
   * @static
   * @param {AppControllerConfig} [config]
   * @returns {AppController}
   * @memberof AppController
   */
  static initialize(config?: AppControllerConfig): AppController {
    return this._instance ?? this._createInstance(config)
  }

  /**
   * Get the current living singleton instance (must already be initialized!)
   *
   * @static
   * @throws
   * @returns {AppController}
   * @memberof AppController
   */
  static getInstance(): AppController {
    if (!this._instance) { throw new Error('App controller has not been initialized!') }
    return this._instance
  }

  /**
   * Living data
   *
   * @private
   * @type {CollectionModel}
   * @memberof AppController
   */
  private _app: DocumentModel


  private constructor(config?: AppControllerConfig) {
    this._config = { ...copyJson(defaultAppConfig), ...copyJson(config ?? {}) }
    this._app = new Document(copyJson(this._config.structure)).init()
    console.log('appp', this._app)
  }

  getConfig() {
    return this._config
  }

  getCollectionById(id: ID): DocumentModel | undefined
  getCollectionById(...ids: ID[]): DocumentModel[]
  getCollectionById(id: ID, ...ids: ID[]): DocumentModel | DocumentModel[] | undefined {
    return this._app.getSubcollectionById(id, ...ids)
  }

  addCollection(v: DocumentModel): this {
    this._app.addSubcollection(v)
    return this
  }

  removeCollection(id: ID): this
  removeCollection(item: DocumentModel): this
  removeCollection(item: ID | DocumentModel): this {
    this._app.removeSubcollection(item)
    return this
  }

  getAllCollections(): DocumentModel {
    return this._app
  }

}

console.log('app controller', AppController)