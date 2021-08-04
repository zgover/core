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


import { logger } from './logger'
import {
  AglynApp,
  AglynAppOptions,
  AglynCommand,
  AglynCommandController,
  AglynExtension,
  AglynExtensionController,
} from './types'
import {
  AGLYN_APP_ERROR,
  AglynAppEventFlag,
  AglynErrorEventFlag,
  DEFAULT_ENTRY_NAME,
} from './constants'
import { _apps } from './internal'
import { LogCallback, Logger, LogLevelString, LogOptions } from '@aglyn/shared/feature/logger'
import { _isFn, _isNull, _isStrEmpty } from '@aglyn/shared/util/guards'
import { trim } from '@aglyn/shared/util/tools'
import { AglynAppImpl } from './models'
import { event } from './event'


export function initializeApp(appOptions: AglynAppOptions = {}): AglynApp {
  const options = {...appOptions}
  const {name: _name = DEFAULT_ENTRY_NAME} = options
  const name = trim(_name)
  if (_isStrEmpty(name)) {
    throw AGLYN_APP_ERROR.create(AglynErrorEventFlag.BAD_APP_NAME, {appName: name})
  }
  if (_apps.has(name)) {
    throw AGLYN_APP_ERROR.create(AglynErrorEventFlag.DUPLICATE_APP, {appName: name})
  }
  const app: AglynApp = AglynAppImpl(options, event, logger)
  _apps.set(name, app)

  logger.debug(AglynAppEventFlag.APP_CREATED, {app})
  event.emit(AglynAppEventFlag.APP_CREATED, {app})

  return app
}

export function getApps(): AglynApp[] {
  return [..._apps.values()]
}

export function getApp(name: string = DEFAULT_ENTRY_NAME): AglynApp {
  const app = _apps.get(name)
  if (!app) {
    throw AGLYN_APP_ERROR.create(AglynErrorEventFlag.NO_APP, {appName: name})
  }
  return _apps.get(name)
}

export function deleteApp(app: AglynApp): void {
  _validateAppArg(app)
  const name = app.getName()
  logger.debug(AglynAppEventFlag.BEFORE_DELETE_APP, {app})
  event.emit(AglynAppEventFlag.BEFORE_DELETE_APP, {app})
  app.unloadApp()
  _apps.delete(name)
  app['deleted'] = true
  logger.debug(AglynAppEventFlag.APP_DELETED, {appName: name})
  event.emit(AglynAppEventFlag.APP_DELETED, {appName: name})
}

export function _validateAppArg(app: AglynApp): void {
  if (!(app as AglynApp)) {
    throw AGLYN_APP_ERROR.create(AglynErrorEventFlag.INVALID_APP_ARG, {appName: app?.getName?.()})
  }
  if (app['deleted']) {
    throw AGLYN_APP_ERROR.create(AglynErrorEventFlag.APP_DELETED, {appName: app?.getName?.()})
  }
}

export function _getExtensionController(app: AglynApp): AglynExtensionController {
  _validateAppArg(app)
  return AglynAppImpl.extensionController.get(app.getName())
}

export function _getCommandController(app: AglynApp): AglynCommandController {
  _validateAppArg(app)
  return AglynAppImpl.commandController.get(app.getName())
}

/**
 * Sets log handler for all SDKs components
 * @param callbackFn - An optional custom log handler that executes user code whenever
 *   the SDK makes a logging call.
 * @param options
 */
export function onLog(callbackFn: LogCallback | null, options?: LogOptions): void {
  if (!_isNull(callbackFn) && !_isFn(callbackFn)) {
    throw AGLYN_APP_ERROR.create(AglynErrorEventFlag.INVALID_LOG_ARG, undefined)
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

export function registerExtension(app: AglynApp, extension: AglynExtension): void {
  const extensionController = _getExtensionController(app)
  extensionController.registerExtension(extension)
}

export function unregisterExtension(app: AglynApp, extension: AglynExtension): void {
  const extensionController = _getExtensionController(app)
  extensionController.unregisterExtension(extension)
}

export function getExtension(app: AglynApp, options: { $id: string }): AglynExtension {
  const extensionController = _getExtensionController(app)
  return extensionController.getExtension(options?.$id)
}

export function getExtensions(app: AglynApp): AglynExtension[] {
  const extensionController = _getExtensionController(app)
  return extensionController.getExtensions()
}

export function loadExtension(app: AglynApp, id: string) {
  const extensionController = _getExtensionController(app)
  extensionController.loadExtension(id)
}

export function unloadExtension(app: AglynApp, id: string) {
  const extensionController = _getExtensionController(app)
  extensionController.loadExtension(id)
}

export function registerCommand(app: AglynApp, command: AglynCommand): void {
  const commandController = _getCommandController(app)
  commandController.registerCommand(command)
}

export function unregisterCommand(app: AglynApp, command: AglynCommand): void {
  const commandController = _getCommandController(app)
  commandController.unregisterCommand(command)
}

export function triggerCommand(app: AglynApp, id: string): void {
  const commandController = _getCommandController(app)
  commandController.triggerCommand({$id: id})
}

// export function getComponent(app: AglynApp, extId: string, options: { $id: string }) {
//   const {$id} = options
//   return app.extensions.get(extId)?.component.find((m) => m.$id === $id)
// }
//
// export function getComponents(app: AglynApp, extId: string, props: { componentIds?: string[] }) {
//   const {componentIds} = props
//   return componentIds
//     ? componentIds.map(($id) => getComponent(app, {extId, $id}))
//     : [...app.extensions.get(extId)?.component.values()]
// }
//
// export function addComponent(
//   app: AglynApp,
//   extId: string,
//   component: PartPartial<AglynComponent, 'options'>,
// ) {
//   const extension = app.extensions?.get(extId)
//   if (!extension) {
//     throw AGLYN_APP_ERROR.create(AglynErrorEventFlag.NO_APP_EXTENSION, {
//       appName: app.getName(), extensionId: extId,
//     })
//   }
//   if (!(component.options)) component.options = {}
//   extension.component.push(component as AglynComponent)
//   app.event.emit(AglynAppEventFlag.SET_COMPONENT, component)
//   logger.debug(`Set component id = ${$id} for extension id = ${extId}`)
//   return this
// }
