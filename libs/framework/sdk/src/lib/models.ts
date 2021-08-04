/**
 * @license
 * Copyright 2021 Aglyn LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  AglynApp,
  AglynAppModule,
  AglynAppOptions,
  AglynCommand,
  AglynCommandController,
  AglynCommander,
  AglynEmitter,
  AglynExtension,
  AglynExtensionController,
  AglynExtensionMap,
  AglynLogger,
} from './types'
import { Timestamp } from '@aglyn/shared/feature/timestamp'
import { EqualityIs, Mitt } from '@aglyn/shared/util/helpers'
import { Mutable } from '@aglyn/shared/util/types'
import { AglynAppEventFlag } from '@aglyn/framework/sdk'
import { logger } from './logger'
import { event } from './event'
import { AglynModuleTriggerFlag, LoadStatusFlag } from './constants'


export function AglynAppImpl(
  appOptions: AglynAppOptions,
  eventEmitter: AglynEmitter,
  logHelper: AglynLogger,
): AglynApp {

  const TAG = 'AglynApp'
  const options = {...appOptions}
  const {name} = options
  const created = Timestamp.now()

  const app: AglynApp = {

    get event() {
      return eventEmitter
    },

    get logger() {
      return logHelper
    },

    getCreatedAt() {
      return created
    },

    getName() {
      return name
    },

    getOptions() {
      return options
    },

    getExtensions(): AglynExtension[] {
      return extensionController.getExtensions()
    },

    getExtension(id: string): AglynExtension {
      return extensionController.getExtension(id)
    },

    register(type: AglynModuleTriggerFlag, data: any): void {
      eventEmitter.emit(type, data)
    },

    unregister(type: AglynModuleTriggerFlag, data: any): void {
      eventEmitter.emit(type, data)
    },

    unloadApp(): void {
      extensionController.unloadExtensions()
      commandController.unload()
      extensionController.unload()
      logger.debug(AglynAppEventFlag.APP_UNLOADED, {appName: name})
      event.emit(AglynAppEventFlag.APP_UNLOADED, {appName: name})
    },

    get [Symbol.toStringTag as any]() {
      return `${TAG}`
    },

    toString() {
      return `${TAG}(name: '${name}')`
    },

    toJSON() {
      return {
        created: this._created,
        name: this._name,
        options: this._options,
      }
    },
  }

  const extensionController = AglynAppExtensionControllerImpl(app)
  AglynAppImpl.extensionController.set(name, extensionController)
  extensionController.load()

  const commandController: AglynCommandController = AglynCommandControllerImpl(app)
  AglynAppImpl.commandController.set(name, commandController)
  commandController.load()

  return app
}

export namespace AglynAppImpl {

  export const extensionController: Map<string, AglynExtensionController> = new Map()
  export const commandController: Map<string, AglynCommandController> = new Map()

}

export function AglynAppExtensionControllerImpl(
  aglynApp: AglynApp,
): AglynExtensionController {

  const TAG = 'AglynExtensionController'
  const app = aglynApp
  const event = app.event
  const logger = app.logger
  const extensions: AglynExtensionMap = new Map()

  const extensionController: AglynExtensionController = {

    getExtension(id: string): AglynExtension {
      return extensions.get(id)
    },

    getExtensions(): AglynExtension[] {
      return [...extensions.values()]
    },

    registerExtension(data: AglynAppModule<AglynExtension>): void {
      const extension = data as Mutable<AglynExtension>
      extensions.set(extension.$id, extension)
      extension.status = LoadStatusFlag.REGISTERED
      logger.debug(AglynAppEventFlag.REGISTERED_EXTENSION, {extension})
      event.emit(AglynAppEventFlag.REGISTERED_EXTENSION, {extension})
    },

    unregisterExtension(data: AglynAppModule) {
      const extension = extensions.get(data?.$id) as Mutable<AglynExtension>
      if (extension) {
        const isLoaded = EqualityIs.sameType(
          extension.status,
          LoadStatusFlag.REGISTERED,
          LoadStatusFlag.LOADING,
          LoadStatusFlag.LOADED,
        )
        if (isLoaded) {
          extensionController.unloadExtension(data?.$id)
        }
        extensions.delete(data?.$id)
        extension.status = LoadStatusFlag.UNREGISTERED
        logger.debug(AglynAppEventFlag.UNREGISTERED_EXTENSION, {extension})
        event.emit(AglynAppEventFlag.UNREGISTERED_EXTENSION, {extension})
      }
    },

    loadExtension(data: { $id: string }): void {
      const {$id} = data
      const extension = extensions.get($id) as Mutable<AglynExtension>
      if (extension) {
        extension.status = LoadStatusFlag.LOADING
        extension.onLoad?.(app)
        extension.status = LoadStatusFlag.LOADED
        logger.debug(AglynAppEventFlag.LOADED_EXTENSION, {extension})
        event.emit(AglynAppEventFlag.LOADED_EXTENSION, {extension})
      }
    },

    unloadExtension(data: { $id: string }): void {
      const {$id} = data
      const extension = extensions.get($id) as Mutable<AglynExtension>
      if (extension) {
        extension.onUnload?.(app)
        extension.status = LoadStatusFlag.UNLOADED
        logger.debug(AglynAppEventFlag.UNLOADED_EXTENSION, {extension})
        event.emit(AglynAppEventFlag.UNLOADED_EXTENSION, {extension})
      }
    },

    unloadExtensions(): void {
      extensions.forEach((_, $id) => {
        extensionController.unloadExtension({$id})
      })
    },

    get [Symbol.toStringTag as any]() {
      return `${TAG}`
    },

    toString() {
      return `${TAG}(appName: '${app.getName()}')`
    },

    toJSON() {
      return {
        extensions: extensions,
      }
    },

    /** @private */
    load() {
      event.on(AglynModuleTriggerFlag.REGISTER_EXTENSION, registerExtension)
      event.on(AglynModuleTriggerFlag.UNREGISTER_EXTENSION, unregisterExtension)
      event.on(AglynModuleTriggerFlag.LOAD_EXTENSION, loadExtension)
      event.on(AglynModuleTriggerFlag.UNLOAD_EXTENSION, unloadExtension)
    },

    /** @private */
    unload() {
      event.off(AglynModuleTriggerFlag.REGISTER_EXTENSION, registerExtension)
      event.off(AglynModuleTriggerFlag.UNREGISTER_EXTENSION, unregisterExtension)
      event.off(AglynModuleTriggerFlag.LOAD_EXTENSION, loadExtension)
      event.off(AglynModuleTriggerFlag.UNLOAD_EXTENSION, unloadExtension)
    },
  }

  const registerExtension = (data) => {
    const {extension} = data
    extensionController.registerExtension(extension)
  }
  const unregisterExtension = (data) => {
    const {extensionId} = data
    extensionController.unregisterExtension({$id: extensionId})
  }
  const loadExtension = (data) => {
    const {extensionId} = data
    extensionController.loadExtension({$id: extensionId})
  }
  const unloadExtension = (data) => {
    const {extensionId} = data
    extensionController.unloadExtension({$id: extensionId})
  }

  return extensionController
}

