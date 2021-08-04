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

import { AglynError } from './types'
import { ErrorFactory, ErrorMap } from '@aglyn/shared/util/errors'


export const DEFAULT_ENTRY_NAME = '[DEFAULT]'

export enum RestrictFlag {
  LIMIT = 'limit',
  DISALLOW = 'disallow',
}

export enum LoadStatusFlag {
  REGISTERED = 'registered',
  UNREGISTERED = 'unregistered',
  LOADING = 'loading',
  LOADED = 'loaded',
  UNLOADED = 'unloaded',
}

export enum AglynAppEventFlag {
  APP_CREATED = 'event:app-created',
  BEFORE_DELETE_APP = 'event:before-delete-app',
  APP_UNLOADED = 'event:app-unloaded',
  APP_DELETED = 'event:app-deleted',
  REGISTERED_EXTENSION = 'event:registered-extension',
  UNREGISTERED_EXTENSION = 'event:unregistered-extension',
  LOADED_EXTENSION = 'event:loaded-extension',
  UNLOADED_EXTENSION = 'event:unloaded-extension',
  REGISTERED_COMMAND = 'event:registered-command',
  UNREGISTERED_COMMAND = 'event:unregistered-command',
  TRIGGERED_COMMAND = 'event:triggered-command',
  SET_COMPONENT = 'event:set-component',
}

export enum AglynErrorEventFlag {
  NO_APP = 'error:no-app',
  BAD_APP_NAME = 'error:bad-app-name',
  DUPLICATE_APP = 'error:duplicate-app',
  APP_DELETED = 'error:app-deleted',
  INVALID_APP_ARG = 'error:invalid-app-argument',
  INVALID_LOG_ARG = 'error:invalid-log-argument',
  NO_APP_EXTENSION = 'error:no-app-extension',
}

export enum AglynModuleTriggerFlag {
  REGISTER_EXTENSION = 'module:register:extension',
  UNREGISTER_EXTENSION = 'module:unregister:extension',
  LOAD_EXTENSION = 'module:load:extension',
  UNLOAD_EXTENSION = 'module:unload:extension',
  REGISTER_EXTENSION_COMPONENT = 'module:register:extension:component',
  UNREGISTER_EXTENSION_COMPONENT = 'module:unregister:extension:component',
  LOAD_EXTENSION_COMPONENT = 'module:load:extension:component',
  UNLOAD_EXTENSION_COMPONENT = 'module:unload:extension:component',

  REGISTER_COMMAND = 'module:register:command',
  UNREGISTER_COMMAND = 'module:unregister:command',
  TRIGGER_COMMAND = 'module:trigger:command',
}

export enum AglynAppCommandFlag {
  ANY = '*',
}

const AGLYN_APP_SDK_ERROR_MSG: ErrorMap<AglynErrorEventFlag> = {
  [AglynErrorEventFlag.NO_APP]: 'No AglynApp \'{$appName}\' has been created - call Web initializeApp()',
  [AglynErrorEventFlag.BAD_APP_NAME]: 'Illegal App name: \'{$appName}\'',
  [AglynErrorEventFlag.DUPLICATE_APP]: 'AglynApp named \'{$appName}\' already exists',
  [AglynErrorEventFlag.APP_DELETED]: 'AglynApp named \'{$appName}\' already deleted',
  [AglynErrorEventFlag.INVALID_APP_ARG]: 'AglynApp.{$appName}() takes either no argument or a AglynApp instance.',
  [AglynErrorEventFlag.INVALID_LOG_ARG]: 'First argument to \'onLog\' must be null or a function.',
  [AglynErrorEventFlag.NO_APP_EXTENSION]: 'No AppExtension \'{$extensionId}\' has been created on AglynApp \'{$appName}\'',
}

export const AGLYN_APP_ERROR: AglynError = new ErrorFactory('sdk', 'AglynApp', AGLYN_APP_SDK_ERROR_MSG)
