/**
 * @license
 * Copyright 2022 Aglyn LLC
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

import { AGLYN_ERROR, AGLYN_LOGGER } from '@aglyn/core-data-foundation'
import { LogLevelString } from '@aglyn/shared-util-logger'
import { Timestamp } from '@aglyn/shared-util-timestamp'
import { EventEmitter2 } from 'eventemitter2'

export const errorFactory = AGLYN_ERROR
export const logger = AGLYN_LOGGER
export const emitter = new EventEmitter2()

export function setLogLevel(logLevel: LogLevelString) {
  logger.setLogLevel(logLevel)
}

export function lifecycleEvent(
  callbackFn: () => void,
  options: {
    startEvent: AglynEvent
    startPayload: any[]
    endEvent: AglynEvent
    endPayload: any[]
    onCatch?: (e: unknown) => void
  },
): void {
  const { startEvent, startPayload, endEvent, endPayload, onCatch } = options
  logger.debug(Timestamp.now().toJSON(), startEvent, startPayload)
  emitter.emit(startEvent, Timestamp.now().toJSON(), ...startPayload)
  try {
    callbackFn()
  } catch (e) {
    logger.error(Timestamp.now().toJSON(), startEvent, startPayload, e)
    onCatch && onCatch(e)
  } finally {
    logger.debug(Timestamp.now().toJSON(), startEvent, startPayload)
    emitter.emit(endEvent, Timestamp.now().toJSON(), ...endPayload)
  }
}

export enum AglynEvent {
  APP_CREATING = 'event:app:creating',
  APP_CREATED = 'event:app:created',
  APP_INITIALIZING = 'event:app:initializing',
  APP_INITIALIZED = 'event:app:initialized',
  APP_ACTIVATING = 'event:app:activating',
  APP_ACTIVATED = 'event:app:activated',
  APP_DEACTIVATING = 'event:app:deactivating',
  APP_DEACTIVATED = 'event:app:deactivated',
  APP_DESTROYING = 'event:app:destroying',
  APP_DESTROYED = 'event:app:destroyed',
  APP_DELETING = 'event:app:deleting',
  APP_DELETED = 'event:app:deleted',

  MODULE_INITIALIZING = 'event:module:initializing',
  MODULE_INITIALIZED = 'event:module:initialized',
  MODULE_ACTIVATING = 'event:module:activating',
  MODULE_ACTIVATED = 'event:module:activated',
  MODULE_DEACTIVATING = 'event:module:deactivating',
  MODULE_DEACTIVATED = 'event:module:deactivated',
  MODULE_DESTROYING = 'event:module:destroying',
  MODULE_DESTROYED = 'event:module:destroyed',

  EXTENSION_REGISTERING = 'event:extensions:registering-extension',
  EXTENSION_REGISTERED = 'event:extensions:registered-extension',
  EXTENSION_INITIALIZING = 'event:extensions:initializing-extension',
  EXTENSION_INITIALIZED = 'event:extensions:initialized-extension',
  EXTENSION_ACTIVATING = 'event:extensions:activating-extension',
  EXTENSION_ACTIVATED = 'event:extensions:activated-extension',
  EXTENSION_DEACTIVATING = 'event:extensions:deactivating-extension',
  EXTENSION_DEACTIVATED = 'event:extensions:deactivated-extension',
  EXTENSION_DESTROYING = 'event:extensions:destroying-extension',
  EXTENSION_DESTROYED = 'event:extensions:destroyed-extension',

  COMMAND_RESOLVER_SETTING = 'event:commands:setting-resolver',
  COMMAND_RESOLVER_SET = 'event:commands:set-resolver',
  COMMAND_LISTENER_REGISTERING = 'event:commands:registering-listener',
  COMMAND_LISTENER_REGISTERED = 'event:commands:registered-listener',
  COMMAND_RESOLVER_REMOVING = 'event:commands:unregistering-resolver',
  COMMAND_RESOLVER_REMOVED = 'event:commands:unregistered-resolver',
  COMMAND_LISTENER_UNREGISTERING = 'event:commands:unregistering-listener',
  COMMAND_LISTENER_UNREGISTERED = 'event:commands:unregistered-listener',
  COMMAND_RESOLVER_TRIGGERING = 'event:commands:triggering-resolver',
  COMMAND_RESOLVER_TRIGGERED = 'event:commands:triggered-resolver',
  COMMAND_LISTENERS_TRIGGERING = 'event:commands:triggering-listeners',
  COMMAND_LISTENERS_TRIGGERED = 'event:commands:triggered-listeners',

  COMPONENT_REGISTERING = 'event:components:registering-component',
  COMPONENT_REGISTERED = 'event:components:registered-component',
  COMPONENT_UNREGISTERING = 'event:components:unregistering-component',
  COMPONENT_UNREGISTERED = 'event:components:unregistered-component',
  COMPONENT_BUNDLE_REGISTERING = 'event:components:registering-bundle',
  COMPONENT_BUNDLE_REGISTERED = 'event:components:registered-bundle',
  COMPONENT_BUNDLE_UNREGISTERING = 'event:components:unregistering-bundle',
  COMPONENT_BUNDLE_UNREGISTERED = 'event:components:unregistered-bundle',
  COMPONENT_PRESET_REGISTERING = 'event:components:registering-preset',
  COMPONENT_PRESET_REGISTERED = 'event:components:registered-preset',
  COMPONENT_PRESET_UNREGISTERING = 'event:components:unregistering-preset',
  COMPONENT_PRESET_UNREGISTERED = 'event:components:unregistered-preset',
}
