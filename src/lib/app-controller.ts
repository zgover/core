import { blueprintModelId, createNewBlueprintEntryDocument, defaultAppConfig } from '../app-defaults'

import { CollectionModel } from './collection'
import { Document, DocumentModel } from './document'
import { ID } from './types'
import { copyJson } from './utils'


/**
 * Describes the initial configuration for the application controller
 */
export interface AppControllerConfig {
  blueprints: DocumentModel
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
   * Living collections data
   *
   * @private
   * @type {CollectionModel}
   * @memberof AppController
   */
  private _blueprints: DocumentModel


  private constructor(config?: AppControllerConfig) {
    this._config = {
      ...copyJson(defaultAppConfig),
      ...copyJson(config ?? {})
    }
    this._blueprints = Document.from(this._config.blueprints)
    this._blueprints.init()
    console.log('_blueprints', this._blueprints)
  }

  public getConfig() {
    return this._config
  }

  public createBlueprint(): DocumentModel {
    const model = this._blueprints.getField(blueprintModelId)
    return createNewBlueprintEntryDocument(model as any)
  }

  public getBlueprintsCollection(): CollectionModel {
    console.log("this._blueprints.getSubcollection('blueprints')", this._blueprints.getSubcollection('blueprints'))
    return this._blueprints.getSubcollection('blueprints')
  }

  public getBlueprint(id: ID): DocumentModel | null {
    return this.getBlueprintsCollection().getDocument(id)
  }

  public setBlueprint(id: ID, value: DocumentModel, index?: number): this {
    this.getBlueprintsCollection().setDocument(id, value, index)
    return this
  }

  public getAllBlueprints(): DocumentModel[] {
    console.log('getBlueprintsCollection()', this.getBlueprintsCollection())
    return this.getBlueprintsCollection().getAllDocuments()
  }

  public getBlueprints(): DocumentModel {
    return this._blueprints
  }

}

console.log('app controller', AppController)