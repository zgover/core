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
  AnyProps,
  Dictionary,
  Implements,
  ImplementsOn,
  Serializable,
  StringLike,
} from '@aglyn/shared/util/types'
import {
  AglynAppEventFlag,
  AglynErrorEventFlag,
  AglynModuleTriggerFlag,
  LoadStatusFlag,
  RestrictFlag,
} from './constants'
import { Emitter } from 'mitt'
import { Timestamp } from '@aglyn/shared/feature/timestamp'
import { FormSchema } from '@aglyn/shared/ui/react'
import { ErrorFactory } from '@aglyn/shared/util/errors'
import { Logger } from '@aglyn/shared/feature/logger'


export type Payload<T = any> = { payload: T }
export type PayloadData<T extends Dictionary = any> = T

export type AglynAppsMap = Map<string, AglynApp>
export type AglynAppModule<T extends AglynUniqueId = any> = T
export type AglynExtensionMap = Map<string, AglynExtension>
export type AglynEmitterParams = AglynAppEventParams & AglynModuleTriggerParams
export type AglynEmitter = Emitter<AglynEmitterParams>
export type AglynError = ErrorFactory<AglynErrorEventParams>
export type AglynLogger = Logger
export type AglynCommander = Emitter<AglynCommandParams>

export type AglynErrorEventParams = {
  [AglynErrorEventFlag.NO_APP]: PayloadData<{ appName: string }>
  [AglynErrorEventFlag.BAD_APP_NAME]: PayloadData<{ appName: string }>
  [AglynErrorEventFlag.DUPLICATE_APP]: PayloadData<{ appName: string }>
  [AglynErrorEventFlag.APP_DELETED]: PayloadData<{ appName: string }>
  [AglynErrorEventFlag.INVALID_APP_ARG]: PayloadData<{ appName: string }>
  [AglynErrorEventFlag.NO_APP_EXTENSION]: PayloadData<{ extensionId: string }>
  [AglynErrorEventFlag.INVALID_LOG_ARG]: undefined
}
export type AglynAppEventParams = {
  [AglynAppEventFlag.APP_CREATED]: PayloadData<{ app: AglynApp }>
  [AglynAppEventFlag.BEFORE_DELETE_APP]: PayloadData<{ app: AglynApp }>
  [AglynAppEventFlag.APP_UNLOADED]: PayloadData<{ appName: string }>
  [AglynAppEventFlag.APP_DELETED]: PayloadData<{ appName: string }>
  [AglynAppEventFlag.REGISTERED_EXTENSION]: PayloadData<{ extension: AglynExtension }>
  [AglynAppEventFlag.UNREGISTERED_EXTENSION]: PayloadData<{ extension: AglynExtension }>
  [AglynAppEventFlag.LOADED_EXTENSION]: PayloadData<{ extension: AglynExtension }>
  [AglynAppEventFlag.UNLOADED_EXTENSION]: PayloadData<{ extension: AglynExtension }>
  [AglynAppEventFlag.REGISTERED_COMMAND]: PayloadData<{ commandId: string }>
  [AglynAppEventFlag.UNREGISTERED_COMMAND]: PayloadData<{ commandId: string }>
  [AglynAppEventFlag.TRIGGERED_COMMAND]: PayloadData<{ commandId: string }>
}
export type AglynModuleTriggerParams = {
  [AglynModuleTriggerFlag.REGISTER_EXTENSION]: PayloadData<{ extension: AglynExtension }>
  [AglynModuleTriggerFlag.UNREGISTER_EXTENSION]: PayloadData<{ extensionId: string }>
  [AglynModuleTriggerFlag.LOAD_EXTENSION]: PayloadData<{ extensionId: string }>
  [AglynModuleTriggerFlag.UNLOAD_EXTENSION]: PayloadData<{ extensionId: string }>
  [AglynModuleTriggerFlag.REGISTER_EXTENSION_COMPONENT]: PayloadData<{ $id: string, component: any, options?: Partial<AglynComponentOptions> }>
  [AglynModuleTriggerFlag.UNREGISTER_EXTENSION_COMPONENT]: PayloadData<{ componentId: string }>
  [AglynModuleTriggerFlag.LOAD_EXTENSION_COMPONENT]: PayloadData<{ componentId: string }>
  [AglynModuleTriggerFlag.UNLOAD_EXTENSION_COMPONENT]: PayloadData<{ componentId: string }>
  [AglynModuleTriggerFlag.REGISTER_COMMAND]: PayloadData<{ commandId: string, callbackFn: ({app: AglynApp}) => void }>
  [AglynModuleTriggerFlag.UNREGISTER_COMMAND]: PayloadData<{ commandId: string, callbackFn: ({app: AglynApp}) => void }>
  [AglynModuleTriggerFlag.TRIGGER_COMMAND]: PayloadData<{ commandId: string }>
}
export type AglynCommandParams = {
  [P in string | '*']: PayloadData<{ app: AglynApp }>
}

