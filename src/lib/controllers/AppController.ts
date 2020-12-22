import { defaultAppConfig } from '../app-defaults'
import { PKey, Schema } from '../interfaces/dod'
import { Ref } from '../interfaces/dod'
import { copyJson } from '../tools/utils'

import { CollectionRefController } from './CollectionRefController'
import { DatabaseRefController } from './DatabaseRefController'
import { DocumentRefController } from './DocumentRefController'
import { FieldRefController } from './FieldRefController'

/**
 * Describes the initial configuration for the application controller
 */
export interface AppControllerConfig {
  databases: {
    [databaseId: string]: Ref.Database<Schema.CollectionsMeta>
  }
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
   * @type {any}
   * @memberof AppController
   */
  private _databases: {
    [databaseId: string]: Ref.Database<any>
  } = {}


  private constructor(config?: AppControllerConfig) {
    this._config = {
      ...copyJson(defaultAppConfig),
      ...copyJson(config ?? {})
    }
    this._databases = this._config.databases
    console.log('_blueprints', this._databases)
  }

  public getConfig() {
    return this._config
  }

  public getDatabase(dbId: PKey): DatabaseRefController<any> {
    return DatabaseRefController.from(this._databases[dbId])
  }

  public setDatabase(dbId: PKey, value: Ref.Database<any>): this {
    this._databases[dbId] = value
    return this
  }

  public getCollection(dbId: PKey, cId: PKey): CollectionRefController<any> {
    const collection = this._databases[dbId]?.collections[cId]
    return collection ? CollectionRefController.from(collection) : null
  }

  public getDocument(dbId: PKey, cId: PKey, dId: PKey): DocumentRefController<any> {
    const document = this._databases[dbId]?.collections[cId]?.documents[dId]
    return document ? DocumentRefController.from(document) : null
  }

  public getField(dbId: PKey, cId: PKey, dId: PKey, fId: PKey): FieldRefController<any> {
    const field = this._databases[dbId]?.collections[cId]?.documents[dId]?.fields[fId]
    return field ? FieldRefController.from(field) : null
  }

}

console.log('app controller', AppController)