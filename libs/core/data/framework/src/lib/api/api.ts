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

import { MutableShallow } from '@aglyn/shared-data-types'
import { _isCtor, _isFnT, _isNull, _isStrEmpty } from '@aglyn/shared-util-guards'
import { LogCallback, Logger, LogLevelString, LogOptions } from '@aglyn/shared-util-logger'
import { trim } from '@aglyn/shared-util-tools'
import { _apps, _commandControllers, _extensionControllers } from '../constants/_internal'
import {
  AGLYN_EMITTER,
  AglynAppEventFlag,
  AglynModuleEventFlag,
  AglynModuleEventPayload,
} from '../constants/emitter'
import { DEFAULT_ENTRY_NAME } from '../constants/enums'
import { AGLYN_ERROR, AglynErrorEventFlag } from '../constants/error'
import { AGLYN_LOGGER } from '../constants/logger'
import { AglynAppController } from '../controllers/aglyn-app.controller'
import {
  AglynAppOptions,
  IAglynApp,
  IAglynCommandController,
  IAglynExtension,
  IAglynExtensionController,
} from '../types'
import { isAppModule, isExtension } from '../util/aglyn-is'

export function initializeApp(options: AglynAppOptions = {}): IAglynApp {
  const opts: AglynAppOptions = { ...options }
  const name: string = trim(opts.name || DEFAULT_ENTRY_NAME)
  const extensions = opts.extensions || []
  if (_isStrEmpty(name)) {
    throw AGLYN_ERROR.create(AglynErrorEventFlag.BAD_APP_NAME, { appName: name })
  }
  if (_apps.has(name)) {
    throw AGLYN_ERROR.create(AglynErrorEventFlag.DUPLICATE_APP, { appName: name })
  }
  const app: IAglynApp = new AglynAppController(opts)
  _apps.set(name, app)

  app.onInit()

  extensions.map((loader) => {
    console.log('loader', loader(), extensions)
    const module = loader()
    if (!module) {
      throw AGLYN_ERROR.create(AglynErrorEventFlag.NO_MODULE, undefined)
    }
    if (!isAppModule(module) || !isExtension(module) || !_isCtor(module)) {
      throw AGLYN_ERROR.create(AglynErrorEventFlag.INVALID_MODULE_ARG, {
        moduleName: module?.getName?.() ?? module?.['name'] ?? 'unknown',
        appName: app.getName() ?? DEFAULT_ENTRY_NAME,
      })
    }

    const extensionModel = new module(app)
    app.effect({
      type: AglynModuleEventFlag.EXTENSION_REGISTER,
      payload: { extension: extensionModel },
    })
    return module
  })

  return app
}

export function getApps(): IAglynApp[] {
  return [..._apps.values()]
}

export function getApp(name: string = DEFAULT_ENTRY_NAME): IAglynApp {
  const app = _apps.get(name)
  if (!app) {
    throw AGLYN_ERROR.create(AglynErrorEventFlag.NO_APP, { appName: name })
  }
  return _apps.get(name)
}

export function deleteApp(app: IAglynApp): void {
  validateAppArg(app)
  const name = app.getName()
  AGLYN_LOGGER.debug(AglynAppEventFlag.BEFORE_DELETE_APP, { app })
  AGLYN_EMITTER.emit(AglynAppEventFlag.BEFORE_DELETE_APP, { app })
  app.onDestroy?.()
  _apps.delete(name)
  ;(app as MutableShallow<IAglynApp>)['deleted'] = true
  AGLYN_LOGGER.debug(AglynAppEventFlag.APP_DELETED, { appName: name })
  AGLYN_EMITTER.emit(AglynAppEventFlag.APP_DELETED, { appName: name })
}

export function validateAppArg(app: IAglynApp): void {
  if (!(app as IAglynApp)) {
    throw AGLYN_ERROR.create(AglynErrorEventFlag.INVALID_APP_ARG, { appName: app?.getName?.() })
  }
  if (app['deleted']) {
    throw AGLYN_ERROR.create(AglynErrorEventFlag.APP_DELETED, { appName: app?.getName?.() })
  }
}

export function _getExtensionController(app: IAglynApp): IAglynExtensionController {
  validateAppArg(app)
  return _extensionControllers.get(app.getName())
}

export function _getCommandController(app: IAglynApp): IAglynCommandController {
  validateAppArg(app)
  return _commandControllers.get(app.getName())
}

/**
 * Sets log handler for all SDKs components
 * @param callbackFn - An optional custom log handler that executes user code whenever
 *   the SDK makes a logging call.
 * @param options - the logger options to pass to `Logger.setUserLogHandler()`
 */
export function onLog(callbackFn: LogCallback | null, options?: LogOptions): void {
  if (!_isNull(callbackFn) && !_isFnT(callbackFn)) {
    throw AGLYN_ERROR.create(AglynErrorEventFlag.INVALID_LOG_ARG, undefined)
  }
  Logger.setUserLogHandler(callbackFn, options)
}

/**
 * Sets log level for all SDK components
 *
 * All of the log types above the current log level are captured (i.e. if
 * you set the log level to `info`, errors are logged, but `debug` and
 * `verbose` logs are not).
 */
export function setLogLevel(logLevel: LogLevelString): void {
  Logger.setLogLevel(logLevel)
}

export function getExtension<T extends IAglynExtension>(app: IAglynApp, data: { name: string }): T {
  const { name } = data
  const extensionController = _getExtensionController(app)
  return extensionController.getExtensionByName(name) as T
}

export function getExtensions(app: IAglynApp): IAglynExtension[] {
  const extensionController = _getExtensionController(app)
  return extensionController.getAllExtensions()
}

export function registerExtension(
  app: IAglynApp,
  data: AglynModuleEventPayload[AglynModuleEventFlag.EXTENSION_REGISTER]
): void {
  const extensionController = _getExtensionController(app)
  extensionController.registerExtension(data)
}

export function unregisterExtension(
  app: IAglynApp,
  data: AglynModuleEventPayload[AglynModuleEventFlag.EXTENSION_UNREGISTER]
): void {
  const extensionController = _getExtensionController(app)
  extensionController.unregisterExtension(data)
}

export function loadExtension(
  app: IAglynApp,
  data: AglynModuleEventPayload[AglynModuleEventFlag.EXTENSION_LOAD]
) {
  const extensionController = _getExtensionController(app)
  extensionController.loadExtension(data)
}

export function unloadExtension(
  app: IAglynApp,
  data: AglynModuleEventPayload[AglynModuleEventFlag.EXTENSION_UNLOAD]
) {
  const extensionController = _getExtensionController(app)
  extensionController.loadExtension(data)
}

export function registerCommand(
  app: IAglynApp,
  data: AglynModuleEventPayload[AglynModuleEventFlag.COMMAND_ACTION_REGISTER]
): void {
  const commandController = _getCommandController(app)
  commandController.registerAction(data)
}

export function unregisterAction(
  app: IAglynApp,
  data: AglynModuleEventPayload[AglynModuleEventFlag.COMMAND_ACTION_UNREGISTER]
): void {
  const commandController = _getCommandController(app)
  commandController.unregisterAction(data)
}

export function triggerCommand(
  app: IAglynApp,
  data: AglynModuleEventPayload[AglynModuleEventFlag.COMMAND_TRIGGER]
): void {
  const commandController = _getCommandController(app)
  commandController.executeCommand(data)
}
