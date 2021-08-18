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
  AglynAppOptions,
  AglynCommandController,
  AglynCommander,
  AglynEffectType,
  AglynEmitter,
  AglynExtension,
  AglynExtensionController,
  AglynExtensionMap,
  AglynLogger,
  AglynModuleTriggerParams,
} from './types'
import { Timestamp } from '@aglyn/shared/feature/timestamp'
import { EqualityIs, Mitt } from '@aglyn/shared/util/helpers'
import { LifecycleFlag, Mutable } from '@aglyn/shared/util/types'
import { AglynAppEventFlag } from '@aglyn/framework/sdk'
import { logger } from './logger'
import { event } from './event'
import { AglynModuleTriggerFlag, AglynSymbol, DEFAULT_ENTRY_NAME } from './constants'


export function AglynAppImpl(
  appOptions: AglynAppOptions,
  eventEmitter: AglynEmitter,
  logHelper: AglynLogger,
): AglynApp {

  const TAG = 'AglynApp'
  const options = {...appOptions}
  const {name = DEFAULT_ENTRY_NAME} = options
  const created = Timestamp.now()
  let deleted = null
  let commandController: AglynCommandController = null
  let extensionController: AglynExtensionController = null

  const app: AglynApp = {
    get event() {
      return eventEmitter
    },
    get logger() {
      return logHelper
    },
    get extensions() {
      return extensionController
    },
    get commands() {
      return commandController
    },
    set deleted(value: boolean) {
      deleted = Boolean(value)
    },
    get deleted(): boolean {
      return deleted
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
    effect(data: AglynEffectType<AglynModuleTriggerFlag>) {
      const {type, payload} = data
      eventEmitter.emit(type, payload as any)
    },
    get [AglynSymbol.TypeOf]() {
      return AglynSymbol.APP_TYPE
    },
    get [Symbol.toStringTag]() {
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
    load(): void {
      commandController.load()
      extensionController.load()
      logger.debug(AglynAppEventFlag.APP_LOADED, {appName: name})
      event.emit(AglynAppEventFlag.APP_LOADED, {appName: name})
    },
    unload(): void {
      extensionController.unloadExtensions()
      commandController.unload()
      extensionController.unload()
      logger.debug(AglynAppEventFlag.APP_UNLOADED, {appName: name})
      event.emit(AglynAppEventFlag.APP_UNLOADED, {appName: name})
    },
  }

  AglynAppImpl.commandController.set(
    name, commandController = AglynCommandControllerImpl({app}),
  )
  AglynAppImpl.extensionController.set(
    name, extensionController = AglynAppExtensionControllerImpl({app}),
  )

  logger.debug(AglynAppEventFlag.APP_CREATED, {app})
  event.emit(AglynAppEventFlag.APP_CREATED, {app})

  return app
}

export namespace AglynAppImpl {

  export const extensionController: Map<string, AglynExtensionController> = new Map()
  export const commandController: Map<string, AglynCommandController> = new Map()

}

export function AglynAppExtensionControllerImpl(
  data: { app: AglynApp },
): AglynExtensionController {

  const TAG = 'AglynExtensionController'
  const {app} = data
  const event = app.event
  const logger = app.logger
  const extensions: AglynExtensionMap = new Map()

  const extensionController: AglynExtensionController = {
    getExtension(id: string): AglynExtension {
      const extension = extensions.get(id)
      const current = extension?.lifecycle
      const autoload = extension?.config?.autoload
      if (current === LifecycleFlag.INITIALIZED && autoload) {
        extensionController.loadExtension({extensionId: id})
      }
      return extension
    },
    getExtensions(): AglynExtension[] {
      return [...extensions.values()]
    },
    registerExtension(
      data: AglynModuleTriggerParams[AglynModuleTriggerFlag.EXTENSION_REGISTER],
    ): void {
      const extension = data.extension as Mutable<AglynExtension>
      const extensionId = extension.$id
      extensions.set(extensionId, extension)
      extension.lifecycle = LifecycleFlag.INITIALIZED
      logger.debug(AglynAppEventFlag.REGISTERED_EXTENSION, {extensionId})
      event.emit(AglynAppEventFlag.REGISTERED_EXTENSION, {extension})
    },
    unregisterExtension(
      data: AglynModuleTriggerParams[AglynModuleTriggerFlag.EXTENSION_UNREGISTER],
    ) {
      const {extensionId} = data
      const extension = extensions.get(extensionId) as Mutable<AglynExtension>
      if (extension) {
        const isLoaded = EqualityIs.sameType(
          extension.lifecycle,
          LifecycleFlag.INITIALIZED,
          LifecycleFlag.LOADING,
          LifecycleFlag.LOADED,
        )
        if (isLoaded) {
          extensionController.unloadExtension(extensionId)
        }
        extensions.delete(extensionId)
        extension.lifecycle = LifecycleFlag.DESTROYED
        logger.debug(AglynAppEventFlag.UNREGISTERED_EXTENSION, {extensionId})
        event.emit(AglynAppEventFlag.UNREGISTERED_EXTENSION, {extensionId})
      }
    },
    loadExtension(
      data: AglynModuleTriggerParams[AglynModuleTriggerFlag.EXTENSION_LOAD],
    ): void {
      const {extensionId} = data
      const extension = extensions.get(extensionId) as Mutable<AglynExtension>
      if (extension) {
        extension.lifecycle = LifecycleFlag.LOADING
        extension.onLoad?.(app)
        extension.lifecycle = LifecycleFlag.LOADED
        logger.debug(AglynAppEventFlag.LOADED_EXTENSION, {extensionId})
        event.emit(AglynAppEventFlag.LOADED_EXTENSION, {extensionId})
      }
    },
    unloadExtension(
      data: AglynModuleTriggerParams[AglynModuleTriggerFlag.EXTENSION_UNLOAD],
    ): void {
      const {extensionId} = data
      const extension = extensions.get(extensionId) as Mutable<AglynExtension>
      if (extension) {
        extension.onUnload?.(app)
        extension.lifecycle = LifecycleFlag.UNLOADED
        logger.debug(AglynAppEventFlag.UNLOADED_EXTENSION, {extensionId})
        event.emit(AglynAppEventFlag.UNLOADED_EXTENSION, {extensionId})
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
        extensions: extensions.keys(),
      }
    },
    load() {
      event.on(AglynModuleTriggerFlag.EXTENSION_REGISTER, registerExtension)
      event.on(AglynModuleTriggerFlag.EXTENSION_UNREGISTER, unregisterExtension)
      event.on(AglynModuleTriggerFlag.EXTENSION_LOAD, loadExtension)
      event.on(AglynModuleTriggerFlag.EXTENSION_UNLOAD, unloadExtension)
    },
    unload() {
      event.off(AglynModuleTriggerFlag.EXTENSION_REGISTER, registerExtension)
      event.off(AglynModuleTriggerFlag.EXTENSION_UNREGISTER, unregisterExtension)
      event.off(AglynModuleTriggerFlag.EXTENSION_LOAD, loadExtension)
      event.off(AglynModuleTriggerFlag.EXTENSION_UNLOAD, unloadExtension)
    },
  }

  const registerExtension = (
    data: AglynModuleTriggerParams[AglynModuleTriggerFlag.EXTENSION_REGISTER],
  ) => {
    extensionController.registerExtension(data)
  }
  const unregisterExtension = (
    data: AglynModuleTriggerParams[AglynModuleTriggerFlag.EXTENSION_UNREGISTER],
  ) => {
    extensionController.unregisterExtension(data)
  }
  const loadExtension = (
    data: AglynModuleTriggerParams[AglynModuleTriggerFlag.EXTENSION_LOAD],
  ) => {
    extensionController.loadExtension(data)
  }
  const unloadExtension = (
    data: AglynModuleTriggerParams[AglynModuleTriggerFlag.EXTENSION_UNLOAD],
  ) => {
    extensionController.unloadExtension(data)
  }

  return extensionController
}

export function AglynCommandControllerImpl(
  props: { app: AglynApp },
): AglynCommandController {
  const {app} = props
  const TAG = 'AglynCommandController'
  const appEvent = app.event
  const appLogger = app.logger
  const commander: AglynCommander = Mitt()

  const CommandController: AglynCommandController = {
    registerAction(
      data: AglynModuleTriggerParams[AglynModuleTriggerFlag.COMMAND_ACTION_REGISTER],
    ): void {
      const {handler} = data
      const commandId = handler?.$id
      commander.on(commandId, handler)
      appLogger.debug(AglynAppEventFlag.REGISTERED_COMMAND, {commandId})
      appEvent.emit(AglynAppEventFlag.REGISTERED_COMMAND, {commandId})
    },
    unregisterAction(
      data: AglynModuleTriggerParams[AglynModuleTriggerFlag.COMMAND_ACTION_UNREGISTER],
    ): void {
      const {handler} = data
      const commandId = handler?.$id
      commander.off(commandId, handler)
      appLogger.debug(AglynAppEventFlag.UNREGISTERED_COMMAND, {commandId})
      appEvent.emit(AglynAppEventFlag.UNREGISTERED_COMMAND, {commandId})
    },
    executeCommand(
      data: AglynModuleTriggerParams[AglynModuleTriggerFlag.COMMAND_TRIGGER],
    ): void {
      const {commandId} = data
      commander.emit(commandId, {app})
      appLogger.debug(AglynAppEventFlag.TRIGGERED_COMMAND, {commandId})
      appEvent.emit(AglynAppEventFlag.TRIGGERED_COMMAND, {commandId})
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
    load() {
      appEvent.on(AglynModuleTriggerFlag.COMMAND_ACTION_REGISTER, registerCommand)
      appEvent.on(AglynModuleTriggerFlag.COMMAND_ACTION_UNREGISTER, unregisterCommand)
      appEvent.on(AglynModuleTriggerFlag.COMMAND_TRIGGER, triggerCommand)
    },
    unload() {
      appEvent.off(AglynModuleTriggerFlag.COMMAND_ACTION_REGISTER, registerCommand)
      appEvent.off(AglynModuleTriggerFlag.COMMAND_ACTION_UNREGISTER, unregisterCommand)
      appEvent.off(AglynModuleTriggerFlag.COMMAND_TRIGGER, triggerCommand)
    },
  }

  const registerCommand = (
    data: AglynModuleTriggerParams[AglynModuleTriggerFlag.COMMAND_ACTION_REGISTER],
  ) => {
    CommandController.registerAction(data)
  }
  const unregisterCommand = (
    data: AglynModuleTriggerParams[AglynModuleTriggerFlag.COMMAND_ACTION_UNREGISTER],
  ) => {
    CommandController.unregisterAction(data)
  }
  const triggerCommand = (
    data: AglynModuleTriggerParams[AglynModuleTriggerFlag.COMMAND_TRIGGER],
  ) => {
    CommandController.executeCommand(data)
  }

  return CommandController
}