export interface AglynUniqueId {
  readonly $id: string
}

export interface AglynNamed {
  name?: string
}

export type AglynLoadable<T> =
  ImplementsOn<'load', ((...arg: T[]) => void)> &
  ImplementsOn<'unload', ((...arg: T[]) => void)>

export type AglynLoads<K extends string, T extends AglynUniqueId & AglynLoadable<unknown>> =
  Implements<'load', K, (...data: T[]) => void> &
  Implements<'unload', K, (...data: T[]) => void>

export type AglynRegistersType<K extends string, T extends AglynUniqueId> =
  Implements<'register', '', (type: K, data: T) => void> &
  Implements<'unregister', '', (type: K, id: T['$id']) => void>

export type AglynRegisters<K extends string, T extends AglynUniqueId> =
  Implements<'register', K, (...data: T[]) => void> &
  Implements<'unregister', K, (...data: (T | AglynUniqueId)[]) => void>

export interface AglynBaseModel extends StringLike, Serializable {

}

export interface AglynAppOptions extends AglynNamed {

}

export interface AglynExtensionOptions extends AglynUniqueId {

}

export interface AglynComponentOptions {
  displayName: string
  title: string
  subtitle: string
  description: string
  icon: unknown
  propsSchema: FormSchema
  defaultProps: AnyProps
  resolveProps: <T>(...args: T[]) => AnyProps | void
  disableActions: boolean
  disableBadge: boolean
  disableCopying: boolean
  disableDragging: boolean
  disableDropping: boolean
  disableEditing: boolean
  disableNesting: boolean
  disableOutline: boolean
  disableRemoving: boolean
  disableSelecting: boolean
  restrictChildren: [type: RestrictFlag, ids: string[]]
  restrictParents: [type: RestrictFlag, ids: string[]]
}

export interface AglynApp extends AglynBaseModel,
  AglynRegistersType<string, AglynAppModule> {

  readonly event: AglynEmitter
  readonly logger: AglynLogger

  getCreatedAt(): Timestamp
  getName(): string
  getOptions(): AglynAppOptions

  getExtension(id: string): AglynExtension
  getExtensions(): AglynExtension[]
  unloadApp(): void
}

export interface AglynExtensionController extends AglynBaseModel,
  AglynRegisters<'extension', AglynAppModule>,
  AglynLoads<'extension', AglynAppModule>,
  AglynLoads<'', undefined> {

  getExtension(id: string): AglynExtension
  getExtensions(): AglynExtension[]
  unloadExtensions(): void
}

export interface AglynCommandController extends AglynBaseModel,
  AglynRegisters<'command', AglynAppModule<AglynCommand>>,
  AglynLoads<'', undefined> {

  triggerCommand(data: { $id: string }): void
}

export interface AglynExtension extends AglynBaseModel,
  AglynUniqueId,
  AglynLoadable<AglynApp> {

  readonly status?: undefined | LoadStatusFlag
}

export interface AglynCommand extends AglynUniqueId {
  callbackFn({app: AglynApp}): void
}

export interface AglynComponent {
  $id: string
  options: Partial<AglynComponentOptions>
  component: any
}

export interface AglynComponentData extends AglynUniqueId {
  component?: AglynComponent | string
  children?: (AglynComponentData | string)[]
  props: AnyProps
  temporary?: boolean
  parent?: string
  name?: string
  description?: string
}