export function AglynCommandControllerImpl(
  aglynApp: AglynApp,
): AglynCommandController {

  const TAG = 'AglynCommandController'
  const app = aglynApp
  const event = app.event
  const logger = app.logger
  const commander: AglynCommander = Mitt()

  const commandController: AglynCommandController = {

    registerCommand(data: AglynAppModule<AglynCommand>): void {
      const {$id, callbackFn} = data
      commander.on($id, callbackFn)
      logger.debug(AglynAppEventFlag.REGISTERED_COMMAND, {commandId: $id})
      event.emit(AglynAppEventFlag.REGISTERED_COMMAND, {commandId: $id})
    },

    unregisterCommand(data: AglynAppModule<AglynCommand>): void {
      const {$id, callbackFn} = data
      commander.off($id, callbackFn)
      logger.debug(AglynAppEventFlag.UNREGISTERED_COMMAND, {commandId: $id})
      event.emit(AglynAppEventFlag.UNREGISTERED_COMMAND, {commandId: $id})
    },

    triggerCommand(data: { $id: string }): void {
      const {$id} = data
      commander.emit($id, {app})
      logger.debug(AglynAppEventFlag.TRIGGERED_COMMAND, {commandId: $id})
      event.emit(AglynAppEventFlag.TRIGGERED_COMMAND, {commandId: $id})
    },

    get [Symbol.toStringTag as any]() {
      return `${TAG}`
    },

    toString() {
      return `${TAG}(app: '${app.getName()}')`
    },

    toJSON() {
      return {
        commands: [...commander.all.values()],
      }
    },

    /** @private */
    load() {
      event.on(AglynModuleTriggerFlag.REGISTER_COMMAND, registerCommand)
      event.on(AglynModuleTriggerFlag.UNREGISTER_COMMAND, unregisterCommand)
      event.on(AglynModuleTriggerFlag.TRIGGER_COMMAND, triggerCommand)
    },

    /** @private */
    unload() {
      event.off(AglynModuleTriggerFlag.REGISTER_COMMAND, registerCommand)
      event.off(AglynModuleTriggerFlag.UNREGISTER_COMMAND, unregisterCommand)
      event.off(AglynModuleTriggerFlag.TRIGGER_COMMAND, triggerCommand)
    },
  }

  const registerCommand = (data) => {
    const {commandId, callbackFn} = data
    commandController.registerCommand({$id: commandId, callbackFn})
  }
  const unregisterCommand = (data) => {
    const {commandId, callbackFn} = data
    commandController.unregisterCommand({$id: commandId, callbackFn})
  }
  const triggerCommand = (data) => {
    const {commandId} = data
    commandController.triggerCommand({$id: commandId})
  }

  return commandController
}
